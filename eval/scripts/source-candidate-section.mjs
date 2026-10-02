import fs from 'node:fs/promises';
import path from 'node:path';
import { validateSourceInventory } from './source-inventory.mjs';
import { validateCrossInventorySourceGroups } from './cross-inventory-source-groups.mjs';

const historicalInventoryPaths = [
  'eval/corpora/commons-inspected-candidates-v1.json',
  'eval/corpora/commons-cc-commerce-candidate-v1.json',
  'eval/corpora/youtube-mingfay-candidate-v1.json',
  'eval/corpora/commons-ying-candidate-v1.json',
  'eval/corpora/commons-vivo-candidate-v1.json',
  'eval/corpora/commons-geekerwan-two-scenes-candidate-v1.json',
  'eval/corpora/commons-sethlui-candidate-v1.json',
  'eval/corpora/paywall-chinese-candidate-v1.json',
  'eval/corpora/youtube-geekerwan-kirin-original-candidate-v1.json',
];

const currentInventoryPaths = historicalInventoryPaths.map(file => {
  if (file === 'eval/corpora/commons-inspected-candidates-v1.json') {
    return 'eval/corpora/commons-inspected-candidates-v2.json';
  }
  if (file === 'eval/corpora/commons-geekerwan-two-scenes-candidate-v1.json') {
    return 'eval/corpora/commons-geekerwan-two-scenes-candidate-v2.json';
  }
  return file;
}).concat('eval/corpora/commons-wikipedia-lesson-candidate-v1.json');

async function loadCandidates(root, paths, current) {
  const inventories = await Promise.all(paths.map(async file => {
    const inventory = JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
    return { inventory, counts: validateSourceInventory(inventory) };
  }));
  const commerce = inventories[1].inventory.sources[0];
  const mingfay = inventories[2].inventory.sources[0];
  const ying = inventories[3].inventory.sources[0];
  const vivo = inventories[4].inventory.sources[0];
  const [asus, kirin] = inventories[5].inventory.sources;
  const sethlui = inventories[6].inventory.sources[0];
  const paywall = inventories[7].inventory.sources[0];
  const originalKirin = inventories[8].inventory.sources[0];
  const lesson = current ? inventories[9].inventory.sources[0] : null;
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
  if (inventories[5].inventory.sources.length !== 2
      || asus.id !== 'commons-geekerwan-asus-892592485'
      || kirin.id !== 'commons-geekerwan-kirin-880535591'
      || [asus, kirin].some(source => source.state !== 'inspected_candidate'
        || source.split !== 'unassigned')
      || asus.cue_count !== 268 || kirin.cue_count !== 304) {
    throw new Error('ASUS/Kirin candidate identities or admission states changed');
  }
  if (inventories[6].inventory.sources.length !== 1
      || sethlui.id !== 'commons-sethlui-restaurant-in-duration-v1'
      || sethlui.state !== 'inspected_candidate'
      || sethlui.split !== 'unassigned'
      || sethlui.cue_count !== 263
      || sethlui.media_duration_ms !== 738056) {
    throw new Error('restaurant candidate identity, duration or admission state changed');
  }
  if (inventories[7].inventory.sources.length !== 1
      || paywall.id !== 'paywall-chinese-4b4ffc0c'
      || paywall.state !== 'inspected_candidate'
      || paywall.split !== 'unassigned'
      || paywall.cue_count !== 880
      || paywall.media_duration_ms !== 3888085
      || paywall.rights.subtitle.decision !== 'approved'
      || paywall.rights.audio.decision !== 'approved'
      || paywall.rights.reference.decision !== 'unknown') {
    throw new Error('Paywall candidate identity, rights or admission state changed');
  }
  if (inventories[8].inventory.sources.length !== 1
      || originalKirin.id !== 'youtube-geekerwan-kirin-original-2026-10-02'
      || originalKirin.group_id !== kirin.group_id
      || originalKirin.state !== 'inspected_candidate'
      || originalKirin.split !== 'unassigned'
      || originalKirin.cue_count !== 343
      || ['subtitle', 'reference', 'audio'].some(kind =>
        originalKirin.rights[kind].decision !== 'unknown')) {
    throw new Error('Original Kirin candidate identity, grouping or admission changed');
  }
  if (current && (inventories[9].inventory.sources.length !== 1
      || lesson.id !== 'commons-wikipedia-lesson-2-100755166-derivative-v1'
      || lesson.state !== 'inspected_candidate' || lesson.split !== 'unassigned'
      || lesson.cue_count !== 37 || lesson.media_duration_ms !== 239000
      || ['subtitle', 'reference', 'audio'].some(kind =>
        lesson.rights[kind].decision !== 'unknown'))) {
    throw new Error('Wikipedia lesson candidate identity, timing or admission changed');
  }
  const identityCounts = current
    ? validateCrossInventorySourceGroups(inventories.map(entry => entry.inventory))
    : null;
  return {
    source_count: inventories.reduce((total, entry) => total + entry.counts.source_count, 0),
    ...(identityCounts ? { media_groups: identityCounts.group_count } : {}),
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
    asus_cues: asus.cue_count,
    asus_sha256: asus.sha256,
    kirin_cues: kirin.cue_count,
    kirin_sha256: kirin.sha256,
    original_kirin_cues: originalKirin.cue_count,
    original_kirin_sha256: originalKirin.sha256,
    sethlui_cues: sethlui.cue_count,
    sethlui_sha256: sethlui.sha256,
    sethlui_media_duration_ms: sethlui.media_duration_ms,
    paywall_cues: paywall.cue_count,
    paywall_sha256: paywall.sha256,
    paywall_media_duration_ms: paywall.media_duration_ms,
    ...(lesson ? { lesson_cues: lesson.cue_count,
      lesson_sha256: lesson.sha256,
      lesson_media_duration_ms: lesson.media_duration_ms } : {}),
  };
}

