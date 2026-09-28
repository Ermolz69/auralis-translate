import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const SUCCESS_FILE = 'v5-terms-paired-v2-2026-09-28.json';
const FAILURE_FILE = 'v5-terms-paired-v1-failed-2026-09-28.json';

export async function loadTermsProbe(root) {
  const successBytes = await fs.readFile(path.join(root, 'eval/reports', SUCCESS_FILE));
  const failureBytes = await fs.readFile(path.join(root, 'eval/reports', FAILURE_FILE));
  const corpusBytes = await fs.readFile(path.join(root, 'eval/corpora/v5-terms-paired-v1.json'));
  const report = JSON.parse(successBytes);
  const failed = JSON.parse(failureBytes);
  const corpus = JSON.parse(corpusBytes);
  assert.equal(report.status, 'passed_structural_probe');
  assert.equal(report.failures.length, 0);
  assert.equal(failed.status, 'failed');
  assert.equal(failed.requests.filter(row => row.path === '/v1/chat/completions').length, 15);
  assert.equal(report.corpus_sha256, digest(corpusBytes));
  assert.equal(report.profile_sha256.no_terms, report.profile_sha256.terms);
  const measuredProfileHash = digest(await fs.readFile(path.join(root, 'eval/profiles/2026-09-28-hy_mt2_1_8b_q4_k_m.context_v5_scene_terms.experimental.json')));
  const activeProfileHash = digest(await fs.readFile(path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v5_scene_terms.experimental.json')));
  assert.equal(report.profile_sha256.terms, measuredProfileHash);
  assert.notEqual(activeProfileHash, measuredProfileHash, 'historical term evidence must not be relabelled as the current profile');
  assert.equal(report.cases.length, 3);
  assert.equal(report.requests.filter(row => row.path === '/v1/chat/completions').length, 18);
  assert.equal(report.requests.length, 72);
  assert(report.cases.every(row => row.arms.length === 2 && row.arms.every(arm => arm.offline_reexport === 'byte_identical')));
  const rows = corpus.cases.map(source => {
    const row = report.cases.find(candidate => candidate.id === source.id);
    assert(row && row.arms[0].arm === 'no_terms' && row.arms[1].arm === 'terms');
    return { id: row.id, source: source.target_zh, before: source.relevant.before_zh.join(' '), after: source.relevant.after_zh.join(' '), no_terms: row.arms[0].accepted_target, terms: row.arms[1].accepted_target, proposed: source.relevant.reference_ru };
  });
  return {
    success_sha256: digest(successBytes), failure_sha256: digest(failureBytes),
    profile_sha256: report.profile_sha256.terms, corpus_sha256: report.corpus_sha256,
    chat_requests: 18, loopback_requests: 72, rows,
  };
}

export function renderTermsProbe(probe, escape) {
  const root = 'https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/';
  const rows = probe.rows.map(row => `<tr data-terms-row="${escape(row.id)}"><th scope="row">${escape(row.id)}</th><td lang="zh-Hans">${escape(row.before)}<br><strong>${escape(row.source)}</strong><br>${escape(row.after)}</td><td>${escape(row.no_terms)}</td><td>${escape(row.terms)}</td></tr>`).join('');
  return `<section id="v5-terms" class="scroll-mt-8 border-t border-slate-200 py-10"><p class="text-sm font-semibold uppercase tracking-[.12em] text-blue-700">Реальная модель · экспериментальные термины · 28 сентября 2026</p><h2 class="mt-2 text-2xl font-semibold">Термин привязан к исходной реплике</h2><p class="mt-3 max-w-5xl text-slate-600">Три одинаковые авторские китайские сцены переведены без термина и с ним. Модель, профиль, контекст, исходник и настройки совпадали. Синтетический словарь помечен как не проверенный человеком: этот опыт подтверждает прохождение данных и показывает наблюдаемые ответы, но не оценивает качество на релизных субтитрах.</p><div class="mt-5 overflow-x-auto"><table class="measurement"><thead><tr><th>Случай</th><th>Сцена · целевая реплика выделена</th><th>Без термина</th><th>С термином «小王 → Сяо Ван»</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-3 text-sm text-slate-600">ИИ-разбор авторского исходника: в t02 оба варианта сохраняют отрицание, но только термин даёт выбранное написание имени; в t03 обе версии сохраняют 3 юаня, а термин даёт выбранное имя и глагол оплаты. t01 совпал в обеих версиях. Это не человеческая оценка точности.</p><div class="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm"><strong>${probe.chat_requests} ответов модели, ${probe.loopback_requests} HTTP-вызова.</strong> Шесть полных SRT прошли проверку защищённых байтов и побайтный повторный экспорт. Термин попал ровно в одну целевую реплику каждой сцены. Профиль SHA-256: <code class="hash">${probe.profile_sha256}</code>.</div><details class="mt-5"><summary class="cursor-pointer font-semibold text-blue-700">Сырые запросы, ответы, токены, время, память и сохранённый сбой</summary><ul class="mt-3 list-disc space-y-2 pl-6 text-sm"><li><a class="text-blue-700 underline" href="${root}${SUCCESS_FILE}">Полный успешный JSON</a> · SHA-256 <code class="hash">${probe.success_sha256}</code></li><li><a class="text-blue-700 underline" href="${root}${FAILURE_FILE}">Остановленный первый прогон</a> · SHA-256 <code class="hash">${probe.failure_sha256}</code>; скрипт недосчитал HTTP-бюджет после 15 ответов модели.</li></ul><p class="mt-3 text-sm">План, входной корпус, код и ограничения находятся в репозитории. Прежние 420 измеренных запросов и более ранние v5 пробы сохранены на этой странице.</p></details></section>`;
}
