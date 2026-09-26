import { spawn } from 'node:child_process';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const MAX_CAPTURE_CHARACTERS = 262_144;

export function startProcess(command, args, cwd, env = process.env) {
  const child = spawn(command, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const process = { child, stdout: '', stderr: '' };
  child.stdout.on('data', (chunk) => { process.stdout = `${process.stdout}${chunk}`.slice(-MAX_CAPTURE_CHARACTERS); });
  child.stderr.on('data', (chunk) => { process.stderr = `${process.stderr}${chunk}`.slice(-MAX_CAPTURE_CHARACTERS); });
  process.ended = new Promise((resolve) => {
    child.once('error', (error) => resolve({ code: null, error }));
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
  return process;
}

export async function waitForExit(process, timeoutMs) {
  let timer;
  try {
    const result = await Promise.race([
      process.ended,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Process timeout')), timeoutMs); }),
    ]);
    if (result.error || result.code !== 0) {
      throw new Error(`Process failed: ${result.error?.message ?? result.code}\n${process.stderr}`);
    }
    return process;
  } finally {
    clearTimeout(timer);
  }
}

export async function stopProcess(process) {
  if (!process) return;
  if (process.child.exitCode === null && process.child.signalCode === null) process.child.kill();
  await process.ended;
}

export async function freeLoopbackPort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => listener.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
  return port;
}

export async function waitForHealthyServer(url, process, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (process.child.exitCode !== null || process.child.signalCode !== null) {
      throw new Error(`Model server exited before readiness\n${process.stderr}`);
    }
    try {
      const response = await fetch(`${url}health`, { signal: AbortSignal.timeout(1000) });
      if (response.ok && (await response.json()).status === 'ok') return;
    } catch { /* Readiness may briefly refuse connections during model loading. */ }
    await delay(200);
  }
  throw new Error(`Model server readiness timed out\n${process.stderr}`);
}
