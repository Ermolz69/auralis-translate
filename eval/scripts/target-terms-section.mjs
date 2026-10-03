import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export async function loadTargetTerms(root) {
  const bytes = await fs.readFile(path.join(root,'eval/reports/2026-10-03-reg-061-target-terms-v1.json'));
  const report = JSON.parse(bytes);
  const reviewBytes = await fs.readFile(path.join(root,'eval/reports/2026-10-03-reg-061-target-terms-v1-ai-review.json'));
  const review = JSON.parse(reviewBytes);
  assert.equal(report.ai_review_sha256,createHash('sha256').update(reviewBytes).digest('hex'));
  assert.equal(report.decision,'reject_keep_product_v8');
  assert.equal(report.chats,30);
  assert.equal(report.preflights,60);
  assert.equal(report.identical_pairs,8);
  assert.equal(report.checkpoint_count,0);
  assert.equal(report.published_results,0);
  assert.equal(review.human_bilingual_review_count,0);
  const previous = JSON.parse(await fs.readFile(path.join(root,'eval/reports/2026-10-02-reg-058-provisional-terms-v1.json')));
  const controls = JSON.parse(await fs.readFile(path.join(root,'eval/regressions/reg-058-provisional-terms-controls-v1.json')));
  return {report,review,previous,controls,summary:{
    chats:report.chats,preflights:report.preflights,structurally_accepted:report.structurally_accepted,
    identical_pairs:report.identical_pairs,original_positive_repairs:2,original_negative_preserved:2,
    scoped_fact_passes:review.rows.filter(row=>row.variant==='scoped' && row.fact_verdict==='pass').length,
    scoped_fact_failures:review.rows.filter(row=>row.variant==='scoped' && row.fact_verdict==='fail').length,
    scoped_needs_review:review.rows.filter(row=>row.variant==='scoped' && row.fact_verdict==='needs_review').length,
    decision:report.decision,totals:report.totals,wall_elapsed_ms:report.wall_elapsed_ms,
    human_review_count:0,checkpoints:0,published_results:0,
    report_sha256:createHash('sha256').update(bytes).digest('hex') }};
}

