import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const FILES = {
  smoke: 'scene-context-smoke-2026-09-28.json',
  regression: 'scene-pronoun-regression-2026-09-28.json',
  repair: 'scene-number-repair-2026-09-28.json',
  after_terms: 'scene-pronoun-after-terms-2026-09-28.json',
  screen7b: 'context-7b-p01-screen-2026-09-29.json',
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
  const activeProfileHash = digest(await fs.readFile(path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v5_scene.experimental.json')));
  const measuredProfileHash = digest(await fs.readFile(path.join(root, 'eval/profiles/2026-09-28-hy_mt2_1_8b_q4_k_m.context_v5_scene.experimental.json')));
  const profileHash = reports.repair.profile_sha256.scene;
  assert.equal(index.original_scene_report_sha256, sha256.smoke);
  assert.equal(index.regression_report_sha256, sha256.regression);
  assert.equal(index.attempted_repair_report_sha256, sha256.repair);
  assert.equal(index.after_terms_report_sha256, sha256.after_terms);
  assert.equal(index.large_model_screen_report_sha256, sha256.screen7b);
  assert.equal(index.large_model_scene_profile_sha256, reports.screen7b.profile_sha256.scene);
  assert.equal(index.scene_profile_sha256, reports.regression.profile_sha256.scene);
  assert.equal(reports.smoke.profile_sha256.scene, index.scene_profile_sha256);
  assert.notEqual(activeProfileHash, profileHash, 'failed repair profile must not replace the active scene profile');
  assert.equal(measuredProfileHash, reports.after_terms.profile_sha256.scene);
  assert.notEqual(activeProfileHash, measuredProfileHash, 'historical scene evidence must not be relabelled as the current profile');
  assert.equal(reports.smoke.cases.length, 2);
  assert.equal(reports.regression.cases.length, 4);
  assert.equal(reports.repair.cases.length, 4);
  assert.equal(reports.after_terms.cases.length, 4);
  assert.equal(reports.screen7b.cases.length, 1);
  assert.equal(reports.smoke.requests.filter(request => request.path === '/v1/chat/completions').length, 10);
  assert.equal(reports.regression.requests.filter(request => request.path === '/v1/chat/completions').length, 24);
  assert.equal(reports.repair.requests.filter(request => request.path === '/v1/chat/completions').length, 24);
  assert.equal(reports.after_terms.requests.filter(request => request.path === '/v1/chat/completions').length, 24);
  assert.equal(reports.screen7b.requests.filter(request => request.path === '/v1/chat/completions').length, 6);
  assert.equal(reports.screen7b.cases[0].source_sha256, reports.smoke.cases.find(row => row.id === 'p01').source_sha256);
  const rows = [...reports.smoke.cases, ...reports.regression.cases].map(row => ({
    id: row.id,
    source_sha256: row.source_sha256,
    expected: row.proposed_reference_ru,
    baseline: row.arms.find(arm => arm.arm === 'baseline')?.accepted_target,
    scene: row.arms.find(arm => arm.arm === 'scene')?.accepted_target,
  }));
  assert(rows.every(row => row.baseline && row.scene));
  assert.deepEqual(rows.slice(2).map(row => row.scene), ['Прибыли.', 'Приехали.', 'Приехали.', 'Прибыли.']);
  const repairRows = reports.repair.cases.map(row => ({ id: row.id, output: row.arms.find(arm => arm.arm === 'scene')?.accepted_target }));
  assert.deepEqual(repairRows.map(row => row.output), ['Приехали.', 'Приехали.', 'Прибыли.', 'Прибыли.']);
  const currentRows = reports.after_terms.cases.map(row => ({ id: row.id, output: row.arms.find(arm => arm.arm === 'scene')?.accepted_target }));
  assert.deepEqual(currentRows.map(row => row.output), ['Приехали.', 'Приехали.', 'Приехали.', 'Прибыли.']);
  const largeScreen = {
    baseline: reports.screen7b.cases[0].arms.find(arm => arm.arm === 'baseline')?.accepted_target,
    scene: reports.screen7b.cases[0].arms.find(arm => arm.arm === 'scene')?.accepted_target,
  };
  assert.deepEqual(largeScreen, { baseline: 'Прибыли.', scene: 'Мы приехали.' });
  return { sha256, profileHash, oldProfileHash: index.scene_profile_sha256, rows, repairRows, currentRows, largeScreen, smoke_chat_requests: 10, regression_chat_requests: 24, repair_chat_requests: 24, after_terms_chat_requests: 24, large_screen_chat_requests: 6, regression_id: index.id, human_review: index.human_review };
}

export function renderSceneContext(scene, escape) {
  const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/';
  const rows = scene.rows.map(row => `<tr data-scene-row="${escape(row.id)}"><th scope="row">${escape(row.id)}</th><td>${escape(row.expected)}</td><td>${escape(row.baseline)}</td><td class="${['p01', 'r01', 'r02', 'r03'].includes(row.id) ? 'bg-rose-50' : ''}">${escape(row.scene)}</td></tr>`).join('');
  return `<section id="scene-context" class="scroll-mt-8 border-t border-slate-200 py-10"><p class="text-sm font-semibold uppercase tracking-[.12em] text-amber-800">Реальные парные сцены · 28 сентября 2026</p><h2 class="mt-2 text-2xl font-semibold">Контекст проходит проверку токенов, но меняет число действующего лица</h2><p class="mt-3 max-w-5xl text-slate-600">Одинаковые авторские SRT переводились без контекста и с соседними китайскими репликами внутри явно заданной сцены. В пробе было ${scene.smoke_chat_requests} ответов модели, в новой регрессии — ${scene.regression_chat_requests}. Все файлы прошли структурную проверку и побайтное восстановление. Эти маленькие наборы не являются человеческой оценкой качества.</p>
  <div class="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-5"><strong class="text-rose-900">${escape(scene.regression_id)} открыт.</strong><p class="mt-2 text-sm text-rose-900">Когда китайский источник явно называл одного брата или сестру, контекстный профиль трижды дал русскую форму множественного числа. В отрицательном контроле источник действительно называл двух братьев. Попытка дополнить инструкцию также не исправила три единственных субъекта: ${scene.repairRows.slice(0, 3).map(row => `${escape(row.id)} — ${escape(row.output)}`).join('; ')} Повтор на v5-шаблоне после терминов также сохранил ошибку: ${scene.currentRows.map(row => `${escape(row.id)} — ${escape(row.output)}`).join('; ')} Каждый из двух дополнительных прогонов сделал 24 ответа модели. Ошибка отмечена ИИ по исходнику; независимая проверка ещё нужна.</p></div>
  <p class="mt-4 text-sm text-rose-900">Разведочный прогон 7B Q4_K_M на том же исходнике <code>p01</code> дал «${escape(scene.largeScreen.baseline)}» без контекста и «${escape(scene.largeScreen.scene)}» с контекстом. Единственный брат вновь стал множественным действующим лицом. Это один прогон и ${scene.large_screen_chat_requests} реальных ответов, без человеческой оценки; увеличение модели не закрыло ${escape(scene.regression_id)}.</p>
  <div class="mt-5 overflow-x-auto"><table class="measurement"><thead><tr><th>Случай</th><th>Предлагаемый смысл*</th><th>Без контекста</th><th>Контекст сцены</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-2 text-sm text-slate-500">* Предложенный русский вариант не передавался модели и не проверен независимым переводчиком. Точные китайские исходники и запросы находятся в JSON ниже.</p>
  <p class="mt-5 text-sm text-slate-600">Перед каждым контекстным ответом сервер сформировал чат-шаблон и посчитал токены. Каждый счёт совпал с <code>usage.prompt_tokens</code> соответствующего ответа; максимум в этих прогонах — 227 при доступном лимите 1 728 после резервов. На длинных файлах и больших блоках этот механизм ещё не принят.</p>
  <details class="mt-5"><summary class="cursor-pointer font-semibold text-blue-700">Сырые ответы, сцены, время и ресурсы</summary><ul class="mt-3 list-disc space-y-2 pl-6 text-sm">${Object.entries(FILES).map(([key, file]) => `<li><a class="text-blue-700 underline" href="${repo}${file}">${escape(key)} JSON</a> · SHA-256 <code class="hash">${scene.sha256[key]}</code></li>`).join('')}</ul><p class="mt-3 text-sm">Исходный профиль сцены SHA-256: <code class="hash">${scene.oldProfileHash}</code>. Профиль попытки исправления: <code class="hash">${scene.profileHash}</code>. Старые 420 запросов, v4 и предыдущие v5 отчёты сохранены отдельно выше.</p></details></section>`;
}
