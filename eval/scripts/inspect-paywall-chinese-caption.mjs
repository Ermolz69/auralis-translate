import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, '.cache/eval/paywall-chinese-caption/caption-0pzS77');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const sourcePath = path.join(directory, 'source.zh-tw.srt');
const source = await fs.readFile(sourcePath);
const acquisitionBytes = await fs.readFile(path.join(directory, 'acquisition.json'));
const acquisition = JSON.parse(acquisitionBytes);
assert.equal(acquisition.outcome, 'acquired_private_unreviewed');
assert.equal(acquisition.revision, '4b4ffc0cbafd1d08bc4e0974dbd5454967a4acf9');
assert.equal(acquisition.response_bytes, source.length);
assert.equal(sha256(source), acquisition.response_sha256);
assert.equal(sha256(source), '3406fcd365446d727f31c4ecf576de6c3b5e168658c3f5d276fea8142ddb5a4b');

const executable = path.join(root, 'target/debug', process.platform === 'win32'
  ? 'auralis-translation-cli.exe' : 'auralis-translation-cli');
const result = spawnSync(executable, ['--json', 'inspect', sourcePath], {
  cwd: root, encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024,
  windowsHide: true,
});
const report = { schema_version: 1, source_sha256: sha256(source),
  acquisition_report_sha256: sha256(acquisitionBytes),
  command: 'auralis-translation-cli --json inspect <retained source>',
  exit_code: result.status, process_error: result.error?.message ?? null,
  stderr: result.stderr, stdout_sha256: sha256(Buffer.from(result.stdout ?? '')) };
try {
  if (result.error) throw result.error;
  const envelope = JSON.parse(result.stdout);
  const inspection = envelope.report?.report;
  report.terminal = envelope.terminal;
  if (result.status === 0 && envelope.command === 'inspect'
      && envelope.report?.event === 'report' && envelope.terminal?.event === 'completed') {
    assert.equal(inspection.source_sha256, report.source_sha256);
    report.format = inspection.format;
    report.cue_count = inspection.segments?.length;
    report.first_cue = inspection.segments?.[0];
    report.last_cue = inspection.segments?.at(-1);
    report.all_ordered = inspection.segments?.every((segment, index) => segment.id === index + 1);
    report.overlap_pairs = inspection.segments?.filter((segment, index, all) =>
      index > 0 && segment.start_ms < all[index - 1].end_ms).length;
    report.outcome = 'strict_inspected';
  } else {
    report.outcome = 'strict_rejected';
    report.cli_response = envelope;
  }
} catch (error) {
  report.outcome = 'inspection_error';
  report.error = String(error);
}
const reportPath = path.join(directory, `inspection-${randomUUID()}.json`);
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ report_path: reportPath, ...report }, null, 2));
if (report.outcome !== 'strict_inspected') process.exitCode = 1;
