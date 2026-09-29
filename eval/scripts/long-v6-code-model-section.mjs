import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const stem = '2026-09-29-long-v6-code-model-screen';
const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/';

export async function loadLongV6CodeModel(root) {
  const summaryBytes = await fs.readFile(path.join(root, `eval/reports/${stem}-summary.json`));
  assert.equal(digest(summaryBytes), '9c4ffca85c62abd3105dc81b73f8aedd397f18d504598016084fa2cb057718d8');
  const summary = JSON.parse(summaryBytes);
  const reportBytes = await fs.readFile(path.join(root, `eval/reports/${summary.report_file}`));
  const journalBytes = await fs.readFile(path.join(root, `eval/reports/${summary.requests_file}`));
  assert.equal(digest(reportBytes), summary.report_sha256);
  assert.equal(digest(journalBytes), summary.requests_gzip_sha256);
  const report = JSON.parse(reportBytes);
  assert.equal(report.requests.length, 162);
  assert.deepEqual(summary.budget.cue_ids.length, 27);
  assert.deepEqual(summary.budget.seeds, [101, 202, 303]);
  assert.equal(summary.human_review, 'missing');
  assert.equal(summary.model_selection, 'unselected');
  const doorIds = [2, 130, 506, 1018];
  const doorRows = report.requests.filter(row => doorIds.includes(row.cue_id));
  assert.equal(doorRows.length, 24);
  const plural7b = doorRows.filter(row => row.model === '7b'
    && /эти двери/iu.test(row.accepted_candidate)).length;
  const singular1b = doorRows.filter(row => row.model === '1b'
    && /эту дверь/iu.test(row.accepted_candidate)).length;
  assert.equal(plural7b, 12);
  assert.equal(singular1b, 12);
  return {
    summary_sha256: digest(summaryBytes),
    requests_sha256: digest(journalBytes),
    models: summary.model_summaries,
    paired: summary.paired,
    door_number: { plural_7b: plural7b, singular_1b: singular1b, pairs: 12 },
    human_review: summary.human_review,
    model_selection: summary.model_selection,
    release_gate: summary.release_gate,
  };
}

export function renderLongV6CodeModel(data) {
  const small = data.models['1b'];
  const large = data.models['7b'];
  const gib = bytes => (bytes / 1024 ** 3).toFixed(2);
  return `<section id="long-v6-code-model" class="my-8 scroll-mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-5 md:p-7"><p class="text-sm font-semibold text-violet-900">Парный экран · 27 мест длинного синтетического файла · 3 семени</p><h2 class="mt-2 text-2xl font-bold">7B чаще сохраняет код, но меняет смысл «одной двери»</h2><p class="mt-3 max-w-4xl text-slate-700">Оба Q4-профиля получили одинаковые исходники, контекст и настройки; в каждой паре менялась только модель. Сохранены все 162 сырых ответа. Числа и JSON прошли узкую машинную проверку, но это не оценка качества естественного перевода.</p><div class="mt-5 overflow-x-auto"><table class="measurement"><thead><tr><th>Показатель</th><th>1.8B</th><th>7B</th></tr></thead><tbody><tr><th scope="row">Корректный слот / исходный код / числа</th><td>${small.structurally_valid}/81 · ${small.exact_identifier}/81 · ${small.exact_numeric_facts}/81</td><td>${large.structurally_valid}/81 · ${large.exact_identifier}/81 · ${large.exact_numeric_facts}/81</td></tr><tr><th scope="row">Время запроса p50 / p95</th><td>${small.request_elapsed_p50_ms} / ${small.request_elapsed_p95_ms} мс</td><td>${large.request_elapsed_p50_ms} / ${large.request_elapsed_p95_ms} мс</td></tr><tr><th scope="row">Пик отслеживаемой рабочей памяти</th><td>${gib(small.resources.peak_tracked_working_set_bytes)} ГиБ</td><td>${gib(large.resources.peak_tracked_working_set_bytes)} ГиБ</td></tr></tbody></table></div><p class="mt-4 text-slate-700">В 81 совпавшей паре 7B улучшила сохранение кода ${data.paired.code_better_7b} раз и ухудшила ${data.paired.code_worse_7b} раз. При этом во всех ${data.door_number.pairs} проверенных 7B-ответах китайское единственное число «эта дверь» стало русским множественным «эти двери»; 1.8B сохранила единственное число в ${data.door_number.singular_1b}/${data.door_number.pairs}. Это исходно-ориентированный ИИ-разбор, не оценка независимого переводчика. Модель для выпуска не выбрана.</p><p class="mt-3 text-sm text-slate-600">Память измерялась по выборкам процессов; показания GPU относятся ко всему устройству. Нужны естественный длинный файл, рецензент и проверка связности сцен.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${repo}eval/experiments/${stem}-results.md">План, условия и разбор (EN)</a><a class="underline" href="${repo}eval/reports/${stem}-summary.json">Сводка и ресурсы</a><a class="underline" href="${repo}eval/reports/${stem}-requests.jsonl.gz">Все 162 сырых запроса и ответа</a><a class="underline" href="${repo}eval/regressions/long-v6-singular-door-v1.json">REG-011</a></div></section>`;
}
