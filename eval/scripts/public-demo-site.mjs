import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSrt, digest } from './flores-file-fixture.mjs';
import { loadCurrencyReport, renderCurrencySection } from './currency-report-section.mjs';
import { loadModelComparison, renderModelComparison } from './model-comparison-section.mjs';
import { loadDeliveryPlan, renderDeliveryProgress } from './delivery-progress-section.mjs';
import { loadV5Envelope, renderV5Envelope } from './v5-envelope-section.mjs';
import { loadSceneContext, renderSceneContext } from './scene-context-section.mjs';
import { loadPronounCrossModel, renderPronounCrossModel } from './pronoun-cross-model-section.mjs';
import { loadLongV5Failure, renderLongV5Failure } from './long-v5-failure-section.mjs';
import { loadLongV6Outcomes, loadLongV6ModelScreen, loadLongV6Postlength, renderLongV6Outcomes, renderLongV6ModelScreen, renderLongV6Postlength } from './long-v6-outcomes-section.mjs';
import { loadLongV6CodeModel, renderLongV6CodeModel } from './long-v6-code-model-section.mjs';
import { loadReg009LivePrefix, renderReg009LivePrefix } from './reg009-live-prefix-section.mjs';
import { loadReg009Greedy81, renderReg009Greedy81 } from './reg009-greedy81-section.mjs';
import { loadReg009LongCli, renderReg009LongCli, renderReg014Decode } from './reg009-long-cli-section.mjs';
import { loadIdentifierDiagnostic, renderIdentifierDiagnostic } from './identifier-diagnostic-section.mjs';
import { loadNeighborContext, renderNeighborContext } from './neighbor-context-section.mjs';
import { loadTermsProbe, renderTermsProbe } from './terms-section.mjs';
import { loadInferenceJournal, renderInferenceJournal } from './inference-journal-section.mjs';
import { loadPreflightJournal, renderPreflightJournal } from './preflight-journal-section.mjs';
import { loadSapiMultivoice, loadSapiMultivoiceMedia } from './sapi-multivoice-section.mjs';
import { loadSapiOriginalWindow, renderSapiOriginalWindow } from './sapi-original-window-section.mjs';
import { loadAuralisPrivateSpeech, renderAuralisPrivateSpeech } from './auralis-private-speech-section.mjs';
import { loadManagedSpeech, renderManagedSpeech } from './managed-speech-section.mjs';
import { loadSourceCandidates, renderSourceCandidates } from './source-candidate-section.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dataset = JSON.parse(await fs.readFile(path.join(root, 'eval/corpora/public-demo-v1.json'), 'utf8'));
const google = JSON.parse(await fs.readFile(path.join(root, 'eval/corpora/public-demo-google-v1.json'), 'utf8'));
const review = JSON.parse(await fs.readFile(path.join(root, 'eval/corpora/public-demo-review-v1.json'), 'utf8'));
const currency = await loadCurrencyReport(root, dataset);
const modelComparison = await loadModelComparison(root);
const deliveryPlan = await loadDeliveryPlan(root);
const v5Envelope = await loadV5Envelope(root, dataset, currency.benchmark);
const sceneContext = await loadSceneContext(root);
const pronounCrossModel = await loadPronounCrossModel(root);
const longV5Failure = await loadLongV5Failure(root);
const longV6Outcomes = await loadLongV6Outcomes(root);
const longV6Postlength = await loadLongV6Postlength(root);
const identifierDiagnostic = await loadIdentifierDiagnostic(root);
const neighborContext = await loadNeighborContext(root);
const longV6ModelScreen = await loadLongV6ModelScreen(root);
const longV6CodeModel = await loadLongV6CodeModel(root);
const reg009LivePrefix = await loadReg009LivePrefix(root);
const reg009Greedy81 = await loadReg009Greedy81(root);
const reg009LongCli = await loadReg009LongCli(root);
const termsProbe = await loadTermsProbe(root);
const inferenceJournal = await loadInferenceJournal(root);
const preflightJournal = await loadPreflightJournal(root);
const sapiMultivoice = await loadSapiMultivoice(root);
const sapiMultivoiceMedia = await loadSapiMultivoiceMedia(root);
const sapiOriginalWindow = await loadSapiOriginalWindow(root);
const auralisPrivateSpeech = await loadAuralisPrivateSpeech(root);
const managedSpeech = await loadManagedSpeech(root);
const sourceCandidates = await loadSourceCandidates(root);
const evidencePath = path.join(root, 'eval/reports/public-demo-2026-09-27.json');
if (process.argv[2] === '--capture') {
  const workspace = (await fs.readFile(path.join(root, '.cache/eval/public-demo/latest.txt'), 'utf8')).trim();
  const relative = path.relative(path.join(root, '.cache/eval/public-demo'), workspace);
  assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
  const bytes = await fs.readFile(path.join(workspace, 'benchmark.json'));
  const captured = JSON.parse(bytes);
  assert.equal(captured.result, 'passed');
  assert.equal(captured.profile.prompt_version, 1, 'Baseline capture must not overwrite v1 with a correction experiment');
  assert.equal(captured.dataset_sha256, digest(await fs.readFile(path.join(root, 'eval/corpora/public-demo-v1.json'))));
  await fs.mkdir(path.dirname(evidencePath), { recursive: true });
  await fs.writeFile(evidencePath, bytes);
}
const evidenceBytes = await fs.readFile(evidencePath);
const benchmark = JSON.parse(evidenceBytes);
assert.equal(benchmark.result, 'passed');
assert.equal(benchmark.runs.length, 3);
assert.equal(benchmark.requests.length, 60);
assert.equal(benchmark.failures.length, 0);
assert.equal(benchmark.dataset_sha256, digest(await fs.readFile(path.join(root, 'eval/corpora/public-demo-v1.json'))));
assert.equal(benchmark.source_sha256, digest(buildSrt(dataset.examples)));
for (const run of benchmark.runs) {
  assert.equal(run.rows.length, 20);
  assert.equal(run.structural_checks, 'passed');
  assert.equal(run.offline_reexport, 'byte_identical');
  assert.equal(run.status.completed_blocks, run.status.total_blocks);
  assert.equal(run.status.review_state, 'needs_review');
  for (const row of dataset.examples) {
    assert.equal(run.rows.filter(candidate => candidate.example_id === row.id).length, 1);
    const requests = benchmark.requests.filter(request => request.run === run.repetition && request.example_id === row.id);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].http_status, 200);
    assert(requests[0].elapsed_ms > 0 && Number.isFinite(requests[0].elapsed_ms));
    assert.equal(requests[0].candidate.trim(), run.rows.find(candidate => candidate.example_id === row.id).candidate);
    assert.equal(google.observations.filter(entry => entry.id === row.id).length, 1);
    assert.equal(review.observations.filter(entry => entry.id === row.id).length, 1);
  }
}
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = (value, digits = 3) => Number(value).toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const sum = values => values.reduce((total, value) => total + value, 0);
const median = values => { const sorted = [...values].sort((a, b) => a - b); const i = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[i] : (sorted[i - 1] + sorted[i]) / 2; };
const peakRam = Math.max(...benchmark.resource_samples.map(sample => sample.working_set_bytes)) / (1024 ** 3);
const peakGpu = Math.max(...benchmark.resource_samples.map(sample => Number(sample.gpu.split(',')[0])));
const times = benchmark.requests.map(request => request.elapsed_ms);
const varied = dataset.examples.filter(row => new Set(benchmark.runs.map(run => run.rows.find(candidate => candidate.example_id === row.id).candidate)).size > 1).length;
const issues = review.observations.filter(row => row.flag === 'issue').length;
const payload = { dataset, google, review, benchmark, evidence_sha256: digest(evidenceBytes), environment_failures: [{ phase: 'Before runtime startup', cause: 'Initial sandbox invocation denied Node child-process creation (EPERM). No inference ran. Rerun with authorized process access succeeded.', model_requests: 0 }] };
payload.currency = currency;
payload.model_comparison = modelComparison;
payload.delivery_plan = deliveryPlan;
payload.v5_envelope = { sha256: v5Envelope.sha256, profile_sha256: v5Envelope.profileHash, copied_count: v5Envelope.copied_count };
payload.scene_context = { sha256: sceneContext.sha256, profile_sha256: sceneContext.profileHash, old_profile_sha256: sceneContext.oldProfileHash, smoke_chat_requests: sceneContext.smoke_chat_requests, regression_chat_requests: sceneContext.regression_chat_requests, repair_chat_requests: sceneContext.repair_chat_requests, after_terms_chat_requests: sceneContext.after_terms_chat_requests, large_screen_chat_requests: sceneContext.large_screen_chat_requests, large_screen: sceneContext.largeScreen, regression_id: sceneContext.regression_id, human_review: sceneContext.human_review };
payload.pronoun_cross_model = pronounCrossModel;
payload.long_v5_failure = longV5Failure;
payload.long_v6_outcomes = longV6Outcomes;
payload.long_v6_postlength = longV6Postlength;
payload.identifier_diagnostic = identifierDiagnostic;
payload.neighbor_context = neighborContext;
payload.long_v6_model_screen = longV6ModelScreen;
payload.long_v6_code_model = longV6CodeModel;
payload.reg009_live_prefix = reg009LivePrefix;
payload.reg009_greedy81 = reg009Greedy81;
payload.reg009_long_cli = reg009LongCli;
payload.inference_journal = { sha256: inferenceJournal.sha256, chats: inferenceJournal.chats, status: inferenceJournal.check.status };
payload.preflight_journal = { sha256: preflightJournal.sha256, chats: 6, preflights: 6, status: preflightJournal.check.status };
payload.sapi_multivoice = sapiMultivoice;
payload.sapi_multivoice_media = sapiMultivoiceMedia;
payload.sapi_original_window_fit = sapiOriginalWindow;
payload.auralis_private_speech = auralisPrivateSpeech;
payload.managed_speech = managedSpeech;
payload.source_candidates = sourceCandidates;
payload.terms_probe = { success_sha256: termsProbe.success_sha256, failure_sha256: termsProbe.failure_sha256, profile_sha256: termsProbe.profile_sha256, corpus_sha256: termsProbe.corpus_sha256, chat_requests: termsProbe.chat_requests, loopback_requests: termsProbe.loopback_requests };
const json = JSON.stringify(payload).replaceAll('<', '\\u003c');
const runRows = benchmark.runs.map(run => `<tr><th scope="row">${run.repetition}</th><td>${number(run.translation_elapsed_ms)}</td><td>${number(run.request_elapsed_sum_ms)}</td><td>${number(run.translation_elapsed_ms - run.request_elapsed_sum_ms)}</td><td>${number(run.offline_reexport_ms)}</td><td>${run.status.completed_blocks}/${run.status.total_blocks}</td></tr>`).join('');
const cards = dataset.examples.map((row, index) => {
  const observation = review.observations.find(item => item.id === row.id);
  const googleRow = google.observations.find(item => item.id === row.id);
  const firstRun = benchmark.runs[0].rows.find(item => item.example_id === row.id);
  const requests = benchmark.requests.filter(item => item.example_id === row.id);
  const detailRows = requests.map(request => `<tr><th scope="row">${request.run}</th><td>${escape(request.candidate)}</td><td>${number(request.elapsed_ms)}</td><td>${request.usage.prompt_tokens} / ${request.usage.completion_tokens}</td><td>${number(request.timings.prompt_ms)} / ${number(request.timings.predicted_ms)}</td><td>${request.usage.prompt_tokens_details.cached_tokens}</td></tr>`).join('');
  return `<article id="${row.id}" class="example scroll-mt-24 border-t border-slate-200 py-7">
    <div class="mb-4 flex flex-wrap items-center gap-3"><a class="font-mono text-sm text-slate-500" href="#${row.id}">${String(index + 1).padStart(2, '0')}</a><h3 class="text-lg font-semibold">${escape(row.category)}</h3><span class="rounded-full px-3 py-1 text-sm ${observation.flag === 'issue' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'}">${observation.flag === 'issue' ? 'Есть замечания' : 'Смысл сохранён · редакционный разбор'}</span></div>
    <div class="comparison grid gap-5 lg:grid-cols-4">
      <div><p class="label">Исходник · 中文</p><p lang="zh-Hans" class="text-[1.3rem] leading-relaxed">${escape(row.source)}</p></div>
      <div class="rounded-xl border border-blue-100 bg-blue-50 p-4"><p class="label text-blue-700">Предлагаемый эталон</p><p class="leading-relaxed">${escape(row.reference)}</p></div>
      <div><p class="label">Auralis · v1 · <span class="run-label">прогон 1</span></p><p class="candidate leading-relaxed" data-example="${row.id}">${escape(firstRun.candidate)}</p><p class="mt-3 font-mono text-sm text-slate-500">медиана ${number(median(requests.map(item => item.elapsed_ms)))} мс<br>диапазон ${number(Math.min(...requests.map(item => item.elapsed_ms)))}–${number(Math.max(...requests.map(item => item.elapsed_ms)))} мс</p></div>
      <div><p class="label">Google Переводчик</p><p class="leading-relaxed">${escape(googleRow.translation)}</p><a href="https://translate.google.com/?sl=zh-CN&amp;tl=ru&amp;text=${encodeURIComponent(row.source)}&amp;op=translate" target="_blank" rel="noopener noreferrer" class="mt-3 inline-block text-sm text-blue-700 underline decoration-blue-200 underline-offset-4">Открыть исходную фразу ↗</a></div>
    </div>
    <div class="mt-5 grid gap-4 lg:grid-cols-2"><p class="text-slate-600"><strong class="text-slate-800">Ожидаемый смысл.</strong> ${escape(row.meaning)}</p><p class="text-slate-600"><strong class="text-slate-800">Разбор Ули для v1.</strong> ${escape(observation.note)}</p></div>
    <div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p class="label text-emerald-800">После правки валют · v4 · <span class="run-label">прогон 1</span></p><p class="fidelity-candidate leading-relaxed" data-example="${row.id}">${escape(currency.benchmark.runs[0].rows.find(item => item.example_id === row.id).candidate)}</p><p class="mt-2 text-sm text-slate-600">Защита валют не исправляет автоматически остальные замечания.</p></div>
    <details class="mt-4"><summary class="cursor-pointer text-sm font-medium text-blue-700">Ответы и замеры исходного профиля v1</summary><div class="mt-3 overflow-x-auto"><table class="measurement"><caption class="sr-only">Три прогона ${row.id}</caption><thead><tr><th>Прогон</th><th>Ответ модели</th><th>HTTP, мс</th><th>Токены вход / выход</th><th>llama prompt / generation, мс</th><th>Кэш токенов</th></tr></thead><tbody>${detailRows}</tbody></table></div><p class="mt-2 text-sm text-slate-500">Google: наблюдение ${escape(googleRow.observed_at)}. Время Google не измерялось.</p></details>
    <details class="mt-3"><summary class="cursor-pointer text-sm font-medium text-emerald-800">Три результата v4, сырой ответ модели и точные замеры</summary><div class="mt-3 overflow-x-auto"><table class="measurement"><thead><tr><th>Прогон</th><th>Сохранённый результат</th><th>Сырой ответ модели</th><th>HTTP, мс</th><th>Токены вход / выход</th></tr></thead><tbody>${currency.benchmark.requests.filter(item => item.example_id === row.id).map(request => `<tr><th>${request.run}</th><td>${escape(request.accepted_candidate)}</td><td>${escape(request.candidate)}</td><td>${number(request.elapsed_ms)}</td><td>${request.usage.prompt_tokens} / ${request.usage.completion_tokens}</td></tr>`).join('')}</tbody></table></div></details>
  </article>`;
}).join('\n');
const bars = benchmark.runs.map(run => `<div class="mb-5"><div class="mb-2 flex justify-between text-sm"><span>Прогон ${run.repetition}</span><span class="font-mono">${number(run.translation_elapsed_ms / 1000)} с</span></div><div class="flex h-4 overflow-hidden rounded bg-slate-200" style="width:${run.translation_elapsed_ms / Math.max(...benchmark.runs.map(row => row.translation_elapsed_ms)) * 100}%"><span class="bg-blue-600" style="width:${run.request_elapsed_sum_ms / run.translation_elapsed_ms * 100}%"></span></div></div>`).join('');
const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="20 китайских реплик, 3 реальных прогона Auralis Translate: переводы, Google, предлагаемые эталоны и точные замеры."><title>Auralis Translate — 20 примеров и реальные замеры</title>
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<style>
:root{color-scheme:light}body{margin:0;font-family:Segoe UI,Arial,sans-serif;color:#172033;background:#fff;font-size:16px;line-height:1.6}*{box-sizing:border-box}a{color:inherit}button{font:inherit;cursor:pointer}.shell{max-width:1440px;margin:auto;padding:0 28px}.label{font-size:14px;font-weight:600;color:#526074;margin:0 0 10px}.measurement{width:100%;border-collapse:collapse;text-align:left;font-size:14px;min-width:760px}.measurement th,.measurement td{border-bottom:1px solid #e2e8f0;padding:12px 14px;vertical-align:top}.measurement thead{background:#f1f5f9}.measurement th{font-weight:600}.measurement td:not(:nth-child(2)){font-variant-numeric:tabular-nums}details summary{padding:4px 0}code{overflow-wrap:anywhere;font-size:14px}p{overflow-wrap:anywhere}.hash{font-family:Consolas,monospace;font-size:13px;word-break:break-all}button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #2563eb;outline-offset:4px}.run-button[aria-pressed=true]{background:#1d4ed8;color:white;border-color:#1d4ed8}@media(max-width:640px){.shell{padding:0 18px}.comparison{grid-template-columns:1fr}.measurement{font-size:14px}}@media print{button,nav{display:none}details{display:block}article{break-inside:avoid}body{font-size:12pt}}
</style></head>
<body>
<header class="border-b border-slate-200"><div class="shell flex flex-wrap items-center justify-between gap-4 py-5"><a class="text-lg font-bold tracking-tight" href="#top">AURALIS <span class="font-normal text-slate-500">/ Translate</span></a><nav class="flex flex-wrap gap-5 text-sm text-slate-600" aria-label="Разделы отчёта"><a href="#model-comparison">1.8B / 7B</a><a href="#delivery-plan">План и прогресс</a><a href="#source-candidates">Источники</a><a href="#v5-envelope">v5 JSON</a><a href="#scene-context">Контекст сцен</a><a href="#pronoun-cross-model">Четыре сцены</a><a href="#long-v5-failure">Длинный файл</a><a href="#reg009-long-cli">Отказ CLI</a><a href="#reg009-live-prefix">Коды и смысл</a><a href="#v5-terms">Термины</a><a href="#retry-policy">Повторы</a><a href="#inference-journal">Журнал запросов</a><a href="#preflight-journal">Токены</a><a href="#voice-handoff">Озвучка</a><a href="#managed-speech">Аудио Auralis</a><a href="#examples">История 20 примеров</a><a href="#measurements">Замеры v1</a><a href="#method">Методика</a></nav></div></header>
<main id="top" class="shell pb-16">
${renderModelComparison(modelComparison, escape, number)}
${renderDeliveryProgress(deliveryPlan, escape)}
<section id="release-readiness" class="my-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">Текущий вывод · выпуск не принят</p><h2 class="mt-2 text-2xl font-bold">G1–G9 и A1–A6 остаются открытыми</h2><p class="mt-3 max-w-4xl text-slate-700">Прежний синтетический длинный файл завершился структурно, но содержит 665 потерь или замен кодов и одну подтверждённую подмену содержания следующей репликой. Узкая вставка кода восстановила 45 пропусков в 81-запросном экране, однако новый реальный запуск через CLI остановился на 89-й реплике из 1 024 после кириллической подмены кода; итоговый SRT не опубликован. Ошибки действующего лица и русского языка остаются. Парный экран 1.8B/7B выявил у 7B замену одной двери несколькими в 12/12 ответах; модель не выбрана. Два настоящих SAPI-голоса уложены в короткие искусственные окна ускорением, однако человек не оценивал речь. Нужны лицензионный естественный источник, независимая китайско-русская проверка, слушатели, чистая Windows-машина и решение по отложенному desktop-этапу. Финальный RELEASE-05 нельзя провести на этом кандидате.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-reg-009-long-cli-soak-results.md">Последний отказ и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-release-readiness-after-reg015.md">Текущий неполный аудит (EN)</a></div></section>
${renderSourceCandidates(sourceCandidates)}
${renderV5Envelope(v5Envelope, dataset, currency.benchmark, escape, number)}
${renderSceneContext(sceneContext, escape)}
${renderPronounCrossModel(pronounCrossModel, escape)}
${renderLongV5Failure(longV5Failure, escape)}
${renderLongV6Outcomes(longV6Outcomes, escape)}
${renderLongV6Postlength(longV6Postlength, escape)}
${renderIdentifierDiagnostic(identifierDiagnostic)}
${renderNeighborContext(neighborContext, escape)}
${renderLongV6ModelScreen(longV6ModelScreen, escape)}
${renderLongV6CodeModel(longV6CodeModel)}
${renderReg009LongCli(reg009LongCli)}
${renderReg014Decode(reg009LongCli)}
${renderReg009LivePrefix(reg009LivePrefix)}
${renderReg009Greedy81(reg009Greedy81)}
${renderAuralisPrivateSpeech(auralisPrivateSpeech)}
${renderManagedSpeech(managedSpeech)}
<section id="sapi-wav-boundary" class="my-8 scroll-mt-8 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-5 md:p-7"><p class="text-sm font-semibold text-cyan-900">Auralis · регрессия VOICE-02/07</p><h2 class="mt-2 text-2xl font-bold">Повреждённый RIFF больше не считается готовым звуком</h2><p class="mt-3 max-w-4xl text-slate-700">Проверка WAV раньше принимала аудиоданные за пределами длины RIFF и неполный PCM-кадр. Минимальные тесты сначала воспроизвели обе ошибки, затем прошли после исправления. Новый разбор сохранил SHA-256 и длительность двух ранее созданных настоящим SAPI WAV: 2469 и 2664 мс. Повторной генерации не было. Это защита технической границы; окна обеих реплик по 1000 мс всё ещё не выдержаны, человек звук не слушал и A1–A6 остаются открытыми.</p><a class="mt-3 inline-block text-sm font-semibold text-blue-700 underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-auralis-sapi-wav-boundary.md">Воспроизведение, хеши и ограничения (EN)</a></section>
<section id="slot-schema" class="scroll-mt-8 border-t border-slate-200 py-10"><p class="text-sm font-semibold uppercase tracking-[.12em] text-slate-600">Парное сравнение · реальная 1.8B · 29 сентября 2026</p><h2 class="mt-2 text-2xl font-semibold">Ограничение ID пока не доказало улучшение</h2><p class="mt-3 max-w-5xl text-slate-700">На том же авторском слоте 72 сравнили исходную JSON-схему и вариант с жёстко заданными ID 72 и индексом строки 0. Два одинаковых источника и семени на каждую пару, четыре сырых ответа. Оба варианта оба раза вернули ID 72 и «Это не последний поезд.», по 290/30 входных/выходных токенов. Прежний необработанный ответ с ID 73 остаётся подтверждённым сбоем, но эти два новых baseline-запроса его не повторили. Оснований менять рабочий профиль или считать длинный файл пройденным нет.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-29-slot-schema-ablation.json">Все четыре запроса и сырых ответа</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-slot-schema-ablation-results.md">План, замеры и ограничения (EN)</a></div><p class="mt-3 text-xs text-slate-500">SHA-256 журнала: <code class="hash">7a53c67769e59cee113aea10fc25b4e04f77acc6aadd4d9b1fb918fe6d4473d5</code>. Человеческой оценки русского текста нет.</p></section>
${renderTermsProbe(termsProbe, escape)}
<section id="retry-policy" class="my-8 scroll-mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7"><p class="text-sm font-semibold text-slate-600">Инженерная регрессия · CTX-02 / EVAL-04</p><h2 class="mt-2 text-2xl font-bold">Повтор только после временного сбоя</h2><p class="mt-3 max-w-4xl text-slate-700">Раньше лимит попыток повторял и повреждённый ответ модели. Теперь HTTP 502–504 и временный сетевой сбой могут быть повторены в пределах профиля; HTTP 400, некорректный JSON, нарушение ID и защищённых фактов останавливают блок без checkpoint. Пауза сохраняет приоритет.</p><p class="mt-3 text-sm text-slate-600">Локальные детерминированные проверки: 7 проверок HTTP и отмены, 5 проверок политики ядра, 1 сквозная проверка CLI с отказом 503 и успешным повтором. Это не испытание отказа настоящей модели или восстановления полного файла.</p><a class="mt-3 inline-block text-sm font-semibold text-blue-700 underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-28-typed-provider-retry.md">Воспроизведение и ограничения (EN)</a></section>
${renderInferenceJournal(inferenceJournal, escape)}
${renderPreflightJournal(preflightJournal, escape)}
<section id="voice-handoff" class="my-8 scroll-mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7"><p class="text-sm font-semibold text-slate-600">Инженерный этап · VOICE-01/02, ещё в работе</p><h2 class="mt-2 text-2xl font-bold">Передача сценария и технический звук в Auralis</h2><p class="mt-3 max-w-4xl text-slate-700">Проверенная история перевода и подготовленный сценарий доступны только для чтения. Новый guard заново сверяет готовую публикацию и выбранный результат перед будущей озвучкой: тест с двумя SQLite-базами отверг смену результата и изменение исходника. Производственный TTS-worker ещё не вызывает guard; отдельный проверенный путь записи речи теперь проверяет выбор в SQLite, но финальный монтаж не подключён. Подтверждённого человеком сценария нет.</p><p class="mt-3 text-sm text-slate-600">Настоящий SAPI создал два WAV; в исходных окнах они превышают длительность на 744 и 169 мс. Отдельный восьмисекундный синтетический клип с расширенными окнами прошёл FFmpeg-декодирование и FFplay-процесс. Это не исправляет исходный fit. Права на публикацию звука, человеческое прослушивание, естественный видеосюжет и A1–A6 остаются открытыми.</p><p class="mt-3 text-sm text-slate-600">Отдельный реальный тест дождался первого готового WAV, отменил пакет из восьми авторских реплик и подтвердил ноль оставшихся файлов. Два запуска в ограниченной среде ранее не дошли до этой точки из-за ошибки доступа к SAPI-голосу; это сохранено как сбой окружения. Проверена одна граница отмены, без оценки речи и без производственного worker.</p><p class="mt-3 text-sm text-slate-600">Сопоставление двух голосов на одинаковой авторской фразе прошло с проверенным PowerShell 7: выбраны Microsoft Irina Desktop и Microsoft Pavel, оба WAV декодируются, без клиппинга. Их длительности ${sapiMultivoice.segments[0].duration_ms} и ${sapiMultivoice.segments[1].duration_ms} мс превышают исходные окна на ${sapiMultivoice.segments[0].exceeds_window_ms} и ${sapiMultivoice.segments[1].exceeds_window_ms} мс. Windows PowerShell ранее не нашёл второй голос; PowerShell 7 взят из локальной среды Codex, это не поставка Auralis. Слуховая оценка этих WAV не проводилась; итоговый ролик с двумя голосами воспроизведён позднее в отдельном синтетическом тесте.</p><p class="mt-3 text-sm text-slate-600">Отдельный двухголосый синтетический ролик 10 с с настоящими Irina и Pavel прошёл FFmpeg-декодирование и FFplay-воспроизведение на том же хеше. Оба голосовых окна содержат звук, между ними тишина, клиппинга нет. Исходные реплики по-прежнему не укладываются в свои окна: +${sapiMultivoiceMedia.voices[0].original_overrun_ms} и +${sapiMultivoiceMedia.voices[1].original_overrun_ms} мс. Человек пока не слушал и не оценивал голоса; естественный источник, утверждённый сценарий и производственный монтаж отсутствуют.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-28-voice-handoff-immutability.md">Передача сценария (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-voice-selection-reverify.md">Повторная сверка (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-sapi-synthetic-media.md">Синтетический клип и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-sapi-cancellation.md">Отмена SAPI и сбой окружения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-sapi-multivoice.md">Два голоса и провал fit (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-29-sapi-multivoice-pwsh-probe.json">Сырые замеры (JSON)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-sapi-multivoice-media.md">Два голоса в ролике (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-29-sapi-multivoice-media-summary.json">Замеры ролика (JSON)</a></div></section>
${renderSapiOriginalWindow(sapiOriginalWindow)}
<section class="pt-10 pb-7"><p class="mb-3 text-sm font-semibold uppercase tracking-[.12em] text-blue-700">Реальный прогон · 27 сентября 2026</p><h1 class="max-w-4xl text-3xl font-bold leading-tight tracking-tight md:text-4xl">Как Auralis переводит 20 китайских реплик</h1><p class="mt-4 max-w-4xl text-lg text-slate-600">Исходник, предлагаемая русская версия, фактический ответ локальной модели и Google Переводчика. Три повторения на одной машине; все ответы и замеры доступны для проверки.</p>
<div class="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4"><div class="border-l-2 border-blue-600 pl-4"><p class="text-3xl font-semibold">60 / 60</p><p class="text-sm text-slate-500">запросов исходного профиля v1</p></div><div class="border-l-2 border-blue-600 pl-4"><p class="text-3xl font-semibold">${number(median(benchmark.runs.map(run => run.translation_elapsed_ms)) / 1000)} с</p><p class="text-sm text-slate-500">медиана обработки 20 реплик</p></div><div class="border-l-2 border-blue-600 pl-4"><p class="text-3xl font-semibold">${number(median(times))} мс</p><p class="text-sm text-slate-500">медиана отдельного запроса</p></div><div class="border-l-2 border-amber-500 pl-4"><p class="text-3xl font-semibold">${issues} / 20</p><p class="text-sm text-slate-500">реплик с замечаниями Ули</p></div></div>
<div class="mt-7 border-l-4 border-amber-500 bg-amber-50 p-5 text-amber-950"><strong>Исходный профиль v1: файл прошёл проверку, перевод требует правки.</strong> В снимке до исправления модель во всех трёх прогонах меняет юани на шиллинги и заменяет «не бросать на полпути» на «не откладывать». Автоматических предупреждений — 0; результаты всё равно имеют статус <code>needs_review</code>. Эталоны и разбор предложены Улей, ИИ-ассистентом, и не проверены независимым переводчиком.</div>
${renderCurrencySection(currency, benchmark, escape, number)}
</section>
<section id="examples" class="scroll-mt-8"><div class="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 py-5"><div><h2 class="text-2xl font-semibold">Сравнение v1 и v4 на исходных репликах</h2><p class="mt-1 text-sm text-slate-500">Все 20 примеров авторские. Эталон — один допустимый вариант; совпадение слов не является оценкой качества.</p></div><div class="flex gap-2" role="group" aria-label="Показать ответ модели из прогона">${[1,2,3].map(run => `<button class="run-button rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium" data-run="${run}" aria-pressed="${run === 1}">Прогон ${run}</button>`).join('')}</div></div>${cards}</section>
<section id="measurements" class="scroll-mt-8 border-t border-slate-200 pt-9"><h2 class="text-2xl font-semibold">Исходные замеры v1</h2><div class="mt-6 grid gap-8 lg:grid-cols-2"><div>${bars}<p class="text-sm text-slate-600"><span class="mr-2 inline-block h-3 w-3 bg-blue-600"></span>Сумма запросов к модели <span class="ml-4 mr-2 inline-block h-3 w-3 bg-slate-200"></span>CLI вне этих запросов</p><p class="mt-3 text-sm text-slate-500">Общее время включает повторную проверку GGUF, планирование, SQLite, валидацию и запись файла. Остаток не измеряет отдельно каждую из этих стадий. Пауза между повторами и сбор справочной информации не входят в строку прогона.</p></div><div class="rounded-xl bg-slate-950 p-6 text-white"><p class="text-sm text-slate-300">${escape(benchmark.hardware.gpu)}</p><p class="mt-3 text-lg font-semibold">${escape(benchmark.hardware.cpu)}</p><p class="mt-2 text-sm text-slate-300">${benchmark.hardware.logical_cpus} логических CPU · ${number(benchmark.hardware.total_ram_bytes / 1024 ** 3, 2)} GiB RAM<br>${escape(benchmark.hardware.os)}</p><dl class="mt-5 grid grid-cols-2 gap-4"><div><dt class="text-sm text-slate-400">Запуск до readiness</dt><dd class="font-mono">${number(benchmark.server_startup_ms)} мс</dd></div><div><dt class="text-sm text-slate-400">Пик working set*</dt><dd class="font-mono">${number(peakRam, 3)} GiB</dd></div><div><dt class="text-sm text-slate-400">Пик GPU памяти*</dt><dd class="font-mono">${number(peakGpu, 0)} MiB</dd></div><div><dt class="text-sm text-slate-400">Сэмплов ресурсов</dt><dd class="font-mono">${benchmark.resource_samples.length}</dd></div></dl><p class="mt-4 text-sm text-slate-400">* Приблизительные пики после readiness, с интервалом около 1 секунды. GPU включает другие приложения; пик загрузки модели не измерялся. Working set не равен приватной RAM.</p></div></div>
<div class="mt-6 overflow-x-auto"><table class="measurement"><caption class="mb-3 text-left text-sm text-slate-600">Все длительности — миллисекунды, часы performance.now(). Отображение округлено до 0,001 мс; это точность записи, а не гарантия точности эксперимента.</caption><thead><tr><th>Прогон</th><th>Файл целиком</th><th>Сумма HTTP</th><th>CLI вне HTTP</th><th>Выгрузка без модели</th><th>Блоки</th></tr></thead><tbody>${runRows}</tbody></table></div>
<div class="mt-6 grid gap-4 md:grid-cols-3"><p><strong>${varied} из 20 реплик</strong><br><span class="text-slate-600">имеют текстовые различия между повторами. Пунктуация, ё/е и род тоже считаются различиями; это не число ошибок.</span></p><p><strong>${number(sum(benchmark.requests.map(request => request.usage.completion_tokens)), 0)} выходных токенов</strong><br><span class="text-slate-600">за 60 запросов. Модель сообщает суммарно ${number(sum(benchmark.requests.map(request => request.timings.predicted_ms)))} мс генерации; HTTP и генерация измеряют разные границы.</span></p><p><strong>Один Google-снимок на фразу</strong><br><span class="text-slate-600">зафиксирован через веб-интерфейс. Версия облачной модели не раскрыта. Сравнения скорости Google и локального CLI здесь нет.</span></p></div></section>
<section id="method" class="scroll-mt-8 mt-10 border-t border-slate-200 pt-9"><h2 class="text-2xl font-semibold">Как работает этот прогон</h2><ol class="mt-5 grid gap-4 md:grid-cols-4"><li class="rounded-xl bg-slate-100 p-5"><span class="font-mono text-blue-700">01</span><h3 class="mt-2 font-semibold">Проверить SRT</h3><p class="mt-2 text-sm text-slate-600">20 однострочных реплик, UTF-8, CRLF. Тайминги искусственные: по 4 секунды на реплику. Исходник остаётся неизменным.</p></li><li class="rounded-xl bg-slate-100 p-5"><span class="font-mono text-blue-700">02</span><h3 class="mt-2 font-semibold">Подготовить модель</h3><p class="mt-2 text-sm text-slate-600">Проверить размер и SHA-256 GGUF, имя модели и сборку llama.cpp. Локальный сервер уже загружен; скачивания нет.</p></li><li class="rounded-xl bg-slate-100 p-5"><span class="font-mono text-blue-700">03</span><h3 class="mt-2 font-semibold">Перевести и сохранить</h3><p class="mt-2 text-sm text-slate-600">Один HTTP-запрос на строку, без соседнего контекста и глоссария. План: 3 блока, по 8 / 8 / 4 реплики. Проверенные блоки сохраняются в SQLite.</p></li><li class="rounded-xl bg-slate-100 p-5"><span class="font-mono text-blue-700">04</span><h3 class="mt-2 font-semibold">Создать отдельный файл</h3><p class="mt-2 text-sm text-slate-600">Повторный парсинг сверяет порядок, ID, тайминги и защищённые байты. После остановки сервера resume воспроизводит каждый результат байт в байт.</p></li></ol>
<div class="mt-6 grid gap-7 lg:grid-cols-2"><div><h3 class="text-lg font-semibold">Модель и параметры</h3><dl class="mt-3 space-y-3 text-sm"><div><dt class="font-semibold">Hy-MT2-1.8B · Q4_K_M</dt><dd>${escape(benchmark.profile.model_repo)} · ${number(benchmark.profile.model_file_bytes, 0)} байт</dd></div><div><dt class="font-semibold">llama.cpp</dt><dd>${escape(benchmark.profile.runtime_build_info)} · GPU layers 99 · context 2048 · parallel 1 · cache-ram 0 · Jinja</dd></div><div><dt class="font-semibold">Исходный checked profile, без замены настроек продукта</dt><dd>prompt v1 · temperature 0,7 · top-p 0,6 · top-k 20 · repeat penalty 1,05 · максимум 256 токенов на строку · таймаут 120 с</dd></div><div><dt class="font-semibold">Точный prompt для каждой строки</dt><dd class="mt-2 rounded bg-slate-100 p-3"><code>Translate the following text into Russian. Note that you should only output the translated result without any additional explanation:<br>&lt;исходная китайская строка&gt;</code></dd></div></dl></div><div><h3 class="text-lg font-semibold">Границы сравнения</h3><ul class="mt-3 list-disc space-y-3 pl-5 text-slate-600"><li>Три свежих состояния SQLite, один загруженный сервер. Первый файл следует за readiness; остальные используют тот же рантайм. Холодный дисковый кэш не обеспечивался.</li><li>Прокси на loopback фиксирует время до полного тела ответа. Служебные /props и проверки GGUF в замер отдельного запроса не входят. Токенные времена сообщает сам llama.cpp; кэш prompt может влиять на повторения.</li><li>Браузерное получение Google выполнялось во время локальных прогонов. Машина не была изолирована; это измеренный пример, а не обещание скорости на другом ПК.</li><li>Обработка строго китайских реплик: CLI фиксирует zh → ru. Японский путь, сцены с контекстом, глоссарий и реальные таймированные субтитры этим отчётом не проверены.</li><li>Первый запуск в sandbox остановился до запуска модели из-за EPERM при создании дочернего процесса. Затем задача успешно повторена. Это отказ окружения, 0 запросов, а не скрытая неудачная генерация.</li></ul></div></div>
<details class="mt-7 rounded-xl border border-slate-200 p-5"><summary class="font-semibold">Идентичность файлов и воспроизводимость</summary><div class="mt-5 grid gap-5 lg:grid-cols-2">${[['Коммит кода',benchmark.revision],['GGUF SHA-256',benchmark.profile.model_file_sha256],['Ревизия модели',benchmark.profile.model_revision],['Профиль SHA-256',benchmark.profile_sha256],['CLI SHA-256',benchmark.cli_sha256],['Рантайм SHA-256',benchmark.runtime_sha256],['Исходник SHA-256',benchmark.source_sha256],['JSON evidence SHA-256',digest(evidenceBytes)]].map(([label,value])=>`<div><p class="label">${label}</p><p class="hash">${escape(value)}</p></div>`).join('')}${benchmark.runs.map(run=>`<div><p class="label">Прогон ${run.repetition}: output SHA-256</p><p class="hash">${run.output_sha256}</p><p class="mt-2 text-sm">run_id: <code>${run.run_id}</code><br>result_id: <code>${run.status.selected_result_id ?? run.status.result_id ?? 'See JSON evidence'}</code></p></div>`).join('')}</div><p class="mt-5 text-sm text-slate-600">Начало: ${benchmark.started_at}; завершение: ${benchmark.finished_at}. UTC. На местных часах UTC+3 — 21:28–21:29.</p><pre class="mt-5 overflow-x-auto rounded-lg bg-slate-950 p-5 text-sm text-slate-100"><code>$env:AURALIS_TEST_LLAMA_SERVER = '&lt;installed llama-server.exe&gt;'
$env:AURALIS_TEST_GGUF = '&lt;installed Hy-MT2-1.8B-Q4_K_M.gguf&gt;'
$env:PATH = '&lt;CUDA runtime directory&gt;;' + $env:PATH
task eval:public-demo
task site:build
task site:check
task docs:check</code></pre><p class="mt-3 text-sm text-slate-600">Новый benchmark создаёт новые замеры в .cache. <code>task site:build</code> воспроизводит опубликованный снимок; намеренное обновление evidence выполняется отдельной задачей <code>task site:capture</code> (только для исходного профиля v1). Веса, SQLite, runtime и частные журналы не публикуются.</p></details>
<div class="mt-7 flex flex-wrap gap-3"><button id="download-json" class="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">Скачать исторический JSON замеров</button><button id="download-source" class="rounded-lg border border-slate-300 px-5 py-3 font-semibold">Скачать исходный SRT</button><button id="download-reference" class="rounded-lg border border-slate-300 px-5 py-3 font-semibold">Скачать предлагаемый эталон SRT</button></div><p class="mt-3 text-sm text-slate-500">Загрузка содержит прежние 420 запросов: 180 исторических v1/v4 и 240 из сравнения моделей. Новые сырые отчёты v5 доступны отдельно по ссылкам в разделе v5 выше; они не заменяют прежние замеры.</p>
</section>
<footer class="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500"><p>Авторские примеры и предлагаемые эталоны: Уля, ИИ-ассистент. Независимая человеческая проверка не выполнена. Google — сравнительный машинный перевод, не эталон. Результаты относятся только к указанной машине, модели и настройкам.</p><p class="mt-3"><a class="underline" href="https://github.com/Ermolz69/auralis-translate">Репозиторий и методика</a> · <a class="underline" href="https://huggingface.co/tencent/Hy-MT2-1.8B-GGUF/tree/${benchmark.profile.model_revision}">Пин модели</a> · <a class="underline" href="https://github.com/ggml-org/llama.cpp">llama.cpp</a> · <a class="underline" href="https://tailwindcss.com/docs/installation/play-cdn">Tailwind через CDN</a></p><p class="mt-3">Единственный HTML-файл. Tailwind загружается с удалённого CDN; локальная библиотека и сборщик не требуются. Для оформления нужен доступ к CDN, для просмотра данных запросы к модели и Google не выполняются.</p></footer>
</main>
<script id="report-data" type="application/json">${json}</script>
<script>
const report=JSON.parse(document.getElementById('report-data').textContent);
document.querySelectorAll('[data-run]').forEach(button=>button.addEventListener('click',()=>{const n=Number(button.dataset.run),run=report.benchmark.runs.find(item=>item.repetition===n);document.querySelectorAll('[data-run]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));document.querySelectorAll('.candidate').forEach(item=>{item.textContent=run.rows.find(row=>row.example_id===item.dataset.example).candidate;});document.querySelectorAll('.fidelity-candidate').forEach(item=>{item.textContent=report.currency.benchmark.runs.find(item=>item.repetition===n).rows.find(row=>row.example_id===item.dataset.example).candidate;});document.querySelectorAll('.run-label').forEach(item=>item.textContent='прогон '+n);}));
function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function timestamp(ms){const s=Math.floor(ms/1000);return String(Math.floor(s/3600)).padStart(2,'0')+':'+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0')+','+String(ms%1000).padStart(3,'0');}
function srt(key){return report.dataset.examples.map((row,i)=>{const start=i*6000+1000;return (i+1)+'\\r\\n'+timestamp(start)+' --> '+timestamp(start+4000)+'\\r\\n'+row[key]+'\\r\\n\\r\\n';}).join('');}
document.querySelectorAll('[data-model-run]').forEach(button=>button.addEventListener('click',()=>{const n=Number(button.dataset.modelRun);document.querySelectorAll('[data-model-run]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));for(const model of ['small','large'])document.querySelectorAll('.model-'+model+'-candidate').forEach(item=>{const b=report.model_comparison.report.cases.find(row=>row.id===item.dataset.dataset+'-'+model).benchmark;item.textContent=b.runs.find(row=>row.repetition===n).rows.find(row=>row.example_id===item.dataset.example).candidate;});}));
document.getElementById('download-json').addEventListener('click',()=>download(JSON.stringify(report,null,2),'auralis-demo-2026-09-27.json','application/json'));
document.getElementById('download-source').addEventListener('click',()=>download(srt('source'),'source.zh.srt','text/plain;charset=utf-8'));
document.getElementById('download-reference').addEventListener('click',()=>download(srt('reference'),'proposed-reference.ru.srt','text/plain;charset=utf-8'));
</script>
</body></html>`;
await fs.mkdir(path.join(root, 'site'), { recursive: true });
await fs.writeFile(path.join(root, 'site/index.html'), html);
console.log(`Verified historical evidence and REG-011 paired model screen; wrote site/index.html (${Buffer.byteLength(html)} bytes)`);
