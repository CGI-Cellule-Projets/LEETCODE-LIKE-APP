import { Suspense, lazy, startTransition, useEffect, useEffectEvent, useRef, useState } from 'react';
import './App.css';

const LazyMonacoEditor = lazy(() => import('@monaco-editor/react'));

const starterCode = {
  javascript: '// Read the stdin text from the input argument.\nfunction solution(input) {\n  return input\n    .split(/\\s+/)\n    .filter(Boolean)\n    .reverse()\n    .join(" ");\n}\n',
  python: '# Write your solution here\ndef solution(input):\n    pass\n',
};

const accentPalette = {
  sunset: { primary: "#ff6b3d", secondary: "#ff9f1c", glow: "rgba(255, 107, 61, 0.18)" },
  ocean:  { primary: "#1f7fff", secondary: "#00b4d8", glow: "rgba(31, 127, 255, 0.2)" },
  mint:   { primary: "#14b884", secondary: "#9ad84b", glow: "rgba(20, 184, 132, 0.2)" },
};

const LEGACY_PROGRESS_KEY = "algoforge-progress";
const PROGRESS_KEY_PREFIX = "algoforge-progress:";
const USER_INFO_KEY = "user_info";

const defaultProgress = {
  attempts: 0,
  solvedCount: 0,
  contestsCompleted: 0,
  totalRuntimePercentile: 0,
  runtimeSamples: 0,
  totalPracticeMinutes: 0,
  activeStreakDays: 0,
  problemOpenCount: 0,
  solvedProblems: {},
  solvedByDifficulty: { easy: 0, medium: 0, hard: 0 },
  solvedByTag: {},
  activityByDate: {}
};

const readUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_INFO_KEY) || "{}");
  } catch {
    return {};
  }
};

const resolveProgressStorageKey = () => {
  if (typeof window === "undefined") {
    return `${PROGRESS_KEY_PREFIX}guest`;
  }

  const userInfo = readUserInfo();
  const identity = userInfo.user_id || userInfo.id || userInfo.email || userInfo.username;
  if (identity === undefined || identity === null) {
    return `${PROGRESS_KEY_PREFIX}guest`;
  }

  const normalizedIdentity = String(identity).trim().toLowerCase();
  return normalizedIdentity
    ? `${PROGRESS_KEY_PREFIX}${normalizedIdentity}`
    : `${PROGRESS_KEY_PREFIX}guest`;
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const computeStreakDays = (activityByDate) => {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = toDateKey(date);
    if (Number(activityByDate[key] || 0) > 0) {
      streak += 1;
      continue;
    }
    break;
  }

  return streak;
};

const readProgress = () => {
  try {
    const scopedKey = resolveProgressStorageKey();
    const scopedRaw = localStorage.getItem(scopedKey);
    const fallbackRaw = localStorage.getItem(LEGACY_PROGRESS_KEY);
    const parsed = JSON.parse(scopedRaw || fallbackRaw || "{}");
    return {
      ...defaultProgress,
      ...parsed,
      solvedByDifficulty: { ...defaultProgress.solvedByDifficulty, ...(parsed.solvedByDifficulty || {}) },
      solvedByTag: { ...(parsed.solvedByTag || {}) },
      solvedProblems: { ...(parsed.solvedProblems || {}) },
      activityByDate: { ...(parsed.activityByDate || {}) }
    };
  } catch {
    return { ...defaultProgress };
  }
};

const writeProgress = (progress) => {
  const scopedKey = resolveProgressStorageKey();
  localStorage.setItem(scopedKey, JSON.stringify(progress));
};

const normalizeTags = (rawTags) => {
  if (!rawTags) return [];
  return String(rawTags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const isLocalHost = (hostname) => hostname === "localhost" || hostname === "127.0.0.1";

const resolveApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return "http://localhost:3000/api";
  }

  const queryApiUrl = new URLSearchParams(window.location.search).get("api");
  if (queryApiUrl && queryApiUrl.trim()) {
    return queryApiUrl.trim().replace(/\/$/, "");
  }

  if (window.location.protocol === "file:") {
    return "http://localhost:3000/api";
  }

  if (isLocalHost(window.location.hostname)) {
    return "http://localhost:3000/api";
  }

  return `${window.location.origin.replace(/\/$/, "")}/api`;
};

const API_BASE_URL = resolveApiBaseUrl();
const LANGUAGE_IDS = {
  javascript: 1,
  python: 2,
};

const EDITOR_OPTIONS = {
  fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
  fontLigatures: true,
  fontSize: 14,
  minimap: { enabled: false },
  automaticLayout: true,
  padding: { top: 16 },
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  cursorBlinking: 'smooth',
};

const getStoredAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("auth_token");
};

