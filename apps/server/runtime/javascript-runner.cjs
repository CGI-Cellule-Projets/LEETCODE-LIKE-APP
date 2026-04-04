const fs = require('node:fs');
const path = require('node:path');
const util = require('node:util');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');

const [, , sourcePath, resultPath, timeLimitArg] = process.argv;
const timeLimit = Math.max(1, Number(timeLimitArg) || 2000);

function writeResult(executionTime, memory) {
  fs.writeFileSync(
    resultPath,
    JSON.stringify({
      executionTime,
      memory,
    }),
    'utf8',
  );
}

function formatValue(value) {
  if (typeof value === 'string') {
    return value;
  }

  return util.inspect(value, {
    depth: null,
    maxArrayLength: 200,
    breakLength: 80,
  });
}

async function main() {
  const sourceCode = fs.readFileSync(sourcePath, 'utf8');
  const stdin = fs.readFileSync(0, 'utf8');

  const runtimeConsole = {
    log: (...args) => {
      process.stdout.write(`${args.map(formatValue).join(' ')}\n`);
    },
    error: (...args) => {
      process.stderr.write(`${args.map(formatValue).join(' ')}\n`);
    },
    warn: (...args) => {
      process.stderr.write(`${args.map(formatValue).join(' ')}\n`);
    },
  };

  const context = vm.createContext({
    console: runtimeConsole,
    clearInterval,
    clearTimeout,
    setInterval,
    setTimeout,
    structuredClone,
    stdin,
  });

  const startTime = performance.now();

  try {
    const script = new vm.Script(sourceCode, {
      filename: path.basename(sourcePath),
      displayErrors: true,
    });

    script.runInContext(context, {
      timeout: timeLimit,
    });

    if (typeof context.solution === 'function') {
      const execution = Promise.resolve(context.solution(stdin));
      let solutionTimeout;

      try {
        const result = await Promise.race([
          execution,
          new Promise((_, reject) => {
            solutionTimeout = setTimeout(() => {
              reject(new Error(`Execution exceeded the ${timeLimit} ms time limit.`));
            }, timeLimit);
          }),
        ]);

        if (result !== undefined) {
          process.stdout.write(`${formatValue(result)}\n`);
        }
      } finally {
        clearTimeout(solutionTimeout);
      }
    }

    writeResult(performance.now() - startTime, process.memoryUsage().rss);
  } catch (error) {
    writeResult(performance.now() - startTime, process.memoryUsage().rss);
    process.stderr.write(error && error.stack ? error.stack : String(error));
    process.exitCode = 1;
  }
}

main();

