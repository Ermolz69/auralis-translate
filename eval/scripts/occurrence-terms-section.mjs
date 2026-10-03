import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');

export async function loadOccurrenceTerms(root) {
  const reportBytes = await fs.readFile(path.join(root,
    'eval/reports/2026-10-03-reg-062-occurrence-terms-v1.json'));
  const reviewBytes = await fs.readFile(path.join(root,
    'eval/reports/2026-10-03-reg-062-occurrence-terms-v1-ai-review.json'));
  const report = JSON.parse(reportBytes);
  const review = JSON.parse(reviewBytes);
  assert.equal(report.experiment,'reg-062-occurrence-terms-v1');
  assert.equal(report.decision,'reject_keep_product_v8');
  assert.equal(report.ai_review_sha256,hash(reviewBytes));
  assert.equal(review.private_report_sha256,report.private_report_sha256);
  assert.equal(report.chats,120);
  assert.equal(report.preflights,240);
  assert.equal(report.structurally_accepted,120);
  assert.equal(report.identical_pairs,27);
  assert.equal(report.review_counts.candidate_fail,8);
  assert.equal(report.review_counts.candidate_needs_review,4);
  assert.equal(review.human_bilingual_review_count,0);
  assert.equal(report.checkpoint_count,0);
  assert.equal(report.published_results,0);
  return {report,review,summary:{chats:report.chats,preflights:report.preflights,
    structurally_accepted:report.structurally_accepted,
    identical_pairs:report.identical_pairs,decision:report.decision,
    candidate_pass:report.review_counts.candidate_pass,
    candidate_fail:report.review_counts.candidate_fail,
    candidate_needs_review:report.review_counts.candidate_needs_review,
    positive_baseline_failures:report.review_counts.positive_baseline_failures,
    positive_occurrence_failures:report.review_counts.positive_occurrence_failures,
    checkpoints:report.checkpoint_count,published_results:report.published_results,
    human_review_count:0,report_sha256:hash(reportBytes)}};
}

export function renderOccurrenceTerms(data,escape) {
  const {report,review}=data;
  const reviewByKey = new Map(review.rows.map(row=>[
    `${row.id}/${row.run}/${row.variant}`,row]));
  const ids = [...new Set(report.rows.map(row=>row.id))];
  const caseRows = ids.map(id => {
    const rows = report.rows.filter(row=>row.id===id);
    const baseline=rows.filter(row=>row.variant==='baseline');
    const candidate=rows.filter(row=>row.variant==='occurrence');
    const verdicts=candidate.map(row=>reviewByKey.get(`${id}/${row.run}/occurrence`).fact_verdict);
    const counts=Object.fromEntries(['pass','fail','needs_review'].map(kind=>
      [kind,verdicts.filter(value=>value===kind).length]));
    return `<tr><th scope="row" class="p-3 text-left align-top">${escape(id)}<p class="mt-2 font-normal">${escape(rows[0].source)}</p></th><td class="p-3 align-top">${escape(baseline[0].candidate)}</td><td class="p-3 align-top">${escape(candidate[0].candidate)}</td><td class="p-3 align-top">${counts.pass} / ${counts.fail} / ${counts.needs_review}</td></tr>`;
  }).join('');
  const base='https://github.com/Ermolz69/auralis-translate/blob/main/';
  return `<section id="reg062-occurrence-terms" class="my-8 rounded-2xl border border-rose-200 bg-white p-5 md:p-7"><p class="text-sm font-semibold text-rose-900">3 октября · TERM-02 / REG-062</p><h2 class="mt-2 text-2xl font-bold">Привязка термина к точному вхождению тоже не сохранила подставку</h2><p class="mt-4">20 открытых авторских реплик, по три парных повтора: ${report.chats} ответов и ${report.preflights} проверок шаблона/токенов. Все ответы структурно валидны; ${report.identical_pairs} запросов кандидата побайтово совпали с v8. Двенадцать известных положительных ошибок v8 исправлены, но во всех трёх повторах «коврик» заменил доступную подставку. В контроле с двумя говорящими подставка также потеряна трижды. Решение: отклонить кандидат, сохранить продуктовый v8.</p><p class="mt-3 text-sm">ИИ-разбор 60 ответов кандидата: ${report.review_counts.candidate_pass} сохранений фактов, ${report.review_counts.candidate_fail} серьёзных ошибок, ${report.review_counts.candidate_needs_review} неясных случаев. Это не независимая оценка качества: китайско-русских рецензентов 0, полный 268-репличный файл не запускался, G5/RELEASE-05 открыты. Сырые ответы, неудачные варианты, хеши, время и ресурсы сохранены.</p><div class="mt-5 overflow-x-auto"><table class="w-full min-w-[900px] text-sm"><caption class="mb-3 text-left font-semibold">Все 20 случаев: первый парный ответ и ИИ-решения кандидата за три повтора (успех / ошибка / неясно)</caption><thead><tr><th class="p-3 text-left">Исходник</th><th class="p-3 text-left">v8</th><th class="p-3 text-left">Точное вхождение</th><th class="p-3 text-left">3 повтора</th></tr></thead><tbody>${caseRows}</tbody></table></div><p class="mt-4 text-sm">Вход/выход v8: ${report.totals.baseline.prompt_tokens}/${report.totals.baseline.completion_tokens}; кандидат: ${report.totals.occurrence.prompt_tokens}/${report.totals.occurrence.completion_tokens}. Весь модельный этап: ${report.wall_elapsed_ms} мс. Выборочный working set: ${report.sampled_max_process_working_set_bytes} байт; память всей GPU: ${report.sampled_max_device_gpu_mib} МиБ. Это нижние оценки ресурсов одного запуска.</p><p class="mt-4 flex flex-wrap gap-4 text-sm"><a class="underline" href="${base}eval/experiments/2026-10-03-reg-062-occurrence-terms-v1-plan.md">План до модели</a><a class="underline" href="${base}eval/experiments/2026-10-03-reg-062-occurrence-terms-v1-result.md">Решение и ограничения</a><a class="underline" href="${base}eval/reports/2026-10-03-reg-062-occurrence-terms-v1.json">Все парные ответы JSON</a><a class="underline" href="${base}eval/reports/2026-10-03-reg-062-occurrence-terms-v1-ai-review.json">Источник и ИИ-разбор</a><a class="underline" href="${base}eval/regressions/catalog-v43.json">Каталог v43</a></p></section>`;
}
