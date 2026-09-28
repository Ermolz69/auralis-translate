import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const FILES = {
  smoke: 'scene-context-smoke-2026-09-28.json',
  regression: 'scene-pronoun-regression-2026-09-28.json',
};

export async function loadSceneContext(root) {
  const reports = {}, sha256 = {};
  for (const [key, file] of Object.entries(FILES)) {
    const bytes = await fs.readFile(path.join(root, 'eval/reports', file));
    reports[key] = JSON.parse(bytes);
    sha256[key] = digest(bytes);
    assert.equal(reports[key].status, 'passed_structural_probe');
    assert.equal(reports[key].failures.length, 0);
  }
  const index = JSON.parse(await fs.readFile(path.join(root, 'eval/regressions/scene-pronoun-v1.json')));
  const profileHash = digest(await fs.readFile(path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v5_scene.experimental.json')));
  assert.equal(index.original_scene_report_sha256, sha256.smoke);
  assert.equal(index.regression_report_sha256, sha256.regression);
  assert.equal(index.scene_profile_sha256, profileHash);
  assert.equal(reports.regression.profile_sha256.scene, profileHash);
  assert.equal(reports.smoke.profile_sha256.scene, profileHash);
  assert.equal(reports.smoke.cases.length, 2);
  assert.equal(reports.regression.cases.length, 4);
  assert.equal(reports.smoke.requests.filter(request => request.path === '/v1/chat/completions').length, 10);
  assert.equal(reports.regression.requests.filter(request => request.path === '/v1/chat/completions').length, 24);
  const rows = [...reports.smoke.cases, ...reports.regression.cases].map(row => ({
    id: row.id,
    source_sha256: row.source_sha256,
    expected: row.proposed_reference_ru,
    baseline: row.arms.find(arm => arm.arm === 'baseline')?.accepted_target,
    scene: row.arms.find(arm => arm.arm === 'scene')?.accepted_target,
  }));
  assert(rows.every(row => row.baseline && row.scene));
  assert.deepEqual(rows.slice(2).map(row => row.scene), ['Прибыли.', 'Приехали.', 'Приехали.', 'Прибыли.']);
  return { sha256, profileHash, rows, smoke_chat_requests: 10, regression_chat_requests: 24, regression_id: index.id, human_review: index.human_review };
}

export function renderSceneContext(scene, escape) {
  const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/';
  const rows = scene.rows.map(row => `<tr data-scene-row="${escape(row.id)}"><th scope="row">${escape(row.id)}</th><td>${escape(row.expected)}</td><td>${escape(row.baseline)}</td><td class="${['p01', 'r01', 'r02', 'r03'].includes(row.id) ? 'bg-rose-50' : ''}">${escape(row.scene)}</td></tr>`).join('');
  return `<section id="scene-context" class="scroll-mt-8 border-t border-slate-200 py-10"><p class="text-sm font-semibold uppercase tracking-[.12em] text-amber-800">Реальные парные сцены · 28 сентября 2026</p><h2 class="mt-2 text-2xl font-semibold">Контекст проходит проверку токенов, но меняет число действующего лица</h2><p class="mt-3 max-w-5xl text-slate-600">Одинаковые авторские SRT переводились без контекста и с соседними китайскими репликами внутри явно заданной сцены. В пробе было ${scene.smoke_chat_requests} ответов модели, в новой регрессии — ${scene.regression_chat_requests}. Все файлы прошли структурную проверку и побайтное восстановление. Эти маленькие наборы не являются человеческой оценкой качества.</p>
  <div class="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-5"><strong class="text-rose-900">${escape(scene.regression_id)} открыт.</strong><p class="mt-2 text-sm text-rose-900">Когда китайский источник явно называл одного брата или сестру, контекстный профиль трижды дал русскую форму множественного числа. В отрицательном контроле источник действительно называл двух братьев. Ошибка отмечена ИИ по исходнику; независимая проверка ещё нужна.</p></div>
  <div class="mt-5 overflow-x-auto"><table class="measurement"><thead><tr><th>Случай</th><th>Предлагаемый смысл*</th><th>Без контекста</th><th>Контекст сцены</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-2 text-sm text-slate-500">* Предложенный русский вариант не передавался модели и не проверен независимым переводчиком. Точные китайские исходники и запросы находятся в JSON ниже.</p>
  <p class="mt-5 text-sm text-slate-600">Перед каждым контекстным ответом сервер сформировал чат-шаблон и посчитал токены. Каждый счёт совпал с <code>usage.prompt_tokens</code> соответствующего ответа; максимум в этих прогонах — 227 при доступном лимите 1 728 после резервов. На длинных файлах и больших блоках этот механизм ещё не принят.</p>
  <details class="mt-5"><summary class="cursor-pointer font-semibold text-blue-700">Сырые ответы, сцены, время и ресурсы</summary><ul class="mt-3 list-disc space-y-2 pl-6 text-sm">${Object.entries(FILES).map(([key, file]) => `<li><a class="text-blue-700 underline" href="${repo}${file}">${escape(key)} JSON</a> · SHA-256 <code class="hash">${scene.sha256[key]}</code></li>`).join('')}</ul><p class="mt-3 text-sm">Профиль сцены SHA-256: <code class="hash">${scene.profileHash}</code>. Старые 420 запросов, v4 и предыдущие v5 отчёты сохранены отдельно выше.</p></details></section>`;
}
