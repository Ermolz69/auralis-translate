import { spawn } from 'node:child_process';

export async function captureBoundedProcess({ command, args, cwd, env, timeoutMs,
  maxOutputBytes, spawnProcess = spawn }) {
  const stdout = [];
  const stderr = [];
  let stdoutBytes = 0;
  let stderrBytes = 0;
  let outputLimitExceeded = false;
  let timedOut = false;
  let outcome;
  let child;
  const collect = (chunks, isStdout) => chunk => {
    if (isStdout) stdoutBytes += chunk.length;
    else stderrBytes += chunk.length;
    if (stdoutBytes + stderrBytes > maxOutputBytes) {
      outputLimitExceeded = true;
      child.kill();
      return;
    }
    chunks.push(chunk);
  };
  try {
    child = spawnProcess(command, args, { cwd, windowsHide: true,
      env, stdio: ['ignore', 'pipe', 'pipe'] });
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    try {
      child.stdout.on('data', collect(stdout, true));
      child.stderr.on('data', collect(stderr, false));
      outcome = await new Promise(resolve => {
        child.once('error', error => resolve({ error: String(error), exit_code: null, signal: null }));
        child.once('close', (exitCode, signal) => resolve({ exit_code: exitCode, signal }));
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    outcome = { error: String(error), exit_code: null, signal: null };
  }
  return { outcome, timedOut, outputLimitExceeded,
    stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) };
}