const getAuthHeaders = () => {
  const token = getStoredAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mapRunStatusToSubmissionStatus = (runStatus) => {
  switch (runStatus) {
    case "success":
      return "Accepted";
    case "failed":
      return "Wrong Answer";
    case "timeout":
      return "Time Limit Exceeded";
    case "runtime_error":
      return "Runtime Error";
    default:
      return "Pending";
  }
};

const persistSubmission = async ({
  problemId,
  language,
  codeBody,
  runStatus,
  executionTime,
  memory,
}) => {
  if (!getStoredAuthToken() || !problemId) {
    return null;
  }

  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw new Error(`Unsupported language for submission persistence: ${language}`);
  }

  const response = await fetch(`${API_BASE_URL}/submissions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      problem_id: problemId,
      language_id: languageId,
      code_body: codeBody,
      status: mapRunStatusToSubmissionStatus(runStatus),
      runtime_ms: Number.isFinite(executionTime) ? Math.round(executionTime) : null,
      memory_kb: Number.isFinite(memory) ? Math.round(memory) : null,
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Failed to persist submission.");
  }

  return payload.data;
};

const readProblemFromSearch = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const rawProblem = searchParams.get("problem");
  if (!rawProblem) {
    return null;
  }

  try {
    return JSON.parse(rawProblem);
  } catch {
    return null;
  }
};

const readProblemIdFromSearch = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const rawProblemId = searchParams.get("problemId");
  const problemId = Number(rawProblemId);

  return Number.isInteger(problemId) && problemId > 0 ? problemId : null;
};

const buildProblemQuery = (problem) => {
  if (!problem) {
    return "";
  }

  try {
    const searchParams = new URLSearchParams();
    if (problem.problem_id) {
      searchParams.set("problemId", String(problem.problem_id));
    }
    searchParams.set("problem", JSON.stringify(problem));
    return `?${searchParams.toString()}`;
  } catch {
    return "";
  }
};

const normalizeDifficultyForEditor = (difficulty) => {
  if (difficulty === "med") {
    return "medium";
  }

  return difficulty || "easy";
};

const buildProblemFromApi = (problem, fallbackProblem = null) => ({
  problem_id: problem.problem_id,
  title: problem.name,
  difficulty: normalizeDifficultyForEditor(problem.difficulty_level),
  description: problem.description || fallbackProblem?.description || "",
  tags: fallbackProblem?.tags || "",
  sampleTests: Array.isArray(problem.public_test_cases)
    ? problem.public_test_cases.map((testCase, index) => ({
      name: `Sample ${index + 1}`,
      input: testCase.input_data || "",
      expectedOutput: testCase.expected_output || "",
    }))
    : [],
  officialTests: Array.isArray(problem.public_test_cases)
    ? problem.public_test_cases.map((testCase, index) => ({
      name: `Test ${index + 1}`,
      input: testCase.input_data || "",
      expectedOutput: testCase.expected_output || "",
    }))
    : [],
});

const fetchProblemById = async (problemId) => {
  const response = await fetch(`${API_BASE_URL}/problems/${problemId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Failed to load problem details.");
  }

  return payload.data;
};

const SAMPLE_TESTS_BY_TITLE = {
  "Two Sum": [
    { name: "Sample 1", input: "2 7 11 15\n9", expectedOutput: "[0,1]" },
  ],
  "Longest Substring Without Repeating Characters": [
    { name: "Sample 1", input: "abcabcbb", expectedOutput: "3" },
    { name: "Sample 2", input: "bbbbb", expectedOutput: "1" },
  ],
  "Merge K Sorted Lists": [
    { name: "Sample 1", input: "1 4 5\n1 3 4\n2 6", expectedOutput: "1 1 2 3 4 4 5 6" },
  ],
  "Binary Tree Level Order Traversal": [
    { name: "Sample 1", input: "3 9 20 null null 15 7", expectedOutput: "[[3],[9,20],[15,7]]" },
  ],
  "Word Ladder": [
    { name: "Sample 1", input: "hit\ncog\nhot dot dog lot log cog", expectedOutput: "5" },
  ],
  "Valid Parentheses": [
    { name: "Sample 1", input: "()", expectedOutput: "true" },
    { name: "Sample 2", input: "([)]", expectedOutput: "false" },
  ],
};

const OFFICIAL_TESTS_BY_TITLE = {
  "Two Sum": [
    { name: "Test 1", input: "2 7 11 15\n9", expectedOutput: "[0,1]" },
    { name: "Test 2", input: "3 2 4\n6", expectedOutput: "[1,2]" },
    { name: "Test 3", input: "3 3\n6", expectedOutput: "[0,1]" },
  ],
  "Longest Substring Without Repeating Characters": [
    { name: "Test 1", input: "abcabcbb", expectedOutput: "3" },
    { name: "Test 2", input: "bbbbb", expectedOutput: "1" },
    { name: "Test 3", input: "pwwkew", expectedOutput: "3" },
  ],
  "Merge K Sorted Lists": [
    { name: "Test 1", input: "1 4 5\n1 3 4\n2 6", expectedOutput: "1 1 2 3 4 4 5 6" },
    { name: "Test 2", input: "", expectedOutput: "[]" },
  ],
  "Binary Tree Level Order Traversal": [
    { name: "Test 1", input: "3 9 20 null null 15 7", expectedOutput: "[[3],[9,20],[15,7]]" },
    { name: "Test 2", input: "1", expectedOutput: "[[1]]" },
    { name: "Test 3", input: "null", expectedOutput: "[]" }
  ],
  "Word Ladder": [
    { name: "Test 1", input: "hit\ncog\nhot dot dog lot log cog", expectedOutput: "5" },
    { name: "Test 2", input: "hit\ncog\nhot dot dog lot log", expectedOutput: "0" },
  ],
  "Valid Parentheses": [
    { name: "Test 1", input: "()", expectedOutput: "true" },
    { name: "Test 2", input: "([)]", expectedOutput: "false" },
    { name: "Test 3", input: "{[]}", expectedOutput: "true" },
  ],
};

const enrichProblem = (problem) => {
  if (!problem) {
    return null;
  }

  return {
    ...problem,
    sampleTests: Array.isArray(problem.sampleTests) && problem.sampleTests.length > 0
      ? problem.sampleTests
      : (SAMPLE_TESTS_BY_TITLE[problem.title] || []),
    officialTests: Array.isArray(problem.officialTests) && problem.officialTests.length > 0
      ? problem.officialTests
      : (OFFICIAL_TESTS_BY_TITLE[problem.title] || SAMPLE_TESTS_BY_TITLE[problem.title] || []),
  };
};

const statusConfig = {
  idle: { label: 'Idle', indicator: 'idle' },
  running: { label: 'Running', indicator: 'running' },
  success: { label: 'Success', indicator: 'success' },
  failed: { label: 'Samples Failed', indicator: 'error' },
  runtime_error: { label: 'Runtime Error', indicator: 'error' },
  timeout: { label: 'Timeout', indicator: 'timeout' },
};

const createDefaultOutput = () => ([
  { type: 'system', text: 'Console ready. Click "Run" to execute your code.' }
]);

const normalizeOutputValue = (value) => String(value ?? "").replace(/\r\n/g, "\n").trim();
const collapseWhitespace = (value) => normalizeOutputValue(value).replace(/\s+/g, " ");
const numericPattern = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;
const LOGIC_DIRECTIVE_PREFIX = "@logic";

const toScalarLiteral = (rawValue) => {
  const normalized = normalizeOutputValue(rawValue);
  if (!normalized) {
    return null;
  }

  const lower = normalized.toLowerCase();
  if (lower === "true" || lower === "false") {
    return { type: "boolean", value: lower === "true" };
  }

  if (lower === "null") {
    return { type: "null", value: null };
  }

  if (numericPattern.test(normalized)) {
    return { type: "number", value: Number(normalized) };
  }

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    return { type: "string", value: normalized.slice(1, -1) };
  }

  return null;
};

const toJsonCompatibleLiteral = (value) => value
  .replace(/\bTrue\b/g, "true")
  .replace(/\bFalse\b/g, "false")
  .replace(/\bNone\b/g, "null")
  .replace(/([{,]\s*)([A-Za-z_$][\w$-]*)(\s*:)/g, '$1"$2"$3')
  .replace(/'/g, '"');

const parseStructuredLiteral = (rawValue) => {
  const normalized = normalizeOutputValue(rawValue);
  if (!normalized) {
    return null;
  }

  const candidates = [normalized];
  const jsonCompatible = toJsonCompatibleLiteral(normalized);
  if (jsonCompatible !== normalized) {
    candidates.push(jsonCompatible);
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next normalization candidate.
    }
  }

  return null;
};

const numbersAreEqual = (left, right) => (
  Number.isFinite(left)
  && Number.isFinite(right)
  && Math.abs(left - right) <= 1e-9
);

const isPlainObject = (value) => Object.prototype.toString.call(value) === "[object Object]";

const deepEqualValues = (left, right) => {
  if (typeof left === "number" && typeof right === "number") {
    return numbersAreEqual(left, right);
  }

  if (left === right) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }

    return left.every((value, index) => deepEqualValues(value, right[index]));
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    for (let index = 0; index < leftKeys.length; index += 1) {
      if (leftKeys[index] !== rightKeys[index]) {
        return false;
      }

      if (!deepEqualValues(left[leftKeys[index]], right[rightKeys[index]])) {
        return false;
      }
    }

    return true;
  }

  return false;
};

