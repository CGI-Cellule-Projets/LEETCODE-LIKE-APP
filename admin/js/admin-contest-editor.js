/**
 * Admin Contest Editor
 * Dedicated admin page to inspect and update a single contest.
 */

let currentContestId = null;
let currentContestIsTemporary = false;
let problemIndex = 0;

const TEMP_ADMIN_CONTEST_DETAILS = (window.CONTEST_MOCK_DATA && Array.isArray(window.CONTEST_MOCK_DATA.details))
  ? window.CONTEST_MOCK_DATA.details
  : [];

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();

  const idParam = new URLSearchParams(window.location.search).get('id');
  if (!idParam || Number.isNaN(Number.parseInt(idParam, 10))) {
    showInfo('Aucun identifiant valide fourni. Chargement d\'un concours temporaire.', true);
    populateEditor(TEMP_ADMIN_CONTEST_DETAILS[0], true);
    return;
  }

  currentContestId = Number.parseInt(idParam, 10);
  await loadContest(currentContestId);
});

function setupEventListeners() {
  const form = document.getElementById('contestEditorForm');
  const addProblemRowBtn = document.getElementById('addProblemRowBtn');

  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  if (addProblemRowBtn) {
    addProblemRowBtn.addEventListener('click', () => addProblemRow());
  }
}

async function loadContest(contestId) {
  try {
    const result = await apiAdminGetContestById(contestId);

    if (result.success && result.data) {
      populateEditor(result.data, false);
      return;
    }

    const fallback = TEMP_ADMIN_CONTEST_DETAILS.find(c => c.contest_id === contestId);
    if (fallback) {
      populateEditor(fallback, true);
      showInfo('Mode démo: données temporaires chargées (API indisponible ou accès refusé).', true);
    } else {
      showInfo('Concours introuvable.', true);
    }
  } catch (error) {
    const fallback = TEMP_ADMIN_CONTEST_DETAILS.find(c => c.contest_id === contestId);
    if (fallback) {
      populateEditor(fallback, true);
      showInfo('Mode démo: données temporaires chargées après erreur réseau.', true);
    } else {
      showInfo('Erreur de chargement du concours.', true);
    }
  }
}

function populateEditor(contest, isTemporary) {
  currentContestIsTemporary = isTemporary;
  currentContestId = contest.contest_id;

  document.getElementById('editorPageTitle').textContent = `${contest.title}`;
  document.getElementById('contestTitle').value = contest.title || '';
  document.getElementById('contestDescription').value = contest.description || '';
  document.getElementById('contestStart').value = toDateTimeLocal(contest.start_time);
  document.getElementById('contestEnd').value = toDateTimeLocal(contest.end_time);

  const container = document.getElementById('problemDefinitions');
  container.innerHTML = '';
  problemIndex = 0;

  const rows = Array.isArray(contest.problems) && contest.problems.length > 0
    ? contest.problems
    : [{ problem_id: '', points: 100 }];

  rows.forEach(row => addProblemRow(row.problem_id, row.points));

  if (!isTemporary) {
    showInfo(`Concours #${contest.contest_id} chargé depuis l'API.`);
  }
}

function addProblemRow(problemId = '', points = 100) {
  const container = document.getElementById('problemDefinitions');
  const row = document.createElement('div');
  row.className = 'problem-entry';
  row.id = `problemRow-${problemIndex}`;

  row.innerHTML = `
    <label>ID du problème :
      <input type="number" class="prob-id-input" value="${problemId}" placeholder="Ex: 5" required>
    </label>
    <label>Points :
      <input type="number" class="prob-points-input" value="${points}" min="1" required>
    </label>
    <button type="button" class="btn-remove" onclick="removeProblemRow(${problemIndex})">X</button>
  `;

  container.appendChild(row);
  problemIndex += 1;
}

function removeProblemRow(index) {
  const row = document.getElementById(`problemRow-${index}`);
  if (row && document.querySelectorAll('.problem-entry').length > 1) {
    row.remove();
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
  formError.style.display = 'none';
  formSuccess.style.display = 'none';

  if (!title || !description || !rawStart || !rawEnd) {
    formError.textContent = '❌ Veuillez remplir tous les champs obligatoires.';
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

  const entries = document.querySelectorAll('.problem-entry');
  const mappingPayload = [];

  for (const entry of entries) {
    const pId = entry.querySelector('.prob-id-input').value;
    const pPts = entry.querySelector('.prob-points-input').value;

    if (!pId) {
      formError.textContent = '❌ Tous les IDs de problème doivent être renseignés.';
      formError.style.display = 'block';
      return;
    }

    mappingPayload.push({
      problem_id: Number.parseInt(pId, 10),
      points: Number.parseInt(pPts, 10)
    });
  }

  if (currentContestIsTemporary) {
    formSuccess.textContent = '✓ Mode démo: modifications locales validées (aucune écriture API).';
    formSuccess.style.display = 'block';
    return;
  }

  const payloadHeader = { title, description, start_time, end_time };
  const result = await apiAdminUpdateContest(currentContestId, payloadHeader, mappingPayload);

  if (result.success) {
    formSuccess.textContent = '✓ Concours mis à jour avec succès.';
    formSuccess.style.display = 'block';
    showInfo(`Dernière mise à jour: ${new Date().toLocaleString()}`);
  } else {
    formError.textContent = `❌ ${result.message || 'Erreur lors de la mise à jour.'}`;
    formError.style.display = 'block';
  }
}

function showInfo(message, isWarning = false) {
  const box = document.getElementById('editorInfo');
  box.textContent = message;
  box.className = `panel admin-note ${isWarning ? 'warning' : ''}`;
}

function toDateTimeLocal(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

window.removeProblemRow = removeProblemRow;
