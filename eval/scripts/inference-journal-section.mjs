import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const reportPath = 'eval/reports/inference-journal-paired-2026-09-29.json';
const checkPath = 'eval/reports/inference-journal-paired-check-2026-09-29.json';
const resultsPath = 'eval/experiments/2026-09-29-inference-journal-paired-results.md';
const sourcePath = 'eval/corpora/context-contrasts-v1.json';
const github = 'https://github.com/Ermolz69/auralis-translate/blob/main/';

export async function loadInferenceJournal(root) {
  const reportBytes = await fs.readFile(path.join(root, reportPath));
  const report = JSON.parse(reportBytes);
  const check = JSON.parse(await fs.readFile(path.join(root, checkPath)));
  const sourceBytes = await fs.readFile(path.join(root, sourcePath));
  const source = JSON.parse(sourceBytes);
  assert.equal(report.experiment, 'inference-journal-paired-v1');
  assert.equal(report.status, 'passed_structural_probe');
  assert.equal(report.corpus_sha256, digest(sourceBytes));
  assert.equal(check.status, 'passed');
  assert.equal(check.report_sha256, digest(reportBytes));
  assert.equal(report.cases.length, 1);
  assert.equal(report.cases[0].id, 'p01');
  assert.deepEqual(report.cases[0].arms.map(arm => arm.arm), ['baseline', 'scene']);
  assert.deepEqual(check.checked.map(arm => [arm.arm, arm.chats]), [
    ['p01:baseline', 3], ['p01:scene', 3],
  ]);
  const chats = report.requests.filter(request => request.path === '/v1/chat/completions');
  assert.equal(chats.length, 6);
  assert.equal(report.requests.length, 18);
  assert.equal(report.failures.length, 0);
  const caseSource = source.cases.find(row => row.id === 'p01');
  assert(caseSource && caseSource.relevant.before_zh.length === 1 && caseSource.relevant.after_zh.length === 1);
  return { report, check, source: caseSource, sha256: digest(reportBytes), chats: chats.length };
}

export function renderInferenceJournal(journal, escape) {
  const { report, source, chats } = journal;
  const [baseline, scene] = report.cases[0].arms;
  const sourceLine = [source.relevant.before_zh[0], source.target_zh, source.relevant.after_zh[0]]
    .map(escape).join(' → ');
  return `<section id="inference-journal" class="my-8 scroll-mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7">
<p class="text-sm font-semibold text-slate-600">Реальный локальный прогон · CTX-02, частично</p>
<h2 class="mt-2 text-2xl font-bold">${chats} из ${chats} ответов модели сохранены в SQLite</h2>
<p class="mt-3 max-w-4xl text-slate-700">Один авторский китайский файл, три реплики, одинаковый исходник в обеих руках: <span lang="zh">${sourceLine}</span>. Запросы, сырые ответы, токены и принятые строки сверены с отдельными неизменяемыми записями журнала.</p>
<div class="mt-4 grid gap-3 sm:grid-cols-2"><div class="rounded-xl border border-slate-200 bg-white p-4"><p class="text-sm text-slate-500">Без соседнего контекста</p><p class="mt-1 text-lg font-semibold">${escape(baseline.accepted_target)}</p></div><div class="rounded-xl border border-slate-200 bg-white p-4"><p class="text-sm text-slate-500">Контекст той же сцены</p><p class="mt-1 text-lg font-semibold">${escape(scene.accepted_target)}</p></div></div>
<p class="mt-3 text-sm text-amber-900">ИИ-разбор исходника: контекстный вариант снова даёт множественное число для явно единственного старшего брата. Независимая человеческая оценка отсутствует; три реплики не подтверждают качество длинного файла.</p>
<p class="mt-3 text-sm text-slate-600">В этом историческом прогоне было 18 локальных HTTP-вызовов; журнал охватывал 6 chat-запросов. Tokenizer preflight в этой версии журнала ещё не сохранялся.</p>
<div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${github}${resultsPath}">Метод и ограничения (EN)</a><a class="underline" href="${github}${reportPath}">Сырой отчёт</a><a class="underline" href="${github}${checkPath}">Проверка журнала</a></div>
</section>`;
}
