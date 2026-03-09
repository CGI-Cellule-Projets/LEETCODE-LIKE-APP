import React, { useState, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import './App.css';

const starterCode = {
  javascript: '// Write your solution here\nfunction solution(input) {\n  \n}\n',
  python: '# Write your solution here\ndef solution(input):\n    pass\n',
  java: '// Write your solution here\nclass Solution {\n    public void solve() {\n        \n    }\n}\n',
  cpp: '// Write your solution here\n#include <vector>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
  c: '// Write your solution here\n#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n',
  csharp: '// Write your solution here\nusing System;\n\nclass Solution {\n    static void Main() {\n        \n    }\n}\n',
  typescript: '// Write your solution here\nfunction solution(input: any): any {\n  \n}\n',
  go: '// Write your solution here\npackage main\n\nfunc main() {\n    \n}\n',
  rust: '// Write your solution here\nfn main() {\n    \n}\n',
};

const accentPalette = {
  sunset: { primary: "#ff6b3d", secondary: "#ff9f1c", glow: "rgba(255, 107, 61, 0.18)" },
  ocean:  { primary: "#1f7fff", secondary: "#00b4d8", glow: "rgba(31, 127, 255, 0.2)" },
  mint:   { primary: "#14b884", secondary: "#9ad84b", glow: "rgba(20, 184, 132, 0.2)" },
};

function App() {
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(starterCode.javascript);
  const [isRunning, setIsRunning] = useState(false);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [output, setOutput] = useState([
    { type: 'system', text: 'Console ready. Click "Run Code" to execute.' }
  ]);

  // Load problem data and sync theme/accent from main site settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem("algoforge-current-problem");
      if (stored) {
        setProblem(JSON.parse(stored));
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

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(starterCode[lang] || `// Write your solution here\n`);
  };

  const handleRunCode = () => {
    if (isRunning) return;

    setIsRunning(true);
    setOutput([{ type: 'system', text: 'Executing code...' }]);

    setTimeout(() => {
      setIsRunning(false);
      setOutput([
        { type: 'system', text: 'Code executed successfully.' }
      ]);
    }, 1500);
  };

  const difficultyLabel = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <a href="/index.html" className="logo-back" title="Retour a AlgoForge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </a>
          <a href="/index.html" className="logo-brand"><span className="logo-highlight">Algo</span>Forge</a>
        </div>
        <select
          value={language}
          onChange={handleLanguageChange}
          className="language-selector"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="csharp">C#</option>
          <option value="typescript">TypeScript</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
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
      </header>

      <main className="main-content">
        {/* Problem Panel */}
        <div className="problem-panel">
          <div className="panel-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="panel-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Problem
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
              <p>Select a problem from the <a href="/problems.html" className="link-back">problems library</a></p>
            </div>
          )}
        </div>

        {/* Code Editor Panel */}
        <div className="editor-panel">
          <div className="editor-wrapper">
            <div className="panel-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="panel-icon"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
              Code Editor
            </div>
            <div style={{ flex: 1, backgroundColor: 'var(--bg-panel)' }}>
              <Editor
                height="100%"
                theme={editorTheme}
                language={language}
                value={code}
                onChange={(value) => setCode(value)}
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

          {/* Console */}
          <div className="console-wrapper">
            <div className="panel-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="panel-icon"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
              Console
            </div>
            <div className="console-content">
              <div className="status-message">
                <div className={`status-indicator ${isRunning ? 'running' : 'success'}`}></div>
                <span>{isRunning ? 'Running logic...' : 'Idle'}</span>
              </div>
              <div className="output-box">
                {output.map((line, idx) => (
                  <div key={idx} className={`output-line ${line.type}`}>{line.text}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
