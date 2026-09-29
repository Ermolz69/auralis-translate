import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const name = '2026-09-29-auralis-private-speech-stage.json';
const reportSha = '579e31afec34e74d4f61c78755e18ce8524d4e18fd3f48dbf0e3921816b328c5';
const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/';

export async function loadAuralisPrivateSpeech(root) {
  const bytes = await fs.readFile(path.join(root, 'eval/reports', name));
  assert.equal(digest(bytes), reportSha);
  const report = JSON.parse(bytes);
  assert.equal(report.kind, 'private_selected_script_real_sapi_stage_unreviewed');
  assert.equal(report.auralis_commit, '1a9ce76971794ecad68d67892573eb897dd4f85e');
  assert.equal(report.audio.length, 2);
  assert.deepEqual(report.audio.map(row => row.duration_ms), [2469, 2664]);
  assert.deepEqual(report.audio.map(row => row.exceeds_window_ms), [1469, 1664]);
  assert(report.audio.every(row => row.codec === 'pcm_s16le'
    && row.sample_rate_hz === 22050 && row.channels === 1
    && row.clipped_samples === 0));
  assert.equal(report.cue_fit, 'failed');
  assert.equal(report.clipping_check, 'passed');
  assert.equal(report.review_evidence, 'synthetic_fixture_only');
  assert.equal(report.human_listening, 'not_performed');
  assert.equal(report.media_playback, 'not_performed');
  assert.equal(report.publication, 'private_stage_only');
  return { sha256: reportSha, report };
}

export function renderAuralisPrivateSpeech(data) {
  const [first, second] = data.report.audio;
  return `<section id="auralis-private-speech" class="my-8 scroll-mt-8 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 md:p-7"><p class="text-sm font-semibold text-cyan-900">Auralis · настоящий SAPI через прикладной этап · технический результат</p><h2 class="mt-2 text-2xl font-bold">Выбранный перевод повторно проверен до и после синтеза</h2><p class="mt-3 max-w-4xl text-slate-700">Новый закрытый этап проверил выбранный результат в двух SQLite, вызвал настоящий русский TTS и сверил оба WAV с репликами. Тесты отклонили смену выбора во время TTS и лишний файл, удалив временный звук. Сценарий и имя рецензента здесь искусственные; сохранены только метаданные, сырые WAV лежат в приватном каталоге.</p><div class="mt-5 overflow-x-auto"><table class="measurement"><thead><tr><th>Реплика</th><th>PCM WAV</th><th>Длительность</th><th>Исходное окно</th><th>Превышение</th><th>Клиппинг</th></tr></thead><tbody><tr><th scope="row">0</th><td>моно · 22 050 Гц · 16 бит</td><td>${first.duration_ms} мс</td><td>${first.cue_window_ms} мс</td><td>+${first.exceeds_window_ms} мс</td><td>${first.clipped_samples}</td></tr><tr><th scope="row">1</th><td>моно · 22 050 Гц · 16 бит</td><td>${second.duration_ms} мс</td><td>${second.cue_window_ms} мс</td><td>+${second.exceeds_window_ms} мс</td><td>${second.clipped_samples}</td></tr></tbody></table></div><p class="mt-4 text-slate-700">Оба WAV декодируются без обнаруженного клиппинга, но исходный fit провален. Человек не слушал этот звук, итоговое медиа не воспроизводилось и производственная публикация не выполнена. A1–A6 остаются открытыми.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${repo}eval/reports/${name}">Машинные замеры и хеши</a><a class="underline" href="${repo}eval/experiments/2026-09-29-auralis-private-speech-stage.md">Условия и ограничения (EN)</a></div></section>`;
}