const parseTokenSequence = (rawValue) => {
  const normalized = normalizeOutputValue(rawValue);
  if (!normalized) {
    return [];
  }

  const rawTokens = normalized
    .replaceAll("[", " ")
    .replaceAll("]", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .replaceAll("{", " ")
    .replaceAll("}", " ")
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  return rawTokens.map((token) => {
    const scalar = toScalarLiteral(token);
    if (scalar) {
      return scalar.value;
    }

    return token;
  });
};

const tokenValuesEqual = (left, right) => {
  if (typeof left === "number" && typeof right === "number") {
    return numbersAreEqual(left, right);
  }

  return left === right;
};

const areOutputsEquivalent = (expectedOutput, actualOutput) => {
  const normalizedExpected = normalizeOutputValue(expectedOutput);
  const normalizedActual = normalizeOutputValue(actualOutput);

  if (normalizedExpected === normalizedActual) {
    return { passed: true, mode: "exact", reason: "Exact output match." };
  }

  if (collapseWhitespace(normalizedExpected) === collapseWhitespace(normalizedActual)) {
    return { passed: true, mode: "whitespace", reason: "Matched after whitespace normalization." };
  }

  const expectedScalar = toScalarLiteral(normalizedExpected);
  const actualScalar = toScalarLiteral(normalizedActual);
  if (expectedScalar && actualScalar && deepEqualValues(expectedScalar.value, actualScalar.value)) {
    return { passed: true, mode: "scalar", reason: "Matched logical scalar value." };
  }

  const expectedStructured = parseStructuredLiteral(normalizedExpected);
  const actualStructured = parseStructuredLiteral(normalizedActual);
  if (
    expectedStructured !== null
    && actualStructured !== null
    && deepEqualValues(expectedStructured, actualStructured)
  ) {
    return { passed: true, mode: "structured", reason: "Matched structured output." };
  }

  const expectedTokens = parseTokenSequence(normalizedExpected);
  const actualTokens = parseTokenSequence(normalizedActual);
  if (
    expectedTokens.length > 0
    && expectedTokens.length === actualTokens.length
    && expectedTokens.every((token, index) => tokenValuesEqual(token, actualTokens[index]))
  ) {
    return { passed: true, mode: "token", reason: "Matched tokenized output sequence." };
  }

  return { passed: false, mode: "mismatch", reason: "Output mismatch." };
};

const sortObjectKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = sortObjectKeys(value[key]);
        return accumulator;
      }, {});
  }

  return value;
};

const toStableValueKey = (value) => {
  if (typeof value === "number") {
    return `number:${value.toPrecision(15)}`;
  }

  if (typeof value === "string") {
    return `string:${collapseWhitespace(value)}`;
  }

  return `${typeof value}:${JSON.stringify(sortObjectKeys(value))}`;
};

const compareUnorderedArrays = (expectedArray, actualArray) => {
  if (!Array.isArray(expectedArray) || !Array.isArray(actualArray) || expectedArray.length !== actualArray.length) {
    return false;
  }

  const expectedCounts = new Map();
  const actualCounts = new Map();

  for (const value of expectedArray) {
    const key = toStableValueKey(value);
    expectedCounts.set(key, (expectedCounts.get(key) || 0) + 1);
  }

  for (const value of actualArray) {
    const key = toStableValueKey(value);
    actualCounts.set(key, (actualCounts.get(key) || 0) + 1);
  }

  if (expectedCounts.size !== actualCounts.size) {
    return false;
  }

  for (const [key, count] of expectedCounts.entries()) {
    if (actualCounts.get(key) !== count) {
      return false;
    }
  }

  return true;
};

const evaluateLogicDirective = (expectedOutput, actualOutput) => {
  const normalizedExpected = normalizeOutputValue(expectedOutput);
  if (!normalizedExpected.toLowerCase().startsWith(LOGIC_DIRECTIVE_PREFIX)) {
    return { applied: false };
  }

  const ruleBody = normalizedExpected.slice(LOGIC_DIRECTIVE_PREFIX.length).trim();
  if (!ruleBody) {
    return { applied: true, passed: false, reason: "Empty @logic rule." };
  }

  const lowerRuleBody = ruleBody.toLowerCase();

  if (lowerRuleBody.startsWith("anyof:")) {
    const candidates = ruleBody.slice("anyof:".length)
      .split("||")
      .map((item) => normalizeOutputValue(item))
      .filter(Boolean);

    const hasMatch = candidates.some((candidate) => areOutputsEquivalent(candidate, actualOutput).passed);
    return {
      applied: true,
      passed: hasMatch,
      reason: hasMatch
        ? "Matched one allowed result from @logic anyof."
        : "No allowed value matched from @logic anyof.",
    };
  }

  if (lowerRuleBody.startsWith("regex:")) {
    const expression = ruleBody.slice("regex:".length).trim();
    if (!expression) {
      return { applied: true, passed: false, reason: "Invalid @logic regex rule." };
    }

    let regex;
    const literalMatch = expression.match(/^\/(.+)\/([a-z]*)$/i);
    try {
      regex = literalMatch ? new RegExp(literalMatch[1], literalMatch[2]) : new RegExp(expression);
    } catch {
      return { applied: true, passed: false, reason: "Invalid regular expression in @logic regex rule." };
    }

    const passed = regex.test(actualOutput);
    return {
      applied: true,
      passed,
      reason: passed ? "Matched @logic regex rule." : "Did not match @logic regex rule.",
    };
  }

  if (lowerRuleBody.startsWith("range:")) {
    const expression = ruleBody.slice("range:".length).trim();
    const match = expression.match(/^([-+]?(?:\d+\.?\d*|\.\d+))\.\.([-+]?(?:\d+\.?\d*|\.\d+))$/i);
    if (!match) {
      return { applied: true, passed: false, reason: "Invalid @logic range rule. Use: @logic range:min..max" };
    }

    const minimum = Number(match[1]);
    const maximum = Number(match[2]);
    const scalar = toScalarLiteral(actualOutput);
    const numericActual = scalar?.type === "number" ? scalar.value : NaN;
    const passed = Number.isFinite(numericActual) && numericActual >= minimum && numericActual <= maximum;

    return {
      applied: true,
      passed,
      reason: passed
        ? "Matched @logic range rule."
        : `Actual output is outside @logic range ${minimum}..${maximum}.`,
    };
  }

  if (lowerRuleBody.startsWith("unordered:")) {
    const expectedListRaw = ruleBody.slice("unordered:".length).trim();
    const expectedList = parseStructuredLiteral(expectedListRaw);
    const actualList = parseStructuredLiteral(actualOutput);
    const passed = compareUnorderedArrays(expectedList, actualList);

    return {
      applied: true,
      passed,
      reason: passed ? "Matched @logic unordered rule." : "Output does not satisfy @logic unordered rule.",
    };
  }

  return {
    applied: true,
    passed: false,
    reason: "Unknown @logic rule. Supported: anyof, regex, range, unordered.",
  };
};

