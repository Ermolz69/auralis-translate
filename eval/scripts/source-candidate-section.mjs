import fs from 'node:fs/promises';
import path from 'node:path';
import { validateSourceInventory } from './source-inventory.mjs';

const inventoryPaths = [
  'eval/corpora/commons-inspected-candidates-v1.json',
  'eval/corpora/commons-cc-commerce-candidate-v1.json',
  'eval/corpora/youtube-mingfay-candidate-v1.json',
  'eval/corpora/commons-ying-candidate-v1.json',
  'eval/corpora/commons-vivo-candidate-v1.json',
];

export async function loadSourceCandidates(root) {
  const inventories = await Promise.all(inventoryPaths.map(async file => {
    const inventory = JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
    return { inventory, counts: validateSourceInventory(inventory) };
  }));
  const commerce = inventories[1].inventory.sources[0];
  const mingfay = inventories[2].inventory.sources[0];
  const ying = inventories[3].inventory.sources[0];
  const vivo = inventories[4].inventory.sources[0];
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
  if (inventories[3].inventory.sources.length !== 1
      || ying.id !== 'commons-ying-henan-1238607314'
      || ying.state !== 'inspected_candidate'
      || ying.split !== 'unassigned'
      || ying.cue_count !== 93) {
    throw new Error('Ying candidate identity or admission state changed');
  }
  if (inventories[4].inventory.sources.length !== 1
      || vivo.id !== 'commons-geekerwan-vivo-979826861'
      || vivo.state !== 'inspected_candidate'
      || vivo.split !== 'unassigned'
      || vivo.cue_count !== 467) {
    throw new Error('Vivo candidate identity or admission state changed');
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
    ying_cues: ying.cue_count,
    ying_sha256: ying.sha256,
    vivo_cues: vivo.cue_count,
    vivo_sha256: vivo.sha256,
  };
}

export function renderSourceCandidates(summary) {
  return `<section id="source-candidates" class="my-8 scroll-mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">DATA-03 · проверка источников, без оценки перевода</p><h2 class="mt-2 text-2xl font-bold">${summary.source_count} источников, ${summary.inspected_cues} проверенных реплик, ${summary.eligible_cues} допущенных</h2><p class="mt-3 max-w-4xl text-slate-700">Первые 4 источника Commons дали 488 реплик. Ролик Mingfay Chinese длится 13:47: его смешанный трек разделён в отдельный китайский SRT с ${summary.mingfay_cues} строго разобранными репликами. Совпадающие субтитры и видео Ying добавили ${summary.ying_cues} реплики, но пробный русский перевод содержит серьёзные ошибки смысла. 20:30 видео о поезде имеет 206 реплик; 240p-копия содержит VP9/Opus, но китайская речь не подтверждена. Новый 18:36 разговор Geekerwan с vivo и MediaTek дал ${summary.vivo_cues} строго разобранных китайских реплик и несколько заявленных говорящих; медиа ещё не сверено с субтитрами. Права импортированных видео, авторство подписей, точность речи и субтитров, русский эталон и независимая оценка не установлены; ни одна реплика из семи источников не входит в допущенный корпус или закрытый holdout.</p><p class="mt-3 text-xs text-slate-600">Китайские SRT SHA-256: Vivo <code class="hash">${summary.vivo_sha256}</code>; Ying <code class="hash">${summary.ying_sha256}</code>; производная Mingfay <code class="hash">${summary.mingfay_sha256}</code>. Ранее проверенный Commons SRT: ревизия ${summary.commerce_revision}, ${summary.commerce_cues} реплики, SHA-256 <code class="hash">${summary.commerce_sha256}</code>. Исходные строки и медиа в отчёт не встроены.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-geekerwan-vivo-caption-result.md">18:36 китайский источник (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-commons-train-240p-stream-result.md">20:30 видео и дорожки (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/corpora/commons-vivo-candidate-v1.json">Недопущенный инвентарь Vivo</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-youtube-mingfay-caption-candidate.md">Mingfay и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-commons-cc-commerce-candidate.md">Ранний Commons источник (EN)</a><a class="underline" href="https://www.youtube.com/watch?v=_G4e2p1p-is">Видео интервью на YouTube</a></div></section>`;
}
