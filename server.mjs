import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const WEB_ROOT = path.join(__dirname, 'apps', 'web');
const EDITOR_ENTRY = path.join(WEB_ROOT, 'editor', 'indexcodeeditor.html');
const RUNTIME_ROOT = path.join(__dirname, 'runtime');

const MAX_BODY_BYTES = 256 * 1024;
const MAX_OUTPUT_BYTES = 64 * 1024;
const DEFAULT_TIME_LIMIT_MS = 2000;
const MIN_TIME_LIMIT_MS = 250;
const MAX_TIME_LIMIT_MS = 10000;
const TIMEOUT_EXIT_CODE = 124;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const languageConfigs = {
  javascript: {
    extension: '.js',
    buildCommand() {
      return {
        command: process.execPath,
        args: [path.join(RUNTIME_ROOT, 'javascript-runner.cjs')],
      };
    },
  },
  python: {
    extension: '.py',
    buildCommand() {
      const python = resolvePythonRuntime();
      return {
        command: python.command,
        args: [...python.prefixArgs, path.join(RUNTIME_ROOT, 'python-runner.py')],
      };
    },
  },
};

let cachedPythonRuntime = null;

function resolvePythonRuntime() {
  if (cachedPythonRuntime) {
    return cachedPythonRuntime;
  }
  const candidates = [
    { command: 'python', prefixArgs: ['-X', 'utf8'] },
    { command: 'py', prefixArgs: ['-3', '-X', 'utf8'] },
  ];

  for (const candidate of candidates) {
    const versionArgs = candidate.command === 'py'
      ? ['-3', '--version']
      : ['--version'];
    const result = spawnSync(candidate.command, versionArgs, {
      stdio: 'ignore',
      windowsHide: true,
    });

    if (result.status === 0) {
      cachedPythonRuntime = candidate;
      return candidate;
    }
  }

  throw new Error('Python runtime is not available on this machine.');
}

function clampNumber(value, minimum, maximum, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function roundMetric(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

function getAllowedOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) {
    return null;
  }

  try {
    const parsed = new URL(origin);
    const isLocalOrigin = ['localhost', '127.0.0.1'].includes(parsed.hostname);
    return isLocalOrigin ? origin : null;
  } catch {
    return null;
  }
}

function setCorsHeaders(request, response) {
  const allowedOrigin = getAllowedOrigin(request);
  if (!allowedOrigin) {
    return;
  }

  response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Vary', 'Origin');
}

function sendJson(request, response, statusCode, payload) {
  setCorsHeaders(request, response);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error('Request body is too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('Request body must be valid JSON.');
    error.statusCode = 400;
    throw error;
  }
}

function validateExecutionPayload(payload) {
  const language = String(payload.language || '').trim().toLowerCase();
  if (!languageConfigs[language]) {
    const error = new Error('Unsupported language. Use javascript or python.');
    error.statusCode = 400;
    throw error;
  }

  const sourceCode = typeof payload.sourceCode === 'string'
    ? payload.sourceCode
    : '';
  if (!sourceCode.trim()) {
    const error = new Error('sourceCode is required.');
    error.statusCode = 400;
    throw error;
  }

  const stdin = typeof payload.stdin === 'string'
    ? payload.stdin
    : '';
  const timeLimit = clampNumber(
    Number(payload.timeLimit),
    MIN_TIME_LIMIT_MS,
    MAX_TIME_LIMIT_MS,
    DEFAULT_TIME_LIMIT_MS,
  );

  return {
    language,
    sourceCode,
    stdin,
    timeLimit,
  };
}

function trimOutput(value) {
  return value.replace(/\s+$/, '');
}

function appendChunk(current, chunk) {
  const remaining = MAX_OUTPUT_BYTES - Buffer.byteLength(current, 'utf8');
  if (remaining <= 0) {
    return { value: current, overflow: true };
  }

  const nextChunk = chunk.subarray(0, remaining).toString('utf8');
  const value = current + nextChunk;
  const overflow = chunk.length > remaining;
  return { value, overflow };
}

function terminateProcessTree(pid) {
  if (!pid) {
    return;
  }

  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/pid', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    killer.on('error', () => {});
    return;
  }

  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    // Ignore missing process errors.
  }
}

