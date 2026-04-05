/**
 * Admin Contests Management
 * Handles CRUD operations for coding contests via Vanilla JS
 */

let allContests = [];
let problemIndex = 0; // tracking row counts
function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const TEMP_ADMIN_CONTESTS = (window.CONTEST_MOCK_DATA && Array.isArray(window.CONTEST_MOCK_DATA.list))
    ? window.CONTEST_MOCK_DATA.list.map((contest) => ({
        ...contest,
        status: contest.listing_type === 'active'
            ? 'Actif'
            : contest.listing_type === 'upcoming'
                ? 'À venir'
                : 'Terminé'
    }))
    : [];

document.addEventListener('DOMContentLoaded', async () => {
    // Load contests
    await loadContests();
    setupEventListeners();
    addProblemRow(); // Start with at least one row
});

function setupEventListeners() {
    const createContestBtn = document.getElementById('createContestBtn');
    const cancelFormBtn = document.getElementById('cancelFormBtn');
    const addProblemRowBtn = document.getElementById('addProblemRowBtn');
    const contestForm = document.getElementById('contestForm');

    if (createContestBtn) {
        createContestBtn.addEventListener('click', showCreateForm);
    }

    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', hideCreateForm);
    }

    if (addProblemRowBtn) {
        addProblemRowBtn.addEventListener('click', addProblemRow);
    }

    if (contestForm) {
        contestForm.addEventListener('submit', handleFormSubmit);
    }
}

function showCreateForm() {
    const formSection = document.getElementById('createFormSection');
    const form = document.getElementById('contestForm');
    
    // reset defaults
    form.reset();
    document.getElementById('problemDefinitions').innerHTML = '';
    problemIndex = 0;
    addProblemRow();
    
    document.getElementById('formError').style.display = 'none';
    document.getElementById('formSuccess').style.display = 'none';
    
    formSection.style.display = 'block';
    document.querySelector('.problems-list-section').style.display = 'none';
    formSection.scrollIntoView({ behavior: 'smooth' });
}

function hideCreateForm() {
    document.getElementById('createFormSection').style.display = 'none';
    document.querySelector('.problems-list-section').style.display = 'block';
}

function addProblemRow() {
    const container = document.getElementById('problemDefinitions');
    const row = document.createElement('div');
    row.className = 'problem-entry';
    row.id = `problemRow-${problemIndex}`;
    
    row.innerHTML = `
        <label>ID du problème : 
            <input type="number" class="prob-id-input" placeholder="Ex: 5" required>
        </label>
        <label>Points : 
            <input type="number" class="prob-points-input" value="100" min="1" required>
        </label>
        <button type="button" class="btn-remove" onclick="removeProblemRow(${problemIndex})">X</button>
    `;
    
    container.appendChild(row);
    problemIndex++;
}

function removeProblemRow(index) {
    const row = document.getElementById(`problemRow-${index}`);
    if (row && document.querySelectorAll('.problem-entry').length > 1) {
        row.remove();
    } else {
        alert("Un concours doit comporter au moins un problème.");
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('contestTitle').value.trim();
    const description = document.getElementById('contestDescription').value.trim();
    
    const rawStart = document.getElementById('contestStart').value;
    const rawEnd = document.getElementById('contestEnd').value;
    
    const formError = document.getElementById('formError');
    const formSuccess = document.getElementById('formSuccess');

    if (!title || !description || !rawStart || !rawEnd) {
        formError.textContent = '❌ Veuillez remplir tous les champs du sommet.';
        formError.style.display = 'block';
        return;
    }

    const start_time = new Date(rawStart).toISOString();
    const end_time = new Date(rawEnd).toISOString();

    if (new Date(end_time) <= new Date(start_time)) {
        formError.textContent = '❌ La date de fin doit être postérieure à la date de début.';
        formError.style.display = 'block';
        return;
    }

    // Extract mapping bindings
    const mappingPayload = [];
    const entries = document.querySelectorAll('.problem-entry');
    
    for (const entry of entries) {
        const pId = entry.querySelector('.prob-id-input').value;
        const pPts = entry.querySelector('.prob-points-input').value;
        
        if (!pId) {
            formError.textContent = '❌ Veuillez fournir un ID de problème valide pour chaque ligne.';
            formError.style.display = 'block';
            return;
        }
        
        mappingPayload.push({
            problem_id: parseInt(pId),
            points: parseInt(pPts)
        });
    }

    const payloadHeader = { title, description, start_time, end_time };
    
    try {
        const result = await apiAdminCreateContest(payloadHeader, mappingPayload);
        
        if (result.success) {
            formError.style.display = 'none';
            formSuccess.textContent = '✓ Concours créé et problèmes mappés avec succès!';
            formSuccess.style.display = 'block';
            
            setTimeout(() => {
                hideCreateForm();
                loadContests();
            }, 1500);
        } else {
            formError.textContent = `❌ ${result.message || 'Erreur lors de la création'}`;
            formError.style.display = 'block';
        }
    } catch (error) {
        formError.textContent = '❌ Erreur inattendue';
        formError.style.display = 'block';
        console.error(error);
    }
}

async function loadContests() {
    try {
        const result = await apiAdminGetContests();
        if (result.success && result.data) {
            // Flatten upcoming/active/past
            allContests = [
                ...result.data.active.map(c => ({...c, status: 'Actif'})),
                ...result.data.upcoming.map(c => ({...c, status: 'À venir'})),
                ...result.data.past.map(c => ({...c, status: 'Terminé'}))
            ];

            if (allContests.length === 0) {
                allContests = TEMP_ADMIN_CONTESTS;
            }

            renderContestsList(allContests);
        } else {
            allContests = TEMP_ADMIN_CONTESTS;
            renderContestsList(allContests);
        }
    } catch (error) {
        console.error(error);
        allContests = TEMP_ADMIN_CONTESTS;
        renderContestsList(allContests);
    }
}

function renderContestsList(contests) {
    const container = document.getElementById('contestsTable');

    if (contests.length === 0) {
                container.innerHTML = '<p class="no-data">Aucun concours trouvé</p>';
        return;
    }

    let html = `
            <table class="problems-table-content">
        <thead>
                    <tr>
                        <th>Statut</th>
                        <th>Titre</th>
                        <th>Heure de Début</th>
                        <th>Heure de Fin</th>
                        <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    contests.forEach(contest => {
                let statusClass = 'past';
                if (contest.status === 'Actif') statusClass = 'active';
                if (contest.status === 'À venir') statusClass = 'upcoming';
        
        html += `
                    <tr data-contest-id="${contest.contest_id}">
                        <td>
                                <span class="status-pill ${statusClass}">
                    ${escapeHtml(contest.status)}
                </span>
            </td>
                        <td>
                                <div class="contest-title">${escapeHtml(contest.title)}</div>
            </td>
                        <td class="contest-date">
                ${new Date(contest.start_time).toLocaleString()}
            </td>
                        <td class="contest-date">
                ${new Date(contest.end_time).toLocaleString()}
            </td>
                                                <td class="actions">
                                                                <a class="btn-icon" href="contest-editor.html?id=${contest.contest_id}">Détails / Modifier</a>
                        </td>
          </tr>
        `;
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;
}

