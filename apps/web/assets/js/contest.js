/**
 * Contests Listing Logic
 * Dynamically binds raw API responses into a unified native Grid
 */

let allContests = [];
const TEMP_CONTESTS = (window.CONTEST_MOCK_DATA && Array.isArray(window.CONTEST_MOCK_DATA.list))
    ? window.CONTEST_MOCK_DATA.list
    : [];

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
                allContests = TEMP_CONTESTS;
            }

            applyFilters(); // Initial render
        } else {
            allContests = TEMP_CONTESTS;
            applyFilters();
        }
    } catch (err) {
        allContests = TEMP_CONTESTS;
        applyFilters();
    }
}

function showError(msg) {
    const errorHTML = `<p class="error-message" style="color: #d32f2f; font-weight: bold; grid-column: 1 / -1; text-align: center; padding: 2rem;">${msg}</p>`;
    document.getElementById('contestsGrid').innerHTML = errorHTML;
    document.getElementById('cardCount').textContent = 'Erreur';
}

function applyFilters() {
    const searchInput = document.getElementById('contestSearch');
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    const activeChip = document.querySelector('.filter-chip.active');
    const currentFilter = activeChip ? activeChip.getAttribute('data-filter') : 'all';

    const filtered = allContests.filter(contest => {
        const matchesSearch = contest.title.toLowerCase().includes(searchQuery) || 
                              contest.description.toLowerCase().includes(searchQuery);
        
        const matchesFilter = currentFilter === 'all' || contest.listing_type === currentFilter;

        return matchesSearch && matchesFilter;
    });

    renderGrid(filtered);
}

function renderGrid(contests) {
    const container = document.getElementById('contestsGrid');
    const countElement = document.getElementById('cardCount');
    
    if (countElement) {
        countElement.textContent = `${contests.length} tournoi${contests.length !== 1 ? 's' : ''} trouvé${contests.length !== 1 ? 's' : ''}`;
    }

    if (contests.length === 0) {
        container.innerHTML = `<p class="no-data" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">Aucun concours ne correspond à vos critères.</p>`;
        return;
    }

    let html = '';
    contests.forEach(c => {
        const type = c.listing_type;
        
        let tagDetails = { text: 'N/A', bg: 'rgba(var(--accent-rgb), 0.15)', color: 'var(--accent)' };
        if (type === 'upcoming') tagDetails = { text: 'Bientôt Ouvert', bg: 'var(--surface-board)', color: 'var(--text)' };
        if (type === 'active') tagDetails = { text: 'En cours', bg: '#dcfce7', color: '#166534' };
        if (type === 'past') tagDetails = { text: 'Terminé', bg: '#f1f5f9', color: '#475569' };

        const startDate = new Date(c.start_time).toLocaleString();
        const endDate = new Date(c.end_time).toLocaleString();
        
        let actionsHtml = `
            <a class="btn btn-primary solve-btn" href="contest-details.html?id=${c.contest_id}">Voir les détails</a>
        `;
        if (type === 'past') {
            actionsHtml = `<a class="btn btn-ghost solve-btn" href="contest-details.html?id=${c.contest_id}">Archive</a>`;
        }

        html += `
            <article class="problem-card contest-card panel ${type === 'past' ? 'is-past' : ''}" style="border-top-color: ${tagDetails.color};">
                <span class="contest-tag" style="background: ${tagDetails.bg}; color: ${tagDetails.color};">
                    ${tagDetails.text}
                </span>
                <h3>${c.title}</h3>
                <p>${c.description}</p>
                <div class="contest-time">
                    <strong> Début :</strong> ${startDate}<br>
                    <strong>Fin :</strong> ${endDate}
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

