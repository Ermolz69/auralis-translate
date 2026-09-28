import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { buildSrt, digest } from './flores-file-fixture.mjs';
import { loadCurrencyReport } from './currency-report-section.mjs';
import { loadModelComparison } from './model-comparison-section.mjs';
import { loadDeliveryPlan } from './delivery-progress-section.mjs';
import { loadV5Envelope } from './v5-envelope-section.mjs';
import { loadSceneContext } from './scene-context-section.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const html = await fs.readFile(path.join(root, 'site/index.html'), 'utf8');
assert.deepEqual(await fs.readdir(path.join(root, 'site')), ['index.html'], 'Only the single report is public');
assert(html.includes('https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4'));
assert.equal((html.match(/<article id="zh\d\d"/g) ?? []).length, 20);
const match = html.match(/<script id="report-data" type="application\/json">([\s\S]*?)<\/script>/);
assert(match);
const data = JSON.parse(match[1]);
assert.equal(data.benchmark.result, 'passed');
assert.equal(data.dataset.examples.length, 20);
assert.equal(data.benchmark.runs.length, 3);
assert.equal(data.benchmark.requests.length, 60);
assert.equal(data.google.observations.length, 20);
assert.equal(data.review.observations.length, 20);
assert.deepEqual(data.currency, await loadCurrencyReport(root, data.dataset));
assert.deepEqual(data.model_comparison, await loadModelComparison(root));
assert.deepEqual(data.delivery_plan, await loadDeliveryPlan(root));
const v5 = await loadV5Envelope(root, data.dataset, data.currency.benchmark);
assert.deepEqual(data.v5_envelope, { sha256: v5.sha256, profile_sha256: v5.profileHash, copied_count: 6 });
assert(html.includes('id="v5-envelope"'));
assert.equal((html.match(/href="https:\/\/github.com\/Ermolz69\/auralis-translate\/blob\/main\/eval\/reports\/v5-/g) ?? []).length, 4);
const scene = await loadSceneContext(root);
assert.deepEqual(data.scene_context, { sha256: scene.sha256, profile_sha256: scene.profileHash, old_profile_sha256: scene.oldProfileHash, smoke_chat_requests: 10, regression_chat_requests: 24, repair_chat_requests: 24, regression_id: 'REG-002', human_review: 'missing' });
assert(html.includes('id="scene-context"'));
assert.equal((html.match(/data-scene-row=/g) ?? []).length, 6);
assert.equal((html.match(/href="https:\/\/github.com\/Ermolz69\/auralis-translate\/blob\/main\/eval\/reports\/scene-/g) ?? []).length, 3);
assert.equal((html.match(/data-plan-task=/g) ?? []).length, data.delivery_plan.total_tasks);
assert(html.indexOf('id="model-comparison"') < html.indexOf('id="delivery-plan"'));
assert(html.indexOf('id="delivery-plan"') < html.indexOf('id="currency-fix"'));
assert(html.indexOf('id="model-comparison"') < html.indexOf('id="currency-fix"'));
assert.equal((html.match(/data-model-row=/g) ?? []).length, 40);
assert.equal((html.match(/data-model-run=/g) ?? []).length, 3);
assert(html.includes('id="currency-fix"'));
assert.equal((html.match(/class="fidelity-candidate /g) ?? []).length, 20);
assert.equal(data.benchmark.source_sha256, digest(buildSrt(data.dataset.examples)));
assert.equal(data.evidence_sha256, digest(await fs.readFile(path.join(root, 'eval/reports/public-demo-2026-09-27.json'))));
for (const example of data.dataset.examples) {
  for (const run of data.benchmark.runs) {
    const candidate = run.rows.find(row => row.example_id === example.id);
    const request = data.benchmark.requests.find(row => row.example_id === example.id && row.run === run.repetition);
    assert.equal(candidate.candidate, request.candidate.trim());
    assert(request.elapsed_ms > 0 && request.usage.completion_tokens > 0);
    assert.equal(request.http_status, 200);
    assert.equal(run.structural_checks, 'passed');
    assert.equal(run.offline_reexport, 'byte_identical');
  }
}
for (const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if (!script[0].includes('application/json')) new vm.Script(script[1]);
}
assert(!/(?:E:\\\\|C:\\\\Users\\\\|00ermzahar@|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/.test(html));
assert(!/<script[^>]+src="(?!https:\/\/cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser@4")/.test(html));
console.log('Public HTML verified: 420 prior requests retained, four earlier v5 and three paired scene reports linked and checked, 40 model comparison rows, evidence identity, scripts and single-file publication boundary.');