const extractBracketPayload = (rawInput, key) => {
  const normalized = normalizeOutputValue(rawInput);
  if (!normalized) {
    return null;
  }

  const assignmentPattern = new RegExp(`${key}\\s*=`, "i");
  const assignmentMatch = assignmentPattern.exec(normalized);
  if (!assignmentMatch) {
    return null;
  }

  const startIndex = normalized.indexOf("[", assignmentMatch.index + assignmentMatch[0].length);
  if (startIndex === -1) {
    return null;
  }

  let depth = 0;
  for (let index = startIndex; index < normalized.length; index += 1) {
    const current = normalized[index];
    if (current === "[") {
      depth += 1;
    } else if (current === "]") {
      depth -= 1;
      if (depth === 0) {
        return normalized.slice(startIndex, index + 1);
      }
    }
  }

  return null;
};

const parseNumberList = (rawValue) => {
  const structured = parseStructuredLiteral(rawValue);
  if (Array.isArray(structured) && structured.every((value) => typeof value === "number" && Number.isFinite(value))) {
    return structured;
  }

  const tokens = parseTokenSequence(rawValue);
  if (tokens.length > 0 && tokens.every((value) => typeof value === "number" && Number.isFinite(value))) {
    return tokens;
  }

  return null;
};

const parseNestedNumberLists = (rawValue) => {
  const structured = parseStructuredLiteral(rawValue);
  if (
    Array.isArray(structured)
    && structured.every(
      (value) => Array.isArray(value) && value.every((item) => typeof item === "number" && Number.isFinite(item)),
    )
  ) {
    return structured;
  }

  return null;
};

const parseTwoSumInput = (rawInput) => {
  const numsPayload = extractBracketPayload(rawInput, "nums");
  const targetMatch = normalizeOutputValue(rawInput).match(/target\s*=\s*([-+]?(?:\d+\.?\d*|\.\d+))/i);

  if (numsPayload && targetMatch) {
    const nums = parseNumberList(numsPayload);
    const target = Number(targetMatch[1]);
    if (nums && Number.isFinite(target)) {
      return { nums, target };
    }
  }

  const lines = normalizeOutputValue(rawInput)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return null;
  }

  const nums = parseNumberList(lines[0]);
  const targetTokens = parseNumberList(lines[1]);
  const target = targetTokens?.[0];
  if (!nums || !Number.isFinite(target)) {
    return null;
  }

  return { nums, target };
};

const parseIntegerPair = (rawOutput) => {
  const structured = parseStructuredLiteral(rawOutput);
  if (
    Array.isArray(structured)
    && structured.length >= 2
    && Number.isInteger(structured[0])
    && Number.isInteger(structured[1])
  ) {
    return [structured[0], structured[1]];
  }

  const list = parseNumberList(rawOutput);
  if (list && list.length >= 2 && Number.isInteger(list[0]) && Number.isInteger(list[1])) {
    return [list[0], list[1]];
  }

  return null;
};

const validateTwoSumLogic = (rawInput, rawOutput) => {
  const parsedInput = parseTwoSumInput(rawInput);
  const indexes = parseIntegerPair(rawOutput);
  if (!parsedInput || !indexes) {
    return false;
  }

  const [leftIndex, rightIndex] = indexes;
  if (leftIndex === rightIndex) {
    return false;
  }

  if (
    leftIndex < 0
    || rightIndex < 0
    || leftIndex >= parsedInput.nums.length
    || rightIndex >= parsedInput.nums.length
  ) {
    return false;
  }

  return parsedInput.nums[leftIndex] + parsedInput.nums[rightIndex] === parsedInput.target;
};

