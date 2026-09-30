import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = '96776d6385f5c207a6489c8197a762d84eeef96c4a6e2f83c73caafc861cec90';

export async function loadVivoFull(root) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-30-commons-vivo-full-summary.json'));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, expectedSha256);
  const summary = JSON.parse(bytes);
  assert.equal(summary.source_cues, 467);
  assert.equal(summary.durable_checkpoints, 467);
  assert.equal(summary.validated_results, 1);
  assert.equal(summary.first_failed_cue, 276);
  assert.equal(summary.saved_prefix_preserved, 275);
  assert.equal(summary.offline_reexport, 'byte_identical');
  assert.equal(summary.first_attempt.chat_requests, 276);
  assert.equal(summary.resume_attempt.chat_requests, 192);
  assert.equal(summary.first_attempt.all_http_requests, 831);
  assert.equal(summary.resume_attempt.all_http_requests, 579);
  assert.equal(summary.ai_source_selected_reviewed_cues, 62);
  assert.deepEqual(summary.ai_triaged_major_regressions,
    ['REG-024', 'REG-025', 'REG-026', 'REG-027']);
  assert.equal(summary.human_bilingual_reviewed_cues, 0);
  assert.equal(summary.human_audio_listening_reviews, 0);
  assert.equal(summary.approved_spoken_script, false);
  assert.equal(summary.release_admitted, false);
  assert.equal(summary.rights_decision, 'unknown');
  return { sha256, summary };
}

export function renderVivoFull(data) {
  const row = data.summary;
  const rows = [row.first_attempt, row.resume_attempt]
    .map((attempt, index) => `<tr><th scope="row">${index === 0 ? 'Первый, отказ на 276' : 'Копия, продолжение'}</th><td>${attempt.chat_requests} / ${attempt.all_http_requests}</td><td>${attempt.prompt_tokens.toLocaleString('ru-RU')} / ${attempt.completion_tokens.toLocaleString('ru-RU')}</td><td>${(attempt.translation_ms / 1000).toFixed(1)} с</td><td>${(attempt.full_elapsed_ms / 1000).toFixed(1)} с</td><td>${(attempt.server_working_set_peak_bytes / 1024 ** 3).toFixed(2)} GiB</td><td>${attempt.whole_device_gpu_used_peak_mib} MiB</td></tr>`)
    .join('');
  return `<section id="vivo-full" class="my-8 scroll-mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">18:36 интервью · 7B v5 · реальный длинный файл</p><h2 class="mt-2 text-2xl font-bold">467/467 после восстановления, качество перевода не принято</h2><p class="mt-3 max-w-4xl text-slate-700">Первый проход остановился на реплике 276: модель поместила хвост JSON внутрь текста. Защита SRT оставила 275 надёжных контрольных точек и не создала частичный файл. Один ограниченный запуск из проверенной копии SQLite сохранил эти точки, завершил все 467 реплик и дал побайтно одинаковый офлайн-экспорт. Это проверка структуры и восстановления, не качества языка.</p><div class="mt-4 overflow-x-auto"><table class="measurement"><caption class="mb-3 text-left text-sm text-slate-600">Один исходный и один скопированный запуск той же модели/профиля; время и память измерены отдельно.</caption><thead><tr><th>Попытка</th><th>Chat / HTTP</th><th>Токены вход / выход</th><th>Команда перевода</th><th>Весь запуск</th><th>Пик working set*</th><th>Пик GPU*</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-4 text-slate-700">Источник выбран по началу, середине, концу, числам и отрицаниям: ИИ проверил ${row.ai_source_selected_reviewed_cues}/${row.source_cues} реплик и отметил REG-024–027, включая неверные время, числовые факты, состав команды и смысл будущего сотрудничества. Правило поиска отрицаний исправлено после ложного срабатывания на «очень». Человеческая китайско-русская оценка: 0/467; человеческое прослушивание: 0. Права Commons не подтверждены, исходный звук и субтитры ждут сверки, сценарий озвучки не утверждён.</p><p class="mt-3 text-xs text-slate-600">Приватный русский кандидат SHA-256 <code class="hash">${row.candidate_ru_srt_sha256}</code>; редактированный JSON SHA-256 <code class="hash">${data.sha256}</code>. Исходные и русские строки, видео, WAV и сырые ответы не опубликованы. * Пики снимались на активной машине; GPU — использование всего устройства.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-commons-vivo-full-7b-resume-result.md">Восстановление и замеры (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-commons-vivo-source-aware-ai-triage.md">ИИ-разбор и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-30-commons-vivo-full-summary.json">Редактированный JSON</a></div></section>`;
}
