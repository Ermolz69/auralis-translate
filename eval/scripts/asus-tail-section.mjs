import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const asusSha256 = '2b1c90704c8680c72c57588ddd15328449eb4cbb223932d07d9229b48fd72113';
const temperatureSha256 = '55482e9cdf29a5ce09ee6c5b0b450a58445a0747029aac12d6a9d7367e91e406';

export async function loadAsusTail(root) {
  const asusBytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-30-asus-long-failure-summary.json'));
  const temperatureBytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-30-json-tail-temperature-summary.json'));
  assert.equal(createHash('sha256').update(asusBytes).digest('hex'), asusSha256);
  assert.equal(createHash('sha256').update(temperatureBytes).digest('hex'),
    temperatureSha256);
  const asus = JSON.parse(asusBytes);
  const temperature = JSON.parse(temperatureBytes);
  assert.equal(asus.source_cues, 268);
  assert.equal(asus.initial.saved_checkpoints, 226);
  assert.equal(asus.initial.complete_results, 0);
  assert.equal(asus.resume.saved_checkpoints, 226);
  assert.equal(asus.resume.complete_results, 0);
  assert.equal(asus.initial.partial_srt_published, false);
  assert.equal(asus.resume.partial_srt_published, false);
  assert.equal(temperature.variant_requests, 8);
  assert.equal(temperature.variant_structural_valid, 6);
  assert.equal(temperature.sources[0].variant_valid, 0);
  assert.equal(temperature.sources[1].variant_valid, 2);
  assert.equal(temperature.profile_promoted, false);
  assert.equal(asus.human_bilingual_reviewed_cues, 0);
  assert.equal(temperature.human_reviewed_cues, 0);
  return { asus, temperature, asus_sha256: asusSha256,
    temperature_sha256: temperatureSha256 };
}

export function renderAsusTail(data) {
  const { asus, temperature } = data;
  return `<section id="asus-tail" class="my-8 scroll-mt-8 rounded-2xl border border-amber-300 bg-amber-50/60 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">LONG-04 · вторая естественная сцена · не принято</p><h2 class="mt-2 text-2xl font-bold">ASUS: 226 из 268 сохранены, дефект модели повторился</h2><p class="mt-3 max-w-4xl text-slate-700">На китайских субтитрах 14:42 видео 7B v5 остановилась на реплике 227: в русский текст попал хвост JSON. Проверка сохранила 226 контрольных точек и не выпустила частичный SRT. Восстановление из копии SQLite повторило ошибку на том же запросе с другим русским текстом. Исходный неудачный прогон сохранён; полный перевод ASUS пока отсутствует.</p><div class="mt-4 overflow-x-auto"><table class="measurement"><caption class="mb-3 text-left text-sm text-slate-600">Замеры отдельных запусков; это проверка структуры, не качества перевода.</caption><thead><tr><th>Попытка</th><th>Сохранено</th><th>Запросы chat / HTTP</th><th>Токены вход / выход</th><th>Результат</th></tr></thead><tbody><tr><th scope="row">Первый полный проход</th><td>${asus.initial.saved_checkpoints}/${asus.source_cues}</td><td>${asus.initial.chat_requests} / ${asus.initial.http_requests}</td><td>${asus.initial.prompt_tokens.toLocaleString('ru-RU')} / ${asus.initial.completion_tokens.toLocaleString('ru-RU')}</td><td>Стоп на 227; итогового SRT нет</td></tr><tr><th scope="row">Копия и продолжение</th><td>${asus.resume.saved_checkpoints}/${asus.source_cues}</td><td>${asus.resume.chat_requests} / 6</td><td>305 / 65</td><td>Тот же дефект; итогового SRT нет</td></tr></tbody></table></div><p class="mt-4 text-slate-700">Проверка температуры на тех же проблемных окнах и соседних репликах: 8 новых запросов, ${temperature.variant_structural_valid}/8 прошли строгую грамматику SRT. При температуре 0 хвост остался в ASUS 2/2 раза; Vivo прошёл структуру 2/2, но ИИ-разбор всё ещё нашёл неверную привязку 36 месяцев. Профиль не изменён. Человеческая оценка: 0; права и совпадение речи с субтитрами не подтверждены.</p><p class="mt-2 text-xs text-slate-600">Первый ASUS перевод: ${(asus.initial.translation_command_ms / 1000).toFixed(1)} с, измеренный пик working set ${(asus.initial.sampled_server_working_set_peak_bytes / 1024 ** 3).toFixed(2)} GiB; GPU ${asus.initial.sampled_whole_device_gpu_memory_peak_mib} MiB — всего устройства. Температурный экран: ${temperature.prompt_tokens.toLocaleString('ru-RU')} / ${temperature.completion_tokens.toLocaleString('ru-RU')} токенов, сумма chat HTTP ${(temperature.summed_chat_http_ms / 1000).toFixed(1)} с. Сырые ответы, субтитры и медиа не опубликованы.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-commons-asus-full-7b-failure.md">Первый отказ (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-commons-asus-resume-failure.md">Восстановление (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-json-tail-temperature-screen-result.md">Сравнение температуры (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-30-json-tail-temperature-summary.json">Редактированный JSON</a></div></section>`;
}
