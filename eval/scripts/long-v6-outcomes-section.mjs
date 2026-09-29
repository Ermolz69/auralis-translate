import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const timeoutStem = '2026-09-29-long-v6-scene-timeout';
const continuationStem = '2026-09-29-long-v6-relocated-continuation-failure';
const postlengthStem = '2026-09-29-long-v6-postlength-v2';
const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/';

export async function loadLongV6Outcomes(root) {
  const timeoutBytes = await fs.readFile(path.join(root, `eval/reports/${timeoutStem}.json`));
  const continuationBytes = await fs.readFile(path.join(root, `eval/reports/${continuationStem}.json`));
  const journalBytes = await fs.readFile(path.join(root, `eval/reports/${continuationStem}-journal.json.gz`));
  assert.equal(digest(timeoutBytes), '66b393595abca189f457fe414a4e7d508a21a8d6c4fd653cf9842f5e79242795');
  assert.equal(digest(continuationBytes), 'c16f0015e958e5080827241a025f87b0cbe124134bfbf98afbc3e823417703f3');
  assert.equal(digest(journalBytes), '09944a0cefd47eb124fa780157bf6fc5d27bec1db4c7c19612500ec7bd49c388');
  const timeout = JSON.parse(timeoutBytes);
  const continuation = JSON.parse(continuationBytes);
  assert.equal(timeout.saved_blocks, 964);
  assert.equal(timeout.request_count, 3619);
  assert.equal(timeout.result_count, 0);
  assert.equal(continuation.saved_blocks, 982);
  assert.equal(continuation.new_request_count, 69);
  assert.equal(continuation.total_request_count, 3688);
  assert.equal(continuation.results, 0);
  assert.equal(continuation.failed_request.segment_id, 983);
  assert.equal(continuation.failed_request.finish_reason, 'length');
  assert.equal(continuation.failed_request.completion_tokens, 256);
  assert.equal(timeout.source_sha256, continuation.source_sha256);
  assert.equal(timeout.profile_sha256, continuation.profile_sha256);
  assert.equal(timeout.model_sha256, continuation.model_sha256);
  return {
    source_sha256: timeout.source_sha256, model_sha256: timeout.model_sha256,
    profile_sha256: timeout.profile_sha256,
    timeout: { saved_blocks: timeout.saved_blocks, request_count: timeout.request_count,
      process_timeout_ms: timeout.resumed_process_timeout_ms,
      report_sha256: digest(timeoutBytes), journal_sha256: timeout.journal_gzip_sha256 },
    copied_state: { saved_blocks: 964, new_model_requests: 0, cause: 'managed_source_locator_outside_copied_state' },
    continuation: { saved_blocks: continuation.saved_blocks, new_request_count: continuation.new_request_count,
      total_request_count: continuation.total_request_count, failure_segment_id: continuation.failed_request.segment_id,
      prompt_tokens: continuation.failed_request.prompt_tokens,
      completion_tokens: continuation.failed_request.completion_tokens,
      request_elapsed_ms: continuation.failed_request.elapsed_ms,
      finish_reason: continuation.failed_request.finish_reason,
      peak_tracked_working_set_bytes: continuation.peak_tracked_working_set_bytes,
      peak_device_gpu_mib: continuation.peak_device_gpu_mib,
      report_sha256: digest(continuationBytes), journal_sha256: digest(journalBytes) },
    complete_output: false, human_review: 'missing', natural_source: false,
  };
}

