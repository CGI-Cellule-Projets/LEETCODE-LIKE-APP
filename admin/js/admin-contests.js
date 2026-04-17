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

function getProblemDefinitionsContainer() {
    return document.getElementById('problemDefinitions');
}

function clearProblemDefinitionsError() {
    const errorNode = document.getElementById('problemDefinitionsError');
    if (!errorNode) {
        return;
    }

    errorNode.textContent = '';
    errorNode.hidden = true;
}

function showProblemDefinitionsError(message) {
    const errorNode = document.getElementById('problemDefinitionsError');
    if (!errorNode) {
        return;
    }

    errorNode.textContent = message;
    errorNode.hidden = false;
}

function refreshProblemRowMetadata() {
    const rows = Array.from(document.querySelectorAll('.problem-entry'));
    rows.forEach((row, index) => {
        const problemLabel = row.querySelector('[data-problem-id-label]');
        const pointsLabel = row.querySelector('[data-problem-points-label]');
        const removeButton = row.querySelector('[data-remove-problem-row]');
        const rowNumber = index + 1;

        if (problemLabel) {
            problemLabel.textContent = `ID du probleme ${rowNumber}`;
        }
        if (pointsLabel) {
            pointsLabel.textContent = `Points ${rowNumber}`;
        }
        if (removeButton) {
            removeButton.setAttribute('aria-label', `Supprimer la ligne du probleme ${rowNumber}`);
            removeButton.disabled = rows.length <= 1;
        }
    });
}

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
    const problemDefinitions = getProblemDefinitionsContainer();

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

    if (problemDefinitions) {
        problemDefinitions.addEventListener('click', (event) => {
            const removeButton = event.target.closest('[data-remove-problem-row]');
            if (!removeButton) {
                return;
            }

            const row = removeButton.closest('.problem-entry');
            if (!row) {
                return;
            }

            removeProblemRow(row.id.replace('problemRow-', ''));
        });
    }
}

function showCreateForm() {
    const formSection = document.getElementById('createFormSection');
    const listSection = document.querySelector('.problems-list-section');
    const form = document.getElementById('contestForm');
    
    // reset defaults
    form.reset();
    getProblemDefinitionsContainer().innerHTML = '';
    problemIndex = 0;
    addProblemRow();
    
    document.getElementById('formError').hidden = true;
    document.getElementById('formSuccess').hidden = true;
    clearProblemDefinitionsError();
    
    formSection.hidden = false;
    if (listSection) {
        listSection.hidden = true;
    }
    formSection.scrollIntoView({ behavior: 'smooth' });
}

function hideCreateForm() {
    document.getElementById('createFormSection').hidden = true;
    const listSection = document.querySelector('.problems-list-section');
    if (listSection) {
        listSection.hidden = false;
    }
    clearProblemDefinitionsError();
}

function addProblemRow() {
    const container = getProblemDefinitionsContainer();
    const row = document.createElement('div');
    row.className = 'problem-entry';
    row.id = `problemRow-${problemIndex}`;
    
    row.innerHTML = `
        <label>
            <span data-problem-id-label>ID du probleme</span>
            <input type="number" class="prob-id-input" placeholder="Ex: 5" required>
        </label>
        <label>
            <span data-problem-points-label>Points</span>
            <input type="number" class="prob-points-input" value="100" min="1" required>
        </label>
        <button type="button" class="btn-remove" data-remove-problem-row>Supprimer</button>
    `;
    
    container.appendChild(row);
    problemIndex++;
    clearProblemDefinitionsError();
    refreshProblemRowMetadata();
}

function removeProblemRow(index) {
    const row = document.getElementById(`problemRow-${index}`);
    const rowCount = document.querySelectorAll('.problem-entry').length;
    if (!row) {
        return;
    }

    if (rowCount <= 1) {
        showProblemDefinitionsError('Un concours doit comporter au moins un probleme.');
        refreshProblemRowMetadata();
        return;
    }

    row.remove();
    clearProblemDefinitionsError();
    refreshProblemRowMetadata();
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('contestTitle').value.trim();
    const description = document.getElementById('contestDescription').value.trim();
    
    const rawStart = document.getElementById('contestStart').value;
    const rawEnd = document.getElementById('contestEnd').value;
    
    const formError = document.getElementById('formError');
    const formSuccess = document.getElementById('formSuccess');
    formError.hidden = true;
    formSuccess.hidden = true;
    clearProblemDefinitionsError();

    if (!title || !description || !rawStart || !rawEnd) {
        formError.textContent = ' Veuillez remplir tous les champs du sommet.';
        formError.hidden = false;
        return;
    }

    const start_time = new Date(rawStart).toISOString();
    const end_time = new Date(rawEnd).toISOString();

    if (new Date(end_time) <= new Date(start_time)) {
        formError.textContent = ' La date de fin doit être postérieure à la date de début.';
        formError.hidden = false;
        return;
    }

    // Extract mapping bindings
    const mappingPayload = [];
    const entries = document.querySelectorAll('.problem-entry');
    
    for (const entry of entries) {
        const pId = entry.querySelector('.prob-id-input').value;
        const pPts = entry.querySelector('.prob-points-input').value;
        const problemId = Number.parseInt(pId, 10);
        const points = Number.parseInt(pPts, 10);
        
        if (!pId || Number.isNaN(problemId)) {
            showProblemDefinitionsError('Veuillez fournir un ID de probleme valide pour chaque ligne.');
            return;
        }

        if (!pPts || Number.isNaN(points) || points < 1) {
            showProblemDefinitionsError('Veuillez fournir un nombre de points valide pour chaque probleme.');
            return;
        }
        
        mappingPayload.push({
            problem_id: problemId,
            points
        });
    }

    const payloadHeader = { title, description, start_time, end_time };
    
    try {
        const result = await apiAdminCreateContest(payloadHeader, mappingPayload);
        
        if (result.success) {
            formError.hidden = true;
            formSuccess.textContent = ' Concours créé et problèmes mappés avec succès!';
            formSuccess.hidden = false;
            
            setTimeout(() => {
                hideCreateForm();
                loadContests();
            }, 1500);
        } else {
            formError.textContent = ` ${result.message || 'Erreur lors de la création'}`;
            formError.hidden = false;
        }
    } catch (error) {
        formError.textContent = ' Erreur inattendue';
        formError.hidden = false;
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

            renderContestsList(allContests);
        } else {
            renderContestsError(result.message || 'Impossible de charger les concours.');
        }
    } catch (error) {
        console.error(error);
        renderContestsError('Impossible de charger les concours.');
    }
}

function renderContestsError(message) {
    const container = document.getElementById('contestsTable');
    if (!container) {
        return;
    }

    container.innerHTML = `<p class="error-message">${escapeHtml(message)}</p>`;
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


