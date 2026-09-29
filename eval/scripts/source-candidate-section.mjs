import fs from 'node:fs/promises';
import path from 'node:path';
import { validateSourceInventory } from './source-inventory.mjs';

const inventoryPaths = [
  'eval/corpora/commons-inspected-candidates-v1.json',
  'eval/corpora/commons-cc-commerce-candidate-v1.json',
  'eval/corpora/youtube-mingfay-candidate-v1.json',
];

export async function loadSourceCandidates(root) {
  const inventories = await Promise.all(inventoryPaths.map(async file => {
    const inventory = JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
    return { inventory, counts: validateSourceInventory(inventory) };
  }));
  const commerce = inventories[1].inventory.sources[0];
  const mingfay = inventories[2].inventory.sources[0];
  if (inventories[1].inventory.sources.length !== 1
      || commerce.id !== 'commons-cc-commerce-906218083'
      || commerce.state !== 'inspected_candidate'
      || commerce.split !== 'unassigned') {
    throw new Error('CC commerce candidate identity or admission state changed');
  }
  if (inventories[2].inventory.sources.length !== 1
      || mingfay.id !== 'mingfay-walk-chinese-derivative-v1'
      || mingfay.state !== 'inspected_candidate'
      || mingfay.split !== 'unassigned'
      || mingfay.cue_count !== 230) {
    throw new Error('Mingfay candidate identity or admission state changed');
  }
  return {
    source_count: inventories.reduce((total, entry) => total + entry.counts.source_count, 0),
    inspected_cues: inventories.reduce((total, entry) => total + entry.counts.inspected_candidate_cues, 0),
    eligible_cues: inventories.reduce((total, entry) => total + entry.counts.eligible_cues, 0),
    commerce_revision: commerce.revision,
    commerce_cues: commerce.cue_count,
    commerce_sha256: commerce.sha256,
    mingfay_cues: mingfay.cue_count,
    mingfay_sha256: mingfay.sha256,
  };
}

export function renderSourceCandidates(summary) {
  return `<section id="source-candidates" class="my-8 scroll-mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">DATA-03 · проверка источников, без оценки перевода</p><h2 class="mt-2 text-2xl font-bold">${summary.source_count} источников, ${summary.inspected_cues} проверенных реплик, ${summary.eligible_cues} допущенных</h2><p class="mt-3 max-w-4xl text-slate-700">Ранее были проверены 4 источника Commons и 488 реплик, ни одна не допущена. Новый ролик Mingfay Chinese длится 13:47. Его обычный китайский трек содержал пиньинь, китайский и английский в каждой из 230 реплик; последняя реплика стояла после более позднего таймкода. Для частного теста создан отдельный китайский SRT с полной картой перестановки: ${summary.mingfay_cues} реплик прошли строгий разбор. Это технический кандидат. Права, совпадение речи и субтитров, русский эталон и независимая оценка не установлены; ни одна реплика из пяти источников не входит в допущенный корпус или закрытый holdout.</p><p class="mt-3 text-xs text-slate-600">Китайская производная копия: SHA-256 <code class="hash">${summary.mingfay_sha256}</code>. Ранее проверенный Commons SRT: ревизия ${summary.commerce_revision}, ${summary.commerce_cues} реплики, SHA-256 <code class="hash">${summary.commerce_sha256}</code>. Исходные строки и медиа в отчёт не встроены.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-youtube-mingfay-caption-candidate.md">Новый источник и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/corpora/youtube-mingfay-candidate-v1.json">Новый недопущенный инвентарь</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-commons-cc-commerce-candidate.md">Прежний источник Commons (EN)</a><a class="underline" href="https://www.youtube.com/watch?v=0hoTgJKET7Q">Страница ролика</a></div></section>`;
}
