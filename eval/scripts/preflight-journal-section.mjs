import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const reportPath = 'eval/reports/inference-preflight-p01-2026-09-29.json';
const checkPath = 'eval/reports/inference-preflight-p01-check-2026-09-29.json';
const resultsPath = 'eval/experiments/2026-09-29-inference-preflight-p01-results.md';
const failurePath = 'eval/reports/inference-preflight-sandbox-failure-2026-09-29.json';
const github = 'https://github.com/Ermolz69/auralis-translate/blob/main/';

export async function loadPreflightJournal(root) {
  const bytes = await fs.readFile(path.join(root, reportPath));
  const report = JSON.parse(bytes);
  const check = JSON.parse(await fs.readFile(path.join(root, checkPath)));
  const failure = JSON.parse(await fs.readFile(path.join(root, failurePath)));
  const corpusBytes = await fs.readFile(path.join(root, 'eval/corpora/context-contrasts-v1.json'));
  assert.equal(report.experiment, 'inference-preflight-p01-v1');
  assert.equal(report.status, 'passed_structural_probe');
  assert.equal(report.corpus_sha256, digest(corpusBytes));
  assert.equal(check.status, 'passed');
  assert.equal(check.report_sha256, digest(bytes));
  assert.equal(failure.status, 'failed_before_inference');
  assert.equal(failure.chat_requests, 0);
  assert.equal(report.cases.length, 1);
  assert.equal(report.cases[0].id, 'p01');
  assert.deepEqual(report.cases[0].arms.map(arm => arm.arm), ['baseline', 'scene']);
  assert.deepEqual(check.checked.map(arm => [arm.arm, arm.chats, arm.preflights]), [
    ['p01:baseline', 3, 0], ['p01:scene', 3, 6],
  ]);
  assert.equal(report.requests.length, 18);
  assert.equal(report.requests.filter(request => request.path === '/v1/chat/completions').length, 6);
  assert.equal(report.requests.filter(request => request.path === '/apply-template').length, 3);
  assert.equal(report.requests.filter(request => request.path === '/tokenize').length, 3);
  assert.equal(report.failures.length, 0);
  return { report, check, sha256: digest(bytes) };
}

export function renderPreflightJournal({ report }, escape) {
  const [baseline, scene] = report.cases[0].arms;
  const usage = arm => report.requests
    .filter(request => request.arm === `p01:${arm}` && request.path === '/v1/chat/completions')
    .reduce((total, request) => ({
      prompt: total.prompt + request.usage.prompt_tokens,
      completion: total.completion + request.usage.completion_tokens,
    }), { prompt: 0, completion: 0 });
  const baselineUsage = usage('baseline');
  const sceneUsage = usage('scene');
  return `<section id="preflight-journal" class="my-8 scroll-mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7">
<p class="text-sm font-semibold text-slate-600">Реальный локальный прогон · CTX-02, частично</p>
<h2 class="mt-2 text-2xl font-bold">Токенизатор: 6 из 6 preflight-запросов сохранены</h2>
<p class="mt-3 max-w-4xl text-slate-700">На том же авторском трёхрепликовом китайском файле схема SQLite 8 сохранила точные тела и сырые ответы трёх вызовов <code>/apply-template</code> и трёх <code>/tokenize</code> до контекстных chat-запросов. Проверка сверила хеши запросов, готовые prompt и число токенов с локальным HTTP-прокси. Ещё 6 chat-запросов сверены отдельно; исходник и выгрузка сохранили структуру.</p>
<div class="mt-4 grid gap-3 sm:grid-cols-2"><div class="rounded-xl border border-slate-200 bg-white p-4"><p class="text-sm text-slate-500">Без соседнего контекста · 0 token preflight</p><p class="mt-1 text-lg font-semibold">${escape(baseline.accepted_target)}</p></div><div class="rounded-xl border border-slate-200 bg-white p-4"><p class="text-sm text-slate-500">Контекст сцены · 6 token preflight</p><p class="mt-1 text-lg font-semibold">${escape(scene.accepted_target)}</p></div></div>
<p class="mt-3 text-sm text-amber-900">Контекстный ответ всё ещё даёт множественное число для единственного старшего брата. Это повторённое наблюдение ИИ на авторском примере, не независимая оценка качества. Проверка модели до run attempt и вызовы Auralis worker ещё не журналируются.</p>
<p class="mt-3 text-sm text-slate-600">Один повтор: ${report.requests.length} локальных HTTP-вызовов; ${baselineUsage.prompt}/${baselineUsage.completion} входных/выходных chat-токенов без контекста и ${sceneUsage.prompt}/${sceneUsage.completion} с контекстом. Полное время файла — ${Math.round(baseline.elapsed_ms)} и ${Math.round(scene.elapsed_ms)} мс. Вывод о скорости по одному повтору не делается. Прежний журнал и его измерения сохранены выше.</p>
<div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${github}${resultsPath}">Метод и ограничения (EN)</a><a class="underline" href="${github}${reportPath}">Сырой отчёт</a><a class="underline" href="${github}${checkPath}">Проверка SQLite</a><a class="underline" href="${github}${failurePath}">Неудачный запуск до модели</a></div>
</section>`;
}
