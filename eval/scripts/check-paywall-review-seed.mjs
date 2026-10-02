import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { countSourceTextSlots } from './source-slot-budget.mjs';
import { ambiguousRussianDigitGrouping,
  sourceAliasMissing } from './source-surface-triage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const capture = process.argv[2] === '--capture';
assert.equal(process.argv.length, capture ? 3 : 2,
  'Use no arguments or --capture');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const expectedSource = '3406fcd365446d727f31c4ecf576de6c3b5e168658c3f5d276fea8142ddb5a4b';
const windows = [['amount', 15, 18, 5], ['peer-review', 465, 468, 5],
  ['closing', 861, 864, 6]];
const source = await fs.readFile(path.join(root,
  '.cache/eval/paywall-chinese-caption/source.zh.srt'));
assert.equal(sha256(source), expectedSource);
const blocks = source.toString('utf8').trimEnd().split(/\n\n+/u);
assert.equal(blocks.length, 880);
const selected = windows.flatMap(([, first, last]) =>
  blocks.slice(first - 1, last));
assert.deepEqual(countSourceTextSlots(selected), { cues: 12, text_slots: 16 });
for (const [id, first, last, slots] of windows) {
  const selectedBlocks = blocks.slice(first - 1, last);
  assert.equal(countSourceTextSlots(selectedBlocks).text_slots, slots, id);
}

