import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const retry = process.argv[2] === '--retry-after-eperm';
assert.equal(process.argv.length, retry ? 3 : 2,
  'Use no arguments or --retry-after-eperm');
const directory = path.join(root,
  '.cache/eval/youtube-geekerwan-kirin-original-caption/attempt-QbgkVq');
const sourcePath = path.join(directory, 'source.zh.srt');
const inspection = path.join(directory,
  retry ? 'strict-inspection-retry' : 'strict-inspection');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const [source, acquisitionBytes] = await Promise.all([
  fs.readFile(sourcePath), fs.readFile(path.join(directory, 'acquisition.json')),
]);
assert.equal(sha256(source),
  'c2a5fa3ae5139fe90b2be0b4b48b10ddd20d9b42103f4dd8401e1426d1b3eae5');
assert.equal(sha256(acquisitionBytes),
  'bb7570d9be85b99e8e8f6b4e81c5d26a57b989d1cee5706e287869fa998722d5');
const acquisition = JSON.parse(acquisitionBytes.toString('utf8'));
assert.equal(acquisition.outcome, 'acquired_private_unreviewed');
assert.equal(acquisition.response_bytes, source.length);
assert.equal(acquisition.response_sha256, sha256(source));
assert.equal(acquisition.video_id, '73XUeYRFsZU');
if (retry) {
  const previous = JSON.parse(await fs.readFile(path.join(directory,
    'strict-inspection/inspection.json'), 'utf8'));
  assert.equal(previous.outcome, 'inspection_error');
  assert.match(previous.process_error, / EPERM$/);
  assert.equal(previous.source_sha256, sha256(source));
  assert.equal(previous.cli_sha256,
    '48195b25dda70d08bb23c2e31a75fb665aae84f12e6726c8f72e0c0ea77bbbb8');
}
await fs.mkdir(inspection);

const executable = path.join(root, 'target/debug', process.platform === 'win32'
  ? 'auralis-translation-cli.exe' : 'auralis-translation-cli');
const cliSha256 = sha256(await fs.readFile(executable));
if (retry) assert.equal(cliSha256,
  '48195b25dda70d08bb23c2e31a75fb665aae84f12e6726c8f72e0c0ea77bbbb8');
const started = performance.now();
const result = spawnSync(executable, ['--json', 'inspect', sourcePath], {
  cwd: root, timeout: 30_000, maxBuffer: 4 * 1024 * 1024,
  windowsHide: true,
});
const stdout = result.stdout ?? Buffer.alloc(0);
const stderr = result.stderr ?? Buffer.alloc(0);
await Promise.all([
  fs.writeFile(path.join(inspection, 'cli-stdout.json'), stdout, { flag: 'wx' }),
  fs.writeFile(path.join(inspection, 'cli-stderr.txt'), stderr, { flag: 'wx' }),
]);
const report = {
  schema_version: 1,
  experiment: acquisition.experiment,
  source_sha256: sha256(source),
  acquisition_sha256: sha256(acquisitionBytes),
  cli_sha256: cliSha256,
  command: 'auralis-translation-cli --json inspect <private SRT>',
  exit_code: result.status,
  process_error: result.error?.message ?? null,
  stdout_bytes: stdout.length, stdout_sha256: sha256(stdout),
  stderr_bytes: stderr.length, stderr_sha256: sha256(stderr),
  elapsed_ms: Math.round(performance.now() - started),
  outcome: 'running',
};
try {
  if (result.error) throw result.error;
  const envelope = JSON.parse(stdout.toString('utf8'));
  const parsed = envelope.report?.report;
  if (result.status === 0 && envelope.command === 'inspect'
    && envelope.report?.event === 'report'
    && envelope.terminal?.event === 'completed'
    && parsed?.format === 'srt') {
    assert.equal(parsed.source_sha256, report.source_sha256);
    assert(parsed.segments?.length > 0);
    assert(parsed.segments.every((cue, index) => cue.id === index + 1));
    const cues = parsed.segments;
    report.cue_count = cues.length;
    report.first_cue = { id: cues[0].id,
      start_ms: cues[0].start_ms, end_ms: cues[0].end_ms };
    report.last_cue = { id: cues.at(-1).id,
      start_ms: cues.at(-1).start_ms, end_ms: cues.at(-1).end_ms };
    report.overlap_pairs = cues.filter((cue, index) =>
      index > 0 && cue.start_ms < cues[index - 1].end_ms).length;
    report.cues_beyond_archived_media_end = cues.filter(cue =>
      cue.end_ms > 761_818).length;
    report.cues_beyond_current_metadata_end = cues.filter(cue =>
      cue.end_ms > 852_000).length;
    report.outcome = 'strict_inspected_private_unreviewed';
  } else {
    report.outcome = 'strict_rejected';
  }
} catch (error) {
  report.outcome = 'inspection_error';
  report.error = String(error);
}
await fs.writeFile(path.join(inspection, 'inspection.json'),
  `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(`Private strict inspection: ${inspection}`);
console.log(JSON.stringify(report, null, 2));
if (report.outcome !== 'strict_inspected_private_unreviewed') process.exitCode = 1;
