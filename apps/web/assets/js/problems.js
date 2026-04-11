function resolveProblemsApiBaseUrl() {
    if (typeof window === 'undefined') {
        return 'http://localhost:3001/api';
    }

    const queryApiUrl = new URLSearchParams(window.location.search).get('api');
    if (queryApiUrl && queryApiUrl.trim()) {
        return queryApiUrl.trim().replace(/\/$/, '');
    }

    if (window.location.protocol === 'file:') {
        return 'http://localhost:3001/api';
    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001/api';
    }

    return `${window.location.origin.replace(/\/$/, '')}/api`;
}

const PROBLEMS_API_BASE_URL = resolveProblemsApiBaseUrl();

const difficultyMeta = {
    easy: { label: 'Facile', className: 'easy', filterValue: 'easy' },
    med: { label: 'Moyen', className: 'medium', filterValue: 'medium' },
    hard: { label: 'Difficile', className: 'hard', filterValue: 'hard' }
};

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getProblemExcerpt(problem) {
    const description = String(problem.description || '').trim();
    if (!description) {
        return 'Consultez l enonce complet dans l editeur et commencez a coder.';
    }

    const firstLine = description.split('\n').find((line) => line.trim()) || description;
    return firstLine.length > 120 ? `${firstLine.slice(0, 117)}...` : firstLine;
}

function buildEditorProblem(problem) {
    return {
        problem_id: problem.problem_id,
        title: problem.name,
        difficulty: difficultyMeta[problem.difficulty_level]?.filterValue || 'easy',
        description: problem.description || ''
    };
}

function buildEditorUrl(problem) {
    const searchParams = new URLSearchParams();
    searchParams.set('problemId', String(problem.problem_id));
    searchParams.set('problem', JSON.stringify(buildEditorProblem(problem)));
    return `editor/indexcodeeditor.html?${searchParams.toString()}`;
}

function renderProblemCard(problem) {
    const meta = difficultyMeta[problem.difficulty_level] || difficultyMeta.easy;
    const acceptance = Number.isFinite(Number(problem.solve_rate))
        ? `${Math.round(Number(problem.solve_rate))}%`
        : 'N/A';

    return `
        <article class="problem-card panel" data-difficulty="${meta.filterValue}" data-title="${escapeHtml(problem.name)}">
            <div class="problem-top">
                <h3>${escapeHtml(problem.name)}</h3>
                <span class="difficulty ${meta.className}">${meta.label}</span>
            </div>
            <p>${escapeHtml(getProblemExcerpt(problem))}</p>
            <div class="meta-line">
                <span>Acceptation ${acceptance}</span>
                <span>#${problem.problem_id}</span>
            </div>
            <div class="problem-actions">
                <span class="points">Database-backed</span>
                <a
                    class="btn btn-primary solve-btn"
                    href="${buildEditorUrl(problem)}"
                    data-problem-id="${problem.problem_id}"
                >
                    Resoudre
                </a>
            </div>
        </article>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('problemGrid');
    const searchInput = document.getElementById('problemSearch');
    const filterChips = Array.from(document.querySelectorAll('.filter-chip'));
    const noResults = document.getElementById('noResults');
    const cardCount = document.getElementById('cardCount');

    if (!grid || !searchInput || filterChips.length === 0 || !noResults || !cardCount) {
        return;
    }

    let allProblems = [];
    let activeFilter = 'all';

    const updateVisibleState = (visibleProblems) => {
        noResults.hidden = visibleProblems.length > 0;
        cardCount.textContent = `${visibleProblems.length} probleme${visibleProblems.length !== 1 ? 's' : ''} trouve${visibleProblems.length !== 1 ? 's' : ''}`;
    };

    const renderProblems = (visibleProblems) => {
        if (visibleProblems.length === 0) {
            grid.innerHTML = '';
            updateVisibleState([]);
            return;
        }

        grid.innerHTML = visibleProblems.map(renderProblemCard).join('');
        updateVisibleState(visibleProblems);
    };

    const applyFilters = () => {
        const query = searchInput.value.trim().toLowerCase();
        const visibleProblems = allProblems.filter((problem) => {
            const difficultyFilter = difficultyMeta[problem.difficulty_level]?.filterValue || 'easy';
            const matchesDifficulty = activeFilter === 'all' || difficultyFilter === activeFilter;
            const haystack = `${problem.name} ${problem.description || ''}`.toLowerCase();
            const matchesQuery = query.length === 0 || haystack.includes(query);
            return matchesDifficulty && matchesQuery;
        });

        renderProblems(visibleProblems);
    };

    filterChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            activeFilter = chip.dataset.filter || 'all';
            filterChips.forEach((item) => {
                item.classList.remove('active');
                item.setAttribute('aria-pressed', 'false');
            });
            chip.classList.add('active');
            chip.setAttribute('aria-pressed', 'true');
            applyFilters();
        });
    });

    searchInput.addEventListener('input', applyFilters);

    grid.addEventListener('click', (event) => {
        const solveLink = event.target.closest('.solve-btn');
        if (!solveLink) {
            return;
        }

        const problemId = Number(solveLink.dataset.problemId);
        const selectedProblem = allProblems.find((problem) => problem.problem_id === problemId);
        if (!selectedProblem) {
            return;
        }

        localStorage.setItem('lla-current-problem', JSON.stringify(buildEditorProblem(selectedProblem)));
    });

    const loadProblems = async () => {
        grid.innerHTML = '<p class="no-data">Chargement des problemes...</p>';

        try {
            const response = await fetch(`${PROBLEMS_API_BASE_URL}/problems`, {
                method: 'GET'
            });
            const payload = await response.json();

            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Impossible de recuperer les problemes.');
            }

            allProblems = Array.isArray(payload.data) ? payload.data : [];
            applyFilters();
        } catch (error) {
            grid.innerHTML = '<p class="no-data">Impossible de charger les problemes depuis la base de donnees.</p>';
            noResults.hidden = true;
            cardCount.textContent = '0 probleme trouve';
            console.error(error);
        }
    };

    loadProblems();
});