const parseMergeKInput = (rawInput) => {
  const listsPayload = extractBracketPayload(rawInput, "lists");
  if (listsPayload) {
    return parseNestedNumberLists(listsPayload);
  }

  const normalized = normalizeOutputValue(rawInput);
  if (!normalized) {
    return [];
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const parsedLists = lines.map((line) => parseNumberList(line)).filter(Boolean);
  return parsedLists.length > 0 ? parsedLists : null;
};

const validateMergeKSortedListsLogic = (rawInput, rawOutput) => {
  const lists = parseMergeKInput(rawInput);
  const actual = parseNumberList(rawOutput);
  if (!lists || !actual) {
    return false;
  }

  const merged = lists
    .flat()
    .slice()
    .sort((left, right) => left - right);

  if (merged.length !== actual.length) {
    return false;
  }

  return merged.every((value, index) => numbersAreEqual(value, actual[index]));
};

const parseQuotedInputString = (rawInput, variableName = "s") => {
  const normalized = normalizeOutputValue(rawInput);
  if (!normalized) {
    return "";
  }

  const quotedMatch = normalized.match(new RegExp(`${variableName}\\s*=\\s*(['"])([\\s\\S]*?)\\1`, "i"));
  if (quotedMatch) {
    return quotedMatch[2];
  }

  return normalized.split("\n")[0] || "";
};

const validateParenthesesString = (value) => {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const openings = new Set(["(", "[", "{"]);
  const stack = [];

  for (const character of value) {
    if (openings.has(character)) {
      stack.push(character);
      continue;
    }

    if (pairs[character]) {
      const top = stack.pop();
      if (top !== pairs[character]) {
        return false;
      }
    }
  }

  return stack.length === 0;
};

const validateValidParenthesesLogic = (rawInput, rawOutput) => {
  const expression = parseQuotedInputString(rawInput, "s");
  const scalar = toScalarLiteral(rawOutput);
  if (!scalar || scalar.type !== "boolean") {
    return false;
  }

  return scalar.value === validateParenthesesString(expression);
};

const lengthOfLongestSubstring = (value) => {
  const seenIndexes = new Map();
  let left = 0;
  let best = 0;

  for (let right = 0; right < value.length; right += 1) {
    const char = value[right];
    if (seenIndexes.has(char) && seenIndexes.get(char) >= left) {
      left = seenIndexes.get(char) + 1;
    }

    seenIndexes.set(char, right);
    best = Math.max(best, right - left + 1);
  }

  return best;
};

const validateLongestSubstringLogic = (rawInput, rawOutput) => {
  const expression = parseQuotedInputString(rawInput, "s");
  const scalar = toScalarLiteral(rawOutput);
  if (!scalar || scalar.type !== "number") {
    return false;
  }

  return numbersAreEqual(scalar.value, lengthOfLongestSubstring(expression));
};

const evaluateProblemLogic = (problemTitle, rawInput, rawOutput) => {
  const title = String(problemTitle || "").toLowerCase();

  if (title.includes("two sum")) {
    return validateTwoSumLogic(rawInput, rawOutput);
  }

  if (title.includes("merge k sorted list")) {
    return validateMergeKSortedListsLogic(rawInput, rawOutput);
  }

  if (title.includes("valid parentheses")) {
    return validateValidParenthesesLogic(rawInput, rawOutput);
  }

  if (title.includes("longest substring without repeating")) {
    return validateLongestSubstringLogic(rawInput, rawOutput);
  }

  return false;
};

const evaluateCaseAgainstExpected = ({ problemTitle, testCase, payload }) => {
  const actualOutput = normalizeOutputValue(payload.stdout);
  const expectedOutput = testCase.expectedOutput == null
    ? null
    : normalizeOutputValue(testCase.expectedOutput);

  if (expectedOutput == null) {
    return {
      actualOutput,
      expectedOutput,
      passed: payload.status === "success",
      comparisonMode: "execution-only",
      comparisonHint: "No expected output configured. Validation is based on successful execution.",
    };
  }

  if (payload.status !== "success") {
    return {
      actualOutput,
      expectedOutput,
      passed: false,
      comparisonMode: "runtime",
      comparisonHint: "Execution did not complete successfully.",
    };
  }

  const directiveEvaluation = evaluateLogicDirective(expectedOutput, actualOutput);
  if (directiveEvaluation.applied) {
    return {
      actualOutput,
      expectedOutput,
      passed: directiveEvaluation.passed,
      comparisonMode: "logic-directive",
      comparisonHint: directiveEvaluation.reason,
    };
  }

  const semanticEvaluation = areOutputsEquivalent(expectedOutput, actualOutput);
  if (semanticEvaluation.passed) {
    return {
      actualOutput,
      expectedOutput,
      passed: true,
      comparisonMode: semanticEvaluation.mode,
      comparisonHint: semanticEvaluation.reason,
    };
  }

  const logicMatch = evaluateProblemLogic(problemTitle, testCase.input, actualOutput);
  if (logicMatch) {
    return {
      actualOutput,
      expectedOutput,
      passed: true,
      comparisonMode: "problem-logic",
      comparisonHint: "Accepted by logical checker for this problem.",
    };
  }

  return {
    actualOutput,
    expectedOutput,
    passed: false,
    comparisonMode: "mismatch",
    comparisonHint: "Expected result and logical checks did not match.",
  };
};

const estimateRuntimePercentile = (executionTime, timeLimit) => {
  if (!Number.isFinite(executionTime) || !Number.isFinite(timeLimit) || timeLimit <= 0) {
    return 0;
  }

  const usageRatio = executionTime / timeLimit;
  return Math.max(1, Math.min(99, Math.round(100 - usageRatio * 100)));
};

const formatDuration = (value) => {
  if (!Number.isFinite(value)) {
    return 'N/A';
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} s`;
  }

  return `${Math.round(value)} ms`;
};

const formatMemory = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 'N/A';
  }

  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

const buildOutputMessages = (result) => {
  const lines = [];

  if (result.stdout) {
    lines.push({ type: 'stdout', text: result.stdout });
  }

  if (result.stderr) {
    lines.push({
      type: result.status === 'success' ? 'system' : 'stderr',
      text: result.stderr,
    });
  }

  if (lines.length === 0) {
    lines.push({
      type: 'system',
      text: 'Execution finished without stdout or stderr.',
    });
  }

  return lines;
};

const buildCaseResultsOutput = (results) => {
  if (!results.length) {
    return createDefaultOutput();
  }

  const passedCount = results.filter((result) => result.passed).length;
  const failedExecution = results.find((result) => result.status === "runtime_error" || result.status === "timeout");

  if (results.length === 1 && results[0].isCustom && results[0].status === "success") {
    return buildOutputMessages({
      stdout: results[0].actualOutput,
      stderr: results[0].stderr,
      status: results[0].status,
    });
  }

  const lines = [{
    type: passedCount === results.length ? "stdout" : "system",
    text: `Passed ${passedCount}/${results.length} ${results.length === 1 ? "test" : "tests"}.`,
  }];

  if (failedExecution?.stderr) {
    lines.push({ type: "stderr", text: failedExecution.stderr });
  }

  return lines;
};

const buildLocalApiUrls = (pathname) => {
  if (typeof window === "undefined") {
    return [];
  }

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const { protocol, hostname, port } = window.location;
  const candidates = [];
  const addCandidate = (value) => {
    if (value && !candidates.includes(value)) {
      candidates.push(value);
    }
  };

  if (protocol === "file:") {
    addCandidate(`http://localhost:3000${normalizedPath}`);
    addCandidate(`http://127.0.0.1:3000${normalizedPath}`);
    return candidates;
  }

  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
  if (isLocalHost && port && port !== "3000") {
    addCandidate(`${protocol}//localhost:3000${normalizedPath}`);
    addCandidate(`${protocol}//127.0.0.1:3000${normalizedPath}`);
  }

  return candidates;
};

const getApiCandidates = (pathname) => {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const candidates = [];
  const addCandidate = (value) => {
    if (value && !candidates.includes(value)) {
      candidates.push(value);
    }
  };

  if (typeof window === "undefined" || window.location.protocol !== "file:") {
    addCandidate(normalizedPath);
  }

  buildLocalApiUrls(normalizedPath).forEach(addCandidate);

  if (candidates.length === 0) {
    addCandidate(normalizedPath);
  }

  return candidates;
};

const fetchExecutionApi = async (pathname, options) => {
  let lastError = null;
  const candidates = getApiCandidates(pathname);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, options);
      const payload = await parseExecutionResponse(response);
      return { response, payload };
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw new Error(`Unable to reach the execution server. Start the app on http://localhost:3000 with "npm run serve", then retry. ${lastError.message}`);
  }

  throw new Error("Execution API is unavailable.");
};

const parseExecutionResponse = async (response) => {
  const rawText = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const looksLikeJson = contentType.includes("application/json");

  if (!rawText.trim()) {
    throw new Error('Execution API returned an empty response. Start the app on http://localhost:3000 with "npm run serve".');
  }

  if (!looksLikeJson) {
    throw new Error('Execution API is unavailable on this server. Open the editor through http://localhost:3000 or start the app with "npm run serve".');
  }

  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error('Execution API returned invalid JSON. Restart the Node server with "npm run serve".');
  }
};

