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
const parent = path.join(root, '.cache/eval/reg-058-semantic-instruction-v1');
const attempts = (await fs.readdir(parent)).filter(name => name.startsWith('attempt-'));
assert.equal(attempts.length, 1, 'The frozen screen allows exactly one attempt');
const attempt = path.join(parent, attempts[0]);
const privatePath = path.join(attempt, 'report.json');
const privateBytes = await fs.readFile(privatePath);
const raw = JSON.parse(privateBytes);
assert.equal(raw.experiment, 'reg-058-semantic-instruction-v1');
assert.equal(raw.harness_sha256, digest(await fs.readFile(path.join(root,
  'eval/scripts/probe-reg-058-semantic-instruction-v1.mjs'))));
assert.equal(digest(Buffer.from(raw.instruction)), raw.instruction_sha256);
assert.equal(raw.instruction_sha256,
  '3985d15da5091d5bacd95a86129f2fcf3527cc81732b5c1b283eb465f1a0f7ae');
const packBytes = await fs.readFile(path.join(root,
  'eval/regressions/v8-natural-7b-semantic-risk-v1.json'));
const extraBytes = await fs.readFile(path.join(root,
  'eval/regressions/reg-058-semantic-instruction-controls-v1.json'));
assert.equal(digest(packBytes), raw.expected.pack);
assert.equal(digest(extraBytes), raw.expected.extra);
const pack = JSON.parse(packBytes);
const extra = JSON.parse(extraBytes);
const priorBytes = await fs.readFile(path.join(root,
  '.cache/eval/v8-asus-single-target-v1/attempt-dVT3zA/report.json'));
assert.equal(digest(priorBytes), raw.expected.prior);
const prior = JSON.parse(priorBytes);
const controls = new Map([...pack.related_controls, ...pack.negative_controls,
  ...extra.extra_controls].map(row => [row.id, row]));
assert.equal(controls.size, 18);
assert.equal(raw.limits.chats_per_arm, 36);
assert.equal(raw.limits.preflights_per_arm, 72);
assert.equal(raw.limits.retries, 0);
assert(raw.arms.length <= 1);
const arm = raw.arms[0];
assert(arm);
assert.equal(arm.id, '7b');
assert.equal(arm.model_sha256,
  '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b');
assert.equal(arm.manifest_sha256,
  'a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc');
const journal = (await fs.readFile(path.join(attempt, '7b/requests.jsonl'), 'utf8'))
  .trim().split('\n').filter(Boolean).map(JSON.parse);
assert.equal(journal.length, arm.requests.length);
let controlIndex = 0;
const order = pack.minimal_reproducers.flatMap((caseRow, index) => {
  const polarities = index % 2 === 0 ? ['positive', 'negative', 'extra']
    : ['negative', 'positive', 'extra'];
  return polarities.flatMap(polarity => {
    const selected = polarity === 'positive' ? pack.related_controls.find(row =>
      row.for === caseRow.id) : polarity === 'negative' ?
      pack.negative_controls.find(row => row.for === caseRow.id) :
      extra.extra_controls.find(row => row.for === caseRow.id);
    assert(selected);
    const variants = controlIndex++ % 2 === 0 ? ['baseline', 'instruction']
      : ['instruction', 'baseline'];
    return variants.map(variant => ({ caseRow, control: selected, polarity, variant }));
  });
});
assert.equal(order.length, 36);
assert.deepEqual(journal.map(entry => [entry.control_id, entry.variant]),
  order.slice(0, journal.length).map(item => [item.control.id, item.variant]));

