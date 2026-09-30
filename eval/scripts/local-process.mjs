import { spawn } from 'node:child_process';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const MAX_CAPTURE_CHARACTERS = 262_144;

export function startProcess(command, args, cwd, env = process.env, { maxCaptureCharacters = MAX_CAPTURE_CHARACTERS } = {}) {
  if (!Number.isInteger(maxCaptureCharacters) || maxCaptureCharacters < 1 || maxCaptureCharacters > 16 * 1024 * 1024) throw new Error('Invalid process capture limit');
  const child = spawn(command, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const process = { child, stdout: '', stderr: '', stdoutTruncated: false, stderrTruncated: false };
  for (const stream of ['stdout', 'stderr']) {
    child[stream].setEncoding('utf8');
    child[stream].on('data', (chunk) => {
      const next = `${process[stream]}${chunk}`;
      process[`${stream}Truncated`] ||= next.length > maxCaptureCharacters;
      process[stream] = next.slice(-maxCaptureCharacters);
    });
  }
  process.ended = new Promise((resolve) => {
    child.once('error', (error) => resolve({ code: null, error }));
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  return process;
}

export async function waitForExit(process, timeoutMs) {
  let timer;
  let timedOut = false;
  try {
    const result = await Promise.race([
      process.ended,
      new Promise((_, reject) => { timer = setTimeout(() => {
        timedOut = true;
        reject(new Error('Process timeout'));
      }, timeoutMs); }),
    ]);
    if (result.error || result.code !== 0) {
      throw new Error(`Process failed: ${result.error?.message ?? result.code}\n${process.stderr}`);
    }
    return process;
  } catch (error) {
    if (timedOut) {
      if (process.child.exitCode === null && process.child.signalCode === null) process.child.kill();
      const stopped = await Promise.race([process.ended.then(() => true), delay(5_000).then(() => false)]);
      if (!stopped) throw new Error('Process timeout; child did not stop');
    }
    throw error;
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
  let lastObservation = 'no health response';
  while (Date.now() < deadline) {
    if (process.child.exitCode !== null || process.child.signalCode !== null) {
      throw new Error(`Model server exited before readiness\n${process.stderr}`);
    }
    try {
      const response = await fetch(`${url}health`, { signal: AbortSignal.timeout(1000) });
      const body = await response.json();
      if (response.ok && body.status === 'ok') return;
      lastObservation = `HTTP ${response.status}, status=${JSON.stringify(body.status ?? null)}`;
    } catch (error) { lastObservation = error.message; }
    await delay(200);
  }
  throw new Error(`Model server readiness timed out; last observation: ${lastObservation}\n${process.stderr}`);
}
