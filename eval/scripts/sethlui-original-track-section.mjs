import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadSethluiOriginalTrack(root) {
  const report = JSON.parse(await fs.readFile(path.join(root,
    'eval/reports/2026-10-01-sethlui-original-track-summary.json'), 'utf8'));
  assert.equal(report.schema_version, 1);
  assert.equal(report.video_id, 'yvCR-EqMhng');
  assert.equal(report.youtube_srt_sha256,
    '4e5e55ec5f50dad128391d1b907e9d0ba51e9fda1c40b13a828ae1d806d380d4');
  assert.equal(report.commons_srt_sha256,
    '077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967');
  assert.equal(report.youtube_bytes, report.commons_prefix_bytes + report.youtube_extra_final_lf_bytes);
  assert.equal(report.original_cues - report.mapped_derivative_cues, report.out_of_media_cues);
  assert.equal(report.first_out_of_media_cue, report.mapped_derivative_cues + 1);
  assert.equal(report.media_duration_ms, 738056);
  assert.equal(report.independent_speech_reviews, 0);
  assert.equal(report.caption_rights_decision, 'unknown');
  assert.equal(report.source_admitted, false);
  return report;
}

export function renderSethluiOriginalTrack(report) {
  return `<aside id="sethlui-original-track" class="mb-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 md:p-7"><h3 class="text-lg font-bold text-slate-900">Сверка с оригинальной дорожкой YouTube</h3><p class="mt-2 max-w-4xl text-sm text-slate-700">Метаданные ролика ${report.video_id} называют лицензию видео «Creative Commons Attribution license (reuse allowed)» и содержат китайскую дорожку SRT. Дорожка из ${report.original_cues} реплики совпадает с копией Commons побайтно до последних двух переводов строки. Реплики ${report.first_out_of_media_cue}–${report.original_cues} находятся за концом видео и уже присутствовали на YouTube. Отдельная производная содержит первые ${report.mapped_derivative_cues} реплики. Авторство и права китайских субтитров, совпадение речи и независимая оценка остаются непроверенными; источник не допущен.</p><p class="mt-3 text-sm text-slate-700">Поправка к результатам 7B: исторический исполняемый файл подтвердил отказ проверки SRT, но его нельзя считать проверкой нового защитного правила провайдера. Текущий код покрыт отдельным тестом; повторного запуска модели не было.</p><p class="mt-3 text-xs text-slate-600">YouTube SRT SHA-256: <code class="hash">${report.youtube_srt_sha256}</code>. В отчёте нет строк исходника или медиа.</p><p class="mt-3 text-sm"><a class="font-semibold text-blue-700 underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-sethlui-youtube-caption-result.md">Протокол, байты и ограничения (EN)</a> · <a class="font-semibold text-blue-700 underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-sethlui-cli-provenance-audit.md">Поправка к происхождению CLI (EN)</a></p></aside>`;
}
