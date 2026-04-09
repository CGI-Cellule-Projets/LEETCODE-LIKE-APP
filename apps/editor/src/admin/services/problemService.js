import { getAuthHeaders, requestJson } from './apiClient';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deriveVisibility = (isPublished) => (isPublished ? 'PUBLIC' : 'HIDDEN');

export async function getProblems() {
  await wait(150);
  const payload = await requestJson('/admin/problems', { method: 'GET', headers: getAuthHeaders() });
  return payload.data || [];
}

export async function getProblemDetails(problemId) {
  await wait(100);
  const payload = await requestJson(`/admin/problems/${problemId}`, { method: 'GET', headers: getAuthHeaders() });
  return payload.data;
}

export async function createProblem(problemInput) {
  const payload = await requestJson('/admin/problems', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(problemInput)
  });
  return payload.data;
}

export async function updateProblem(problemId, updates) {
  const payload = await requestJson(`/admin/problems/${problemId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  return payload.data;
}

export async function deleteProblem(problemId) {
  await requestJson(`/admin/problems/${problemId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export async function addTestCase(problemId, testCase) {
  const payload = await requestJson(`/admin/problems/${problemId}/testcases`, {
    method: 'POST',
    headers: getAuthHeaders(),
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
    visibility: deriveVisibility(Boolean(problemValues.is_published)),
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
