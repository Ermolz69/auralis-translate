import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const relative = file => path.relative(root, file).replaceAll('\\', '/');
const parent = path.join(root, '.cache/eval/reg-058-provisional-terms-v1');
const attempts = (await fs.readdir(parent)).filter(name => name.startsWith('attempt-'));
assert.equal(attempts.length, 1, 'Frozen experiment permits one attempt');
const attempt = path.join(parent, attempts[0]);
const privatePath = path.join(attempt, 'report.json');
const privateBytes = await fs.readFile(privatePath);
const raw = JSON.parse(privateBytes);
assert.equal(raw.experiment, 'reg-058-provisional-terms-v1');
assert.equal(raw.harness_sha256, digest(await fs.readFile(path.join(root,
  'eval/scripts/probe-reg-058-provisional-terms-v1.mjs'))));
assert.equal(raw.instruction_sha256, digest(Buffer.from(raw.instruction)));
assert.equal(raw.limits.chats_per_arm, 20);
assert.equal(raw.limits.preflights_per_arm, 40);
assert.equal(raw.limits.retries, 0);
const packBytes = await fs.readFile(path.join(root,
  'eval/regressions/v8-natural-7b-semantic-risk-v1.json'));
const controlsBytes = await fs.readFile(path.join(root,
  'eval/regressions/reg-058-provisional-terms-controls-v1.json'));
assert.equal(digest(packBytes), raw.expected.pack);
assert.equal(digest(controlsBytes), raw.expected.controls);
const pack = JSON.parse(packBytes);
const corpus = JSON.parse(controlsBytes);
assert.equal(corpus.split, 'authored_development_not_holdout');
assert.equal(corpus.controls.length, 10);
const priorBytes = await fs.readFile(path.join(root,
  '.cache/eval/v8-asus-single-target-v1/attempt-dVT3zA/report.json'));
assert.equal(digest(priorBytes), raw.expected.prior);
const prior = JSON.parse(priorBytes);
assert.equal(raw.arms.length, 1);
const arm = raw.arms[0];
assert.equal(arm.id, '7b');
assert.equal(arm.model_sha256,
  '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b');
assert.equal(arm.manifest_sha256,
  'a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc');
const journal = (await fs.readFile(path.join(attempt, '7b/requests.jsonl'), 'utf8'))
  .trim().split('\n').filter(Boolean).map(JSON.parse);
assert.equal(journal.length, arm.requests.length);
const order = corpus.controls.flatMap((control, index) =>
  (index % 2 === 0 ? ['baseline', 'terms'] : ['terms', 'baseline'])
    .map(variant => ({ control, variant })));
assert.deepEqual(journal.map(entry => [entry.control_id, entry.variant]),
  order.slice(0, journal.length).map(item => [item.control.id, item.variant]));

