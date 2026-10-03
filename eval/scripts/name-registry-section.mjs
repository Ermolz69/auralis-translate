import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export async function loadNameRegistry(root) {
  const bytes = await fs.readFile(path.join(root,'eval/reports/2026-10-03-source-name-registry-v1.json'));
  const report = JSON.parse(bytes);
  const review = JSON.parse(await fs.readFile(path.join(root,'eval/reports/2026-10-03-source-name-registry-v1-ai-review.json')));
  assert.equal(review.report_sha256,createHash('sha256').update(bytes).digest('hex'));
  assert.equal(review.human_ratings,0);
  assert.equal(review.reviewed_observations,report.observations.length);
  return {report,review,summary:{status:report.status,decision:review.decision,
    ...report.counters,consistency_improved:review.consistency_improved,
    new_semantic_errors:review.new_semantic_errors,uncertain_regressions:review.uncertain_regressions,
    human_review_count:0,long_file_run:false,wall_elapsed_ms:report.wall_elapsed_ms,
    report_sha256:createHash('sha256').update(bytes).digest('hex')}};
}

export function renderNameRegistry({report,review},escape) {
  const ids=[...new Set(report.observations.map(o=>o.segment_id))];
  const rows=ids.map(id=>{
    const observations=report.observations.filter(o=>o.segment_id===id);
    const outputs=variant=>observations.filter(o=>o.variant===variant).map(o=>
      `<p class="mt-2"><span class="font-mono text-xs">${o.repetition}.</span> ${escape(o.accepted??`Rejected: ${o.outcome}`)}</p>`).join('');
    const judgement=review.rows.find(row=>row.segment_id===id);
    return `<tr><th scope="row" class="p-3 text-left align-top">${id}. ${escape(observations[0].source)}</th><td class="p-3 align-top">${outputs('baseline')}</td><td class="p-3 align-top">${outputs('registry')}</td><td class="p-3 align-top">${escape(judgement?.reason??'No semantic assessment')}</td></tr>`;
  }).join('');
  const base='https://github.com/Ermolz69/auralis-translate/blob/main/';
  return `<section id="source-name-registry" class="my-8 rounded-2xl border border-amber-200 bg-white p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">3 октября · NAME-01 · source-name-registry-v1</p><h2 class="mt-2 text-2xl font-bold">Реестр имён: сохранение проверено, качество требует отдельного решения</h2><p class="mt-4">Китайские кандидаты и точные вхождения хранятся в Translate SQLite. Подсказка действует только в целевой реплике; соседнее имя её не активирует. Разные имена и одинаковые обращения в разных сценах остаются отдельными. Смена версии запрещает несовместимое продолжение, прежний результат можно экспортировать по его сохранённой версии.</p><p class="mt-3">Опыт: ${report.counters.chats} ответов модели, ${report.counters.preflights} проверок шаблона/токенов, ${report.counters.checkpoints} checkpoint, ${report.counters.results} полных development-черновиков. Решение ИИ: <strong>${review.decision === 'advance' ? 'допустить отдельный следующий опыт' : 'отклонить продвижение к длинному файлу'}</strong>. Неединообразные формы сократились с ${review.consistency.baseline_inconsistent_entity_runs}/${review.consistency.entity_run_denominator_per_arm} до ${review.consistency.registry_inconsistent_entity_runs}/${review.consistency.entity_run_denominator_per_arm} групп «сущность/прогон», но появился перенос действия из соседней реплики и подмена формы имени. Все формы предложены ИИ, имеют needs_review; независимых оценок человека: 0. Полный естественный файл не запускался.</p><div class="mt-5 overflow-x-auto"><table class="w-full min-w-[850px] text-sm"><caption class="mb-3 text-left font-semibold">Все целевые реплики и сохранённые ответы, без отбора удачных примеров</caption><thead><tr><th class="p-3 text-left">Китайский источник</th><th class="p-3 text-left">Исходный v8</th><th class="p-3 text-left">v8 + реестр</th><th class="p-3 text-left">ИИ-разбор</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-4 text-sm">Запросы и контекст, исходные ответы, хеши, токены, время и выборочные ресурсы сохранены в отчёте. Начало/середина/конец 1024 реплик проверены структурными тестами; это не естественный длинный перевод. G3–G5 и RELEASE-05 открыты.</p><p class="mt-4 flex flex-wrap gap-4 text-sm"><a class="underline" href="${base}eval/experiments/2026-10-03-source-name-registry-v1-plan.md">План до модели</a><a class="underline" href="${base}eval/experiments/2026-10-03-source-name-registry-v1-result.md">Решение и ограничения</a><a class="underline" href="${base}eval/reports/2026-10-03-source-name-registry-v1.json">Полный JSON</a><a class="underline" href="${base}eval/reports/2026-10-03-source-name-registry-v1-ai-review.json">Отдельный ИИ-разбор</a><a class="underline" href="./index.html">Текущее состояние →</a></p></section>`;
}

export function renderCurrentNameRegistry(summary) {
  return `<section id="name-registry-current" class="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 class="text-2xl font-bold">Реестр имён: инженерная часть проверена</h2><p class="mt-3">Версии, точные китайские вхождения и предложенные русские формы сохраняются в SQLite; подсказки ограничены целевой репликой. Реальный development-опыт: ${summary.chats} ответов. Продвижение к длинному файлу: ${summary.decision==='advance'?'допущено только отдельным планом':'не допущено'}. Имена остаются needs_review, человеческих оценок — 0; продуктовый v8 и открытые гейты качества сохраняют прежний статус.</p><a class="mt-3 inline-block font-semibold text-blue-700 underline" href="./history.html#source-name-registry">Все ответы, ИИ-решение и пределы →</a></section>`;
}
