import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const profilePath = path.resolve(root, process.argv[2]);
const modelPath = path.resolve(root, process.argv[3]);
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER ?? path.join(root, '.cache/runtime/llama/llama-server.exe');
const profile = JSON.parse(await fs.readFile(profilePath));
const port = Number(process.env.AURALIS_MODEL_PORT ?? 18080);
assert(Number.isInteger(port) && port >= 1024 && port <= 65535);
const env = { ...process.env, PATH: `${path.dirname(serverPath)};${path.join(root, '.cache/runtime/cudart')};${process.env.PATH}` };
const doctor = startProcess(path.join(root, 'target/release/auralis-translation-cli.exe'), ['doctor', profilePath, modelPath], root, env);
await waitForExit(doctor, 180_000);
console.log(doctor.stdout.trim());
const server = startProcess(serverPath, ['--model', modelPath, '--alias', profile.model_alias, '--host', '127.0.0.1', '--port', String(port), '-c', String(profile.min_context_tokens), '-ngl', '99', '--cache-ram', '0', '--parallel', '1', '--jinja'], root, env, { maxCaptureCharacters: 4 * 1024 * 1024 });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { void stopProcess(server); });
try {
  await waitForHealthyServer(`http://127.0.0.1:${port}/`, server, 180_000);
  console.log(`Ready: ${profile.model_alias} at http://127.0.0.1:${port}/; use the same profile for a new CLI run.`);
  if (process.argv[4] !== '--verify-only') {
    const ended = await server.ended;
    if (ended.error || (ended.code !== 0 && !ended.signal)) throw new Error(ended.error?.message ?? server.stderr);
  }
} finally {
  await stopProcess(server);
}
