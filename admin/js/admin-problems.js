/**
 * Admin Problems Management
 * Handles CRUD operations for coding problems
 */

let allProblems = [];
let editingProblemId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Load problems when page loads
  await loadProblems();
  setupEventListeners();
});

function setupEventListeners() {
  const createProblemBtn = document.getElementById('createProblemBtn');
  const cancelFormBtn = document.getElementById('cancelFormBtn');
  const problemForm = document.getElementById('problemForm');
  const problemSearch = document.getElementById('problemSearch');
  const difficultyFilter = document.getElementById('difficultyFilter');

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
}

function showCreateForm() {
  editingProblemId = null;
  const form = document.getElementById('problemForm');
  const formSection = document.getElementById('createFormSection');
  const formTitle = document.getElementById('formTitle');
  const searchInput = document.getElementById('problemSearch');

  formTitle.textContent = 'Créer un Nouveau Problème';
  form.reset();
  formSection.style.display = 'block';
  document.querySelector('.problems-list-section').style.display = 'none';
  if (searchInput) {
    searchInput.value = '';
  }
  
  // Scroll to form
  formSection.scrollIntoView({ behavior: 'smooth' });
}

function hideCreateForm() {
  document.getElementById('createFormSection').style.display = 'none';
  document.querySelector('.problems-list-section').style.display = 'block';
  editingProblemId = null;
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('problemName').value.trim();
  const difficulty = document.getElementById('problemDifficulty').value;
  const description = document.getElementById('problemDescription').value.trim();
  const isPublished = document.getElementById('isPublished').checked;
  const formError = document.getElementById('formError');

  // Validation
  if (!name || !difficulty || !description) {
    formError.textContent = '❌ Veuillez remplir tous les champs obligatoires';
    formError.style.display = 'block';
    return;
  }

  try {
    let result;

    if (editingProblemId) {
      // Update existing problem
      result = await apiAdminUpdateProblem(editingProblemId, {
        name,
        difficulty_level: difficulty,
        description,
        is_published: isPublished
      });
    } else {
      // Create new problem
      result = await apiAdminCreateProblem(name, difficulty, description, isPublished);
    }

    if (result.success) {
      formError.style.display = 'none';
      hideCreateForm();
      await loadProblems(); // Reload the list
      alert('✓ Problème enregistré avec succès');
    } else {
      formError.textContent = `❌ ${result.message || 'Erreur'}`;
      formError.style.display = 'block';
    }
  } catch (error) {
    formError.textContent = '❌ Erreur lors de l\'enregistrement';
    formError.style.display = 'block';
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
      document.getElementById('problemsTable').innerHTML = '<p class="error-message">Erreur de chargement</p>';
    }
  } catch (error) {
    console.error('Error loading problems:', error);
    document.getElementById('problemsTable').innerHTML = '<p class="error-message">Erreur de chargement</p>';
  }
}

function filterProblems() {
  const searchQuery = document.getElementById('problemSearch').value.toLowerCase();
  const difficultyFilter = document.getElementById('difficultyFilter').value;

  const filtered = allProblems.filter(problem => {
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
    container.innerHTML = '<p class="no-data">Aucun problème trouvé</p>';
    return;
  }

  let html = `
    <table class="problems-table-content">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Difficulté</th>
          <th>Publié</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  problems.forEach(problem => {
    const isPublished = problem.is_published ? '✓' : '✗';
    html += `
      <tr data-problem-id="${problem.problem_id}">
        <td class="problem-name">${problem.name}</td>
        <td><span class="difficulty ${problem.difficulty_level}">${problem.difficulty_level}</span></td>
        <td>${isPublished}</td>
        <td class="actions">
          <button class="btn-icon btn-edit" onclick="editProblem(${problem.problem_id})" title="Éditer">Éditer</button>
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
  const problem = allProblems.find(p => p.problem_id === problemId);
  if (!problem) return;

  editingProblemId = problemId;

  // Fill form with problem data
  document.getElementById('problemName').value = problem.name;
  document.getElementById('problemDifficulty').value = problem.difficulty_level;
  document.getElementById('problemDescription').value = problem.description || '';
  document.getElementById('isPublished').checked = problem.is_published || false;

  // Show form and scroll
  document.getElementById('createFormSection').style.display = 'block';
  document.querySelector('.problems-list-section').style.display = 'none';
  document.getElementById('formTitle').textContent = `Éditer: ${problem.name}`;

  document.getElementById('createFormSection').scrollIntoView({ behavior: 'smooth' });
}

async function deleteProblem(problemId) {
  const problem = allProblems.find(p => p.problem_id === problemId);
  if (!problem) return;

  if (!confirm(`Êtes-vous sûr de vouloir supprimer "${problem.name}" ? Cette action est irréversible.`)) {
    return;
  }

  try {
    const result = await apiAdminDeleteProblem(problemId);

    if (result.success) {
      alert('✓ Problème supprimé avec succès');
      await loadProblems();
    } else {
      alert(`❌ ${result.message || 'Erreur lors de la suppression'}`);
    }
  } catch (error) {
    alert('❌ Erreur lors de la suppression');
    console.error('Delete error:', error);
  }
}