let preflights = 0;
const rows = [];
for (const [index, entry] of journal.entries()) {
  const { control, variant } = order[index];
  const caseRow = pack.minimal_reproducers.find(row => row.id === control.parent_id);
  assert(caseRow);
  const summary = arm.requests[index];
  assert.equal(entry.control_id, control.id);
  assert.equal(entry.case_id, caseRow.id);
  assert.equal(entry.role, control.role);
  assert.equal(entry.variant, variant);
  assert.equal(summary.control_id, control.id);
  assert.equal(summary.role, control.role);
  const original = prior.arms[1].requests.find(item =>
    item.request_kind === 'chat_completion' && item.segment_id === caseRow.cue_id);
  assert(original);
  assert.equal(entry.original_request_sha256, original.request_sha256);
  const request = JSON.parse(original.rendered_request);
  request.model = entry.request.model;
  const [head, input] = request.messages[0].content.split('Input JSON:\n');
  assert(head && input);
  const envelope = JSON.parse(input);
  assert.equal(envelope.target_slots.length, 1);
  assert.equal(envelope.target_slots[0].segment_id, caseRow.cue_id);
  assert.deepEqual(envelope.target_slots[0].approved_terms, []);
  assert.deepEqual(envelope.target_slots[0].protected_facts, []);
  envelope.target_slots[0].source_original = control.source;
  envelope.target_slots[0].source_for_translation = control.source;
  request.messages[0].content = `${head}${variant === 'terms' ? raw.instruction : ''}` +
    `Input JSON:\n${JSON.stringify(envelope)}`;
  assert.deepEqual(entry.request, request);
  assert(!JSON.stringify(request).includes(control.expected_meaning));
  assert.equal(entry.request_sha256, digest(Buffer.from(JSON.stringify(request))));
  assert.equal(summary.request_sha256, entry.request_sha256);
  for (const preflight of entry.preflight) {
    assert.equal(preflight.http_status, 200);
    assert.equal(digest(Buffer.from(preflight.raw_response)), preflight.raw_response_sha256);
  }
  if (entry.preflight.length === 2) {
    preflights += 2;
    const templateRequest = { model: request.model, messages: request.messages,
      response_format: request.response_format };
    assert.equal(entry.preflight[0].request_sha256,
      digest(Buffer.from(JSON.stringify(templateRequest))));
    const rendered = JSON.parse(entry.preflight[0].raw_response).prompt;
    const tokenizerRequest = { content: rendered, add_special: false,
      parse_special: true };
    assert.equal(entry.preflight[1].request_sha256,
      digest(Buffer.from(JSON.stringify(tokenizerRequest))));
    const tokens = JSON.parse(entry.preflight[1].raw_response).tokens;
    assert.equal(tokens.length, entry.prompt_tokens_preflight);
    assert(tokens.length + raw.limits.response_tokens + raw.limits.safety_tokens
      <= raw.limits.context_tokens);
    if (entry.usage) assert.equal(entry.usage.prompt_tokens, tokens.length);
  }
  let candidate = null;
  if (entry.chat) {
    assert.equal(entry.chat.request_sha256, entry.request_sha256);
    assert.equal(digest(Buffer.from(entry.chat.raw_response)), entry.chat.raw_response_sha256);
    assert.equal(summary.raw_response_sha256, entry.chat.raw_response_sha256);
    const response = JSON.parse(entry.chat.raw_response);
    assert.deepEqual(response.usage, entry.usage);
    assert.equal(response.choices?.[0]?.finish_reason, entry.finish_reason);
    if (entry.chat.http_status === 200 && entry.finish_reason === 'stop') {
      try {
        const translations = JSON.parse(response.choices[0].message.content).translations;
        assert.equal(translations.length, 1);
        assert.equal(translations[0].segment_id, caseRow.cue_id);
        assert.equal(translations[0].line_index, 0);
        assert(typeof translations[0].text === 'string' && translations[0].text.trim());
        assert(!/[{}\[\]]/.test(translations[0].text));
        candidate = translations[0].text;
      } catch { /* Retain malformed raw response as a failed control. */ }
    }
    assert.equal(entry.candidate ?? null, candidate);
    assert.equal(summary.candidate ?? null, candidate);
    assert.equal(entry.structural_outcome === 'accepted_structure_unreviewed_meaning',
      candidate !== null);
  }
  rows.push({ id: control.id, case_id: caseRow.id, role: control.role, variant,
    expected_meaning: control.expected_meaning, candidate,
    structural_outcome: entry.structural_outcome ?? 'aborted',
    request_sha256: entry.request_sha256,
    raw_response_sha256: entry.chat?.raw_response_sha256 ?? null,
    prompt_tokens: entry.usage?.prompt_tokens ?? null,
    completion_tokens: entry.usage?.completion_tokens ?? null,
    chat_elapsed_ms: entry.chat?.elapsed_ms ?? null });
}
if (raw.status === 'complete_responses_unreviewed') {
  assert.equal(journal.length, 20);
  assert.equal(preflights, 40);
}
const samples = arm.resources?.samples ?? [];
const report = { schema_version: 1, experiment: raw.experiment,
  status: raw.status === 'complete_responses_unreviewed' ?
    'paired_real_model_terms_screen_validated_unreviewed_meaning' :
    'incomplete_real_model_terms_screen_retained',
  split: corpus.split,
  private_report: relative(privatePath),
  private_report_sha256: digest(privateBytes),
  harness_sha256: raw.harness_sha256,
  controls_sha256: raw.expected.controls,
  prior_natural_report_sha256: raw.expected.prior,
  runtime_sha256: raw.expected.runtime,
  model_sha256: arm.model_sha256,
  manifest_sha256: arm.manifest_sha256,
  instruction_sha256: raw.instruction_sha256,
  code_commit: raw.code_commit,
  wall_elapsed_ms: raw.wall_elapsed_ms,
  chats: journal.length, preflights,
  sampled_max_process_working_set_bytes: Math.max(0, ...samples.flatMap(sample =>
    sample.processes.map(process => process.WorkingSet64))),
  sampled_max_device_gpu_mib: Math.max(0, ...samples.map(sample =>
    Number(sample.gpu_device.split(', ')[1]))),
  human_bilingual_review_count: 0,
  meaning_assessment: 'pending_separate_AI_review',
  rows, release_gate: 'open' };
const publicPath = path.join(root,
  'eval/reports/2026-10-02-reg-058-provisional-terms-v1.json');
const output = `${JSON.stringify(report, null, 2)}\n`;
if (write) await fs.writeFile(publicPath, output);
else assert.equal(await fs.readFile(publicPath, 'utf8'), output);
console.log(`REG-058 provisional terms: ${journal.length} chats and ${preflights} preflights verified.`);
