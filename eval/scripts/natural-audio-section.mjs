import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = 'ed9897698b6370994eb7a5e25ae681f782d5b57387e554ce00d95a4f959a31e9';

export async function loadNaturalAudio(root) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-30-ying-natural-audio-summary.json'));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, expectedSha256);
  const summary = JSON.parse(bytes);
  assert.equal(summary.auralis_local_commit, 'b6991e6');
  assert.deepEqual(summary.cues.map(row => row.id), [1, 41, 93]);
  assert(summary.cues.every(row => row.overrun_ms === row.wav_duration_ms - row.window_ms
    && row.overrun_ms > 0 && row.clipped_samples === 0));
  assert.equal(summary.media_duration_ms, 217904);
  assert.equal(summary.decoded_audio_clipped_samples, 0);
  assert.equal(summary.cue_fit, 'failed');
  assert.equal(summary.player_process, 'completed');
  assert(Math.abs(summary.full_playback_ms - summary.media_duration_ms) < 5000);
  assert.equal(summary.human_bilingual_review, 'missing');
  assert.equal(summary.human_listening_review, 'missing');
  assert.equal(summary.approved_spoken_script, false);
  assert.equal(summary.release_admitted, false);
  return { sha256, summary };
}

export function renderNaturalAudio(data) {
  const report = data.summary;
  const rows = report.cues.map(row => `<tr><th scope="row">${row.id}</th><td>${row.window_ms.toLocaleString('ru-RU')} мс</td><td>${row.wav_duration_ms.toLocaleString('ru-RU')} мс</td><td>+${row.overrun_ms.toLocaleString('ru-RU')} мс</td><td>${row.clipped_samples}</td></tr>`).join('');
  return `<section id="natural-audio" class="my-8 scroll-mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">Auralis · реальный TTS и исходное видео · технический опыт</p><h2 class="mt-2 text-2xl font-bold">Три реальные реплики озвучены и воспроизведены, укладка не прошла</h2><p class="mt-3 max-w-4xl text-slate-700">Auralis через существующий адаптер Windows SAPI создал WAV для реплик 1, 41 и 93 из файла Ying. Проверены оригинальный китайский SRT, отдельный русский кандидат и соответствующее видео. Это выборка начала, середины и конца, а не утверждённые сцены. Русский кандидат имеет серьёзные ошибки REG-022/023 и не проходил независимую проверку.</p><div class="mt-4 overflow-x-auto"><table class="measurement"><caption class="mb-3 text-left text-sm text-slate-600">Оригинальные окна и декодированные WAV; текст и скорость речи не менялись.</caption><thead><tr><th>Реплика</th><th>Окно</th><th>Речь</th><th>Превышение</th><th>Клиппинг WAV</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-4 text-sm text-slate-700">Оригинальный видеопоток VP9 и три русских WAV смешаны в приватный Matroska с Opus. Оба потока полностью декодированы; итоговое аудио: 0 клиппированных отсчётов. Длительность ${report.media_duration_ms.toLocaleString('ru-RU')} мс; полный FFplay-проход завершился за ${report.full_playback_ms.toLocaleString('ru-RU')} мс. Завершение плеера подтверждает техническое воспроизведение, но человеческое прослушивание и оценка разборчивости отсутствуют. Все три реплики превышают таймкоды, поэтому A1–A6 открыты.</p><p class="mt-3 text-xs text-slate-600">Приватное видео SHA-256 <code class="hash">${report.media_sha256}</code>; проверенный редактированный JSON SHA-256 <code class="hash">${data.sha256}</code>. Медиа, китайские субтитры, русский текст и WAV не размещены на Pages.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-ying-natural-audio-technical-result.md">Методика и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-30-ying-natural-audio-summary.json">Редактированный JSON</a></div></section>`;
}
