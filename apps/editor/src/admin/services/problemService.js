const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function resolveApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000/api';
  }

  const queryApiUrl = new URLSearchParams(window.location.search).get('api');
  if (queryApiUrl && queryApiUrl.trim()) {
    return queryApiUrl.trim().replace(/\/$/, '');
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

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    const errorMessage = data.errors || data.message || 'Request failed';
    throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
  }

  return data;
}

export async function getProblems() {
  await wait(150);
  const payload = await request('/admin/problems', { method: 'GET' });
  return payload.data || [];
}

export async function getProblemDetails(problemId) {
  await wait(100);
  const payload = await request(`/problems/${problemId}`, { method: 'GET' });
  return payload.data;
}

export async function createProblem(problemInput) {
  const payload = await request('/admin/problems', {
    method: 'POST',
    body: JSON.stringify(problemInput)
  });
  return payload.data;
}

export async function updateProblem(problemId, updates) {
  const payload = await request(`/admin/problems/${problemId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  return payload.data;
}

export async function deleteProblem(problemId) {
  await request(`/admin/problems/${problemId}`, {
    method: 'DELETE'
  });
}

export async function addTestCase(problemId, testCase) {
  const payload = await request(`/admin/problems/${problemId}/testcases`, {
    method: 'POST',
    body: JSON.stringify(testCase)
  });
  return payload.data;
}

export async function upsertProblemWithTestCases(mode, problemValues) {
  const input = {
    name: problemValues.name,
    difficulty_level: problemValues.difficulty_level,
    description: problemValues.description,
    is_published: problemValues.is_published,
    constraints: ''
  };

  const testCases = problemValues.testCases || [];

  let problem;
  if (mode === 'create') {
    problem = await createProblem(input);

    await Promise.all(
      testCases.map((item) =>
        addTestCase(problem.problem_id, {
          input_data: item.input_data,
          expected_output: item.expected_output,
          is_hidden: Boolean(item.is_hidden)
        })
      )
    );

    return problem;
  }

  problem = await updateProblem(problemValues.problem_id, input);

  const newCases = testCases.filter((item) => !item.isExisting);
  await Promise.all(
    newCases.map((item) =>
      addTestCase(problemValues.problem_id, {
        input_data: item.input_data,
        expected_output: item.expected_output,
        is_hidden: Boolean(item.is_hidden)
      })
    )
  );

  return problem;
}