export async function loadLongV6ModelScreen(root) {
  const stem = '2026-09-29-reg-006-paired-model-probe';
  const summaryBytes = await fs.readFile(path.join(root, `eval/reports/${stem}.json`));
  const reportBytes = await fs.readFile(path.join(root, `eval/reports/${stem}-report.json`));
  const requestsBytes = await fs.readFile(path.join(root, `eval/reports/${stem}-requests.jsonl.gz`));
  assert.equal(digest(summaryBytes), 'f1d9f31f99a0f986e8cbb39566dbf5cb63b3004d72f3eb85c711743c80eafc4d');
  assert.equal(digest(reportBytes), '45fb210494e254ccd2e61b4c125abadccfe4f2ce489e6f160cc0de6d073f8bd8');
  assert.equal(digest(requestsBytes), '8db3b4a924bbe2fe54693415914b945781f74ea960e9caed93df4848c52fe083');
  const summary = JSON.parse(summaryBytes);
  const report = JSON.parse(reportBytes);
  assert.equal(summary.request_count, 16);
  assert.equal(report.status, 'complete_observations_unreviewed');
  assert.equal(report.requests.length, 16);
  assert(summary.model_summaries.every(row => row.structurally_valid === 8));
  return { summary_sha256: digest(summaryBytes), requests_sha256: digest(requestsBytes),
    model_summaries: summary.model_summaries,
    focus_rows: report.requests.filter(row =>
      ['zh-983-amin-tomorrow', 'zh-983-amin-today'].includes(row.case_id))
      .map(row => ({ model: row.model, seed: row.seed, case_id: row.case_id,
        candidate: row.accepted_candidate, prompt_tokens: row.usage.prompt_tokens,
        completion_tokens: row.usage.completion_tokens, elapsed_ms: row.elapsed_ms })),
    human_review: 'missing', quality_verdict: 'unreviewed', full_long_file: false };
}

export async function loadLongV6Postlength(root) {
  const summaryBytes = await fs.readFile(path.join(root, `eval/reports/${postlengthStem}-summary.json`));
  assert.equal(digest(summaryBytes), '8a1007c11133a5da95936e8d794c626b3869295fe3c068f28cb603c658fe9d4b');
  const summary = JSON.parse(summaryBytes);
  const reportBytes = await fs.readFile(path.join(root, `eval/reports/${summary.report_file}`));
  assert.equal(digest(reportBytes), summary.report_sha256);
  const report = JSON.parse(reportBytes);
  assert.equal(summary.outcome, 'passed_structural_with_identifier_loss_after_harness_failure');
  assert.equal(summary.quality_verdict, 'failed_identifier_preservation_unreviewed');
  assert.equal(summary.initial_task_exit, 1);
  assert.equal(summary.checkpoints_after, 1024);
  assert.equal(summary.text_slot_count, 1280);
  assert.equal(summary.identifier_violation_count, 665);
  assert.equal(summary.offline_reexport, 'byte_identical');
  assert.equal(report.identifier_violations.length, 665);
  const examples = [
    report.identifier_violations.find(row => row.segment_id === 2),
    report.identifier_violations.find(row => row.segment_id >= 512),
    report.identifier_violations.find(row => row.segment_id >= 1000),
  ];
  assert(examples.every(Boolean));
  return { ...summary, summary_sha256: digest(summaryBytes), examples };
}

export function renderLongV6Outcomes(data, escape) {
  return `<section id="long-v6-outcomes" class="my-8 scroll-mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-800">Инженерный опыт · v6 · не пройден</p><h2 class="mt-2 text-2xl font-bold">1 024 реплики: сохранение есть, полного перевода нет</h2><p class="mt-3 max-w-4xl text-slate-700">На том же авторском китайском SRT схема v6 связала ответ с целью: ранее ошибочный ID на реплике 72 не повторился в одном наблюдении. Первый длинный прогон остановил лимит тестового процесса на 964/1 024 блоках. Копия базы с прежним абсолютным путём исходника была отвергнута до инференса. После проверенного переноса пути в копии модель дошла до 982/1 024, затем на реплике 983 повторяла испорченный JSON и инструкции до лимита 256 токенов. CLI отверг ответ. Во всех трёх состояниях ноль готовых результатов и ни одного частичного SRT.</p><div class="mt-5 overflow-x-auto"><table class="measurement"><thead><tr><th>Попытка</th><th>Сохранённые блоки</th><th>Новые запросы</th><th>Причина остановки</th></tr></thead><tbody><tr><td>Исходная v6</td><td>${data.timeout.saved_blocks}/1 024</td><td>${data.timeout.request_count}</td><td>Лимит процесса ${data.timeout.process_timeout_ms / 60_000} минут</td></tr><tr><td>Первая копия</td><td>${data.copied_state.saved_blocks}/1 024</td><td>${data.copied_state.new_model_requests}</td><td>Абсолютный путь к управляемому исходнику</td></tr><tr><td>Проверенная копия</td><td>${data.continuation.saved_blocks}/1 024</td><td>${data.continuation.new_request_count}</td><td>Реплика ${data.continuation.failure_segment_id}: ответ оборвался по лимиту</td></tr></tbody></table></div><p class="mt-4 text-sm text-slate-700">Последний запрос: ${data.continuation.prompt_tokens} входных / ${data.continuation.completion_tokens} выходных токенов, ${data.continuation.request_elapsed_ms} мс; причина завершения <code>${escape(data.continuation.finish_reason)}</code>. Пиковая отслеживаемая рабочая память процессов ${(data.continuation.peak_tracked_working_set_bytes / 1024 ** 3).toFixed(2)} ГиБ. Показание GPU ${data.continuation.peak_device_gpu_mib} МиБ относится ко всему устройству и не доказывает выгрузку слоёв. Синтетический источник и отсутствие независимой проверки не подтверждают качество длинного естественного файла.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${repo}eval/experiments/2026-09-29-long-v6-scene-timeout.md">Первый лимит и условия</a><a class="underline" href="${repo}eval/experiments/2026-09-29-v6-timeout-continuation-v1-failure.md">Отказ первой копии</a><a class="underline" href="${repo}eval/experiments/2026-09-29-long-v6-relocated-continuation-failure.md">Разбор сбоя модели</a><a class="underline" href="${repo}eval/reports/${continuationStem}.json">Сводка и сырой ответ</a><a class="underline" href="${repo}eval/reports/${continuationStem}-journal.json.gz">Все ${data.continuation.total_request_count} запросов</a></div></section>`;
}

