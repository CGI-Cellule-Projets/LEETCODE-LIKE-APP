/**
 * REST API Client
 * Handles all communication with the Node.js/Express REST API
 */

function resolveApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:3001/api';
  }

  const queryApiUrl = new URLSearchParams(window.location.search).get('api');
  if (queryApiUrl && queryApiUrl.trim()) {
    return queryApiUrl.trim().replace(/\/$/, '');
  }

  const configuredBaseUrl = window.__API_BASE_URL__;
  if (typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim()) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  const metaTag = document.querySelector('meta[name="api-base-url"]');
  if (metaTag) {
    const content = metaTag.getAttribute('content');
    if (content && content.trim()) {
      return content.replace(/\/$/, '');
    }
  }

  if (window.location.protocol === 'file:') {
    return 'http://localhost:3001/api';
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }

  return `${window.location.origin.replace(/\/$/, '')}/api`;
}

const API_BASE_URL = resolveApiBaseUrl();

const DIFFICULTY_META = {
  easy: { value: 'easy', label: 'Facile', className: 'easy', filterValue: 'easy' },
  med: { value: 'med', label: 'Moyen', className: 'medium', filterValue: 'medium' },
  hard: { value: 'hard', label: 'Difficile', className: 'hard', filterValue: 'hard' },
};

function normalizeDifficultyValue(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'easy' || normalized === 'facile') return 'easy';
  if (normalized === 'med' || normalized === 'medium' || normalized === 'moyen') return 'med';
  if (normalized === 'hard' || normalized === 'difficile') return 'hard';
  return 'easy';
}

function getDifficultyDisplayMeta(value) {
  return DIFFICULTY_META[normalizeDifficultyValue(value)] || DIFFICULTY_META.easy;
}

function formatDifficultyLabel(value) {
  return getDifficultyDisplayMeta(value).label;
}

if (typeof window !== 'undefined') {
  window.LLADifficulty = {
    normalizeValue: normalizeDifficultyValue,
    getMeta: getDifficultyDisplayMeta,
    formatLabel: formatDifficultyLabel,
  };
}

function getStoredAuthToken() {
  return localStorage.getItem('auth_token');
}

// ============== Auth Endpoints ==============

/**
 * Register a new user
 * @param {string} username 
 * @param {string} email 
 * @param {string} password 
 */
async function apiRegister(username, email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Registration failed', errors: error.message };
  }
}

/**
 * Login an existing user
 * @param {string} email
 * @param {string} password
 */
async function apiLogin(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Login failed', errors: error.message };
  }
}


// ============== Problem Endpoints ==============

/**
 * Get all problems
 */
