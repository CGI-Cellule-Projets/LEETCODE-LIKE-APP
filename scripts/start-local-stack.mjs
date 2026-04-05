import { spawn } from 'node:child_process';
import process from 'node:process';

const APP_PORT = process.env.PORT || '3000';
const REST_API_PORT = process.env.REST_API_PORT || '3001';
const shouldBuildEditor = process.argv.includes('--build-editor');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const children = new Set();
let shuttingDown = false;

function quoteWindowsArg(value) {
  if (/^[A-Za-z0-9_:\\/.=-]+$/.test(value)) {
    return value;
  }

  return '"' + value.replace(/"/g, '\\"') + '"';
}

function spawnProcess(command, args, options = {}) {
  const baseOptions = {
    stdio: 'inherit',
    env: process.env,
    ...options,
  };

  const requiresCmdWrapper = process.platform === 'win32' && /\.(cmd|bat)$/i.test(command);

  const child = requiresCmdWrapper
    ? spawn('cmd.exe', ['/d', '/s', '/c', [command, ...args].map(quoteWindowsArg).join(' ')], {
        windowsHide: false,
        ...baseOptions,
      })
    : spawn(command, args, baseOptions);

  children.add(child);
  child.once('exit', () => {
    children.delete(child);
  });

  return child;
}

async function runStep(label, command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawnProcess(command, args, options);

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} exited with code ${code ?? 'unknown'}.`));
    });
  });
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    child.kill('SIGTERM');
  }

  setTimeout(() => process.exit(exitCode), 250);
}

async function main() {
  if (shouldBuildEditor) {
    console.log('Building editor bundle...');
    await runStep('Editor build', npmCommand, ['--prefix', 'apps/editor', 'run', 'build']);
  }

  console.log(`Starting REST API on http://127.0.0.1:${REST_API_PORT}`);
  const apiProcess = spawnProcess(
    npmCommand,
    ['--prefix', 'RestAPI', 'run', 'dev'],
    {
      env: {
        ...process.env,
        PORT: REST_API_PORT,
        APP_ORIGIN: `http://localhost:${APP_PORT}`,
      },
    },
  );

  console.log(`Starting app server on http://127.0.0.1:${APP_PORT}`);
  const appProcess = spawnProcess(
    process.execPath,
    ['apps/server/server.mjs'],
    {
      env: {
        ...process.env,
        PORT: APP_PORT,
        REST_API_PORT,
      },
    },
  );

  const onChildExit = (name) => (code) => {
    if (shuttingDown) {
      return;
    }

    const exitCode = typeof code === 'number' ? code : 1;
    console.error(`${name} exited unexpectedly with code ${exitCode}. Stopping local stack.`);
    shutdown(exitCode);
  };

  apiProcess.once('exit', onChildExit('REST API'));
  appProcess.once('exit', onChildExit('App server'));
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

main().catch((error) => {
  console.error(error.message || error);
  shutdown(1);
});





