import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const reportName = '2026-09-29-auralis-managed-speech-publication.json';
const failureName = '2026-09-29-auralis-managed-speech-publication-failure.json';
const reportSha = '50234864a6c2bb5da32b913d900566bb75ecab675874b33b6994bac1dab531e0';
const failureSha = '8f99179f85f875856c4dadf168e6b2dc017bcd6dcaa900e11f71ed20cb447ac4';
const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/';

export async function loadManagedSpeech(root) {
  const reportBytes = await fs.readFile(path.join(root, 'eval/reports', reportName));
  const failureBytes = await fs.readFile(path.join(root, 'eval/reports', failureName));
  assert.equal(digest(reportBytes), reportSha);
  assert.equal(digest(failureBytes), failureSha);
  const report = JSON.parse(reportBytes);
  const failure = JSON.parse(failureBytes);
  assert.equal(report.probe_id, 'VOICE-PUBLISH-SAPI-2026-09-29-v1');
  assert.equal(failure.probe_id, report.probe_id);
  assert.equal(failure.attempt, 1);
  assert.equal(failure.status, 'failed_before_managed_publication');
  assert.equal(report.measured.length, 2);
  assert.deepEqual(report.measured.map(row => row.duration_ms), [2469, 2664]);
  assert.deepEqual(report.measured.map(row => row.exceeds_window_ms), [1469, 1664]);
  assert(report.measured.every(row => row.codec === 'pcm_s16le'
    && row.sample_rate_hz === 22050 && row.channels === 1
    && row.clipped_samples === 0));
  assert.equal(report.cue_fit, 'failed');
  assert.equal(report.clipping_check, 'passed');
  assert.equal(report.review_evidence, 'synthetic_fixture_only');
  assert.equal(report.human_listening, 'not_performed');
  assert.equal(report.media_playback, 'not_performed');
  assert.equal(report.publication, 'managed_artifact_ready_in_ephemeral_two_database_fixture');
  return { sha256: reportSha, failure_sha256: failureSha, report, failure };
}

export function renderManagedSpeech(data) {
  const [first, second] = data.report.measured;
  return `<section id="managed-speech" class="my-8 scroll-mt-8 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 md:p-7"><p class="text-sm font-semibold text-cyan-900">Auralis · VOICE-01/02 · управляемое аудио, технический результат</p><h2 class="mt-2 text-2xl font-bold">Два настоящих WAV сохранены вместе с выбранным переводом</h2><p class="mt-3 max-w-4xl text-slate-700">В тесте с двумя SQLite-базами Auralis повторно проверил выбранный перевод, создал речь через SAPI, сверил хеши, одним коммитом записал оба аудиоартефакта и очередь их завершения. До завершения пакет был скрыт; изменение выбора перевода также скрывает звук. Первая попытка в ограниченном процессе не нашла голос, после проверки окружения единственная повторная попытка с тем же голосом прошла.</p><div class="mt-5 overflow-x-auto"><table class="measurement"><thead><tr><th>Реплика</th><th>WAV</th><th>Длительность</th><th>Окно</th><th>Превышение</th><th>Клиппинг</th></tr></thead><tbody><tr><th scope="row">1</th><td>моно · 22 050 Гц · 16 бит</td><td>${first.duration_ms} мс</td><td>${first.cue_window_ms} мс</td><td>+${first.exceeds_window_ms} мс</td><td>${first.clipped_samples}</td></tr><tr><th scope="row">2</th><td>моно · 22 050 Гц · 16 бит</td><td>${second.duration_ms} мс</td><td>${second.cue_window_ms} мс</td><td>+${second.exceeds_window_ms} мс</td><td>${second.clipped_samples}</td></tr></tbody></table></div><p class="mt-4 text-slate-700">Источник, перевод и рецензент были искусственными; обе реплики выходят за исходные окна. Тестовые базы удалены после проверки, сохранены только приватные WAV и опубликованные метаданные. Человек звук не слушал, готовое медиа не воспроизводилось, производственный worker не подключён. A1–A6 остаются открытыми.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${repo}eval/experiments/2026-09-29-auralis-managed-speech-publication.md">Условия и ограничения (EN)</a><a class="underline" href="${repo}eval/reports/${reportName}">Декодирование и хеши (JSON)</a><a class="underline" href="${repo}eval/reports/${failureName}">Первый сбой (JSON)</a></div></section>`;
}
