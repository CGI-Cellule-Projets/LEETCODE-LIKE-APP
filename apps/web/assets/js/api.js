/**
 * REST API Client
 * Handles all communication with the Node.js/Express REST API
 */

function resolveApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000/api';
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
    return 'http://localhost:3000/api';
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }

  return `${window.location.origin.replace(/\/$/, '')}/api`;
}

const API_BASE_URL = resolveApiBaseUrl();

// ============== Problem Endpoints ==============

/**
 * Get all problems
 */
async function apiGetProblems() {
  try {
    const response = await fetch(`${API_BASE_URL}/problems`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to fetch submission', errors: error.message };
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
      headers: {
        'Content-Type': 'application/json',
      },
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
async function apiAdminCreateProblem(name, difficulty, description, isPublished = false) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/problems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        difficulty_level: difficulty,
        description,
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
 * Update a problem (admin)
 */
async function apiAdminUpdateProblem(problemId, updates) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/problems/${problemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input_data: inputData,
        expected_output: expectedOutput,
        is_hidden: isHidden,
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to add test case', errors: error.message };
  }
}

/**
 * Health check
 */
async function apiHealthCheck() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'API is not running', errors: error.message };
  }
}
