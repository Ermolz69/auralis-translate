import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const timeoutStem = '2026-09-29-long-v6-scene-timeout';
const continuationStem = '2026-09-29-long-v6-relocated-continuation-failure';
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

export function renderLongV6Outcomes(data, escape) {
  return `<section id="long-v6-outcomes" class="my-8 scroll-mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-800">Инженерный опыт · v6 · не пройден</p><h2 class="mt-2 text-2xl font-bold">1 024 реплики: сохранение есть, полного перевода нет</h2><p class="mt-3 max-w-4xl text-slate-700">На том же авторском китайском SRT схема v6 связала ответ с целью: ранее ошибочный ID на реплике 72 не повторился в одном наблюдении. Первый длинный прогон остановил лимит тестового процесса на 964/1 024 блоках. Копия базы с прежним абсолютным путём исходника была отвергнута до инференса. После проверенного переноса пути в копии модель дошла до 982/1 024, затем на реплике 983 повторяла испорченный JSON и инструкции до лимита 256 токенов. CLI отверг ответ. Во всех трёх состояниях ноль готовых результатов и ни одного частичного SRT.</p><div class="mt-5 overflow-x-auto"><table class="measurement"><thead><tr><th>Попытка</th><th>Сохранённые блоки</th><th>Новые запросы</th><th>Причина остановки</th></tr></thead><tbody><tr><td>Исходная v6</td><td>${data.timeout.saved_blocks}/1 024</td><td>${data.timeout.request_count}</td><td>Лимит процесса ${data.timeout.process_timeout_ms / 60_000} минут</td></tr><tr><td>Первая копия</td><td>${data.copied_state.saved_blocks}/1 024</td><td>${data.copied_state.new_model_requests}</td><td>Абсолютный путь к управляемому исходнику</td></tr><tr><td>Проверенная копия</td><td>${data.continuation.saved_blocks}/1 024</td><td>${data.continuation.new_request_count}</td><td>Реплика ${data.continuation.failure_segment_id}: ответ оборвался по лимиту</td></tr></tbody></table></div><p class="mt-4 text-sm text-slate-700">Последний запрос: ${data.continuation.prompt_tokens} входных / ${data.continuation.completion_tokens} выходных токенов, ${data.continuation.request_elapsed_ms} мс; причина завершения <code>${escape(data.continuation.finish_reason)}</code>. Пиковая отслеживаемая рабочая память процессов ${(data.continuation.peak_tracked_working_set_bytes / 1024 ** 3).toFixed(2)} ГиБ. Показание GPU ${data.continuation.peak_device_gpu_mib} МиБ относится ко всему устройству и не доказывает выгрузку слоёв. Синтетический источник и отсутствие независимой проверки не подтверждают качество длинного естественного файла.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${repo}eval/experiments/2026-09-29-long-v6-scene-timeout.md">Первый лимит и условия</a><a class="underline" href="${repo}eval/experiments/2026-09-29-v6-timeout-continuation-v1-failure.md">Отказ первой копии</a><a class="underline" href="${repo}eval/experiments/2026-09-29-long-v6-relocated-continuation-failure.md">Разбор сбоя модели</a><a class="underline" href="${repo}eval/reports/${continuationStem}.json">Сводка и сырой ответ</a><a class="underline" href="${repo}eval/reports/${continuationStem}-journal.json.gz">Все ${data.continuation.total_request_count} запросов</a></div></section>`;
}
