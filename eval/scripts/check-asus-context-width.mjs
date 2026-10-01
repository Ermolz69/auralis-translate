import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const workspace = path.join(root, '.cache/eval/asus-context-width-paired-v1/run-X4grxy');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const reportBytes = fs.readFileSync(path.join(workspace, 'report.json'));
const journalBytes = fs.readFileSync(path.join(workspace, 'requests.jsonl'));
assert.equal(sha256(reportBytes), '2774488568d7eebc993616bb107a6aa76cf8f9ca6ea99f7438b915fa6968c7c9');
assert.equal(sha256(journalBytes), '18926c366346ebb4805abb23bf2e8108c2bf5378021f58e4b793d2b14a8336d6');
const report = JSON.parse(reportBytes);
assert.equal(report.id, 'asus-context-width-paired-v1');
assert.equal(report.status, 'complete_with_failures_unreviewed');
assert.equal(report.git_head, 'd51b957785a36b88a007232c05e4efa1695a32e4');
assert.equal(report.identity.source, '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b');
assert.equal(report.identity.archive, '1d8addf0860cb88f0161ac6eeed3fc45351ab9912aaf0eff2b39a76772a26413');
assert.equal(report.identity.packet, 'da15e4cf479513ba1a41fc5e86f7802e6531e7c51c5a855e30f675d533485a6a');
assert.equal(report.identity.runtime, '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
assert.equal(report.harness_sha256,
  sha256(fs.readFileSync(path.join(root, 'eval/scripts/probe-asus-context-width.mjs'))));
assert.deepEqual(report.focus_ids, [2, 3, 12, 20, 91, 133, 142, 226, 227, 242, 267]);
assert.deepEqual(report.seeds, [101, 202]);
assert.deepEqual(report.widths, [1, 3]);
assert.equal(report.limits.chats, 88);
assert.equal(report.limits.preflights, 176);
assert.equal(report.limits.total_http, 264);
assert.equal(report.limits.retries, 0);
assert.equal(report.human_review_count, 0);
assert.deepEqual(report.failures, []);
assert.equal(report.requests.length, 88);
assert.equal(report.planned_requests.length, 88);
assert(report.wall_elapsed_ms <= report.limits.wall_ms);
const entries = journalBytes.toString('utf8').trimEnd().split('\n').map(line => JSON.parse(line));
assert.equal(entries.length, 88);
const marker = 'Input JSON:\n';
for (const [index, entry] of entries.entries()) {
  const summary = report.requests[index];
  const planned = report.planned_requests[index];
  for (const field of ['model', 'seed', 'cue_id', 'width', 'request_sha256', 'prompt_sha256']) {
    assert.equal(entry[field], planned[field]);
    assert.equal(summary[field], planned[field]);
  }
  assert.equal(entry.request_sha256, sha256(Buffer.from(JSON.stringify(entry.request))));
  assert.equal(entry.prompt_sha256, sha256(Buffer.from(entry.request.messages[0].content)));
  assert.doesNotMatch(entry.request.messages[0].content, /\p{Script=Cyrillic}/u);
  const envelope = JSON.parse(entry.request.messages[0].content.split(marker)[1]);
  assert.equal(envelope.target_slots.length, 1);
  assert.equal(envelope.target_slots[0].segment_id, entry.cue_id);
  assert.equal(envelope.approved_terms.length, 0);
  assert.equal(entry.request.response_format.schema.properties.translations.items
    .properties.segment_id.const, entry.cue_id);
  const allowed = [];
  for (let id = Math.max(1, entry.cue_id - entry.width);
    id <= Math.min(268, entry.cue_id + entry.width); id++)
    if (id !== entry.cue_id) allowed.push(id);
  assert.deepEqual(envelope.source_context.map(cue => cue.segment_id), allowed);
  assert.equal(entry.preflight.length, 2);
  const [template, tokenized] = entry.preflight;
  assert.deepEqual([template.path, tokenized.path], ['/apply-template', '/tokenize']);
  for (const preflight of entry.preflight) {
    assert.equal(preflight.http_status, 200);
    assert.equal(preflight.request_sha256, sha256(Buffer.from(JSON.stringify(preflight.request))));
    assert.equal(preflight.raw_response_sha256, sha256(Buffer.from(preflight.raw_response)));
  }
  assert.deepEqual(template.request.messages, entry.request.messages);
  assert.deepEqual(template.request.response_format, entry.request.response_format);
  const rendered = JSON.parse(template.raw_response).prompt;
  assert.equal(tokenized.request.content, rendered);
  const tokens = JSON.parse(tokenized.raw_response).tokens;
  assert(Array.isArray(tokens) && tokens.length > 0);
  assert.equal(tokens.length, entry.prompt_tokens_preflight);
  assert.equal(tokens.length, entry.usage.prompt_tokens);
  assert(tokens.length <= 1728);
  assert.equal(summary.prompt_tokens_preflight, tokens.length);
  assert.equal(entry.http_status, 200);
  assert.equal(entry.raw_response_sha256, sha256(Buffer.from(entry.raw_response)));
  const chat = JSON.parse(entry.raw_response);
  assert.equal(chat.choices[0].message.content, entry.raw_candidate);
  assert.equal(chat.choices[0].finish_reason, entry.finish_reason);
  assert.deepEqual(chat.usage, entry.usage);
  assert.equal(summary.structural_outcome, entry.structural_outcome);
  assert.equal(summary.raw_response_sha256, entry.raw_response_sha256);
  if (entry.structural_outcome === 'outer_json_valid_unreviewed') {
    const rows = JSON.parse(entry.raw_candidate).translations;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].segment_id, entry.cue_id);
    assert.equal(rows[0].line_index, 0);
    assert.equal(rows[0].text, entry.parsed_candidate);
    assert.equal(summary.parsed_candidate, entry.parsed_candidate);
  } else {
    assert.equal(entry.model, '7b');
    assert.equal(entry.seed, 101);
    assert.equal(entry.cue_id, 227);
    assert.equal(entry.width, 1);
    assert.equal(entry.finish_reason, 'length');
    assert.equal(entry.usage.completion_tokens, 256);
    assert.equal(summary.parsed_candidate, null);
  }
}
assert.equal(entries.filter(row => row.structural_outcome === 'outer_json_valid_unreviewed').length, 87);
assert(report.resources['1b'].samples.length > 0);
assert(report.resources['7b'].samples.length > 0);
const summary = Object.fromEntries(['1b', '7b'].map(model => [model,
  Object.fromEntries([1, 3].map(width => {
    const rows = entries.filter(entry => entry.model === model && entry.width === width);
    assert.equal(rows.length, 22);
    return [width, {
      outer_valid: rows.filter(row => row.structural_outcome === 'outer_json_valid_unreviewed').length,
      prompt_tokens: rows.reduce((sum, row) => sum + row.usage.prompt_tokens, 0),
      completion_tokens: rows.reduce((sum, row) => sum + row.usage.completion_tokens, 0),
      chat_elapsed_ms: rows.reduce((sum, row) => sum + row.chat_elapsed_ms, 0),
      max_prompt_tokens: Math.max(...rows.map(row => row.usage.prompt_tokens)),
    }];
  }))]));