const updateProgressFromRun = (problem, result, requestedTimeLimit, isSubmit = false) => {
  const progress = readProgress();
  const todayKey = toDateKey(new Date());

  progress.attempts += 1;
  progress.totalPracticeMinutes += 15;
  progress.activityByDate[todayKey] = Number(progress.activityByDate[todayKey] || 0) + 1;

  if (result.status === 'success') {
    const runtimePercentile = estimateRuntimePercentile(result.executionTime, requestedTimeLimit);
    progress.totalRuntimePercentile += runtimePercentile;
    progress.runtimeSamples += 1;

    if (isSubmit && problem && !progress.solvedProblems[problem.title]) {
      progress.solvedProblems[problem.title] = true;
      progress.solvedCount += 1;

      const difficulty = (problem.difficulty || 'easy').toLowerCase();
      progress.solvedByDifficulty[difficulty] = (progress.solvedByDifficulty[difficulty] || 0) + 1;

      const tags = normalizeTags(problem.tags);
      tags.forEach(tag => {
        progress.solvedByTag[tag] = (progress.solvedByTag[tag] || 0) + 1;
      });
    }
  }

  progress.contestsCompleted = Math.floor(progress.solvedCount / 4);
  progress.activeStreakDays = computeStreakDays(progress.activityByDate);
  writeProgress(progress);
};