async function readMetrics(resultPath) {
  try {
    const raw = await fs.readFile(resultPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function runExecution({ language, sourceCode, stdin, timeLimit }) {
  const languageConfig = languageConfigs[language];
  const executionDir = await fs.mkdtemp(path.join(os.tmpdir(), 'algoforge-run-'));
  const sourcePath = path.join(executionDir, `submission${languageConfig.extension}`);
  const resultPath = path.join(executionDir, 'result.json');

  try {
    await fs.writeFile(sourcePath, sourceCode, 'utf8');

    const runtime = languageConfig.buildCommand();
    const child = spawn(
      runtime.command,
      [...runtime.args, sourcePath, resultPath, String(timeLimit)],
      {
        cwd: executionDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      },
    );

    const startTime = performance.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let outputOverflow = false;

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      terminateProcessTree(child.pid);
    }, timeLimit);

    child.stdout.on('data', (chunk) => {
      const next = appendChunk(stdout, chunk);
      stdout = next.value;
      if (next.overflow && !outputOverflow) {
        outputOverflow = true;
        terminateProcessTree(child.pid);
      }
    });

    child.stderr.on('data', (chunk) => {
      const next = appendChunk(stderr, chunk);
      stderr = next.value;
      if (next.overflow && !outputOverflow) {
        outputOverflow = true;
        terminateProcessTree(child.pid);
      }
    });

    child.stdin.end(stdin);

    let exitResult;
    try {
      exitResult = await new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('close', (code, signal) => resolve({ code, signal }));
      });
    } finally {
      clearTimeout(timeoutHandle);
    }

    const metrics = await readMetrics(resultPath);
    const fallbackExecutionTime = performance.now() - startTime;
    const exitCode = Number.isInteger(exitResult.code)
      ? exitResult.code
      : timedOut
        ? TIMEOUT_EXIT_CODE
        : 1;

    let status = 'success';
    if (timedOut) {
      status = 'timeout';
    } else if (outputOverflow || exitCode !== 0) {
      status = 'runtime_error';
    }

    if (timedOut) {
      stderr = trimOutput(`${stderr}\nExecution exceeded the ${timeLimit} ms time limit.`.trim());
    }

    if (outputOverflow) {
      stderr = trimOutput(`${stderr}\nOutput exceeded ${MAX_OUTPUT_BYTES} bytes and was terminated.`.trim());
    }

    return {
      stdout: trimOutput(stdout),
      stderr: trimOutput(stderr),
      exitCode,
      executionTime: roundMetric(metrics.executionTime ?? fallbackExecutionTime),
      memory: Number.isFinite(metrics.memory) ? Math.round(metrics.memory) : null,
      status,
    };
  } finally {
    await fs.rm(executionDir, { recursive: true, force: true });
  }
}

function isLocalRequest(request) {
  const remoteAddress = request.socket.remoteAddress || '';
  return [
    '127.0.0.1',
    '::1',
    '::ffff:127.0.0.1',
  ].includes(remoteAddress);
}

function handleOptions(request, response) {
  setCorsHeaders(request, response);
  response.writeHead(204);
  response.end();
}

async function handleExecute(request, response) {
  if (request.method === 'OPTIONS') {
    handleOptions(request, response);
    return;
  }

  if (!isLocalRequest(request)) {
    sendJson(request, response, 403, {
      error: 'Local execution is available only from this machine.',
    });
    return;
  }

  if (request.method !== 'POST') {
    sendJson(request, response, 405, {
      error: 'Method not allowed.',
    });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const payload = validateExecutionPayload(body);
    const result = await runExecution(payload);
    sendJson(request, response, 200, result);
  } catch (error) {
    const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    sendJson(request, response, statusCode, {
      error: error.message || 'Execution failed.',
    });
  }
}

function handleHealth(request, response) {
  if (request.method === 'OPTIONS') {
    handleOptions(request, response);
    return;
  }

  sendJson(request, response, 200, {
    ok: true,
    service: 'algoforge-executor',
    languages: Object.keys(languageConfigs),
    localOnly: true,
  });
}

function decodePathname(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

function resolveStaticPath(pathname) {
  if (pathname === '/' || pathname === '') {
    return path.join(WEB_ROOT, 'index.html');
  }

  if (pathname === '/editor' || pathname === '/editor/') {
    return EDITOR_ENTRY;
  }

  const relativePath = pathname.replace(/^\/+/, '');
  const absolutePath = path.resolve(WEB_ROOT, relativePath);
  const relativeToRoot = path.relative(WEB_ROOT, absolutePath);

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    return null;
  }

  return absolutePath;
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const decodedPathname = decodePathname(url.pathname);
  if (decodedPathname === null) {
    response.writeHead(400, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end('Bad request');
    return;
  }

  const filePath = resolveStaticPath(decodedPathname);

  if (!filePath) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Cache-Control': extension === '.html'
        ? 'no-cache'
        : 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === '/api/health') {
    handleHealth(request, response);
    return;
  }

  if (url.pathname === '/api/execute') {
    await handleExecute(request, response);
    return;
  }

  await serveStatic(request, response);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing server or set a different PORT.`);
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, HOST, () => {
  console.log(`AlgoForge server listening on http://${HOST}:${PORT}`);
});



