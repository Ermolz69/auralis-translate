import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const stem = '2026-09-29-reg009-greedy81';
const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/';
const expectedSummary = '7f74986de0f8209fdbacaaf2acb3683bbc300b3c618514a3463c9ce90128e0ff';
const expectedArchive = 'da0617c86ccf7ef7cbab3dcbeb30a36ae2dce650696623f6f9477a6749bc0b2b';

export async function loadReg009Greedy81(root) {
  const reports = path.join(root, 'eval/reports');
  const summaryBytes = await fs.readFile(path.join(reports, `${stem}-summary.json`));
  const archiveBytes = await fs.readFile(path.join(reports, `${stem}-archive.json.gz`));
  assert.equal(digest(summaryBytes), expectedSummary);
  assert.equal(digest(archiveBytes), expectedArchive);
  const summary = JSON.parse(summaryBytes);
  assert.equal(summary.archive_sha256, expectedArchive);
  assert.equal(summary.git_head, '89dca653c6ec98ae73b8c839d0be26925ec905e6');
  assert.equal(summary.request_count, 81);
  assert.equal(summary.baseline_raw_exact_code, 36);
  assert.equal(summary.greedy_raw_exact_code, 36);
  assert.equal(summary.improved_code, 6);
  assert.equal(summary.regressed_code, 6);
  assert.equal(summary.human_review, 'missing');
  assert.equal(summary.status, 'complete_observations_unreviewed');
  const archive = JSON.parse(gunzipSync(archiveBytes));
  const responses = archive.raw['requests.jsonl'].trim().split('\n').map(JSON.parse);
  assert.equal(responses.length, 81);
  const cues = [...new Set(responses.map(row => row.cue_id))];
  assert.equal(cues.length, 27);
  assert(cues.every(cue => new Set(responses.filter(row => row.cue_id === cue)
    .map(row => row.restored_candidate)).size === 1));
  const pack = JSON.parse(await fs.readFile(path.join(root,
    'eval/regressions/greedy-restart-grammar-v1.json')));
  assert.equal(pack.id, 'REG-017');
  assert.equal(pack.source_archive_sha256, expectedArchive);
  assert.equal(pack.failure.cue_id, 510);
  return { summary_sha256: expectedSummary, archive_sha256: expectedArchive,
    baseline_exact: summary.baseline_raw_exact_code,
    greedy_exact: summary.greedy_raw_exact_code,
    improved: summary.improved_code, regressed: summary.regressed_code,
    changed_wording: summary.changed_raw_wording,
    unique_greedy_cues: cues.length, cue510_repetitions: pack.failure.seeds.length,
    human_review: summary.human_review };
}

export function renderReg009Greedy81(data) {
  return `<section id="reg009-greedy81" class="my-8 scroll-mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-800">Одинаковые источники · реальная модель · 27 синтетических реплик × 3 seed</p><h2 class="mt-2 text-2xl font-bold">Greedy не улучшил сохранность кодов на всём экране</h2><p class="mt-3 max-w-4xl text-slate-700">В архивном режиме 0.7 и новом режиме 0.0 точный исходный код сохранился в <strong>${data.baseline_exact}/81</strong> ответов каждого. Шесть случаев улучшились, шесть ухудшились. Числа сохранились во всех 81 новых ответах. Все три greedy-ответа для одной реплики совпадали, поэтому это 27 разных новых формулировок, а не 81 независимый перевод.</p><div class="mt-5 grid gap-3 sm:grid-cols-3"><div class="rounded-xl bg-white p-4"><p class="text-sm text-slate-600">Точные коды</p><p class="text-2xl font-bold">36 → 36 / 81</p></div><div class="rounded-xl bg-white p-4"><p class="text-sm text-slate-600">Парные изменения</p><p class="text-2xl font-bold">+6 / −6</p></div><div class="rounded-xl bg-white p-4"><p class="text-sm text-slate-600">Новая ошибка на реплике 510</p><p class="text-2xl font-bold">3 / 3</p></div></div><p class="mt-4 max-w-4xl text-slate-700">На реплике 510 все три ответа повторили неудачную конструкцию «необходимо перезапускать не нужно». В других совпадающих источниках формулировка улучшалась; часть ответов исправила лицо «мы». Это ИИ-разбор, человеческой оценки нет. Режим 0.0 не выбран для релиза; старые замеры сохранены.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${repo}eval/experiments/2026-09-29-reg009-greedy-81-results.md">Метод и ограничения (EN)</a><a class="underline" href="${repo}eval/reports/${stem}-summary.json">Парная сводка</a><a class="underline" href="${repo}eval/reports/${stem}-archive.json.gz">Все сырые ответы</a><a class="underline" href="${repo}eval/regressions/greedy-restart-grammar-v1.json">REG-017 и контроли</a></div><p class="sr-only">SHA-256 сводки ${data.summary_sha256}; архива ${data.archive_sha256}; human review ${data.human_review}.</p></section>`;
}
