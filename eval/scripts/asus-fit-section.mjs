import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadAsusFit(root) {
  const bytes = await fs.readFile(path.join(root, 'eval/reports/2026-10-01-asus-fit-summary.json'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    'f30abab3b512e9b7b8e9c38e41658f1c09cd5e78c8b68aa81dd80466f31faf4f');
  const summary = JSON.parse(bytes);
  assert.equal(summary.schema_version, 1);
  assert.equal(summary.experiment_id, 'VOICE-ASUS-FIT-SCREEN-2026-10-01-v1');
  assert.equal(summary.cue_count, 268);
  assert.equal(summary.end_margin_ms, 75);
  assert.deepEqual(summary.at_most_tempo, { '1': 4, '2': 155, '1.25': 16, '1.5': 47 });
  assert.deepEqual(summary.at_most_1_5_by_third, [28, 12, 7]);
  assert.equal(summary.human_listening_review, 'not_performed');
  assert.equal(summary.reviewed_spoken_script, false);
  assert.equal(summary.approved_fit_policy, false);
  return summary;
}

export function renderAsusFit(summary) {
  return `<aside id="asus-fit-screen" class="mb-8 rounded-2xl border border-rose-200 bg-rose-50/50 p-5 md:p-7"><h3 class="text-lg font-bold text-slate-900">268 настоящих WAV: простое ускорение не решает укладку</h3><p class="mt-2 max-w-4xl text-sm text-slate-700">Повторно использованы те же WAV без нового TTS. При резерве ${summary.end_margin_ms} мс исходное окно математически доступно для ${summary.at_most_tempo['1']}/268 реплик без ускорения, ${summary.at_most_tempo['1.25']}/268 при 1,25×, ${summary.at_most_tempo['1.5']}/268 при 1,5× и ${summary.at_most_tempo['2']}/268 при 2×. Медианная требуемая скорость ${summary.median_required_tempo.toFixed(2)}×, p95 ${summary.p95_required_tempo.toFixed(2)}×. Даже при 2× за пределами окон остаются 113 реплик. Эти расчёты не устанавливают допустимый темп; текст не одобрен, звук человеком не прослушан, A1–A6 открыты.</p><p class="mt-3 text-sm"><a class="font-semibold text-blue-700 underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-asus-audio-fit-feasibility-result.md">Методика и ограничения (EN)</a> · <a class="font-semibold text-blue-700 underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-10-01-asus-fit-summary.json">Сводка измерений JSON</a></p></aside>`;
}
