import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { courierActionPreserved, farewellPreserved } from '../natural-caption-fact-diagnostics.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const packs = await Promise.all(['natural-courier-substitution-v1.json',
  'natural-farewell-invention-v1.json'].map(async filename =>
  JSON.parse(await fs.readFile(path.join(root, 'eval/regressions', filename), 'utf8'))));
const summary = await fs.readFile(path.join(root, 'eval/reports/2026-09-29-mingfay-natural-summary.json'));

test('REG-018 and REG-019 retain a public redacted source identity and distinct controls', () => {
  assert.deepEqual(packs.map(pack => pack.id), ['REG-018', 'REG-019']);
  for (const pack of packs) {
    assert.equal(pack.source_summary_sha256, sha256(summary));
    assert.equal(pack.related_controls.length, 3);
    assert.equal(pack.negative_controls.length, 3);
    assert.equal(pack.human_review, 'missing');
    assert.equal(pack.release_gate, 'open');
    assert.equal(pack.private_reproducer.report_sha256,
      '7f5d5ffa72584e689ce432508efb2044aad24c7e8acf18c67279dd46e9646f0f');
  }
});

test('authored courier controls distinguish delivery from an actual taxi', () => {
  const pack = packs[0];
  for (const control of [...pack.related_controls, ...pack.negative_controls]) {
    assert.equal(courierActionPreserved(control.source_zh, control.candidate_ru),
      control.expected_preserved, control.id);
  }
});

test('authored farewell controls allow an actual bookmaker source', () => {
  const pack = packs[1];
  for (const control of [...pack.related_controls, ...pack.negative_controls]) {
    assert.equal(farewellPreserved(control.source_zh, control.candidate_ru),
      control.expected_preserved, control.id);
  }
});

test('private exact reproductions retain source, raw response and accepted output', {
  skip: process.env.AURALIS_REQUIRE_PRIVATE_NATURAL !== '1',
}, async () => {
  const rawPath = path.join(root, '.cache/eval/youtube-mingfay-derived/source.zh.srt');
  const rawBytes = await fs.readFile(rawPath);
  assert.equal(sha256(rawBytes), '42109fc054cba93b0ef343853628b6a248b31664786d579bdefa415ccaacf9ee');
  const blocks = rawBytes.toString('utf8').trimEnd().split(/\n\n+/);
  for (const [index, pack] of packs.entries()) {
    const repro = pack.private_reproducer;
    const reportBytes = await fs.readFile(path.join(root, repro.report_locator));
    assert.equal(sha256(reportBytes), repro.report_sha256);
    const report = JSON.parse(reportBytes);
    const row = report.cases.find(item => item.id === repro.window);
    assert(row && row.original_cue_ids.includes(repro.cue_id));
    assert.equal(row.source_sha256, repro.window_source_sha256);
    const sourceZh = blocks[repro.cue_id - 1].split('\n')[2];
    const cueIndex = row.original_cue_ids.indexOf(repro.cue_id);
    const accepted = row.arms[0].accepted_lines[cueIndex];
    assert.equal(sha256(Buffer.from(accepted)), repro.accepted_text_sha256);
    const requests = report.requests.filter(entry => entry.arm === `${row.id}:scene`
      && entry.path === '/v1/chat/completions');
    const request = requests[cueIndex];
    assert.equal(request.request_sha256, repro.request_sha256);
    assert.equal(sha256(Buffer.from(request.raw_candidate)), repro.raw_candidate_sha256);
    assert.equal(index === 0 ? courierActionPreserved(sourceZh, accepted)
      : farewellPreserved(sourceZh, accepted), false);
  }
});