export async function loadSourceCandidates(root) {
  return loadCandidates(root, currentInventoryPaths, true);
}

export async function loadHistoricalSourceCandidates(root) {
  return loadCandidates(root, historicalInventoryPaths, false);
}

export function renderSourceCandidates(summary) {
  return `<section id="source-candidates" class="my-8 scroll-mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">DATA-03 · проверка источников, без оценки перевода</p><h2 class="mt-2 text-2xl font-bold">${summary.source_count} источников, ${summary.inspected_cues} проверенных реплик, ${summary.eligible_cues} допущенных</h2><p class="mt-3 max-w-4xl text-slate-700">Первые 4 источника Commons дали 488 реплик. Ролик Mingfay Chinese длится 13:47: его смешанный трек разделён в отдельный китайский SRT с ${summary.mingfay_cues} строго разобранными репликами. Совпадающие субтитры и видео Ying добавили ${summary.ying_cues} реплики, но пробный русский перевод содержит серьёзные ошибки смысла. 20:30 видео о поезде имеет 206 реплик; 240p-копия содержит VP9/Opus, но китайская речь не подтверждена. Разговор Geekerwan с vivo и MediaTek длится 18:36 и дал ${summary.vivo_cues} строго разобранных китайских реплик. Два других видео Geekerwan длительностью 14:42 и 12:41 добавили ${summary.asus_cues} и ${summary.kirin_cues} реплики. Все три совпадающие 240p-копии содержат VP9/Opus; девять фрагментов начала, середины и конца декодированы для приватного прослушивания, но речь и совпадение реплик человеком пока не проверены. Отдельная текущая дорожка оригинального Kirin дала ${summary.original_kirin_cues} строго разобранные реплики; 39 идут после архивного видео, а две ограниченные попытки получить оригинальное медиа вернули HTTP 302 и 403. Ролик о кухне добавил ${summary.sethlui_cues} реплики после проверки фактической длительности потока; исходные восемь поздних реплик сохранены только в оригинале. Для остальных одиннадцати источников права на видео или подписи остаются неустановленными. У Paywall лицензии фильма и титров подтверждены первичными страницами, но точность речевого соответствия, русский эталон и независимая оценка не установлены; ни одна реплика из ${summary.source_count} источников не входит в допущенный корпус или закрытый holdout.</p><p class="mt-3 text-xs text-slate-600">Китайские SRT SHA-256: Vivo <code class="hash">${summary.vivo_sha256}</code>; ASUS <code class="hash">${summary.asus_sha256}</code>; архивный Kirin <code class="hash">${summary.kirin_sha256}</code>; текущий Kirin <code class="hash">${summary.original_kirin_sha256}</code>; Ying <code class="hash">${summary.ying_sha256}</code>; производная Mingfay <code class="hash">${summary.mingfay_sha256}</code>. Ранее проверенный Commons SRT: ревизия ${summary.commerce_revision}, ${summary.commerce_cues} реплики, SHA-256 <code class="hash">${summary.commerce_sha256}</code>. Исходные строки и медиа в отчёт не встроены.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-geekerwan-two-scene-media-result.md">Два новых видео и шесть фрагментов (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-commons-vivo-media-samples-result.md">18:36 видео и фрагменты (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-commons-train-240p-stream-result.md">20:30 видео и дорожки (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/corpora/commons-geekerwan-two-scenes-candidate-v1.json">Недопущенные ASUS/Kirin</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-02-kirin-original-caption-and-media-result.md">Текущий Kirin и отказ медиа (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-youtube-mingfay-caption-candidate.md">Mingfay и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-commons-cc-commerce-candidate.md">Ранний Commons источник (EN)</a></div></section>`;
}

