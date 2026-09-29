import fs from 'node:fs/promises';
import path from 'node:path';
import { validateSourceInventory } from './source-inventory.mjs';

const inventoryPaths = [
  'eval/corpora/commons-inspected-candidates-v1.json',
  'eval/corpora/commons-cc-commerce-candidate-v1.json',
];

export async function loadSourceCandidates(root) {
  const inventories = await Promise.all(inventoryPaths.map(async file => {
    const inventory = JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
    return { inventory, counts: validateSourceInventory(inventory) };
  }));
  const commerce = inventories[1].inventory.sources[0];
  if (inventories[1].inventory.sources.length !== 1
      || commerce.id !== 'commons-cc-commerce-906218083'
      || commerce.state !== 'inspected_candidate'
      || commerce.split !== 'unassigned') {
    throw new Error('CC commerce candidate identity or admission state changed');
  }
  return {
    source_count: inventories.reduce((total, entry) => total + entry.counts.source_count, 0),
    inspected_cues: inventories.reduce((total, entry) => total + entry.counts.inspected_candidate_cues, 0),
    eligible_cues: inventories.reduce((total, entry) => total + entry.counts.eligible_cues, 0),
    commerce_revision: commerce.revision,
    commerce_cues: commerce.cue_count,
    commerce_sha256: commerce.sha256,
  };
}

export function renderSourceCandidates(summary) {
  return `<section id="source-candidates" class="my-8 scroll-mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">DATA-03 · проверка источников, без оценки перевода</p><h2 class="mt-2 text-2xl font-bold">${summary.source_count} источника, ${summary.inspected_cues} проверенных реплик, ${summary.eligible_cues} допущенных</h2><p class="mt-3 max-w-4xl text-slate-700">Новый китайский SRT к ролику Creative Commons содержит ${summary.commerce_cues} строго разобранные реплики. У ролика английская речь, поэтому этот текст не подтверждает совпадение китайской речи с субтитрами для озвучки. История Commons содержит одну ревизию с комментарием автора «added machine transcribed subtitles»; способ создания и точность текста независимо не проверены. Права на текст, сцены, эталонный русский перевод и человеческая оценка остаются неустановленными. Ни одна реплика из этих четырёх кандидатов не используется как допущенный корпус или закрытый holdout.</p><p class="mt-3 text-xs text-slate-600">Новый SRT: ревизия ${summary.commerce_revision}, SHA-256 <code class="hash">${summary.commerce_sha256}</code>. Исходные строки и медиа в отчёт не встроены.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-commons-cc-commerce-candidate.md">Происхождение и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/corpora/commons-cc-commerce-candidate-v1.json">Недопущенный инвентарь</a><a class="underline" href="https://commons.wikimedia.org/wiki/File:Creative_Commons_and_Commerce.ogv">Страница медиа Commons</a></div></section>`;
}
