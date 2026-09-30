import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSourceInventory } from './source-inventory.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = process.argv[2] ?? 'eval/corpora/commons-inspected-candidates-v1.json';
if (process.argv.length > 3) throw new Error('usage: node check-source-candidate-inspection.mjs [MANIFEST_JSON]');
const inventory = JSON.parse(await readFile(path.join(root, manifest), 'utf8'));
const counts = validateSourceInventory(inventory);
const executable = path.join(root, 'target/debug', process.platform === 'win32' ? 'auralis-translation-cli.exe' : 'auralis-translation-cli');

let inspected = 0;
for (const source of inventory.sources) {
  if (source.state !== 'inspected_candidate') throw new Error(`${source.id}: this check requires inspected candidates only`);
  const result = spawnSync(executable, ['--json', 'inspect', path.join(root, source.local_candidate_path)], {
    cwd: root, encoding: 'utf8', timeout: 30_000, maxBuffer: 2 * 1024 * 1024, windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${source.id}: strict CLI inspection failed (status=${result.status}, error=${result.error?.message ?? 'none'})`);
  }
  const envelope = JSON.parse(result.stdout);
  const report = envelope.report?.report;
  if (envelope.command !== 'inspect' || envelope.report?.event !== 'report'
      || envelope.terminal?.event !== 'completed' || report?.format !== 'srt'
      || report.source_sha256 !== source.sha256 || report.segments?.length !== source.cue_count
      || report.segments.some((segment, index) => segment.id !== index + 1)) {
    throw new Error(`${source.id}: CLI source hash or ordered cue count differs from the non-admitted inventory`);
  }
  inspected += report.segments.length;
  console.log(`${source.id}: ${report.segments.length} strict SRT cues; source hash matched; rights unresolved`);
}
if (inspected !== counts.inspected_candidate_cues || counts.eligible_cues !== 0) {
  throw new Error('candidate counts changed or unapproved cues became eligible');
}
console.log(`Strict candidate inspection verified: ${inventory.sources.length} files, ${inspected} candidate cues, 0 eligible cues.`);