function App() {
  const [problem, setProblem] = useState(null);
  const [isProblemLoading, setIsProblemLoading] = useState(true);
  const [problemLoadError, setProblemLoadError] = useState('');
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(starterCode.python);
  const [stdin, setStdin] = useState("");
  const [timeLimit] = useState("2000");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isProblemOpen, setIsProblemOpen] = useState(false);
  const [windowMode, setWindowMode] = useState("split");
  const [splitRatio, setSplitRatio] = useState(0.68);
  const [isResizing, setIsResizing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState("idle");
  const [lastRunResult, setLastRunResult] = useState(null);
  const [caseResults, setCaseResults] = useState([]);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [output, setOutput] = useState(createDefaultOutput);
  const workspaceRef = useRef(null);

  // Load problem data and sync theme/accent from main site settings
  useEffect(() => {
    const currentSearchProblem = readProblemFromSearch();
    const currentProblemId = readProblemIdFromSearch();
    let isCancelled = false;

    const applyProblem = (nextProblem) => {
      const enrichedProblem = enrichProblem(nextProblem);
      setProblem(enrichedProblem);
      localStorage.setItem("algoforge-current-problem", JSON.stringify(enrichedProblem));
      setProblemLoadError("");
    };

    const hydrateProblem = async () => {
      setIsProblemLoading(true);
      if (currentProblemId) {
        try {
          const apiProblem = await fetchProblemById(currentProblemId);
          if (isCancelled) {
            return;
          }

          applyProblem(buildProblemFromApi(apiProblem, currentSearchProblem));
          return;
        } catch (error) {
          console.warn('Unable to load problem details from the API. Falling back to cached metadata.', error);
          setProblemLoadError("Les details du probleme n'ont pas pu etre recuperes depuis l API.");
        }
      }

      try {
        if (currentSearchProblem) {
          applyProblem(currentSearchProblem);
        } else {
          const stored = localStorage.getItem("algoforge-current-problem");
          if (stored) {
            applyProblem(JSON.parse(stored));
          } else {
            setProblem(null);
          }
        }
      } catch (e) {
        setProblem(null);
        setProblemLoadError("Les donnees du probleme sont invalides. Recharge la page depuis la bibliotheque.");
      } finally {
        if (!isCancelled) {
          setIsProblemLoading(false);
        }
      }
    };

    hydrateProblem();

    // Apply saved theme & accent settings
    try {
      const settings = JSON.parse(localStorage.getItem("algoforge-settings") || "{}");
      const root = document.documentElement;

      // Theme
      if (settings.theme === "night") {
        document.body.classList.add("theme-night");
        setEditorTheme("vs-dark");
      } else {
        document.body.classList.remove("theme-night");
        setEditorTheme("light");
      }

      // Accent color
      const palette = accentPalette[settings.accent] || accentPalette.sunset;
      root.style.setProperty("--accent-primary", palette.primary);
      root.style.setProperty("--accent-secondary", palette.secondary);
      root.style.setProperty("--accent-glow", palette.glow);

      // Motion
      if (settings.motion === false) {
        document.body.classList.add("motion-off");
      }
    } catch (e) {
      // use defaults
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isProblemOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsProblemOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isProblemOpen]);

  const updateSplitRatio = useEffectEvent((clientX, clientY) => {
    const workspace = workspaceRef.current;
    if (!workspace) {
      return;
    }

    const bounds = workspace.getBoundingClientRect();
    const isCompactLayout = window.innerWidth <= 960;
    const nextRatio = isCompactLayout
      ? (clientY - bounds.top) / bounds.height
      : (clientX - bounds.left) / bounds.width;
    setSplitRatio(Math.min(0.82, Math.max(0.3, nextRatio)));
  });

  useEffect(() => {
    if (!isResizing) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      updateSplitRatio(event.clientX, event.clientY);
    };

    const stopResizing = () => {
      setIsResizing(false);
    };

    document.body.style.cursor = window.innerWidth <= 960 ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
    };
  }, [isResizing, updateSplitRatio]);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    startTransition(() => {
      setLanguage(lang);
      setCode(starterCode[lang] || starterCode.javascript);
      setOutput(createDefaultOutput());
      setLastRunResult(null);
      setCaseResults([]);
      setRunStatus("idle");
    });
  };

  const executeTests = async (isSubmit) => {
    if (isRunning) return;

    const requestedTimeLimit = Math.max(250, Number(timeLimit) || 2000);
    const sampleTests = Array.isArray(problem?.sampleTests) ? problem.sampleTests : [];
    const officialTests = Array.isArray(problem?.officialTests) ? problem.officialTests : [];
    
    // Resolve one execution plan per action so the UI and persistence layers observe one stable result set.
    let testsToRun;
    if (isSubmit) {
      testsToRun = officialTests.length > 0
        ? officialTests.map((test, index) => ({
          name: test.name || `Test ${index + 1}`,
          input: test.input || "",
          expectedOutput: test.expectedOutput ?? "",
          isCustom: false,
        }))
        : sampleTests.map((test, index) => ({
          name: test.name || `Sample ${index + 1}`,
          input: test.input || "",
          expectedOutput: test.expectedOutput ?? "",
          isCustom: false,
        }));
    } else {
      testsToRun = showCustomInput && stdin.trim()
        ? [{ name: "Custom Input", input: stdin, expectedOutput: null, isCustom: true }]
        : sampleTests.length > 0
          ? sampleTests.map((test, index) => ({
            name: test.name || `Sample ${index + 1}`,
            input: test.input || "",
            expectedOutput: test.expectedOutput ?? "",
            isCustom: false,
          }))
          : [{ name: "Run", input: stdin, expectedOutput: null, isCustom: true }];
    }

    setIsRunning(true);
    setRunStatus("running");
    setLastRunResult(null);
    setCaseResults([]);
    setOutput([{ type: 'system', text: isSubmit ? 'Executing official tests...' : 'Executing code...' }]);

    try {
      const nextCaseResults = [];

      for (const testCase of testsToRun) {
        const { response, payload } = await fetchExecutionApi("/api/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language,
            sourceCode: code,
            stdin: testCase.input,
            timeLimit: requestedTimeLimit,
          }),
        });

        if (!response.ok) {
          throw new Error(payload.error || "Execution request failed.");
        }

        const evaluation = evaluateCaseAgainstExpected({
          problemTitle: problem?.title,
          testCase,
          payload,
        });

        nextCaseResults.push({
          name: testCase.name,
          input: testCase.input,
          expectedOutput: evaluation.expectedOutput,
          actualOutput: evaluation.actualOutput,
          stderr: payload.stderr,
          status: payload.status,
          passed: evaluation.passed,
          comparisonMode: evaluation.comparisonMode,
          comparisonHint: evaluation.comparisonHint,
          isCustom: testCase.isCustom,
          executionTime: payload.executionTime,
          memory: payload.memory,
        });
      }

      const hasTimeout = nextCaseResults.some((result) => result.status === "timeout");
      const hasRuntimeError = nextCaseResults.some((result) => result.status === "runtime_error");
      const hasFailures = nextCaseResults.some((result) => !result.passed);
      const nextStatus = hasTimeout
        ? "timeout"
        : hasRuntimeError
          ? "runtime_error"
          : hasFailures
            ? "failed"
            : "success";

      setRunStatus(nextStatus);
      setCaseResults(nextCaseResults);
      setLastRunResult(nextCaseResults[nextCaseResults.length - 1] || null);
      setOutput(buildCaseResultsOutput(nextCaseResults));

      if (!hasRuntimeError && !hasTimeout) {
        const maxExecutionTime = nextCaseResults.reduce((max, result) => Math.max(max, result.executionTime || 0), 0);
        updateProgressFromRun(problem, { status: nextStatus === "success" ? "success" : "failed", executionTime: maxExecutionTime }, requestedTimeLimit, isSubmit);
      }

      if (isSubmit && problem?.problem_id) {
        const maxExecutionTime = nextCaseResults.reduce((max, result) => Math.max(max, result.executionTime || 0), 0);
        const maxMemory = nextCaseResults.reduce((max, result) => Math.max(max, result.memory || 0), 0);

        try {
          const submission = await persistSubmission({
            problemId: problem.problem_id,
            language,
            codeBody: code,
            runStatus: nextStatus,
            executionTime: maxExecutionTime,
            memory: maxMemory,
          });
          console.log("Submission persisted successfully:", submission);
        } catch (persistError) {
          console.error("Unable to persist submission:", persistError);
        }

        window.location.href = new URL("../problems.html", window.location.href).toString();
      }
    } catch (error) {
      const failureResult = {
        status: "runtime_error",
        stdout: "",
        stderr: error.message || "Execution request failed.",
        exitCode: null,
        executionTime: null,
        memory: null,
      };

      setRunStatus("runtime_error");
      setLastRunResult(failureResult);
      setCaseResults([]);
      setOutput(buildOutputMessages(failureResult));
      updateProgressFromRun(problem, failureResult, requestedTimeLimit, isSubmit);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunCode = () => executeTests(false);
  const handleSubmitCode = () => executeTests(true);

  const difficultyLabel = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };
  const currentStatus = statusConfig[runStatus] || statusConfig.idle;
  const editorFlex = `${splitRatio} 1 0%`;
  const consoleFlex = `${1 - splitRatio} 1 0%`;
  const problemPlaceholderTitle = isProblemLoading
    ? 'Loading Problem'
    : problemLoadError
      ? 'Problem Unavailable'
      : 'No Problem Selected';
  const problemPlaceholderMessage = isProblemLoading
    ? 'Preparing the statement, examples, and official tests...'
    : problemLoadError || 'Select a problem from the problems library';

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <a href="../index.html" className="logo-back" title="Retour a AlgoForge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </a>
          <a href="../index.html" className="logo-brand"><span className="logo-highlight">Algo</span>Forge</a>
        </div>
        <div className="header-actions">
          <button
            className={`problem-toggle-button ${isProblemOpen ? 'active' : ''}`}
            onClick={() => setIsProblemOpen((current) => !current)}
            type="button"
            aria-expanded={isProblemOpen}
            aria-controls="problemDrawer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            {isProblemOpen ? 'Hide Problem' : 'Show Problem'}
          </button>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="language-selector"
            disabled={isRunning}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
          <button
            className="run-button"
            onClick={handleRunCode}
            disabled={isRunning}
            style={{ 
              opacity: isRunning ? 0.7 : 1, 
              cursor: isRunning ? 'not-allowed' : 'pointer',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)',
              boxShadow: 'none'
            }}
          >
            Run
          </button>
          
          <button
            className="run-button"
            onClick={handleSubmitCode}
            disabled={isRunning}
            style={{ opacity: isRunning ? 0.7 : 1, cursor: isRunning ? 'not-allowed' : 'pointer' }}
          >
            {isRunning ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                Submitting
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Submit
              </>
            )}
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Code Editor Panel */}
        <div className="editor-panel editor-panel-expanded">
          <div className={`workspace-stack mode-${windowMode}`} ref={workspaceRef}>
            <div
              className={`editor-wrapper window-shell ${windowMode === "console" ? 'window-hidden' : ''}`}
              style={windowMode === "split" ? { flex: editorFlex } : undefined}
            >
              <div className="panel-header window-header">
                <div className="window-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="panel-icon"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                  <span>Code Editor</span>
                </div>
                <div className="window-controls">
                  {windowMode !== "editor" && (
                    <button type="button" className="window-control-button" onClick={() => setWindowMode("editor")} aria-label="Maximize code editor">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M8 21H5a2 2 0 0 1-2-2v-3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>
                    </button>
                  )}
                  {windowMode === "split" && (
                    <button type="button" className="window-control-button" onClick={() => setWindowMode("console")} aria-label="Minimize code editor">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                  )}
                  {windowMode === "editor" && (
                    <button type="button" className="window-control-button" onClick={() => setWindowMode("split")} aria-label="Restore split view">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><line x1="4" y1="14" x2="20" y2="14"></line></svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="window-body" style={{ backgroundColor: 'var(--bg-panel)' }}>
                <Suspense
                  fallback={(
                    <div className="editor-loading-state" role="status">
                      <div className="editor-loading-pulse" aria-hidden="true"></div>
                      <p>Chargement du moteur Monaco...</p>
                    </div>
                  )}
                >
                  <LazyMonacoEditor
                    height="100%"
                    theme={editorTheme}
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value ?? '')}
                    options={EDITOR_OPTIONS}
                  />
                </Suspense>
              </div>
            </div>

            {windowMode === "split" && (
              <button
                type="button"
                className="window-resizer"
                onPointerDown={(event) => {
                  event.preventDefault();
                  setIsResizing(true);
                }}
                aria-label="Resize editor and console"
              >
                <span className="window-resizer-grip"></span>
              </button>
            )}

            <div
              className={`console-wrapper window-shell ${windowMode === "editor" ? 'window-hidden' : ''}`}
              style={windowMode === "split" ? { flex: consoleFlex } : undefined}
              aria-busy={isRunning}
            >
              <div className="panel-header window-header">
                <div className="window-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="panel-icon"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                  <span>Console</span>
                </div>
                <div className="window-controls">
                  {windowMode !== "console" && (
                    <button type="button" className="window-control-button" onClick={() => setWindowMode("console")} aria-label="Maximize console">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M8 21H5a2 2 0 0 1-2-2v-3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>
                    </button>
                  )}
                  {windowMode === "split" && (
                    <button type="button" className="window-control-button" onClick={() => setWindowMode("editor")} aria-label="Minimize console">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                  )}
                  {windowMode === "console" && (
                    <button type="button" className="window-control-button" onClick={() => setWindowMode("split")} aria-label="Restore split view">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><line x1="4" y1="14" x2="20" y2="14"></line></svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="console-content window-body">
                <div className="console-toolbar">
                  <div className="status-message compact">
                    <div className={`status-indicator ${currentStatus.indicator}`}></div>
                    <span>{currentStatus.label}</span>
                  </div>
                  <button
                    type="button"
                    className={`console-toggle-button ${showCustomInput ? 'active' : ''}`}
                    onClick={() => setShowCustomInput((current) => !current)}
                  >
                    {showCustomInput ? 'Hide Input' : 'Custom Input'}
                  </button>
                </div>
                {showCustomInput && (
                  <div className="execution-input-panel">
                    <label className="console-field">
                      <span>stdin</span>
                      <textarea
                        className="console-textarea"
                        placeholder="Optional standard input"
                        value={stdin}
                        onChange={(event) => setStdin(event.target.value)}
                        disabled={isRunning}
                      />
                    </label>
                  </div>
                )}
                {caseResults.length > 0 && (
                  <div className="sample-results">
                    {caseResults.map((result) => (
                      <article key={result.name} className={`sample-result-card ${result.passed ? 'passed' : 'failed'}`}>
                        <div className="sample-result-header">
                          <span className="sample-result-name">{result.name}</span>
                          <span className={`sample-result-badge ${result.passed ? 'passed' : 'failed'}`}>
                            {result.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        {result.comparisonHint && (
                          <p className={`sample-result-meta ${result.passed ? 'passed' : 'failed'}`}>
                            {result.comparisonHint}
                          </p>
                        )}
                        <div className="sample-result-block">
                          <span>Input</span>
                          <pre>{result.input || "Empty input"}</pre>
                        </div>
                        {result.expectedOutput !== null && (
                          <div className="sample-result-block">
                            <span>Expected</span>
                            <pre>{result.expectedOutput || "Empty output"}</pre>
                          </div>
                        )}
                        <div className="sample-result-block">
                          <span>{result.stderr ? 'Error' : 'Actual'}</span>
                          <pre>{result.stderr || result.actualOutput || "Empty output"}</pre>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <div className="output-box" aria-live="polite">
                  {output.map((line, idx) => (
                    <div key={idx} className={`output-line ${line.type}`}>{line.text}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {windowMode !== "split" && (
            <div className="window-dock">
              <button
                type="button"
                className={`window-dock-button ${windowMode === "editor" ? 'active' : ''}`}
                onClick={() => setWindowMode(windowMode === "editor" ? "split" : "editor")}
              >
                Code Editor
              </button>
              <button
                type="button"
                className={`window-dock-button ${windowMode === "console" ? 'active' : ''}`}
                onClick={() => setWindowMode(windowMode === "console" ? "split" : "console")}
              >
                Console
              </button>
            </div>
          )}
        </div>
      </main>

      <div
        className={`problem-drawer-backdrop ${isProblemOpen ? 'open' : ''}`}
        onClick={() => setIsProblemOpen(false)}
        aria-hidden={!isProblemOpen}
      />
      <aside
        id="problemDrawer"
        className={`problem-drawer ${isProblemOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal={isProblemOpen}
        aria-hidden={!isProblemOpen}
      >
        <div className="problem-drawer-shell">
          <div className="problem-drawer-header">
            <div className="problem-drawer-heading">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="panel-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>Problem</span>
            </div>
            <button
              className="problem-close-button"
              type="button"
              onClick={() => setIsProblemOpen(false)}
              aria-label="Close problem panel"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          {problem ? (
            <div className="problem-content">
              <div className="problem-header">
                <h2 className="problem-title">{problem.title}</h2>
                <span className={`problem-difficulty ${problem.difficulty}`}>
                  {difficultyLabel[problem.difficulty] || problem.difficulty}
                </span>
              </div>
              {problem.tags && (
                <div className="problem-tags">
                  {problem.tags.split(',').map((tag, i) => (
                    <span key={i} className="problem-tag">{tag.trim()}</span>
                  ))}
                </div>
              )}
              <div className="problem-description">
                {problem.description.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
              {problem.sampleTests?.length > 0 && (
                <div className="problem-samples">
                  <h3 className="problem-samples-title">Sample Tests</h3>
                  <div className="problem-samples-list">
                    {problem.sampleTests.map((sample) => (
                      <article key={sample.name} className="problem-sample-card">
                        <div className="problem-sample-name">{sample.name}</div>
                        <div className="problem-sample-block">
                          <span>Input</span>
                          <pre>{sample.input}</pre>
                        </div>
                        <div className="problem-sample-block">
                          <span>Expected Output</span>
                          <pre>{sample.expectedOutput}</pre>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="problem-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="placeholder-icon"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"></path><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>
              <h3>{problemPlaceholderTitle}</h3>
              <p>
                {problemPlaceholderMessage}
                {!isProblemLoading ? (
                  <>
                    {' '}<a href="../problems.html" className="link-back">Browse the problems library</a>
                  </>
                ) : null}
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;
