import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const pidFilePath = path.join(repoRoot, 'runtime-logs', 'local-stack-pids.json');

function safeKill(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

function main() {
  if (!existsSync(pidFilePath)) {
    console.log('No background local stack was found.');
    return;
  }

  let state = null;
  try {
    state = JSON.parse(readFileSync(pidFilePath, 'utf8'));
  } catch {
    state = null;
  }

  const stoppedApi = safeKill(state?.apiPid);
  const stoppedApp = safeKill(state?.appPid);

  rmSync(pidFilePath, { force: true });

  console.log(`Stopped app server: ${stoppedApp ? 'yes' : 'no process found'}`);
  console.log(`Stopped REST API: ${stoppedApi ? 'yes' : 'no process found'}`);
}

main();