let promptTokens = 0;
let completionTokens = 0;
let preflights = 0;
const rows = [];
for (const [index, entry] of journal.entries()) {
  const { caseRow, control, polarity, variant } = order[index];
  const summary = arm.requests[index];
  assert.equal(entry.case_id, caseRow.id);
  assert.equal(entry.cue_id, caseRow.cue_id);
  assert.equal(entry.polarity, polarity);
  assert.equal(entry.variant, variant);
  assert.equal(summary.control_id, control.id);
  assert.equal(summary.variant, variant);
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
  request.messages[0].content = `${head}${variant === 'instruction' ? raw.instruction : ''}` +
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
    assert(Array.isArray(tokens) && tokens.every(Number.isInteger));
    assert.equal(tokens.length, entry.prompt_tokens_preflight);
    assert(tokens.length + raw.limits.response_tokens + raw.limits.safety_tokens
      <= raw.limits.context_tokens);
    if (entry.usage) assert.equal(entry.usage.prompt_tokens, tokens.length);
  }
  if (entry.chat) {
    assert.equal(entry.chat.request_sha256, entry.request_sha256);
    assert.equal(digest(Buffer.from(entry.chat.raw_response)), entry.chat.raw_response_sha256);
    assert.equal(summary.raw_response_sha256, entry.chat.raw_response_sha256);
    const response = JSON.parse(entry.chat.raw_response);
    assert.equal(response.choices?.[0]?.finish_reason, entry.finish_reason);
    assert.deepEqual(response.usage, entry.usage);
    if (entry.usage) {
      promptTokens += entry.usage.prompt_tokens;
      completionTokens += entry.usage.completion_tokens;
    }
    let candidate = null;
    if (entry.chat.http_status === 200 && entry.finish_reason === 'stop') {
      try {
        const translations = JSON.parse(response.choices[0].message.content).translations;
        assert.equal(translations.length, 1);
        assert.equal(translations[0].segment_id, caseRow.cue_id);
        assert.equal(translations[0].line_index, 0);
        assert(typeof translations[0].text === 'string' && translations[0].text.trim());
        assert(!/[{}\[\]]/.test(translations[0].text));
        candidate = translations[0].text;
      } catch { /* A malformed candidate is recorded as a failed control. */ }
    }
    assert.equal(entry.candidate ?? null, candidate);
    assert.equal(summary.candidate ?? null, candidate);
    assert.equal(entry.structural_outcome === 'accepted_structure_unreviewed_meaning',
      candidate !== null);
  }
  rows.push({ id: control.id, case_id: caseRow.id, variant, polarity,
    expected_meaning: control.expected_meaning, candidate: entry.candidate ?? null,
    structural_outcome: entry.structural_outcome ?? 'aborted',
    request_sha256: entry.request_sha256,
    raw_response_sha256: entry.chat?.raw_response_sha256 ?? null,
    prompt_tokens: entry.usage?.prompt_tokens ?? null,
    completion_tokens: entry.usage?.completion_tokens ?? null,
    chat_elapsed_ms: entry.chat?.elapsed_ms ?? null,
    finish_reason: entry.finish_reason ?? null });
}
if (raw.status === 'complete_responses_unreviewed') {
  assert.equal(journal.length, 36);
  assert.equal(preflights, 72);
}
const samples = arm.resources?.samples ?? [];
const report = { schema_version: 1, experiment: raw.experiment,
  status: raw.status === 'complete_responses_unreviewed' ?
    'paired_real_model_prompt_screen_validated_unreviewed_meaning' :
    'incomplete_real_model_prompt_screen_retained',
  split: 'authored_development_not_holdout',
  private_report: relative(privatePath),
  private_report_sha256: digest(privateBytes),
  harness_sha256: raw.harness_sha256,
  parent_pack_sha256: raw.expected.pack,
  extra_controls_sha256: raw.expected.extra,
  prior_natural_report_sha256: raw.expected.prior,
  runtime_sha256: raw.expected.runtime,
  model_sha256: arm.model_sha256,
  manifest_sha256: arm.manifest_sha256,
  instruction_sha256: raw.instruction_sha256,
  code_commit: raw.code_commit,
  wall_elapsed_ms: raw.wall_elapsed_ms,
  chats: journal.length, preflights, prompt_tokens: promptTokens,
  completion_tokens: completionTokens,
  sampled_max_process_working_set_bytes: Math.max(0, ...samples.flatMap(sample =>
    sample.processes.map(process => process.WorkingSet64))),
  sampled_max_device_gpu_mib: Math.max(0, ...samples.map(sample =>
    Number(sample.gpu_device.split(', ')[1]))),
  paired_case_comparison_valid: journal.length === 36 && preflights === 72,
  population_quality_comparison_valid: false,
  meaning_assessment: 'pending_separate_AI_review',
  human_bilingual_review_count: 0,
  rows, release_gate: 'open' };
const publicPath = path.join(root,
  'eval/reports/2026-10-02-reg-058-semantic-instruction-v1.json');
const output = `${JSON.stringify(report, null, 2)}\n`;
if (write) await fs.writeFile(publicPath, output);
else assert.equal(await fs.readFile(publicPath, 'utf8'), output);
console.log(`REG-058 instruction: ${journal.length} raw chats and ${preflights} preflights verified.`);