const pinnedReports = {
  '1b': { directory: 'run-0uz6uR',
    sha256: '4be2d6f641338e5690ad4a3c8cf9ab2e3f908ec61ecfbbde2a90def3981af3eb',
    model_alias: 'auralis-hy-mt2-1.8b-q4' },
  '7b': { directory: 'run-y7vfu5',
    sha256: 'bf68b06e7c69eb68e677f2c6ba447e01cde04e4dd1527155a4a366131e68b0fa',
    model_alias: 'auralis-hy-mt2-7b-q4' },
};
const variants = [];
const rawChats = [];
for (const variant of ['1b', '7b']) {
  const pin = pinnedReports[variant];
  const workspace = path.join(root,
    `.cache/eval/paywall-review-seed-${variant}-v1/${pin.directory}`);
  const reportBytes = await fs.readFile(path.join(workspace, 'report.json'));
  assert.equal(sha256(reportBytes), pin.sha256, `${variant}: report changed`);
  const report = JSON.parse(reportBytes);
  const journalBytes = await fs.readFile(path.join(workspace, 'journal-check.json'));
  const journal = JSON.parse(journalBytes);
  assert.equal(report.experiment,
    `DATA-03-paywall-bilingual-review-seed-${variant}-v1`);
  assert.equal(report.status, 'passed_structural_probe');
  assert.equal(report.model_variant, variant);
  assert.equal(report.source_sha256, expectedSource);
  assert.equal(report.revision, 'ede3ae878bacfd0b3b8f3dee15e89ab74e17d7d2');
  assert.equal(report.limits.source_cues, 12);
  assert.equal(report.limits.chat_requests, 16);
  assert.equal(report.limits.all_http_requests, 64);
  assert.equal(report.limits.whole_run_retries, 0);
  assert.equal(report.failures.length, 0);
  assert.equal(journal.status, 'passed');
  assert.equal(journal.report_sha256, pin.sha256);
  assert.equal(journal.checked.length, 3);
  const profilePath = path.join(root,
    `models/manifests/hy_mt2_${variant === '1b' ? '1_8b' : '7b'}_q4_k_m.context_v5_scene.experimental.json`);
  const profileBytes = await fs.readFile(profilePath);
  const profile = JSON.parse(profileBytes);
  assert.equal(sha256(profileBytes), report.profile_sha256);
  assert.equal(profile.prompt_template_sha256,
    'af6ebaa8af4ff777aeb313c0e4496998c898701df07809c7691d4fe2717b959c');
  const doctor = JSON.parse(report.doctor);
  assert.equal(doctor.verified, true);
  assert.equal(doctor.model_sha256, profile.model_file_sha256);
  assert.equal(doctor.model_bytes, profile.model_file_bytes);
  assert.equal(doctor.model_alias, pin.model_alias);
  assert.equal(report.model_sha256_verified_by_doctor, doctor.model_sha256);
  assert.equal(report.cases.length, 3);
  const sourceWindows = [];
  const outputWindows = [];
  for (const [index, row] of report.cases.entries()) {
    const [id, first, last, slots] = windows[index];
    assert.equal(row.id, id);
    assert.deepEqual(row.original_cue_ids, [first, first + 1, first + 2, last]);
    assert.equal(row.arms.length, 1);
    assert.equal(row.arms[0].status.state, 'validated');
    assert.equal(row.arms[0].accepted_lines.length, 4);
    assert.equal(row.arms[0].offline_reexport, 'byte_identical');
    const expectedSubset = Buffer.from(`${blocks.slice(first - 1, last).join('\n\n')}\n`);
    const actualSubset = await fs.readFile(row.source_path);
    assert(actualSubset.equals(expectedSubset));
    assert.equal(sha256(actualSubset), row.source_sha256);
    const translated = await fs.readFile(path.join(workspace,
      id, 'scene', 'candidate.ru.srt'));
    const reexport = await fs.readFile(path.join(workspace,
      id, 'scene', 'offline.ru.srt'));
    assert.equal(sha256(translated), row.arms[0].output_sha256);
    assert(translated.equals(reexport));
    assert.equal(journal.checked[index].arm, `${id}:scene`);
    assert.equal(journal.checked[index].chats, slots);
    assert.equal(journal.checked[index].preflights, 2 * slots);
    assert.equal(journal.checked[index].run_id, row.arms[0].run_id);
    sourceWindows.push({ id, cue_ids: row.original_cue_ids,
      source_sha256: row.source_sha256, text_slots: slots });
    outputWindows.push({ id, output_sha256: row.arms[0].output_sha256 });
  }
  const chats = report.requests.filter(item => item.path === '/v1/chat/completions');
  const preflights = report.requests.filter(item =>
    item.path === '/apply-template' || item.path === '/tokenize');
  assert.equal(chats.length, 16);
  assert.equal(preflights.length, 32);
  assert.equal(report.requests.length, 57);
  assert.equal(report.requests.filter(item => item.error).length, 0);
  assert.equal(chats.reduce((sum, item) => sum + item.usage.prompt_tokens, 0),
    variant === '1b' ? 4441 : 4434);
  assert.equal(chats.reduce((sum, item) => sum + item.usage.completion_tokens, 0),
    variant === '1b' ? 763 : 764);
  assert(chats.every(item => item.http_status === 200
    && item.raw_response && item.raw_candidate
    && item.usage?.total_tokens === item.usage.prompt_tokens
      + item.usage.completion_tokens));
  for (const item of chats) {
    const content = item.request.messages[0].content;
    const sourcePayload = JSON.parse(content.split('Input JSON:\n')[1]);
    assert.deepEqual(Object.keys(sourcePayload).sort(),
      ['approved_terms', 'protected_facts', 'schema_version',
        'source_context', 'target_slots'].sort());
    assert.equal(sourcePayload.target_slots.length, 1);
    assert.equal(item.request.model, pin.model_alias);
    assert.equal(item.request.max_tokens, 256);
  }
  rawChats.push(chats.map(item => ({ arm: item.arm,
    request: { ...item.request, model: '<model alias>' } })));
  const samples = report.resource_samples.filter(item =>
    Number.isSafeInteger(item.working_set_bytes));
  const gpu = report.resource_samples.map(item =>
    Number.parseInt(String(item.gpu ?? '').split(',')[0], 10))
    .filter(Number.isFinite);
  assert(samples.length > 0 && gpu.length > 0);
  const accepted = new Map(report.cases.flatMap(row =>
    row.original_cue_ids.map((id, index) =>
      [id, row.arms[0].accepted_lines[index]])));
  assert.equal(accepted.size, 12);
  const source861 = blocks[860].split('\n').slice(2).join('\n');
  const aliasMissing = sourceAliasMissing({ source: source861,
    translation: accepted.get(861), sourceName: '愛思唯爾',
    acceptedForms: ['Elsevier', 'Эльзевир'] });
  assert.equal(aliasMissing, variant === '1b');
  const digitRisk = ambiguousRussianDigitGrouping(accepted.get(17));
  assert.equal(digitRisk, true);
  variants.push({ model: variant, model_sha256: doctor.model_sha256,
    model_revision: profile.model_revision,
    profile_sha256: report.profile_sha256,
    prompt_template_sha256: profile.prompt_template_sha256,
    cli_sha256: report.cli_sha256, runtime_sha256: report.runtime_sha256,
    report_sha256: pin.sha256, journal_sha256: sha256(journalBytes),
    windows: outputWindows, accepted_cues: 12, text_slots: 16,
    chat_requests: chats.length, preflight_requests: preflights.length,
    all_http_requests: report.requests.length,
    prompt_tokens: chats.reduce((sum, item) => sum + item.usage.prompt_tokens, 0),
    completion_tokens: chats.reduce((sum, item) =>
      sum + item.usage.completion_tokens, 0),
    chat_http_ms: Math.round(chats.reduce((sum, item) => sum + item.elapsed_ms, 0)),
    translation_command_ms: Math.round(report.cases.reduce((sum, row) =>
      sum + row.arms[0].elapsed_ms, 0)),
    total_run_ms: Date.parse(report.finished_at) - Date.parse(report.started_at),
    sampled_process_rss_peak_bytes: Math.max(...samples.map(item =>
      item.working_set_bytes)),
    sampled_device_gpu_used_peak_mib: Math.max(...gpu),
    source_alias_missing_at_861: aliasMissing,
    ambiguous_number_grouping_at_17: digitRisk,
    human_reviewed_cues: 0,
  });
}
assert.deepEqual(rawChats[0], rawChats[1],
  'Models did not receive identical source and sampling requests');
