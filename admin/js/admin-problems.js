/**
 * Admin Problems Management
 * Handles CRUD operations for coding problems
 */

let allProblems = [];
let editingProblemId = null;
const DEMO_PROBLEMS_KEY = 'lla-admin-demo-problems';

function readDemoProblems() {
  try {
    const stored = localStorage.getItem(DEMO_PROBLEMS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeDemoProblems(problems) {
  localStorage.setItem(DEMO_PROBLEMS_KEY, JSON.stringify(problems));
}

function isNetworkFailure(result) {
  if (!result || result.success !== false) {
    return false;
  }

  const errorText = String(result.errors || result.message || '');
  return /failed to fetch|networkerror|network request failed|load failed/i.test(errorText);
}

function createDemoProblemRecord({ name, difficulty, description, visibility, isPublished, testCases }) {
  return {
    problem_id: Date.now(),
    name,
    difficulty_level: difficulty,
    description,
    visibility,
    is_published: Boolean(isPublished),
    solve_rate: 0,
    test_cases: testCases.map((testCase) => ({
      input_data: testCase.input_data,
      expected_output: testCase.expected_output,
      is_hidden: Boolean(testCase.is_hidden),
      isExisting: true,
    })),
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadProblems();
  setupEventListeners();
  ensureAtLeastOneTestCase();
});

function setupEventListeners() {
  const createProblemBtn = document.getElementById('createProblemBtn');
  const cancelFormBtn = document.getElementById('cancelFormBtn');
  const problemForm = document.getElementById('problemForm');
  const problemSearch = document.getElementById('problemSearch');
  const difficultyFilter = document.getElementById('difficultyFilter');
  const addTestCaseBtn = document.getElementById('addTestCaseBtn');
  const testCasesContainer = document.getElementById('testCasesContainer');

  if (createProblemBtn) {
    createProblemBtn.addEventListener('click', showCreateForm);
  }

  if (cancelFormBtn) {
    cancelFormBtn.addEventListener('click', hideCreateForm);
  }

  if (problemForm) {
    problemForm.addEventListener('submit', handleFormSubmit);
  }

  if (problemSearch) {
    problemSearch.addEventListener('input', filterProblems);
  }

  if (difficultyFilter) {
    difficultyFilter.addEventListener('change', filterProblems);
  }

  if (addTestCaseBtn) {
    addTestCaseBtn.addEventListener('click', () => {
      appendTestCase();
    });
  }

  if (testCasesContainer) {
    testCasesContainer.addEventListener('click', (event) => {
      const removeButton = event.target.closest('[data-remove-test-case]');
      if (!removeButton) {
        return;
      }

      const card = removeButton.closest('.test-case-card');
      if (!card) {
        return;
      }

      if (card.dataset.existing === 'true') {
        alert('Les cas de test deja enregistres ne peuvent pas etre supprimes depuis cette page pour le moment.');
        return;
      }

      card.remove();
      ensureAtLeastOneTestCase();
      updateRemoveButtonsState();
    });
  }
}

function getTestCasesContainer() {
  return document.getElementById('testCasesContainer');
}

function createTestCaseMarkup(testCase = {}) {
  const isExisting = Boolean(testCase.isExisting);
  const index = getTestCasesContainer()?.querySelectorAll('.test-case-card').length ?? 0;
  const title = isExisting ? `Cas de test enregistre ${index + 1}` : `Nouveau cas de test ${index + 1}`;
  const readonlyHint = isExisting
    ? '<p style="margin:0 0 12px;color:var(--text-secondary);font-size:0.85rem;">Ce cas de test existe deja dans la base. Vous pouvez en ajouter de nouveaux ci-dessous.</p>'
    : '';

  return `
    <article
      class="test-case-card panel"
      data-test-case
      data-existing="${isExisting ? 'true' : 'false'}"
      style="padding:16px;margin-bottom:12px;border:1px solid rgba(148,163,184,0.24);"
    >
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
        <strong>${title}</strong>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          data-remove-test-case
          ${isExisting ? 'disabled' : ''}
        >
          Supprimer
        </button>
      </div>
      ${readonlyHint}
      <div class="form-row">
        <div class="form-group">
          <label>Input</label>
          <textarea
            class="test-case-input"
            rows="4"
            placeholder="Ex: 2 7 11 15"
            ${isExisting ? 'readonly' : ''}
          >${escapeHtml(testCase.input_data || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Output attendu</label>
          <textarea
            class="test-case-output"
            rows="4"
            placeholder="Ex: Hello from LLA"
            ${isExisting ? 'readonly' : ''}
          >${escapeHtml(testCase.expected_output || '')}</textarea>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="test-case-hidden" ${testCase.is_hidden ? 'checked' : ''} ${isExisting ? 'disabled' : ''}>
            Cas cache (validation finale uniquement)
          </label>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getDifficultyMeta(value) {
  if (window.LLADifficulty?.getMeta) {
    return window.LLADifficulty.getMeta(value);
  }

  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'med' || normalized === 'medium' || normalized === 'moyen') {
    return { label: 'Moyen', className: 'medium', filterValue: 'medium' };
  }
  if (normalized === 'hard' || normalized === 'difficile') {
    return { label: 'Difficile', className: 'hard', filterValue: 'hard' };
  }
  return { label: 'Facile', className: 'easy', filterValue: 'easy' };
}

function appendTestCase(testCase = {}) {
  const container = getTestCasesContainer();
  if (!container) {
    return;
  }

  container.insertAdjacentHTML('beforeend', createTestCaseMarkup(testCase));
  updateRemoveButtonsState();
}

function updateRemoveButtonsState() {
  const container = getTestCasesContainer();
  if (!container) {
    return;
  }

  const removableCards = Array.from(container.querySelectorAll('.test-case-card'))
    .filter((card) => card.dataset.existing !== 'true');

  removableCards.forEach((card) => {
    const removeButton = card.querySelector('[data-remove-test-case]');
    if (!removeButton) {
      return;
    }

    removeButton.disabled = removableCards.length <= 1;
  });
}

function ensureAtLeastOneTestCase() {
  const container = getTestCasesContainer();
  if (!container) {
    return;
  }

  const testCaseCount = container.querySelectorAll('.test-case-card').length;
  if (testCaseCount === 0) {
    appendTestCase({
      input_data: '',
      expected_output: '',
      is_hidden: false,
      isExisting: false,
    });
  }
}

function collectTestCases() {
  const container = getTestCasesContainer();
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll('.test-case-card')).map((card) => ({
    input_data: card.querySelector('.test-case-input')?.value.trim() || '',
    expected_output: card.querySelector('.test-case-output')?.value.trim() || '',
    is_hidden: Boolean(card.querySelector('.test-case-hidden')?.checked),
    isExisting: card.dataset.existing === 'true',
  }));
}

function resetTestCases(testCases = []) {
  const container = getTestCasesContainer();
  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (testCases.length === 0) {
    ensureAtLeastOneTestCase();
    return;
  }

  testCases.forEach((testCase) => appendTestCase(testCase));
  updateRemoveButtonsState();
}

function showCreateForm() {
  editingProblemId = null;
  const form = document.getElementById('problemForm');
  const formSection = document.getElementById('createFormSection');
  const problemsListSection = document.querySelector('.problems-list-section');
  const formTitle = document.getElementById('formTitle');
  const searchInput = document.getElementById('problemSearch');
  const formError = document.getElementById('formError');

  formTitle.textContent = 'Creer un Nouveau Probleme';
  form.reset();
  resetTestCases([]);
  formError.hidden = true;
  formSection.hidden = false;
  if (problemsListSection) {
    problemsListSection.hidden = true;
  }
  if (searchInput) {
    searchInput.value = '';
  }

  formSection.scrollIntoView({ behavior: 'smooth' });
}

function hideCreateForm() {
  document.getElementById('createFormSection').hidden = true;
  const problemsListSection = document.querySelector('.problems-list-section');
  if (problemsListSection) {
    problemsListSection.hidden = false;
  }
  editingProblemId = null;
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('problemName').value.trim();
  const difficulty = document.getElementById('problemDifficulty').value;
  const description = document.getElementById('problemDescription').value.trim();
  const visibility = document.getElementById('problemVisibility').value;
  const isPublished = document.getElementById('isPublished').checked;
  const formError = document.getElementById('formError');
  const testCases = collectTestCases();
  formError.hidden = true;

  if (!name || !difficulty || !description || !visibility) {
    formError.textContent = 'Veuillez remplir tous les champs obligatoires.';
    formError.hidden = false;
    return;
  }

  if (testCases.length === 0) {
    formError.textContent = 'Ajoutez au moins un cas de test.';
    formError.hidden = false;
    return;
  }

  const invalidTestCase = testCases.find((testCase) => testCase.expected_output === '');
  if (invalidTestCase) {
    formError.textContent = 'Chaque cas de test doit avoir un input et un output attendu.';
    formError.hidden = false;
    return;
  }

  try {
    let result;
    let problemId = editingProblemId;
    let createdLocally = false;

    if (editingProblemId) {
      result = await apiAdminUpdateProblem(editingProblemId, {
        name,
        difficulty_level: difficulty,
        description,
        visibility,
        is_published: isPublished,
      });

      if (!result.success && isNetworkFailure(result)) {
        const demoProblems = readDemoProblems();
        const demoProblemIndex = demoProblems.findIndex((problem) => problem.problem_id === editingProblemId);

        if (demoProblemIndex !== -1) {
          const existingTestCases = demoProblems[demoProblemIndex].test_cases || [];
          demoProblems[demoProblemIndex] = {
            ...demoProblems[demoProblemIndex],
            name,
            difficulty_level: difficulty,
            description,
            visibility,
            is_published: Boolean(isPublished),
            test_cases: existingTestCases,
          };
          writeDemoProblems(demoProblems);
          allProblems = demoProblems;
          result = { success: true, message: 'Updated locally' };
        }
      }
    } else {
      result = await apiAdminCreateProblem(name, difficulty, description, visibility, isPublished);
      problemId = result?.data?.problem_id ?? null;

      if (!result.success && isNetworkFailure(result)) {
        const demoProblems = readDemoProblems();
        const demoProblem = createDemoProblemRecord({
          name,
          difficulty,
          description,
          visibility,
          isPublished,
          testCases,
        });

        demoProblems.unshift(demoProblem);
        writeDemoProblems(demoProblems);
        allProblems = demoProblems;
        problemId = demoProblem.problem_id;
        createdLocally = true;
      }
    }

    if (!result.success || !problemId) {
      if (createdLocally) {
        formError.hidden = true;
      } else {
        formError.textContent = result.message || 'Erreur lors de l enregistrement du probleme.';
        formError.hidden = false;
        return;
      }
    }

    const pendingTestCases = editingProblemId
      ? testCases.filter((testCase) => !testCase.isExisting)
      : testCases;

    if (createdLocally) {
      const demoProblems = readDemoProblems();
      const demoProblem = demoProblems.find((problem) => problem.problem_id === problemId);
      if (demoProblem) {
        demoProblem.test_cases = pendingTestCases.map((testCase) => ({
          input_data: testCase.input_data,
          expected_output: testCase.expected_output,
          is_hidden: Boolean(testCase.is_hidden),
          isExisting: true,
        }));
        writeDemoProblems(demoProblems);
      }
    } else {
      for (const testCase of pendingTestCases) {
        const testCaseResult = await apiAdminAddTestCase(
          problemId,
          testCase.input_data,
          testCase.expected_output,
          testCase.is_hidden,
        );

        if (!testCaseResult.success) {
          throw new Error(testCaseResult.message || 'Erreur lors de l enregistrement des cas de test.');
        }
      }
    }

    formError.hidden = true;
    hideCreateForm();
    await loadProblems();
    alert(createdLocally ? 'Probleme enregistre en mode demo local.' : 'Probleme enregistre avec succes');
  } catch (error) {
    formError.textContent = error.message || 'Erreur lors de l enregistrement';
    formError.hidden = false;
    console.error('Form submit error:', error);
  }
}

async function loadProblems() {
  try {
    const result = await apiAdminGetProblems();

    if (result.success && result.data) {
      allProblems = result.data;
      renderProblemsList(allProblems);
    } else {
      if (isNetworkFailure(result)) {
        const demoProblems = readDemoProblems();
        if (demoProblems.length > 0) {
          allProblems = demoProblems;
          renderProblemsList(allProblems);
          return;
        }
      }

      const errorText = String(result.message || result.errors || 'Erreur de chargement');
      document.getElementById('problemsTable').innerHTML = `<p class="error-message">${escapeHtml(errorText)}</p>`;
    }
  } catch (error) {
    console.error('Error loading problems:', error);
    const demoProblems = readDemoProblems();
    if (demoProblems.length > 0) {
      allProblems = demoProblems;
      renderProblemsList(allProblems);
      return;
    }

    document.getElementById('problemsTable').innerHTML = '<p class="error-message">Erreur de chargement</p>';
  }
}

function filterProblems() {
  const searchQuery = document.getElementById('problemSearch').value.toLowerCase();
  const difficultyFilter = document.getElementById('difficultyFilter').value;

  const filtered = allProblems.filter((problem) => {
    const name = String(problem.name || '').toLowerCase();
    const description = String(problem.description || '').toLowerCase();
    const matchesSearch = name.includes(searchQuery) || description.includes(searchQuery);
    const matchesDifficulty = !difficultyFilter || problem.difficulty_level === difficultyFilter;

    return matchesSearch && matchesDifficulty;
  });

  renderProblemsList(filtered);
}

function renderProblemsList(problems) {
  const container = document.getElementById('problemsTable');

  if (problems.length === 0) {
    container.innerHTML = '<p class="no-data">Aucun probleme trouve</p>';
    return;
  }

  let html = `
    <table class="problems-table-content">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Difficulte</th>
          <th>Visibilite</th>
          <th>Publie</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  problems.forEach((problem) => {
    const difficultyMeta = getDifficultyMeta(problem.difficulty_level);
    const isPublished = problem.is_published ? 'Oui' : 'Non';
    html += `
      <tr data-problem-id="${problem.problem_id}">
        <td class="problem-name">${escapeHtml(problem.name)}</td>
        <td><span class="difficulty ${difficultyMeta.className}">${escapeHtml(difficultyMeta.label)}</span></td>
        <td>${escapeHtml(problem.visibility || 'HIDDEN')}</td>
        <td>${isPublished}</td>
        <td class="actions">
          <button class="btn-icon btn-edit" onclick="editProblem(${problem.problem_id})" title="Editer">Editer</button>
          <button class="btn-icon btn-delete" onclick="deleteProblem(${problem.problem_id})" title="Supprimer">Supprimer</button>
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

async function editProblem(problemId) {
  const problem = allProblems.find((item) => item.problem_id === problemId);
  if (!problem) {
    return;
  }

  editingProblemId = problemId;

  document.getElementById('problemName').value = problem.name;
  document.getElementById('problemDifficulty').value = problem.difficulty_level;
  document.getElementById('problemDescription').value = problem.description || '';
  document.getElementById('problemVisibility').value = problem.visibility || 'HIDDEN';
  document.getElementById('isPublished').checked = problem.is_published || false;
  document.getElementById('formError').hidden = true;

  resetTestCases([]);

  try {
    const details = await apiAdminGetProblemDetails(problemId);
    if (details.success && details.data) {
      resetTestCases((details.data.test_cases || []).map((testCase) => ({
        input_data: testCase.input_data || '',
        expected_output: testCase.expected_output || '',
        is_hidden: Boolean(testCase.is_hidden),
        isExisting: true,
      })));
      document.getElementById('createFormSection').hidden = false;
      const problemsListSection = document.querySelector('.problems-list-section');
      if (problemsListSection) {
        problemsListSection.hidden = true;
      }
      document.getElementById('formTitle').textContent = `Editer: ${problem.name}`;
      document.getElementById('createFormSection').scrollIntoView({ behavior: 'smooth' });
      return;
    }
  } catch (error) {
    console.warn('Unable to load saved test cases for edit mode.', error);
  }

  const demoProblems = readDemoProblems();
  const demoProblem = demoProblems.find((item) => item.problem_id === problemId);
  if (demoProblem) {
    resetTestCases((demoProblem.test_cases || []).map((testCase) => ({
      input_data: testCase.input_data || '',
      expected_output: testCase.expected_output || '',
      is_hidden: Boolean(testCase.is_hidden),
      isExisting: true,
    })));
  }

  document.getElementById('createFormSection').hidden = false;
  const problemsListSection = document.querySelector('.problems-list-section');
  if (problemsListSection) {
    problemsListSection.hidden = true;
  }
  document.getElementById('formTitle').textContent = `Editer: ${problem.name}`;
  document.getElementById('createFormSection').scrollIntoView({ behavior: 'smooth' });
}

async function deleteProblem(problemId) {
  const problem = allProblems.find((item) => item.problem_id === problemId);
  if (!problem) {
    return;
  }

  if (!confirm(`Etes-vous sur de vouloir supprimer "${problem.name}" ? Cette action est irreversible.`)) {
    return;
  }

  try {
    const result = await apiAdminDeleteProblem(problemId);

    if (result.success) {
      alert('Probleme supprime avec succes');
      await loadProblems();
    } else {
      alert(result.message || 'Erreur lors de la suppression');
    }
  } catch (error) {
    alert('Erreur lors de la suppression');
    console.error('Delete error:', error);
  }
}
