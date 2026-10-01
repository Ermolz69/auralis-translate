import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = '3599109458baf971169eb51a4da44b08deeb600da21ab59c6fb63d0c56d4395f';

export async function loadSethluiAudio(root) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/2026-10-01-sethlui-real-audio-summary.json'));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, expectedSha256);
  const summary = JSON.parse(bytes);
  assert.equal(summary.probe_id, 'VOICE-SETHLUI-MEDIA-TECH-2026-10-01-v1');
  assert.equal(summary.cue_count, 263);
  assert.equal(summary.overrun_count, 256);
  assert.equal(summary.overlap_start_count, 236);
  assert.equal(summary.wav_clipped_samples, 0);
  assert.equal(summary.fit_at_most_2x, 158);
  assert.equal(summary.fit_end_margin_ms, 75);
  assert.equal(summary.tempo_policy_approved, false);
  assert.equal(summary.audition_windows, 6);
  assert.equal(summary.audition_paired_clips, 12);
  assert.equal(summary.audition_distinct_cues, 49);
  assert.equal(summary.audition_human_review, 'not_performed');
  assert.equal(summary.source_media_duration_ms, 738056);
  assert.equal(summary.decoded_audio_ms, 738056);
  assert.equal(summary.maximum_packet_gap_ms, 1);
  assert.equal(summary.output_clipped_samples, 0);
  assert.equal(summary.player_process, 'completed');
  assert(Math.abs(summary.full_playback_ms - summary.source_media_duration_ms) < 10000);
  assert.equal(summary.human_bilingual_review, 'missing');
  assert.equal(summary.human_listening_review, 'missing');
  assert.equal(summary.approved_spoken_script, false);
  assert.equal(summary.cue_fit_admitted, false);
  assert.equal(summary.release_admitted, false);
  return { sha256, summary };
}

export function renderSethluiAudio(data) {
  const value = data.summary;
  return `<section id="sethlui-real-audio" class="my-8 scroll-mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">Auralis · тот же китайский источник · реальный SAPI · технический результат</p><h2 class="mt-2 text-2xl font-bold">263 WAV и полный ролик; укладка и оценка звука открыты</h2><p class="mt-3 max-w-4xl text-slate-700">Черновой русский перевод 7B с того же 12:18 китайского SRT озвучен установленным голосом Microsoft Irina Desktop: ${value.cue_count}/${value.cue_count} реальных WAV за ${value.tts_elapsed_ms.toLocaleString('ru-RU')} мс. Независимая проверка прочитала каждый WAV и сверила хеши. В ${value.overrun_count} репликах речь длиннее исходного окна, ${value.overlap_start_count} начал накладываются на предыдущую речь; наибольшее превышение — ${value.max_overrun_ms.toLocaleString('ru-RU')} мс. Укладка не прошла. При 75-мс запасе даже гипотетические 2× уместили бы лишь ${value.fit_at_most_2x}/${value.cue_count} реплик; приемлемость темпа никто не оценивал на слух.</p><p class="mt-3 max-w-4xl text-slate-700">Из всех WAV и исходного VP9-видео собран приватный MKV. Декодированная дорожка покрывает ${value.decoded_audio_ms.toLocaleString('ru-RU')} мс из ${value.source_media_duration_ms.toLocaleString('ru-RU')} мс исходника, максимальный разрыв между ${value.audio_packet_count.toLocaleString('ru-RU')} аудиопакетами — ${value.maximum_packet_gap_ms} мс; клиппированных отсчётов нет. Полный процесс FFplay завершился за ${value.full_playback_ms.toLocaleString('ru-RU')} мс. Это проверка воспроизведения процессом, а не прослушивание человеком.</p><p class="mt-3 max-w-4xl text-slate-700">Китайско-русский рецензент и слушатели отсутствуют. В черновике остаются ошибка роли специалиста по димсам и непоследовательное название заведения (REG-044). Соответствие китайской речи таймкодам и права на озвучку не установлены; сценарий, голосовой баланс и три сцены не утверждены. G1–G9, A1–A6 и RELEASE-05 остаются открытыми; частное видео не публикуется.</p><p class="mt-3 text-xs text-slate-600">Приватное медиа SHA-256 <code class="hash">${value.media_sha256}</code>; публичный JSON SHA-256 <code class="hash">${data.sha256}</code>.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-sethlui-real-audio-technical-result.md">Протокол и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-sethlui-audio-fit-feasibility-result.md">Укладка: расчёт (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-10-01-sethlui-real-audio-summary.json">Агрегированные замеры JSON</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-release-readiness-after-sethlui-audio.md">Неполный аудит (EN)</a></div></section>`;
}

export function renderSethluiAudition(data) {
  const value = data.summary;
  return `<section id="sethlui-audition" class="my-8 scroll-mt-8 rounded-2xl border border-slate-300 bg-slate-50 p-5 md:p-7"><p class="text-sm font-semibold text-slate-600">Подготовка проверки звука · приватные данные</p><h2 class="mt-2 text-2xl font-bold">${value.audition_windows} окон, ${value.audition_paired_clips} звуковых фрагментов, 0 слушателей</h2><p class="mt-3 max-w-4xl text-slate-700">Для будущего независимого прослушивания подготовлены парные фрагменты оригинала и русского микса: ${value.audition_distinct_cues} реплик начала, середины и конца, включая имя, числа, отрицание, повтор названия и конец ролика. Все ${value.audition_paired_clips} приватных Opus-файлов декодированы и сверены с исходными субтитрами. Анкета остаётся пустой; оценок понятности, естественности, смысла и соответствия китайской речи нет. Пакет не даёт права считать звук или три сцены принятыми.</p><p class="mt-3 text-xs text-slate-600">Приватный отчёт SHA-256 <code class="hash">${value.audition_packet_report_sha256}</code>; сами фрагменты не опубликованы.</p><a class="mt-3 inline-block text-sm font-semibold text-blue-700 underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-sethlui-private-audition-packet-result.md">Выборка, проверки и ограничения (EN)</a></section>`;
}