async function apiGetProblems() {
  try {
    const response = await fetch(`${API_BASE_URL}/problems`, {
      method: 'GET',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to fetch problems', errors: error.message };
  }
}

/**
 * Get problem by ID (with public test cases)
 */
async function apiGetProblemById(problemId) {
  try {
    const response = await fetch(`${API_BASE_URL}/problems/${problemId}`, {
      method: 'GET',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to fetch problem', errors: error.message };
  }
}

// ============== Submission Endpoints ==============

/**
 * Create a code submission
 */
async function apiCreateSubmission(problemId, languageId, codeBody) {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ problem_id: problemId, language_id: languageId, code_body: codeBody }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Submission failed', errors: error.message };
  }
}

/**
 * Get submission by ID
 */
async function apiGetSubmission(submissionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to fetch submission', errors: error.message };
  }
}

// ============== Contests Endpoints ==============

/**
 * Get all contests
 */
async function apiGetContests() {
  try {
    const response = await fetch(`${API_BASE_URL}/contests`, {
      method: 'GET',
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Failed to fetch contests', errors: error.message };
  }
}

/**
 * Get a specific contest by ID
 */
async function apiGetContestById(contestId) {
  try {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}`, {
      method: 'GET',
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Failed to fetch contest details', errors: error.message };
  }
}

function getAuthHeaders() {
  const token = getStoredAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

/**
 * Register active user for a contest
 */
async function apiRegisterForContest(contestId) {
  try {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Registration failed', errors: error.message };
  }
}

// ============== Admin Endpoints ==============

/**
 * Get all problems (admin)
 */
async function apiAdminGetProblems() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/problems`, {
      method: 'GET',
      headers: getAdminAuthHeaders(),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to fetch problems', errors: error.message };
  }
}

/**
 * Create a problem (admin)
 */
async function apiAdminCreateProblem(name, difficulty, description, visibility = 'HIDDEN', isPublished = false) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/problems`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({
        name,
        difficulty_level: difficulty,
        description,
        visibility,
        is_published: isPublished,
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to create problem', errors: error.message };
  }
}

/**
 * Get problem details with test cases (admin)
 */
async function apiAdminGetProblemDetails(problemId) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/problems/${problemId}`, {
      method: 'GET',
      headers: getAdminAuthHeaders(),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to fetch problem details', errors: error.message };
  }
}

/**
 * Update a problem (admin)
 */
async function apiAdminUpdateProblem(problemId, updates) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/problems/${problemId}`, {
      method: 'PUT',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to update problem', errors: error.message };
  }
}

/**
 * Delete a problem (admin)
 */
async function apiAdminDeleteProblem(problemId) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/problems/${problemId}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to delete problem', errors: error.message };
  }
}

/**
 * Add test case to problem (admin)
 */
async function apiAdminAddTestCase(problemId, inputData, expectedOutput, isHidden = false) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/problems/${problemId}/testcases`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({
        input_data: inputData,
        expected_output: expectedOutput,
        is_hidden: isHidden,
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to add testcase', errors: error.message };
  }
}

// ============== Admin Contest Endpoints ==============

function getAdminAuthHeaders() {
  return getAuthHeaders();
}

/**
 * Get contest leaderboard entries
 */
async function apiGetContestLeaderboard(contestId) {
  try {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}/leaderboard`, {
      method: 'GET',
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Failed to fetch leaderboard', errors: error.message };
  }
}

/**
 * Get admin dashboard stats
 */
async function apiAdminGetStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      method: 'GET',
      headers: getAdminAuthHeaders(),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to fetch admin stats', errors: error.message };
  }
}

/**
 * Get admin users list and metrics
 */
async function apiAdminGetUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: getAdminAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Failed to fetch users', errors: error.message };
  }
}

/**
 * Get all contests (admin/public wrapper)
 */
async function apiAdminGetContests() {
  try {
    const response = await fetch(`${API_BASE_URL}/contests`, {
      method: 'GET',
      headers: getAdminAuthHeaders(),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to fetch contests', errors: error.message };
  }
}

/**
 * Get one contest by id for admin editor
 */
async function apiAdminGetContestById(contestId) {
  try {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}`, {
      method: 'GET',
      headers: getAdminAuthHeaders(),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to fetch contest', errors: error.message };
  }
}

/**
 * Create a contest and map problems in one flow
 */
async function apiAdminCreateContest(contestPayload, problemMappingsPayload) {
  try {
    // 1. Create Contest Header
    const contestRes = await fetch(`${API_BASE_URL}/admin/contests`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(contestPayload)
    });
    
    const contestData = await contestRes.json();
    if (!contestRes.ok || !contestData.success) {
      return { success: false, message: contestData.message || 'Failed to create contest header' };
    }
    
    const newContestId = contestData.data.contest_id;
    
    // 2. Map Problems
    const mappingRes = await fetch(`${API_BASE_URL}/admin/contests/${newContestId}/problems`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ problems: problemMappingsPayload })
    });
    
    const mappingData = await mappingRes.json();
    if (!mappingRes.ok || !mappingData.success) {
      return { success: false, message: mappingData.message || 'Failed to assign problems' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Creation failed', errors: error.message };
  }
}

/**
 * Update a contest and overwrite its problem mappings
 */
async function apiAdminUpdateContest(contestId, contestPayload, problemMappingsPayload) {
  try {
    const contestRes = await fetch(`${API_BASE_URL}/admin/contests/${contestId}`, {
      method: 'PUT',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(contestPayload),
    });

    const contestData = await contestRes.json();
    if (!contestRes.ok || !contestData.success) {
      return { success: false, message: contestData.message || 'Failed to update contest header' };
    }

    const mappingRes = await fetch(`${API_BASE_URL}/admin/contests/${contestId}/problems`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ problems: problemMappingsPayload }),
    });

    const mappingData = await mappingRes.json();
    if (!mappingRes.ok || !mappingData.success) {
      return { success: false, message: mappingData.message || 'Failed to update problem mappings' };
    }

    return { success: true, message: 'Contest updated successfully' };
  } catch (error) {
    return { success: false, message: 'Update failed', errors: error.message };
  }
}

