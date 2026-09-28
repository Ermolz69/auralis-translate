import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = async relative => fs.readFile(path.join(root, relative));
const index = JSON.parse(await read('eval/regressions/scene-pronoun-v1.json'));
const corpusBytes = await read('eval/corpora/scene-pronoun-regression-v1.json');
const firstBytes = await read('eval/reports/scene-context-smoke-2026-09-28.json');
const reportBytes = await read('eval/reports/scene-pronoun-regression-2026-09-28.json');
const repairBytes = await read('eval/reports/scene-number-repair-2026-09-28.json');
const corpus = JSON.parse(corpusBytes);
const first = JSON.parse(firstBytes);
const report = JSON.parse(reportBytes);
const repair = JSON.parse(repairBytes);

assert.equal(index.schema_version, 1);
assert.equal(index.id, 'REG-002');
assert.equal(index.status, 'open_semantic_unreviewed');
assert.equal(index.human_review, 'missing');
assert.equal(index.original_scene_report_sha256, digest(firstBytes));
assert.equal(index.regression_report_sha256, digest(reportBytes));
assert.equal(index.attempted_repair_report_sha256, digest(repairBytes));
assert.equal(index.regression_corpus_sha256, digest(corpusBytes));
assert.equal(index.scene_profile_sha256, report.profile_sha256.scene);
assert.equal(corpus.provenance, 'ai_authored_unreviewed');
assert.equal(corpus.split, 'development');
assert.deepEqual(corpus.cases.map(row => row.id), [index.reproduction_case_id, ...index.related_case_ids, ...index.negative_case_ids]);
assert.equal(new Set(corpus.cases.map(row => row.id)).size, corpus.cases.length);
assert.equal(report.status, 'passed_structural_probe');
assert.equal(report.failures.length, 0);
assert.equal(report.requests.length, 72);
assert.equal(report.requests.filter(request => request.path === '/v1/chat/completions').length, 24);
assert.equal(first.cases.find(row => row.id === 'p01').source_sha256, report.cases.find(row => row.id === 'r01').source_sha256);

const observed = new Map();
for (const row of corpus.cases) {
  const evidence = report.cases.find(candidate => candidate.id === row.id);
  assert(evidence, `missing ${row.id}`);
  assert.equal(evidence.target_id, row.relevant.before_zh.length + 1);
  assert.equal(evidence.arms.length, 2);
  assert.deepEqual(evidence.arms.map(arm => arm.arm), ['baseline', 'scene']);
  assert(evidence.arms.every(arm => arm.status.state === 'validated' && arm.offline_reexport === 'byte_identical'));
  const outputs = [];
  for (const arm of evidence.arms) {
    const active = `${row.id}:${arm.arm}`;
    const chats = report.requests.filter(request => request.arm === active && request.path === '/v1/chat/completions');
    assert.equal(chats.length, row.relevant.before_zh.length + row.relevant.after_zh.length + 1);
    const targetChat = chats.find(request => {
      const prompt = request.request.messages[0].content;
      const envelope = JSON.parse(prompt.split('Input JSON:\n')[1]);
      assert.equal(envelope.approved_terms.length, 0);
      assert(!prompt.includes(row.relevant.reference_ru), 'reference leaked into prompt');
      assert(!corpus.cases.some(other => prompt.includes(other.relevant.reference_ru)), 'another reference leaked into prompt');
      return envelope.target_slots[0].segment_id === evidence.target_id;
    });
    assert(targetChat?.raw_candidate, `missing raw target for ${active}`);
    const raw = JSON.parse(targetChat.raw_candidate).translations[0];
    assert.equal(raw.segment_id, evidence.target_id);
    assert.equal(raw.text, arm.accepted_target);
    outputs.push(arm.accepted_target);
    if (arm.arm === 'scene') {
      const tokenized = report.requests.filter(request => request.arm === active && request.path === '/tokenize');
      assert.equal(tokenized.length, chats.length);
      tokenized.forEach((measurement, position) => {
        assert.equal(measurement.token_count, chats[position].usage.prompt_tokens);
        assert(measurement.token_count + 256 + 64 <= 2048);
      });
    }
  }
  observed.set(row.id, outputs);
}
assert.deepEqual(observed.get('r01'), ['Пришло.', 'Прибыли.']);
assert.deepEqual(observed.get('r02'), ['Пришло.', 'Приехали.']);
assert.deepEqual(observed.get('r03'), ['Пришло.', 'Приехали.']);
assert.deepEqual(observed.get('r04'), ['Пришло.', 'Прибыли.']);
assert.equal(repair.corpus_sha256, report.corpus_sha256);
assert.equal(repair.status, 'passed_structural_probe');
assert.equal(repair.requests.length, 72);
assert.equal(repair.requests.filter(request => request.path === '/v1/chat/completions').length, 24);
assert.deepEqual(repair.cases.map(row => row.id), corpus.cases.map(row => row.id));
for (const row of repair.cases) {
  const old = report.cases.find(candidate => candidate.id === row.id);
  assert.equal(row.source_sha256, old.source_sha256);
  assert.deepEqual(row.arms.map(arm => arm.arm), ['baseline', 'scene']);
  assert(row.arms.every(arm => arm.offline_reexport === 'byte_identical'));
  for (const arm of row.arms) {
    const active = `${row.id}:${arm.arm}`;
    const chats = repair.requests.filter(request => request.arm === active && request.path === '/v1/chat/completions');
    assert.equal(chats.length, 3);
    const targetChat = chats.find(request => JSON.parse(request.request.messages[0].content.split('Input JSON:\n')[1]).target_slots[0].segment_id === row.target_id);
    assert(targetChat?.request.messages[0].content.includes('Preserve explicit singular or plural actors'));
    assert(!targetChat.request.messages[0].content.includes(corpus.cases.find(candidate => candidate.id === row.id).relevant.reference_ru));
    assert.equal(JSON.parse(targetChat.raw_candidate).translations[0].text, arm.accepted_target);
    if (arm.arm === 'scene') {
      const tokens = repair.requests.filter(request => request.arm === active && request.path === '/tokenize');
      assert.equal(tokens.length, chats.length);
      tokens.forEach((measurement, position) => assert.equal(measurement.token_count, chats[position].usage.prompt_tokens));
    }
  }
}
assert.deepEqual(repair.cases.slice(0, 3).map(row => row.arms[1].accepted_target), ['Приехали.', 'Приехали.', 'Прибыли.']);
assert.equal(repair.cases[3].arms[1].accepted_target, 'Прибыли.');
await fs.access(path.join(root, index.evidence_record));
console.log('REG-002 verified: original and failed prompt-repair singular/plural evidence retained with related and negative controls; no human acceptance claimed.');
