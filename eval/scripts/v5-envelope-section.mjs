import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const FILES = {
  placeholder: 'v5-envelope-placeholder-2026-09-28.json',
  no_example: 'v5-envelope-no-example-failure-2026-09-28.json',
  regression: 'v5-schema-regression-2026-09-28.json',
  control: 'v5-schema-control-2026-09-28.json',
};

export async function loadV5Envelope(root, dataset, v4) {
  const reports = {};
  const sha256 = {};
  for (const [key, file] of Object.entries(FILES)) {
    const bytes = await fs.readFile(path.join(root, 'eval/reports', file));
    reports[key] = JSON.parse(bytes);
    sha256[key] = digest(bytes);
    assert.equal(reports[key].profile.prompt_version, 5);
  }
  const { placeholder, no_example: noExample, regression, control } = reports;
  const demoHash = digest(await fs.readFile(path.join(root, 'eval/corpora/public-demo-v1.json')));
  const regressionHash = digest(await fs.readFile(path.join(root, 'eval/corpora/v5-placeholder-regression-v1.json')));
  const profileHash = digest(await fs.readFile(path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v5.experimental.json')));
  assert.equal(placeholder.result, 'passed');
  assert.equal(placeholder.requests.length, 60);
  assert.equal(placeholder.dataset_sha256, demoHash);
  assert.equal(noExample.result, 'failed');
  assert.equal(noExample.requests.length, 1);
  assert.equal(noExample.runs.length, 0);
  assert.equal(regression.result, 'passed');
  assert.equal(regression.requests.length, 15);
  assert.equal(regression.dataset_sha256, regressionHash);
  assert.equal(control.result, 'passed');
  assert.equal(control.requests.length, 60);
  assert.equal(control.dataset_sha256, demoHash);
  assert.equal(control.profile_sha256, profileHash);
  assert.equal(regression.profile_sha256, profileHash);
  assert.equal(control.profile.model_file_sha256, v4.profile.model_file_sha256);
  assert.equal(control.runtime_sha256, v4.runtime_sha256);
  for (const run of [...regression.runs, ...control.runs]) {
    assert.equal(run.structural_checks, 'passed');
    assert.equal(run.offline_reexport, 'byte_identical');
    assert.equal(run.status.completed_blocks, run.status.total_blocks);
  }
  assert.equal(regression.source_preservation, 'byte_identical');
  assert.equal(control.source_preservation, 'byte_identical');
  const copied = placeholder.requests.filter(request => ['zh08', 'zh19'].includes(request.example_id) && request.accepted_candidate === 'Русский текст');
  assert.equal(copied.length, 6);
  assert(regression.requests.every(request => request.accepted_candidate !== 'Русский текст'));
  assert(control.requests.every(request => request.accepted_candidate !== 'Русский текст'));
  assert.deepEqual(control.runs[0].rows.map(row => row.example_id), dataset.examples.map(row => row.id));
  return { reports, sha256, demoHash, regressionHash, profileHash, copied_count: copied.length };
}

export function renderV5Envelope(v5, dataset, v4, escape, number) {
  const { placeholder, regression, control } = v5.reports;
  const row = (report, id) => report.runs[0].rows.find(item => item.example_id === id)?.candidate;
  const flagged = new Set(['zh05', 'zh07', 'zh08', 'zh18']);
  const rows = dataset.examples.map(item => `<tr><th scope="row">${escape(item.id)}</th><td lang="zh-Hans">${escape(item.source)}</td><td>${escape(row(v4, item.id))}</td><td>${escape(row(placeholder, item.id))}</td><td class="${flagged.has(item.id) ? 'bg-amber-50' : ''}">${escape(row(control, item.id))}</td></tr>`).join('');
  const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/';
  const links = Object.entries(FILES).map(([key, file]) => `<li><a class="text-blue-700 underline" href="${repo}${file}">${escape(key)} JSON</a> · SHA-256 <code class="hash">${v5.sha256[key]}</code></li>`).join('');
  return `<section id="v5-envelope" class="scroll-mt-8 border-t border-slate-200 py-10"><p class="text-sm font-semibold uppercase tracking-[.12em] text-amber-800">Эксперимент · 28 сентября 2026</p><h2 class="mt-2 text-2xl font-semibold">Профиль v5: JSON проходит, смысл ещё ошибается</h2><p class="mt-3 max-w-5xl text-slate-600">На тех же 20 авторских китайских строках исправленный профиль создал три отдельных файла: 60/60 запросов приняты, исходник не изменился, повторная выгрузка совпала побайтно. Это профиль без контекста сцен и терминов. Независимой оценки перевода нет; отмеченные ниже ошибки — разбор ИИ, не человеческий балл.</p>
  <div class="mt-5 grid gap-4 md:grid-cols-3"><div class="rounded-xl bg-rose-50 p-5"><p class="text-2xl font-semibold text-rose-900">6 / 6</p><p class="text-sm text-rose-900">Первый v5 скопировал «Русский текст» на двух репликах в трёх повторах</p></div><div class="rounded-xl bg-slate-100 p-5"><p class="text-2xl font-semibold">1 отказ</p><p class="text-sm text-slate-600">После удаления примера модель вернула неверную JSON-схему; результат не сохранился</p></div><div class="rounded-xl bg-amber-50 p-5"><p class="text-2xl font-semibold text-amber-900">15 + 60</p><p class="text-sm text-amber-900">Схема сервера дала 15 ответов на регрессиях и 60 на исходном наборе; смысловые ошибки остались</p></div></div>
  <p class="mt-5 max-w-5xl text-sm text-slate-600">Примеры нерешённых ошибок: «две бутылки» стало «двадцать бутылок» в одном из трёх прогонов; имя 小林 теряется или читается по-разному; «не позднее пятницы» стало «не позднее третьего дня пятницы» во всех трёх; идиома об уклончивом ответе иногда превращается в «махинации». На новом пятирепличном наборе две связанные идиомы тоже дали выдуманные оттенки. Вариант v5 остаётся экспериментальным; v4 не заменён.</p>
  <details class="mt-6"><summary class="cursor-pointer font-semibold text-blue-700">Все 20 строк: v4, первый v5 и исправленный JSON v5 · прогон 1</summary><div class="mt-3 overflow-x-auto"><table class="measurement"><thead><tr><th>ID</th><th>Китайский источник</th><th>v4</th><th>v5 с примером</th><th>v5 со схемой</th></tr></thead><tbody>${rows}</tbody></table></div></details>
  <div class="mt-5 grid gap-4 md:grid-cols-2"><p class="text-sm text-slate-600">Время исправленного v5 на 20 строк: ${control.runs.map(run => number(run.translation_elapsed_ms / 1000)).join(' / ')} с. Для v4: ${v4.runs.map(run => number(run.translation_elapsed_ms / 1000)).join(' / ')} с. Это разные дни и снимки кода; сравнение скорости не является парным аппаратным тестом.</p><p class="text-sm text-slate-600">Отдельный набор: 5 исходников × 3 прогона, включая две исходные ошибки, две новые связанные строки и отрицательный контроль. Все ответы сохранены, но русские эталоны предложены ИИ и не проверены переводчиком.</p></div>
  <details class="mt-5"><summary class="cursor-pointer font-semibold text-blue-700">Сырые ответы, версии и хеши</summary><ul class="mt-3 list-disc space-y-2 pl-6 text-sm">${links}</ul><p class="mt-3 text-sm">Профиль SHA-256: <code class="hash">${v5.profileHash}</code>. GGUF SHA-256: <code class="hash">${control.profile.model_file_sha256}</code>. У каждого JSON есть исходники, точные промпты, сырые и принятые ответы, токены, времена, сэмплы ресурсов и журналы ошибок.</p></details></section>`;
}