export function renderTargetTerms(data,escape) {
  const {report,review,previous,controls}=data;
  const pairedRows = [...new Set(report.rows.map(row=>row.id))].map(id=>{
    const baseline=report.rows.find(row=>row.id===id && row.variant==='baseline');
    const scoped=report.rows.find(row=>row.id===id && row.variant==='scoped');
    const judgement=review.rows.find(row=>row.id===id && row.variant==='scoped');
    return `<tr><th scope="row" class="p-3 text-left align-top">${escape(id)}<p class="mt-2 font-normal">${escape(scoped.source)}</p></th><td class="p-3 align-top">${escape(baseline.candidate)}</td><td class="p-3 align-top">${escape(scoped.candidate)}</td><td class="p-3 align-top"><strong>${escape(judgement.fact_verdict)}</strong><p class="mt-2">${escape(judgement.reason)}</p><p class="mt-2 font-mono text-xs">scope: ${escape(scoped.review_state)} · v8 bytes: ${scoped.baseline_identical}</p></td></tr>`;
  }).join('');
  const previousRows=controls.controls.map(control=>{
    const baseline=previous.rows.find(row=>row.id===control.id && row.variant==='baseline');
    const terms=previous.rows.find(row=>row.id===control.id && row.variant==='terms');
    return `<tr><th class="p-3 text-left align-top">${escape(control.source)}</th><td class="p-3 align-top">${escape(baseline.candidate)}</td><td class="p-3 align-top">${escape(terms.candidate)}</td></tr>`;
  }).join('');
  const base='https://github.com/Ermolz69/auralis-translate/blob/main/';
  return `<section id="reg061-target-terms" class="my-8 rounded-2xl border border-rose-200 bg-white p-5 md:p-7"><p class="text-sm font-semibold text-rose-900">3 октября · REG-061 / REG-062</p><h2 class="mt-2 text-2xl font-bold">Целевая область исправлена; кандидат отклонён из-за смыслового сбоя в противопоставлении</h2><p class="mt-4">30 реальных ответов, 60 проверок шаблона/токенов, 8 пар с побайтово одинаковыми запросами v8. Два исходных положительных термина исправлены и два исходных отрицательных случая сохранены. Но подставка в новом противопоставлении стала «ковриком-стендом»; два упоминания требуют проверки. Вариант не продвинут, продуктовый v8 не изменён, полный файл не запускался.</p><p class="mt-3 text-sm">Все оценки ниже — ИИ-разбор исходного китайского текста, не независимая оценка человека. Термины ASUS предварительные и раскрыты модели; approved_terms пуст. Эталоны полных реплик не передавались модели. Повторов, контрольных точек и опубликованных SRT: 0. Предел: 256 выходных + 64 запасных токена в контексте 2048, одна попытка.</p><div class="mt-5 overflow-x-auto"><table class="w-full min-w-[860px] text-sm"><caption class="mb-3 text-left font-semibold">Все 15 пар: источник, v8, подсказка и отдельное ИИ-решение</caption><thead><tr><th class="p-3 text-left">Целевой китайский текст</th><th class="p-3 text-left">v8</th><th class="p-3 text-left">Целевая подсказка</th><th class="p-3 text-left">ИИ-разбор фактов</th></tr></thead><tbody>${pairedRows}</tbody></table></div><p class="mt-4 text-sm">Вход/выход v8: ${report.totals.baseline.prompt_tokens}/${report.totals.baseline.completion_tokens}; вариант: ${report.totals.scoped.prompt_tokens}/${report.totals.scoped.completion_tokens}. Сумма HTTP-времени: ${report.totals.baseline.chat_elapsed_ms}/${report.totals.scoped.chat_elapsed_ms} мс; весь модельный этап: ${report.wall_elapsed_ms} мс. Выборочный working set: ${report.sampled_max_process_working_set_bytes} байт; память всей GPU: ${report.sampled_max_device_gpu_mib} МиБ. Это один опыт, а не SLA или оценка качества.</p><p class="mt-4 flex flex-wrap gap-4 text-sm"><a class="underline" href="${base}eval/experiments/2026-10-03-reg-061-target-terms-v1-plan.md">План до модели</a><a class="underline" href="${base}eval/experiments/2026-10-03-reg-061-target-terms-v1-result.md">Решение и хеши</a><a class="underline" href="${base}eval/reports/2026-10-03-reg-061-target-terms-v1.json">Все сырые ответы JSON</a><a class="underline" href="${base}eval/reports/2026-10-03-reg-061-target-terms-v1-ai-review.json">Отдельный ИИ-разбор</a><a class="underline" href="${base}eval/regressions/catalog-v41.json">Регрессионный каталог v41</a></p><details class="mt-6"><summary class="cursor-pointer font-semibold">Прежние десять пар с общей подсказкой ASUS · 2 октября</summary><p class="mt-3 text-sm">20 ответов, 40 токенных проверок. Вход/выход v8: 2899/501; подсказка: 3609/521. Обе положительные ошибки улучшены, но два правильных отрицательных случая испорчены. Вариант отклонён; исходные замеры и сырые ответы сохранены.</p><div class="mt-4 overflow-x-auto"><table class="w-full min-w-[760px] text-sm"><thead><tr><th class="p-3 text-left">Источник</th><th class="p-3 text-left">v8</th><th class="p-3 text-left">Общая подсказка ASUS</th></tr></thead><tbody>${previousRows}</tbody></table></div><a class="mt-4 inline-block text-sm underline" href="${base}eval/experiments/2026-10-02-reg-058-provisional-terms-v1-result.md">Прежний план, ответы, ресурсы и решение</a></details><p class="mt-4 text-sm">Ещё раньше общая смысловая инструкция не исправила термины: 18 пар, 36 ответов, 72 проверки токенов. <a class="underline" href="${base}eval/experiments/2026-10-02-reg-058-semantic-instruction-v1-result.md">Замеры и неудачные попытки</a>. <a class="underline" href="${base}eval/experiments/2026-10-02-reg-058-paired-controls-result.md">Предшествующие 1.8B/7B контроли и ошибка измерителя</a>.</p><p class="mt-4 text-sm">Независимых китайско-русских оценок: 0. G3–G9, RELEASE-05, аудиогейты и полный Goal остаются открытыми. <a class="underline" href="./index.html">Текущее состояние →</a></p></section>`;
}