assert.equal(variants[0].cli_sha256, variants[1].cli_sha256);
assert.equal(variants[0].runtime_sha256, variants[1].runtime_sha256);
const summary = {
  schema_version: 1,
  experiment: 'DATA-03-paywall-bilingual-review-seed-v1',
  source_id: 'paywall-chinese-4b4ffc0c',
  source_sha256: expectedSource,
  source_windows: windows.map(([id, first, last, textSlots]) =>
    ({ id, cue_ids: [first, first + 1, first + 2, last], text_slots: textSlots })),
  source_cues: 12, source_text_slots: 16,
  model_request_projection_identical: true,
  subtitle_rights: 'approved_CC_BY_4_0',
  film_speech_language: 'English_per_archive_catalog',
  source_admission: 'unassigned_unreviewed',
  reference_rights: 'unknown',
  expected_meaning_not_sent_to_model: true,
  predeclared_call_budget_correction: '16 text slots consumed all 16 chat calls; the plan had incorrectly described 12 calls plus four possible retries',
  variants,
  ai_surface_triage: {
    reg_047: '1.8B cue 861 omits the source company name and repeats following-cue business content; 7B retains the name. Human adequacy unscored.',
    reg_048: 'Both cue 17 outputs use 10,702 with a comma in Russian; this is a numeric reading risk, not a scored meaning error.',
  },
  selected_model: null,
  independent_human_reviewed_cues: 0,
  listened_cues: 0,
  release_gate: 'open',
};
const serialized = `${JSON.stringify(summary, null, 2)}\n`;
const publicPath = path.join(root, 'eval/reports/paywall-review-seed-v1.json');
if (capture) {
  await fs.writeFile(publicPath, serialized, { flag: 'wx' });
} else {
  assert.equal(await fs.readFile(publicPath, 'utf8'), serialized,
    'Redacted Paywall screen summary changed');
}
console.log('Paywall matched screen verified: 12 cues/16 text slots per model, 16 raw chats and 32 durable preflights each; no human score.');