const publicReport = JSON.parse(fs.readFileSync(path.join(root,
  'eval/reports/asus-context-width-paired-v1.json')));
assert.equal(publicReport.id, report.id);
assert.equal(publicReport.status, 'development_screen_unreviewed');
assert.equal(publicReport.source_sha256, report.identity.source);
assert.equal(publicReport.private_report_sha256, sha256(reportBytes));
assert.equal(publicReport.private_journal_sha256, sha256(journalBytes));
assert.equal(publicReport.runtime_sha256, report.identity.runtime);
assert.deepEqual(publicReport.focus_cue_ids, report.focus_ids);
assert.deepEqual(publicReport.seeds, report.seeds);
assert.deepEqual(publicReport.context_widths, report.widths);
assert.equal(publicReport.preflight_requests, 176);
assert.equal(publicReport.chat_requests, entries.length);
assert.equal(publicReport.measured_http_requests, entries.length * 3);
assert.equal(publicReport.wall_elapsed_ms, report.wall_elapsed_ms);
assert.equal(publicReport.max_prompt_tokens,
  Math.max(...entries.map(entry => entry.usage.prompt_tokens)));
assert.equal(publicReport.prompt_ceiling_tokens, 1728);
assert.equal(publicReport.token_preflight_chat_mismatches, 0);
assert.equal(publicReport.inference_retries, 0);
assert.equal(publicReport.ai_source_aware_observations.length, 11);
assert.deepEqual(publicReport.ai_source_aware_observations.map(row => row.cue_id), report.focus_ids);
assert.equal(publicReport.human_bilingual_review_count, 0);
assert.equal(publicReport.profile_selected, false);
assert.equal(publicReport.wider_context_selected, false);
assert.equal(publicReport.release_gate, 'open');
for (const [model, details] of Object.entries(publicReport.models)) {
  const identity = report.identity.models.find(row => row.key === model);
  assert.equal(details.model_sha256, identity.model_sha256);
  assert.equal(details.profile_sha256, identity.profile_sha256);
  const samples = report.resources[model].samples;
  assert.equal(details.sampled_server_working_set_peak_bytes,
    Math.max(...samples.flatMap(sample => sample.processes.map(process => process.WorkingSet64))));
  assert.equal(details.sampled_device_gpu_memory_peak_mib,
    Math.max(...samples.map(sample => Number(sample.gpu_device.split(',')[1].trim()))));
}
for (const arm of publicReport.arms) {
  assert.deepEqual({ outer_valid: arm.outer_json_valid,
    prompt_tokens: arm.prompt_tokens, completion_tokens: arm.completion_tokens,
    chat_elapsed_ms: arm.chat_http_ms, max_prompt_tokens: arm.max_prompt_tokens },
  summary[arm.model][arm.width]);
  assert.equal(arm.cases, 22);
}
assert.deepEqual(publicReport.structural_failures, [{ model: '7b', seed: 101,
  cue_id: 227, width: 1, finish_reason: 'length', completion_tokens: 256 }]);
console.log(JSON.stringify({ status: report.status, chats: entries.length,
  measured_http: entries.length * 3, wall_ms: report.wall_elapsed_ms,
  summary, human_review_count: report.human_review_count }));
