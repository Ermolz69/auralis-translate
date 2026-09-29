import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSourceInventory } from './source-inventory.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const inventory = JSON.parse(await readFile(path.join(root, 'eval/corpora/commons-cc-commerce-candidate-v1.json'), 'utf8'));
const counts = validateSourceInventory(inventory);
if (counts.source_count !== 1 || counts.inspected_candidate_cues !== 123 || counts.eligible_cues !== 0) {
  throw new Error('CC commerce candidate eligibility or count changed');
}
const source = inventory.sources[0];
const executable = path.join(root, 'target/debug', process.platform === 'win32' ? 'auralis-translation-cli.exe' : 'auralis-translation-cli');
const result = spawnSync(executable, ['--json', 'inspect', path.join(root, source.local_candidate_path)], {
  cwd: root, encoding: 'utf8', timeout: 30_000, maxBuffer: 2 * 1024 * 1024, windowsHide: true,
});
if (result.error || result.status !== 0) {
  throw new Error(`Strict candidate inspection failed (status=${result.status}, error=${result.error?.message ?? 'none'})`);
}
const envelope = JSON.parse(result.stdout);
const report = envelope.report?.report;
if (envelope.command !== 'inspect' || envelope.report?.event !== 'report'
    || envelope.terminal?.event !== 'completed' || report?.format !== 'srt'
    || report.source_sha256 !== source.sha256 || report.segments?.length !== source.cue_count
    || report.segments.some((segment, index) => segment.id !== index + 1)) {
  throw new Error('Pinned CC commerce source hash or ordered cue mapping differs');
}
console.log(`CC commerce candidate: ${report.segments.length} strict SRT cues; sha256=${source.sha256}; 0 admitted.`);
