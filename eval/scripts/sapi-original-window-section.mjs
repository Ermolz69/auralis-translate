import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';
import { loadSapiMultivoice } from './sapi-multivoice-section.mjs';

const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/';
const reportHash = '8c9c6fa877353a6789c59467dfe7d38f2e60c60a288a911b7d6875f848aec0d6';
const playbackHash = '34415cf27baf9536ddb3d93906dc50696e0f7e0f142d1333d4eb101fface7325';

export async function loadSapiOriginalWindow(root) {
  const reportBytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-29-sapi-original-window-fit-report.json'));
  const playbackBytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-29-sapi-original-window-fit-playback.json'));
  assert.equal(digest(reportBytes), reportHash);
  assert.equal(digest(playbackBytes), playbackHash);
  const report = JSON.parse(reportBytes);
  const playback = JSON.parse(playbackBytes);
  const source = await loadSapiMultivoice(root);
  assert.equal(report.source_probe_sha256, source.report_sha256);
  assert.equal(report.experiment_id, 'SAPI-ORIGINAL-WINDOW-TEMPO-2026-09-29-v1');
  assert.equal(report.status, 'passed_technical_probe');
  assert.equal(report.human_listening_review, 'not_performed');
  assert.equal(report.production_media_pipeline, 'not_implemented');
  assert.deepEqual(report.original_windows_ms, [[0, 2400], [2400, 4300]]);
  assert.equal(report.fitted.length, 2);
  for (const [index, fitted] of report.fitted.entries()) {
    assert.equal(fitted.voice_id, source.segments[index].voice_id);
    assert.equal(fitted.original_sha256, source.segments[index].sha256);
    assert.equal(fitted.original_duration_ms, source.segments[index].duration_ms);
    assert.equal(fitted.window_ms, source.segments[index].end_ms - source.segments[index].start_ms);
    assert(fitted.fitted_duration_ms > 0 && fitted.fitted_duration_ms <= fitted.window_ms);
  }
  assert.deepEqual(report.fitted.map(row => row.fitted_duration_ms), [2316, 1812]);
  assert.equal(report.output_sha256,
    '21167f4b9fc70afafeed598c183813d803a05840ede7d94385695fd91cca8fd1');
  assert(report.decoded_audio.first.rms > 200 && report.decoded_audio.second.rms > 200);
  assert.equal(report.decoded_audio.seam.rms, 0);
  assert.equal(report.decoded_audio.all.clipped_samples, 0);
  assert.equal(playback.clip_sha256, report.output_sha256);
  assert.equal(playback.status, 'player_process_completed');
  assert.equal(playback.human_listening_review, 'not_performed');
  return { experiment_id: report.experiment_id, report_sha256: reportHash,
    playback_sha256: playbackHash, output_sha256: report.output_sha256,
    fitted: report.fitted.map(row => ({ voice_id: row.voice_id,
      original_duration_ms: row.original_duration_ms, window_ms: row.window_ms,
      tempo_factor: row.tempo_factor, fitted_duration_ms: row.fitted_duration_ms })),
    decoded_audio: report.decoded_audio,
    playback_status: playback.status,
    human_listening_review: report.human_listening_review,
    status: 'technical_unreviewed_unselected' };
}

export function renderSapiOriginalWindow(data) {
  return `<section id="voice-original-window" class="my-8 scroll-mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">Реальный SAPI · отдельный технический кандидат VOICE-03</p><h2 class="mt-2 text-2xl font-bold">Два голоса уложены в исходные окна ускорением</h2><p class="mt-3 max-w-4xl text-slate-700">Те же настоящие WAV без изменения слов: Irina ${data.fitted[0].original_duration_ms} → ${data.fitted[0].fitted_duration_ms} мс при окне ${data.fitted[0].window_ms} мс и ускорении ${data.fitted[0].tempo_factor.toFixed(2)}×; Pavel ${data.fitted[1].original_duration_ms} → ${data.fitted[1].fitted_duration_ms} мс при окне ${data.fitted[1].window_ms} мс и ${data.fitted[1].tempo_factor.toFixed(2)}×. Пятсекундный MP4 декодирован, оба участка слышимы по уровню сигнала, на проверенном стыке тишина, клиппинга нет. FFplay завершил воспроизведение файла с тем же SHA-256.</p><p class="mt-3 max-w-4xl text-slate-700">Ускорение велико, человек не слушал и не оценивал разборчивость или естественность. Это авторский синтетический пример без утверждённого перевода, прав на публикацию голосовых байтов и производственного монтажа. WAV и MP4 остаются приватными; A1–A6 открыты.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${repo}eval/experiments/2026-09-29-sapi-original-window-fit.md">Методика и ограничения (EN)</a><a class="underline" href="${repo}eval/reports/2026-09-29-sapi-original-window-fit-report.json">Машинный отчёт JSON</a><a class="underline" href="${repo}eval/reports/2026-09-29-sapi-original-window-fit-playback.json">Запись воспроизведения JSON</a></div></section>`;
}
