import fs from 'node:fs/promises';
import { startProcess, stopProcess, waitForExit } from './local-process.mjs';

const SAMPLE_INTERVAL_MS = 5000;
const SAMPLE_TIMEOUT_MS = 4000;

export function runtimeSampler(file, root, trackedPids) {
  let running;
  let stopped = false;
  const samples = [];
  async function tick() {
    if (running || stopped) return;
    running = (async () => {
      const pids = trackedPids().filter((pid) => Number.isInteger(pid) && pid > 0);
      if (pids.length === 0) return;
      const shell = startProcess('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `@(Get-Process -Id ${pids.join(',')} -ErrorAction SilentlyContinue | Select-Object Id,WorkingSet64,PrivateMemorySize64,CPU) | ConvertTo-Json -Compress`], root);
      const gpu = startProcess('nvidia-smi', ['--query-gpu=name,memory.used,memory.total', '--format=csv,noheader,nounits'], root);
      const sample = { created_at: new Date().toISOString(), tracked_pids: pids, processes: [], gpu_device: null, errors: [] };
      try { await waitForExit(shell, SAMPLE_TIMEOUT_MS); sample.processes = shell.stdout.trim() ? JSON.parse(shell.stdout) : []; }
      catch (error) { sample.errors.push(`process sampling: ${error.message}`); }
      finally { await stopProcess(shell); }
      try { await waitForExit(gpu, SAMPLE_TIMEOUT_MS); sample.gpu_device = gpu.stdout.trim(); }
      catch (error) { sample.errors.push(`device sampling: ${error.message}`); }
      finally { await stopProcess(gpu); }
      if (!Array.isArray(sample.processes)) sample.processes = [sample.processes];
      samples.push(sample);
      await fs.appendFile(file, `${JSON.stringify(sample)}\n`);
    })().catch((error) => { samples.push({ created_at: new Date().toISOString(), errors: [error.message], processes: [] }); }).finally(() => { running = undefined; });
    await running;
  }
  const timer = setInterval(() => { void tick(); }, SAMPLE_INTERVAL_MS);
  void tick();
  return {
    async stop() {
      stopped = true;
      clearInterval(timer);
      await running;
      return { interval_ms: SAMPLE_INTERVAL_MS, samples, limitations: 'Sampled working set/private memory of tracked processes; device-wide GPU use includes other applications. Not an isolated peak or release hardware gate.' };
    },
  };
}
