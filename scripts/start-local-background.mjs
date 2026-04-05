import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const restApiRoot = path.join(repoRoot, 'RestAPI');
const runtimeLogsDir = path.join(repoRoot, 'runtime-logs');
const pidFilePath = path.join(runtimeLogsDir, 'local-stack-pids.json');

const appPort = process.env.PORT || '3000';
const restApiPort = process.env.REST_API_PORT || '3001';
const appEntryPath = path.join(repoRoot, 'apps', 'server', 'server.mjs');
const restApiEntryPath = path.join(restApiRoot, 'dist', 'main.js');

function ensureRuntimeDirectory() {
  mkdirSync(runtimeLogsDir, { recursive: true });
}

function isProcessRunning(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readExistingState() {
  if (!existsSync(pidFilePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(pidFilePath, 'utf8'));
  } catch {
    return null;
  }
}

function openLogFile(fileName) {
  return openSync(path.join(runtimeLogsDir, fileName), 'a');
}

function spawnDetachedNode(entryPath, options) {
  const child = spawn(process.execPath, [entryPath], {
    cwd: options.cwd,
    env: options.env,
    detached: true,
    stdio: ['ignore', options.stdoutFd, options.stderrFd],
    windowsHide: true,
  });

  child.unref();
  return child;
}

function assertBuildArtifactsExist() {
  if (!existsSync(restApiEntryPath)) {
    throw new Error('REST API build is missing. Run `npm --prefix RestAPI run build` first.');
  }
}

function main() {
  ensureRuntimeDirectory();
  assertBuildArtifactsExist();

  const existingState = readExistingState();
  if (existingState?.apiPid && existingState?.appPid) {
    const apiRunning = isProcessRunning(existingState.apiPid);
    const appRunning = isProcessRunning(existingState.appPid);

    if (apiRunning && appRunning) {
      console.log(`Local stack is already running on http://localhost:${appPort}`);
      console.log(`App PID: ${existingState.appPid}`);
      console.log(`API PID: ${existingState.apiPid}`);
      return;
    }
  }

  const apiStdoutFd = openLogFile('api-stdout.log');
  const apiStderrFd = openLogFile('api-stderr.log');
  const appStdoutFd = openLogFile('app-stdout.log');
  const appStderrFd = openLogFile('app-stderr.log');

  const apiProcess = spawnDetachedNode(restApiEntryPath, {
    cwd: restApiRoot,
    env: {
      ...process.env,
      PORT: restApiPort,
      APP_ORIGIN: `http://localhost:${appPort}`,
    },
    stdoutFd: apiStdoutFd,
    stderrFd: apiStderrFd,
  });

  const appProcess = spawnDetachedNode(appEntryPath, {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: appPort,
      REST_API_PORT: restApiPort,
    },
    stdoutFd: appStdoutFd,
    stderrFd: appStderrFd,
  });

  writeFileSync(
    pidFilePath,
    JSON.stringify(
      {
        appPid: appProcess.pid,
        apiPid: apiProcess.pid,
        appPort: Number(appPort),
        restApiPort: Number(restApiPort),
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log('AlgoForge is starting in the background.');
  console.log(`Site: http://localhost:${appPort}/problems.html`);
  console.log(`API: http://localhost:${restApiPort}/api/problems`);
  console.log(`PIDs saved to: ${pidFilePath}`);
}

main();