export function renderLongV6Postlength(data, escape) {
  const exampleRows = data.examples.map(row => `<tr><th scope="row">${row.segment_id}</th><td lang="zh-Hans">${escape(row.source_zh)}</td><td>${escape(row.candidate_ru)}</td><td>${escape(row.expected_identifier)}</td></tr>`).join('');
  return `<section id="long-v6-postlength" class="my-8 scroll-mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 md:p-7"><p class="text-sm font-semibold text-rose-800">Позднее восстановление · 1 024 реплики · качество не пройдено</p><h2 class="mt-2 text-2xl font-bold">Файл собран, но в тексте потеряны коды</h2><p class="mt-3 max-w-4xl text-slate-700">После сохранённых 982 блоков та же 1.8B-модель завершила копию исходного запуска: ${data.checkpoints_after}/1 024 checkpoints, ${data.text_slot_count} строк, ${data.total_request_count} сырых запросов. Отдельная офлайн-проверка подтвердила порядок реплик, тайминг, защищённые байты и побайтно одинаковый повторный экспорт. Исходная задача завершилась с ошибкой проверочного скрипта; первая офлайн-проверка выявила потерю кодов. Оба сбоя сохранены, поздняя проверка не запускала модель повторно.</p><div class="mt-5 grid gap-3 sm:grid-cols-3"><div class="rounded-xl border border-rose-200 bg-white p-4"><p class="text-sm text-slate-600">Несохранённый код</p><p class="mt-1 text-2xl font-semibold">${data.identifier_violation_count} / ${data.text_slot_count}</p></div><div class="rounded-xl border border-rose-200 bg-white p-4"><p class="text-sm text-slate-600">Реплики с кодом во всех строках</p><p class="mt-1 text-2xl font-semibold">${data.code_preserved_cues} / ${data.cue_count}</p></div><div class="rounded-xl border border-rose-200 bg-white p-4"><p class="text-sm text-slate-600">Новые чаты после 982 блоков</p><p class="mt-1 text-2xl font-semibold">${data.new_chat_count}</p></div></div><p class="mt-4 text-sm text-slate-700">Из 665 нарушений: 656 пропусков, 8 кириллических записей «АУР» и 1 неверный либо повторный ASCII-код. Они есть в начале, середине и конце файла. Это факты внутри переводимых строк, а не форматная структура SRT; структурный результат нельзя считать качественным переводом. Китайско-русский редактор текст не оценивал; источник синтетический.</p><div class="mt-5 overflow-x-auto"><table class="measurement"><thead><tr><th>Реплика</th><th>Китайский исходник</th><th>Сохранённый русский текст</th><th>Ожидаемый код</th></tr></thead><tbody>${exampleRows}</tbody></table></div><p class="mt-4 text-sm text-slate-600">Новые чаты: ${data.new_chat_prompt_tokens} входных / ${data.new_chat_completion_tokens} выходных токенов, ${data.new_chat_elapsed_sum_ms.toLocaleString('ru-RU')} мс суммарного времени запросов. Пик отслеживаемой рабочей памяти ${(data.resources.peak_tracked_working_set_bytes / 1024 ** 3).toFixed(2)} ГиБ. Показание GPU ${data.resources.peak_device_gpu_mib} МиБ относится ко всему устройству. Естественный длинный файл, независимая оценка и выпуск остаются открытыми.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${repo}eval/experiments/2026-09-29-long-v6-postlength-results.md">Ход опыта и ограничения</a><a class="underline" href="${repo}eval/reports/${postlengthStem}-summary.json">Сводка JSON</a><a class="underline" href="${repo}eval/reports/${postlengthStem}-report.json">Все 665 нарушений и строки</a><a class="underline" href="${repo}eval/reports/${postlengthStem}-journal.json.gz">Все 3 847 сырых запросов</a></div></section>`;
}

