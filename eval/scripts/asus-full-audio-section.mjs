import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = '0edc413cbbaac55dfdea43711d712a9dfb163290fb1bda2d8ccce49b8278ea1a';

export async function loadAsusFullAudio(root) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-30-asus-full-audio-summary.json'));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, expectedSha256);
  const summary = JSON.parse(bytes);
  assert.equal(summary.probe_id, 'VOICE-ASUS-FULL-TECH-2026-09-30-v1');
  assert.equal(summary.cue_count, 268);
  assert.equal(summary.overrun_count, 264);
  assert.equal(summary.overlap_start_count, 259);
  assert.equal(summary.wav_clipped_samples, 0);
  assert.deepEqual(summary.failed_media_variants.map(row => row.variant), ['v1', 'v2']);
  assert.equal(summary.media_variant, 'v3');
  assert.equal(summary.media_duration_ms, 882231);
  assert.equal(summary.decoded_audio_ms, 882223);
  assert.equal(summary.maximum_packet_gap_ms, 1);
  assert.equal(summary.output_clipped_samples, 0);
  assert.equal(summary.player_process, 'completed');
  assert(Math.abs(summary.full_playback_ms - summary.media_duration_ms) < 10000);
  assert.equal(summary.human_bilingual_review, 'missing');
  assert.equal(summary.human_listening_review, 'missing');
  assert.equal(summary.approved_spoken_script, false);
  assert.equal(summary.release_admitted, false);
  return { sha256, summary };
}

export function renderAsusFullAudio(data) {
  const value = data.summary;
  return `<section id="asus-full-audio" class="my-8 scroll-mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">Auralis · 14:42 · реальный SAPI · технический опыт</p><h2 class="mt-2 text-2xl font-bold">268 WAV и полный ролик; укладка речи не прошла</h2><p class="mt-3 max-w-4xl text-slate-700">На одном исходном ASUS-файле Auralis синтезировал все 268 реплик настоящим русским SAPI за ${value.tts_elapsed_ms.toLocaleString('ru-RU')} мс. Каждая WAV и исходный видеопоток проверены по SHA-256. ${value.overrun_count} из 268 реплик длиннее своих окон; ${value.overlap_start_count} начал накладываются на предыдущую речь. Максимальное превышение — ${value.max_overrun_ms.toLocaleString('ru-RU')} мс. Это черновой перевод с известными ошибками фактов, а не утверждённый сценарий.</p><p class="mt-3 max-w-4xl text-slate-700">Первая сборка потеряла последние 14,147 мс звука. Во второй звук сохранился, но временные метки растянули контейнер до 896,370 мс. Обе неудачи оставлены в журнале; регрессии проверяют короткую дорожку и разрыв меток. Третья сборка имеет VP9/Opus, ${value.media_duration_ms.toLocaleString('ru-RU')} мс контейнера против 882,223 мс оригинала, ${value.decoded_audio_ms.toLocaleString('ru-RU')} мс декодированного звука, максимальный разрыв пакетов ${value.maximum_packet_gap_ms} мс и 0 клиппированных отсчётов. Полный FFplay-процесс завершился за ${value.full_playback_ms.toLocaleString('ru-RU')} мс.</p><p class="mt-3 max-w-4xl text-slate-700">Завершение плеера не является прослушиванием. Китайско-русский рецензент, слушатели, проверка речи с таймкодами и правами, адаптация текста и чистая Windows-машина остаются нужны. A1–A6 и G1–G9 открыты; аудио и исходники не опубликованы.</p><p class="mt-3 text-xs text-slate-600">Приватное медиа SHA-256 <code class="hash">${value.media_sha256}</code>; публичный редактированный JSON SHA-256 <code class="hash">${data.sha256}</code>.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-asus-full-audio-technical-result.md">Методика и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-30-asus-full-audio-summary.json">Редактированный JSON</a></div></section>`;
}
