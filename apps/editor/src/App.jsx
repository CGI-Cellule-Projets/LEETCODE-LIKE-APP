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

const buildProblemQuery = (problem) => {
  if (!problem) {
    return "";
  }

  try {
    return `?problem=${encodeURIComponent(JSON.stringify(problem))}`;
  } catch {
    return "";
  }
};

const buildBackendEditorUrl = (problem) => {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.protocol}//${window.location.hostname}:3000/editor/indexcodeeditor.html${buildProblemQuery(problem)}`;
};

const statusConfig = {
  idle: { label: 'Idle', indicator: 'idle' },
  running: { label: 'Running', indicator: 'running' },
  success: { label: 'Success', indicator: 'success' },
  runtime_error: { label: 'Runtime Error', indicator: 'error' },
  timeout: { label: 'Timeout', indicator: 'timeout' },
};

const createDefaultOutput = () => ([
  { type: 'system', text: 'Console ready. Click "Run" to execute your code.' }
]);

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

const updateProgressFromRun = (problem, result, requestedTimeLimit) => {
  const progress = readProgress();
  const todayKey = toDateKey(new Date());

  progress.attempts += 1;
  progress.totalPracticeMinutes += 15;
  progress.activityByDate[todayKey] = Number(progress.activityByDate[todayKey] || 0) + 1;

  if (result.status === 'success') {
    const runtimePercentile = estimateRuntimePercentile(result.executionTime, requestedTimeLimit);
    progress.totalRuntimePercentile += runtimePercentile;
    progress.runtimeSamples += 1;
  }

  progress.contestsCompleted = Math.floor(progress.solvedCount / 4);
  progress.activeStreakDays = computeStreakDays(progress.activityByDate);
  writeProgress(progress);
};

function App() {
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(starterCode.javascript);
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
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [output, setOutput] = useState(createDefaultOutput);
  const workspaceRef = useRef(null);

  // Load problem data and sync theme/accent from main site settings
  useEffect(() => {
    const currentSearchProblem = readProblemFromSearch();

    if (typeof window !== "undefined") {
      const { hostname, port } = window.location;
      if (isLocalHost(hostname) && port && port !== "3000") {
        let redirectProblem = currentSearchProblem;

        if (!redirectProblem) {
          try {
            const storedProblem = localStorage.getItem("algoforge-current-problem");
            if (storedProblem) {
              redirectProblem = JSON.parse(storedProblem);
            }
          } catch {
            // Ignore malformed data and redirect without problem context.
          }
        }

        window.location.replace(buildBackendEditorUrl(redirectProblem));
        return;
      }
    }

    try {
      if (currentSearchProblem) {
        setProblem(currentSearchProblem);
        localStorage.setItem("algoforge-current-problem", JSON.stringify(currentSearchProblem));
      } else {
        const stored = localStorage.getItem("algoforge-current-problem");
        if (stored) {
          setProblem(JSON.parse(stored));
        }
      }
    } catch (e) {
      // ignore parse errors
    }

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
      setRunStatus("idle");
    });
  };

  const handleRunCode = async () => {
    if (isRunning) return;

    const requestedTimeLimit = Math.max(250, Number(timeLimit) || 2000);

    setIsRunning(true);
    setRunStatus("running");
    setLastRunResult(null);
    setOutput([{ type: 'system', text: 'Executing code...' }]);

    try {
      const { response, payload } = await fetchExecutionApi("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          sourceCode: code,
          stdin,
          timeLimit: requestedTimeLimit,
        }),
      });
      if (!response.ok) {
        throw new Error(payload.error || "Execution request failed.");
      }

      setRunStatus(payload.status);
      setLastRunResult(payload);
      setOutput(buildOutputMessages(payload));
      updateProgressFromRun(problem, payload, requestedTimeLimit);
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
      setOutput(buildOutputMessages(failureResult));
      updateProgressFromRun(problem, failureResult, requestedTimeLimit);
    } finally {
      setIsRunning(false);
    }
  };

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
            style={{ opacity: isRunning ? 0.7 : 1, cursor: isRunning ? 'not-allowed' : 'pointer' }}
          >
            {isRunning ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                Running
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Run
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

