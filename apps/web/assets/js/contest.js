/**
 * Contests Listing Logic
 * Dynamically binds raw API responses into a unified native Grid
 */

let allContests = [];
let usingDemoContests = false;

function getDemoContests() {
    const demoData = window.LLADemoData;
    if (!demoData?.contests) {
        return [];
    }

    return [
        ...(demoData.contests.upcoming || []).map((contest) => ({ ...contest, listing_type: 'upcoming' })),
        ...(demoData.contests.active || []).map((contest) => ({ ...contest, listing_type: 'active' })),
        ...(demoData.contests.past || []).map((contest) => ({ ...contest, listing_type: 'past' })),
    ];
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadContests();
    setupEventListeners();
});

function setupEventListeners() {
    const searchInput = document.getElementById('contestSearch');
    const filterChips = document.querySelectorAll('.filter-chip');

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    filterChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            // Update active state
            filterChips.forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-pressed', 'false');
            });
            e.target.classList.add('active');
            e.target.setAttribute('aria-pressed', 'true');
            
            applyFilters();
        });
    });
}

async function loadContests() {
    try {
        const response = await apiGetContests();
        if (response.success && response.data) {
            // Flatten the response and assign a `type` property corresponding to the filter targets
            allContests = [
                ...response.data.upcoming.map(c => ({...c, listing_type: 'upcoming'})),
                ...response.data.active.map(c => ({...c, listing_type: 'active'})),
                ...response.data.past.map(c => ({...c, listing_type: 'past'}))
            ];

            if (allContests.length === 0) {
                allContests = getDemoContests();
                usingDemoContests = allContests.length > 0;
            } else {
                usingDemoContests = false;
            }

            applyFilters(); // Initial render
        } else {
            allContests = getDemoContests();
            if (allContests.length > 0) {
                usingDemoContests = true;
                applyFilters();
                return;
            }

            usingDemoContests = false;
            showError('Impossible de charger les concours depuis l API.');
        }
    } catch (err) {
        allContests = getDemoContests();
        if (allContests.length > 0) {
            usingDemoContests = true;
            applyFilters();
            return;
        }

        usingDemoContests = false;
        showError('Impossible de charger les concours depuis l API.');
    }
}

function showError(msg) {
    const errorHTML = `<p class="error-message" style="color: #d32f2f; font-weight: bold; grid-column: 1 / -1; text-align: center; padding: 2rem;">${escapeHtml(msg)}</p>`;
    document.getElementById('contestsGrid').innerHTML = errorHTML;
    document.getElementById('cardCount').textContent = 'Erreur';
}

function normalizeContestId(value) {
    const contestId = Number(value);
    return Number.isInteger(contestId) && contestId > 0 ? contestId : null;
}

function applyFilters() {
    const searchInput = document.getElementById('contestSearch');
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    const activeChip = document.querySelector('.filter-chip.active');
    const currentFilter = activeChip ? activeChip.getAttribute('data-filter') : 'all';

    const filtered = allContests.filter(contest => {
        const title = String(contest.title || '').toLowerCase();
        const description = String(contest.description || '').toLowerCase();
        const matchesSearch = title.includes(searchQuery) || description.includes(searchQuery);
        
        const matchesFilter = currentFilter === 'all' || contest.listing_type === currentFilter;

        return matchesSearch && matchesFilter;
    });

    renderGrid(filtered);
}

function renderGrid(contests) {
    const container = document.getElementById('contestsGrid');
    const countElement = document.getElementById('cardCount');
    
    if (countElement) {
        countElement.textContent = `${contests.length} concours trouve${contests.length !== 1 ? 's' : ''}${usingDemoContests ? ' • données de démonstration' : ''}`;
    }

    if (contests.length === 0) {
        container.innerHTML = `<p class="no-data" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">Aucun concours ne correspond a vos criteres.</p>`;
        return;
    }

    let html = '';
    contests.forEach(c => {
        const type = c.listing_type;
        const contestId = normalizeContestId(c.contest_id);
        
        let tagDetails = { text: 'N/A', bg: 'rgba(var(--accent-rgb), 0.15)', color: 'var(--accent)' };
        if (type === 'upcoming') tagDetails = { text: 'A venir', bg: 'var(--surface-board)', color: 'var(--text)' };
        if (type === 'active') tagDetails = { text: 'En cours', bg: '#dcfce7', color: '#166534' };
        if (type === 'past') tagDetails = { text: 'Termine', bg: '#f1f5f9', color: '#475569' };

        const startDate = new Date(c.start_time).toLocaleString();
        const endDate = new Date(c.end_time).toLocaleString();
        
        let actionsHtml = `
            <a class="btn btn-primary solve-btn" href="contest-details.html?id=${contestId ?? ''}">Voir les details</a>
        `;
        if (type === 'past') {
            actionsHtml = `<a class="btn btn-ghost solve-btn" href="contest-details.html?id=${contestId ?? ''}">Archive</a>`;
        }

        html += `
            <article class="problem-card contest-card panel ${type === 'past' ? 'is-past' : ''}" style="border-top-color: ${tagDetails.color};">
                <span class="contest-tag" style="background: ${tagDetails.bg}; color: ${tagDetails.color};">
                    ${tagDetails.text}
                </span>
                <h3>${escapeHtml(c.title)}</h3>
                <p>${escapeHtml(c.description)}</p>
                <div class="contest-time">
                    <strong>Debut :</strong> ${escapeHtml(startDate)}<br>
                    <strong>Fin :</strong> ${escapeHtml(endDate)}
                </div>
                <div class="problem-actions">
                    <span class="difficulty medium">-</span>
                    ${actionsHtml}
                </div>
            </article>
        `;
    });

    container.innerHTML = html;
}
