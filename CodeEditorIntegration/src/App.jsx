import React, { useState } from 'react';
import Editor from "@monaco-editor/react";
import './App.css';

function App() {
  const [code, setCode] = useState("// Start coding here...\n");
  const [language, setLanguage] = useState("javascript");
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState([
    { type: 'system', text: 'Console ready. Click "Run Code" to execute.' }
  ]);

  const handleRunCode = () => {
    if (isRunning) return;

    setIsRunning(true);
    setOutput([{ type: 'system', text: 'Executing code...' }]);

    // Simulate execution
    setTimeout(() => {
      setIsRunning(false);
      setOutput([
        { type: 'system', text: 'Code executed successfully.' }
      ]);
    }, 1500);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">&#123; &#125;</div>
          <span>Code Editor</span>
        </div>
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="language-selector"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="csharp">C#</option>
          <option value="typescript">TypeScript</option>
          <option value="jsx">JSX</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
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
        {/* Problem Component Placeholder */}
        <div className="problem-panel">
          <div className="panel-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="panel-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Problem
          </div>
          <div className="problem-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="placeholder-icon"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"></path><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>
            <h3>No Problem Selected</h3>
            <p>Problems will appear here once selected</p>
          </div>
        </div>

        {/* Code Editor Panel */}
        <div className="editor-panel">
          {/* Editor */}
          <div className="editor-wrapper">
            <div className="panel-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="panel-icon"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
              Code Editor
            </div>
            <div style={{ flex: 1, backgroundColor: 'var(--bg-panel)' }}>
              <Editor
                height="100%"
                theme="vs-dark"
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