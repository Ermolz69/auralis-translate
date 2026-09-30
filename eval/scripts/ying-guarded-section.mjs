import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = '4577efecda4f51fcdeb0a247c50fc4723e19d6088debb9fc873697c4a0572b30';

export async function loadYingGuarded(root) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-30-commons-ying-guarded-summary.json'));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, expectedSha256);
  const summary = JSON.parse(bytes);
  assert.equal(summary.source_cues, 93);
  assert.equal(summary.durable_checkpoints, 93);
  assert.equal(summary.validated_results, 1);
  assert.equal(summary.offline_reexport, 'byte_identical');
  assert.equal(summary.chat_requests, 93);
  assert.equal(summary.all_http_requests, 282);
  assert.equal(summary.inspected_sources, 6);
  assert.equal(summary.inspected_cues, 811);
  assert.equal(summary.eligible_cues, 0);
  assert.deepEqual(summary.ai_triaged_major_regressions, ['REG-022', 'REG-023']);
  assert.equal(summary.human_bilingual_reviewed_cues, 0);
  assert.equal(summary.human_audio_listening_reviews, 0);
  assert.equal(summary.approved_spoken_script, false);
  assert.equal(summary.release_admitted, false);
  return { sha256, summary };
}

export function renderYingGuarded(data) {
  const row = data.summary;
  return `<section id="ying-guarded" class="my-8 scroll-mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">Следующий запуск · 7B v5 · реальный китайский файл</p><h2 class="mt-2 text-2xl font-bold">Ying: 93/93 структурно, ошибки смысла остаются</h2><p class="mt-3 max-w-4xl text-slate-700">После защиты SRT-чекпойнтов один новый запуск завершил 93 реплики, создал отдельный кандидат и воспроизвёл его побайтно из SQLite. Это технический успех сохранения. ИИ-разбор нашёл две группы серьёзных смысловых ошибок: имена и термин распались на границах реплик (REG-022), отрицательное противопоставление превратилось в утверждение одинаковости (REG-023). Поэтому кандидат не утверждён для озвучки или релиза.</p><div class="mt-4 overflow-x-auto"><table class="measurement"><caption class="mb-3 text-left text-sm text-slate-600">Один запуск 7B на источнике Ying; не сопоставлять с 16-репличным экраном другого источника.</caption><thead><tr><th>Структура</th><th>Chat / HTTP</th><th>Токены вход / выход</th><th>Chat HTTP</th><th>Перевод</th><th>Весь запуск</th><th>Пик working set*</th><th>Пик GPU*</th></tr></thead><tbody><tr><td>${row.durable_checkpoints}/${row.source_cues}, 1 результат</td><td>${row.chat_requests} / ${row.all_http_requests}</td><td>${row.prompt_tokens.toLocaleString('ru-RU')} / ${row.completion_tokens.toLocaleString('ru-RU')}</td><td>${(row.chat_http_ms / 1000).toFixed(1)} с</td><td>${(row.translation_ms / 1000).toFixed(1)} с</td><td>${(row.full_elapsed_ms / 1000).toFixed(1)} с</td><td>${(row.server_working_set_peak_bytes / 1024 ** 3).toFixed(2)} GiB</td><td>${row.whole_device_gpu_used_peak_mib} MiB</td></tr></tbody></table></div><p class="mt-4 text-sm text-slate-700">Теперь осмотрены 6 источников / 811 реплик, допущено 0. Независимая китайско-русская оценка: 0/93; прослушивание итоговой русской речи: 0. Это ИИ-триаж известных окон, без оценки остальных реплик. Подтверждение прав на субтитры, совпадения речи и перевода, рецензент и длинные 10–20-минутные сцены остаются открытыми.</p><p class="mt-3 text-xs text-slate-600">Русский кандидат хранится частно, SHA-256 <code class="hash">${row.candidate_ru_srt_sha256}</code>; редактированный JSON SHA-256 <code class="hash">${data.sha256}</code>. Сырые субтитры, ответы и видео не встроены. * Пики снимались примерно раз в секунду на активной машине; GPU — всё устройство.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-commons-ying-guarded-full-result.md">Разбор и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-30-commons-ying-guarded-summary.json">Редактированный JSON</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/corpora/commons-ying-candidate-v1.json">Недопущенный источник</a></div></section>`;
}
