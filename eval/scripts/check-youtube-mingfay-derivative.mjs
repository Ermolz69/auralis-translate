import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveChineseSrt } from './mandarin-triline-srt.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const parent = path.join(root, '.cache/eval/youtube-mingfay');
const rawPath = path.join(parent, 'caption-Vb3TuT/source.zh.srt');
const workspace = path.join(parent, 'derived-krjB0X');
const derivedPath = path.join(workspace, 'source.zh.srt');
const rawSha256 = 'a875c0a84ab0c3a9b44a1b5a2be0c6f3d5b885ed82d241d386057c0dbd5ab436';
const derivedSha256 = '42109fc054cba93b0ef343853628b6a248b31664786d579bdefa415ccaacf9ee';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const raw = await fs.readFile(rawPath);
const derived = await fs.readFile(derivedPath);
assert.equal(sha256(raw), rawSha256);
assert.equal(sha256(derived), derivedSha256);
const recomputed = deriveChineseSrt(raw.toString('utf8'));
assert(derived.equals(Buffer.from(recomputed.srt)), 'derived SRT differs from the frozen extraction policy');
assert.equal(recomputed.mapping.length, 230);
const report = JSON.parse(await fs.readFile(path.join(workspace, 'derivation.json'), 'utf8'));
assert.deepEqual(report.mapping, recomputed.mapping);
const executable = path.join(root, 'target/debug', process.platform === 'win32' ? 'auralis-translation-cli.exe' : 'auralis-translation-cli');
const result = spawnSync(executable, ['--json', 'inspect', derivedPath], {
  cwd: root, encoding: 'utf8', timeout: 30_000, maxBuffer: 2 * 1024 * 1024, windowsHide: true,
});
const attempt = await fs.mkdtemp(path.join(workspace, 'strict-inspection-'));
await fs.writeFile(path.join(attempt, 'stdout.json'), result.stdout ?? '');
await fs.writeFile(path.join(attempt, 'stderr.txt'), result.stderr ?? '');
const summary = { source_sha256: rawSha256, derived_sha256: derivedSha256,
  derivation_mapping_checked: true, strict_exit_code: result.status,
  strict_error: result.error?.message ?? null, strict_signal: result.signal };
try {
  const envelope = JSON.parse(result.stdout);
  summary.command = envelope.command ?? null;
  summary.terminal_event = envelope.terminal?.event ?? null;
  summary.format = envelope.report?.report?.format ?? null;
  summary.cue_count = envelope.report?.report?.segments?.length ?? null;
  summary.report_sha256 = envelope.report?.report?.source_sha256 ?? null;
} catch { summary.output_error = 'CLI output is not one JSON envelope'; }
summary.accepted = result.status === 0 && summary.terminal_event === 'completed'
  && summary.format === 'srt' && summary.cue_count === 230
  && summary.report_sha256 === derivedSha256;
await fs.writeFile(path.join(attempt, 'inspection.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Derivative strict inspection retained: ${attempt}`);
console.log(JSON.stringify(summary, null, 2));
if (!summary.accepted) process.exitCode = 1;
