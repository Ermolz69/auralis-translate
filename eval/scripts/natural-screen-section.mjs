import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = '37a604deb8c8a25e478097123e9e844eaa23a47d1eb9f4f76cee9b5182d6efb5';

export async function loadNaturalScreen(root) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-29-mingfay-natural-summary.json'));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, expectedSha256);
  const summary = JSON.parse(bytes);
  assert.equal(summary.candidate_source_sha256,
    '42109fc054cba93b0ef343853628b6a248b31664786d579bdefa415ccaacf9ee');
  assert.equal(summary.release_denominator, 0);
  assert.equal(summary.human_review, 'not_performed');
  assert.deepEqual(summary.variants.map(row => row.model), ['1b', '7b']);
  for (const row of summary.variants) {
    assert.equal(row.accepted_cues, 16);
    assert.equal(row.chats, 16);
    assert.equal(row.preflights, 32);
    assert.equal(row.failure_count, 0);
  }
  assert.deepEqual(summary.variants[0].source_windows, summary.variants[1].source_windows);
  return { sha256, summary };
}

export function renderNaturalScreen(data) {
  const rows = data.summary.variants.map(row => `<tr><th scope="row">Hy-MT2 ${row.model === '1b' ? '1.8B' : '7B'} Q4</th><td>${row.accepted_cues}/16</td><td>${row.prompt_tokens} / ${row.completion_tokens}</td><td>${Math.round(row.chat_http_ms).toLocaleString('ru-RU')} мс</td><td>${(row.run_wall_ms / 1000).toFixed(1)} с</td><td>${(row.sampled_working_set_peak_bytes / 1024 ** 3).toFixed(2)} GiB</td><td>${row.sampled_device_gpu_used_peak_mib} MiB</td></tr>`).join('');
  return `<section id="natural-screen" class="my-8 scroll-mt-8 rounded-2xl border border-slate-200 bg-white p-5 md:p-7"><p class="text-sm font-semibold text-blue-800">DATA-03 / CTX-02 · реальный китайский текст, частный кандидат</p><h2 class="mt-2 text-2xl font-bold">Одинаковые 16 реплик: 1.8B и 7B</h2><p class="mt-3 max-w-4xl text-slate-700">Из 230 реплик ролика взяты начало, середина, граница переставленной реплики и конец — по четыре подряд, с исходными таймкодами. Обе модели сохранили структуру 16/16, а все сырые запросы и принятые строки сверены с SQLite. Это техническая проверка, не оценка качества всего файла: права и совпадение речи с субтитрами не установлены, медиа-загрузка остановилась на HTTP 403, независимых оценок нет.</p><div class="mt-4 overflow-x-auto"><table class="measurement"><caption class="mb-3 text-left text-sm text-slate-600">Один запуск на модель. HTTP — сумма 16 запросов перевода; полное время включает запуск модели и проверки. GPU — память всего устройства.</caption><thead><tr><th>Модель</th><th>Структура</th><th>Токены вход / выход</th><th>Chat HTTP</th><th>Полное время</th><th>Пик working set*</th><th>Пик GPU*</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-4 text-sm text-slate-700"><strong>ИИ-разбор двух конкретных ошибок:</strong> 1.8B подменила курьера и доставку таксистом и выдумала обращение к букмекерам в прощании. В этих двух местах 7B сохранила смысл. Остальные реплики не прошли полный смысловой разбор. Человеческая оценка: 0/16; допущенный корпус: 0 реплик. REG-018/019 сохраняют точные частные воспроизведения и новые контрольные случаи.</p><p class="mt-3 text-xs text-slate-500">Редактированный сводный JSON SHA-256: <code class="hash">${data.sha256}</code>. Сырой текст субтитров, запросы, ответы и медиа не опубликованы.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-mingfay-natural-model-screen-results.md">Методика и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-29-mingfay-natural-summary.json">Редактированный JSON</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-mingfay-media-download-failure.md">Неудача загрузки медиа (EN)</a></div><p class="mt-2 text-xs text-slate-500">* Пики снимались примерно раз в секунду на активной машине.</p></section>`;
}