export function renderXiaolinMetadataScreen() {
  return `<aside id="xiaolin-source-screen" class="mb-8 rounded-2xl border border-slate-200 bg-white p-5 md:p-7"><h3 class="text-lg font-bold text-slate-900">Ещё один источник проверен, но субтитры не найдены</h3><p class="mt-2 max-w-4xl text-sm text-slate-700">Видео длится 12:56 и отнесено Commons к стандартному мандаринскому китайскому; речь не прослушана. Зафиксированный ответ YouTube не содержит ни обычного, ни автоматического трека субтитров; лицензия копии на Commons пока не прошла проверку. Видео не добавлено в корпус: на момент проверки оставались 9 источников, 1850 проверенных реплик и 0 допущенных. Полный ответ метаданных сохранён только локально; видео не загружалось.</p><p class="mt-3 text-sm"><a class="font-semibold text-blue-700 underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-xiaolin-source-inventory-result.md">Запись проверки и хеши (EN)</a></p></aside>`;
}

export function renderPaywallSource(summary) {
  return `<aside id="paywall-source-screen" class="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 md:p-7"><h3 class="text-lg font-bold text-slate-900">CC BY 4.0: длинный китайский SRT и совпадающее видео</h3><p class="mt-2 max-w-4xl text-sm text-slate-700">Документальный фильм Paywall длится ${summary.paywall_media_duration_ms} мс; проверены ${summary.paywall_cues} традиционно-китайских титров без выхода за длительность. Исходные OGV 294 354 909 байт и SRT сверены по хешам; три 20-секундных звуковых фрагмента начала, середины и конца декодированы и связаны с репликами. Фильм указан как англоязычный, китайские титры — перевод. Автор фильма Jason Schmitt и автор китайских титров Sau-Chin Chen указаны в первичных источниках с лицензией CC BY 4.0. Фрагменты не прослушаны человеком; сцены, речевое соответствие и независимые русские эталоны ещё не проверены. Это технический кандидат, не закрытый holdout и не допуск к озвучке.</p><p class="mt-3 text-xs text-slate-600">SHA-256 SRT: <code class="hash">${summary.paywall_sha256}</code>. SHA-256 OGV: <code class="hash">1bc2e667d296cfb9d11ebdf4ecfec468e3c6fd2aa969f2f6bbfb3fbe46343fd0</code>. Оригиналы и WAV не встроены в страницу.</p><p class="mt-3 text-sm"><a class="font-semibold text-blue-700 underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-paywall-licensed-long-source-result.md">Доказательства, хеши и ограничения (EN)</a> · <a class="font-semibold text-blue-700 underline" href="https://github.com/paywallthemovie/subtitles">Лицензия и автор титров</a> · <a class="font-semibold text-blue-700 underline" href="https://archive.org/details/PaywallTheBusinessOfScholarshipFinalMovieMastered">Фильм в Internet Archive</a></p></aside>`;
}

export function renderSethluiTimingScreen(summary) {
  return `<aside id="sethlui-source-screen" class="mb-8 rounded-2xl border border-rose-200 bg-rose-50/50 p-5 md:p-7"><h3 class="text-lg font-bold text-slate-900">Видео 12:18.056; из 271 реплики сохранены 263</h3><p class="mt-2 max-w-4xl text-sm text-slate-700">Реальная 240p-копия содержит видео VP9 и звук Opus; FFprobe измерил ${summary.sethlui_media_duration_ms} мс. Реплики 264–271 исходного китайского SRT идут после конца видео, поэтому полный файл отклонён. Отдельная копия первых ${summary.sethlui_cues} реплик строго разобрана, проверена по длительности и сопоставлена с исходными ID. Три 12-секундных фрагмента начала, середины и конца декодированы и связаны с 17 исходными репликами; их никто не прослушал. Это только технический кандидат: речь не прослушана, права и соответствие звуку не проверены, русский эталон отсутствует. Сейчас ${summary.source_count} источников, ${summary.inspected_cues} проверенных реплик и ${summary.eligible_cues} допущенных.</p><p class="mt-3 text-xs text-slate-600">SHA-256 отдельного SRT: <code class="hash">${summary.sethlui_sha256}</code>. Исходник и медиа не публикуются.</p><p class="mt-3 text-sm"><a class="font-semibold text-blue-700 underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-sethlui-stream-derivative-result.md">Длительность, карта реплик и неудачная попытка (EN)</a> · <a class="font-semibold text-blue-700 underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-sethlui-audio-windows-result.md">Три звуковых окна без прослушивания (EN)</a> · <a class="font-semibold text-blue-700 underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-sethlui-caption-media-mismatch.md">Исходная ошибка и REG-039 (EN)</a></p></aside>`;
}