export function renderLongV6ModelScreen(data, escape) {
  const name = model => model === '1b' ? '1.8B Q4' : '7B Q4';
  const focus = data.focus_rows.map(row => `<tr><td>${escape(row.case_id === 'zh-983-amin-today' ? 'Сегодня, как обычно' : 'Отложено на завтра')}</td><td>${name(row.model)}</td><td>${row.seed}</td><td>${escape(row.candidate)}</td><td>${row.prompt_tokens} / ${row.completion_tokens}</td><td>${row.elapsed_ms}</td></tr>`).join('');
  return `<section id="long-v6-model-screen" class="my-8 scroll-mt-8 rounded-2xl border border-slate-200 bg-white p-5 md:p-7"><p class="text-sm font-semibold text-slate-600">Парное сравнение · REG-006/007 · только авторские примеры</p><h2 class="mt-2 text-2xl font-bold">Одна сцена, две модели, два seed</h2><p class="mt-3 max-w-4xl text-slate-700">Для четырёх вариантов реплики 983 обе модели получили одинаковые китайские текст и контекст; в паре менялся только идентификатор проверенной модели. Все 16 ответов прошли проверку JSON. Более ранний обрыв 1.8B на исходной фразе остаётся отдельной неудачей. В двух ответах 1.8B на явное «сегодня» день отсутствовал, хотя JSON был принят; 7B сохранила его. Это разбор Ули, независимый переводчик не оценивал ответы.</p><div class="mt-5 grid gap-4 md:grid-cols-2">${data.model_summaries.map(row => `<div class="rounded-xl border border-slate-200 p-4"><p class="font-semibold">${name(row.model)}</p><p class="mt-2 text-sm text-slate-700">8/8 структурно · медиана ${row.median_request_ms.toLocaleString('ru-RU')} мс · ${row.prompt_tokens} / ${row.completion_tokens} токенов · пик процессов ${(row.peak_tracked_working_set_bytes / 1024 ** 3).toFixed(2)} ГиБ</p></div>`).join('')}</div><div class="mt-5 overflow-x-auto"><table class="measurement"><thead><tr><th>Исходный факт</th><th>Модель</th><th>Seed</th><th>Сохранённый текст</th><th>Токены вход / выход</th><th>HTTP, мс</th></tr></thead><tbody>${focus}</tbody></table></div><p class="mt-4 text-sm text-slate-600">Для имени 阿华 1.8B написала «Авха», 7B — «А Хуа». В обоих ответах 7B на «послезавтра» встретилось «позавтра»; редакторская приемлемость требует человеческой проверки. Память GPU измерена для всего устройства и не доказывает фактическую выгрузку слоёв. Этот экран не завершает длинный файл и не выбирает релизную модель.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${repo}eval/experiments/2026-09-29-reg-006-paired-model-probe-results.md">Методика, ограничения и числа</a><a class="underline" href="${repo}eval/reports/2026-09-29-reg-006-paired-model-probe.json">Сводка JSON</a><a class="underline" href="${repo}eval/reports/2026-09-29-reg-006-paired-model-probe-requests.jsonl.gz">Все 16 сырых запросов и ответов</a><a class="underline" href="${repo}eval/regressions/long-v6-today-omission-v1.json">REG-007 и контроли</a></div></section>`;
}
