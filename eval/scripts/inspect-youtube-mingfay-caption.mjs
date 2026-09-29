import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workspace = path.join(root, '.cache/eval/youtube-mingfay/caption-Vb3TuT');
const source = path.join(workspace, 'source.zh.srt');
const expectedSha256 = 'a875c0a84ab0c3a9b44a1b5a2be0c6f3d5b885ed82d241d386057c0dbd5ab436';
const bytes = await fs.readFile(source);
const sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, expectedSha256, 'retained caption bytes changed');
const blocks = bytes.toString('utf8').replace(/\r\n/g, '\n').trim().split(/\n\n+/);
const timePattern = /^(\d\d):(\d\d):(\d\d),(\d\d\d) --> (\d\d):(\d\d):(\d\d),(\d\d\d)$/;
const timestampMs = (hours, minutes, seconds, millis) =>
  (((Number(hours) * 60 + Number(minutes)) * 60 + Number(seconds)) * 1000 + Number(millis));
const cues = blocks.map((block, index) => {
  const lines = block.split('\n');
  assert(/^\d+$/.test(lines[0]), `block ${index + 1} lacks a numeric SRT label`);
  const match = timePattern.exec(lines[1] ?? '');
  assert(match, `block ${index + 1} lacks a strict SRT timestamp`);
  return { label: Number(lines[0]), start_ms: timestampMs(...match.slice(1, 5)),
    end_ms: timestampMs(...match.slice(5, 9)), text_lines: lines.slice(2),
    chinese_lines: lines.slice(2).filter(line => /[\p{Script=Han}]/u.test(line)).length,
    chinese_text: lines.slice(2).find(line => /[\p{Script=Han}]/u.test(line)) ?? null };
});
const retrograde = cues.flatMap((cue, index) => index > 0 && cue.start_ms < cues[index - 1].start_ms
  ? [{ previous_label: cues[index - 1].label, label: cue.label,
    previous_start_ms: cues[index - 1].start_ms, start_ms: cue.start_ms }] : []);
const duplicateFinalChineseLabels = cues.slice(0, -1)
  .filter(cue => cue.chinese_text === cues.at(-1).chinese_text)
  .map(cue => cue.label);
const executable = path.join(root, 'target/debug', process.platform === 'win32' ? 'auralis-translation-cli.exe' : 'auralis-translation-cli');
const strict = spawnSync(executable, ['--json', 'inspect', source], {
  cwd: root, encoding: 'utf8', timeout: 30_000, maxBuffer: 2 * 1024 * 1024, windowsHide: true,
});
const attempt = await fs.mkdtemp(path.join(workspace, 'inspection-'));
await fs.writeFile(path.join(attempt, 'strict-inspect-stdout.json'), strict.stdout ?? '');
await fs.writeFile(path.join(attempt, 'strict-inspect-stderr.txt'), strict.stderr ?? '');
let strictSummary;
try {
  const envelope = JSON.parse(strict.stdout);
  strictSummary = { command: envelope.command ?? null,
    terminal_event: envelope.terminal?.event ?? null,
    report_event: envelope.report?.event ?? null,
    format: envelope.report?.report?.format ?? null,
    parsed_cues: envelope.report?.report?.segments?.length ?? null,
    report_sha256: envelope.report?.report?.source_sha256 ?? null,
    error_code: envelope.terminal?.error?.code ?? envelope.error?.code ?? null };
} catch {
  strictSummary = { parse_error: 'CLI output is not one JSON envelope' };
}
const result = { experiment: 'DATA-03-youtube-mingfay-caption-inspect-2026-09-29-v1',
  source_sha256: sha256, source_bytes: bytes.length, block_count: cues.length,
  first: { label: cues[0].label, start_ms: cues[0].start_ms },
  middle: { label: cues[Math.floor(cues.length / 2)].label,
    start_ms: cues[Math.floor(cues.length / 2)].start_ms },
  last: { label: cues.at(-1).label, start_ms: cues.at(-1).start_ms },
  three_text_line_cues: cues.filter(cue => cue.text_lines.length === 3).length,
  one_chinese_line_cues: cues.filter(cue => cue.chinese_lines === 1).length,
  duplicate_final_chinese_labels: duplicateFinalChineseLabels,
  retrograde, strict: { exit_code: strict.status, signal: strict.signal,
    error: strict.error?.message ?? null, ...strictSummary } };
await fs.writeFile(path.join(attempt, 'inspection.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(`Caption inspection retained: ${attempt}`);
console.log(JSON.stringify(result, null, 2));
if (strict.error || strict.status !== 0) process.exitCode = 1;
