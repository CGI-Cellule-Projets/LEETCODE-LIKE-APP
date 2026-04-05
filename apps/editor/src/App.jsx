import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react';
import Editor from "@monaco-editor/react";
import './App.css';

const starterCode = {
  javascript: '// Read the stdin text from the input argument.\nfunction solution(input) {\n  return input\n    .split(/\\s+/)\n    .filter(Boolean)\n    .reverse()\n    .join(" ");\n}\n',
  python: '# Write your solution here\ndef solution(input):\n    pass\n',
};

const accentPalette = {
  sunset: { primary: "#ff6b3d", secondary: "#ff9f1c", glow: "rgba(255, 107, 61, 0.18)" },
  ocean:  { primary: "#1f7fff", secondary: "#00b4d8", glow: "rgba(31, 127, 255, 0.2)" },
  mint:   { primary: "#14b884", secondary: "#9ad84b", glow: "rgba(20, 184, 132, 0.2)" },
};

const PROGRESS_KEY = "algoforge-progress";

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
    const parsed = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
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
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
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

const buildLocalApiUrl = (pathname) => {
  if (typeof window === "undefined") {
    return pathname;
  }

  const { protocol, hostname, port } = window.location;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalHost && port && port !== "3000") {
    return `${protocol}//${hostname}:3000${pathname}`;
  }

  return pathname;
};

const getApiCandidates = (pathname) => {
  const primary = pathname;
  const fallback = buildLocalApiUrl(pathname);
  return fallback !== primary ? [primary, fallback] : [primary];
};

const fetchExecutionApi = async (pathname, options) => {
  let lastError = null;

  for (const candidate of getApiCandidates(pathname)) {
    try {
      const response = await fetch(candidate, options);
      const payload = await parseExecutionResponse(response);
      return { response, payload };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Execution API is unavailable.');
};

const parseExecutionResponse = async (response) => {
  const rawText = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const looksLikeJson = contentType.includes("application/json");

  if (!rawText.trim()) {
    throw new Error('Execution API returned an empty response. Start the app with "npm run serve" from the project root.');
  }

  if (!looksLikeJson) {
    throw new Error('Execution API is unavailable on this server. Use "npm run serve" from the project root instead of a static server.');
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

    const hydrateProblem = async () => {
      if (currentProblemId) {
        try {
          const apiProblem = await fetchProblemById(currentProblemId);
          if (isCancelled) {
            return;
          }

          const enrichedProblem = enrichProblem(buildProblemFromApi(apiProblem, currentSearchProblem));
          setProblem(enrichedProblem);
          localStorage.setItem("algoforge-current-problem", JSON.stringify(enrichedProblem));
          return;
        } catch (error) {
          console.warn(error);
        }
      }

      try {
        if (currentSearchProblem) {
          const enrichedProblem = enrichProblem(currentSearchProblem);
          setProblem(enrichedProblem);
          localStorage.setItem("algoforge-current-problem", JSON.stringify(enrichedProblem));
        } else {
          const stored = localStorage.getItem("algoforge-current-problem");
          if (stored) {
            setProblem(enrichProblem(JSON.parse(stored)));
          }
        }
      } catch (e) {
        // ignore parse errors
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

        const actualOutput = normalizeOutputValue(payload.stdout);
        const expectedOutput = testCase.expectedOutput == null
          ? null
          : normalizeOutputValue(testCase.expectedOutput);
        const passed = expectedOutput == null
          ? payload.status === "success"
          : payload.status === "success" && actualOutput === expectedOutput;

        nextCaseResults.push({
          name: testCase.name,
          input: testCase.input,
          expectedOutput,
          actualOutput,
          stderr: payload.stderr,
          status: payload.status,
          passed,
          isCustom: testCase.isCustom,
          executionTime: payload.executionTime,
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
                <Editor
                  height="100%"
                  theme={editorTheme}
                  language={language}
                  value={code}
                  onChange={(value) => setCode(value ?? '')}
                  options={{
                    fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                    fontLigatures: true,
                    fontSize: 14,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                  }}
                />
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
                <div className="output-box">
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
              <h3>No Problem Selected</h3>
              <p>Select a problem from the <a href="../problems.html" className="link-back">problems library</a></p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;

