import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const stem = '2026-09-29-reg009-long-cli-prefix-repair';
const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/';
const escape = value => String(value).replace(/[&<>"']/g,
  char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export async function loadReg009LongCli(root) {
  const reports = path.join(root, 'eval/reports');
  const summaryBytes = await fs.readFile(path.join(reports, `${stem}-summary.json`));
  const summary = JSON.parse(summaryBytes);
  const archiveBytes = await fs.readFile(path.join(reports, summary.archive_file));
  const correctionBytes = await fs.readFile(path.join(reports, `${stem}-capture-correction.json`));
  const correction = JSON.parse(correctionBytes);
  assert.equal(digest(summaryBytes), correction.original_summary_sha256);
  assert.equal(digest(archiveBytes), summary.archive_sha256);
  assert.equal(correction.archive_sha256, summary.archive_sha256);
  assert.equal(summary.outcome, 'failed_retained');
  assert.equal(summary.checkpoint_count, 88);
  assert.equal(summary.interrupted_checkpoint_count, 16);
  assert.equal(summary.request_count, 334);
  assert.equal(summary.chat_request_count, 111);
  assert.equal(summary.preflight_request_count, 223);
  assert.equal(correction.corrected_fields.no_partial_publication, true);
  const archive = JSON.parse(gunzipSync(archiveBytes));
  assert.equal(archive.snapshot.results.length, 0);
  assert.equal(archive.output_srt_base64, null);
  const failed = archive.requests.find(row => row.segment_id === 89 &&
    row.line_index === 0 && row.request_kind === 'chat_completion');
  assert(failed);
  assert.equal(failed.outcome, 'invalid_candidate');
  assert.equal(failed.restored_candidate, 'АРУ-0089: Поезд отправится в 08:10.');
  const prompt = JSON.parse(Buffer.from(failed.rendered_request_base64, 'base64'));
  const source = JSON.parse(prompt.messages[0].content.split('Input JSON:\n')[1])
    .target_slots[0].source_original;
  assert.equal(source, '工程 AUR-0089：列车将在 08:10 出发。');
  const flags = archive.snapshot.checkpoints.flatMap(checkpoint =>
    JSON.parse(checkpoint.diagnostics_json));
  assert.equal(flags.filter(flag => flag.code === 'source_prefix_inserted').length, 73);
  const mixedScript = JSON.parse(await fs.readFile(path.join(root,
    'eval/regressions/long-v6-mixed-script-code-repair-v1.json')));
  assert.equal(mixedScript.id, 'REG-015');
  assert.equal(mixedScript.candidate_ru, 'АUR-0089: Поезд отправится в 08:10.');
  assert.equal(mixedScript.expected_v2_outcome, 'reject_without_checkpoint');
  const decodeStem = '2026-09-29-reg014-cue89-decode';
  const decodeSummary = JSON.parse(await fs.readFile(path.join(reports,
    `${decodeStem}-summary.json`)));
  const decodeArchive = await fs.readFile(path.join(reports,
    `${decodeStem}-archive.json.gz`));
  assert.equal(digest(decodeArchive), decodeSummary.archive_sha256);
  assert.equal(decodeSummary.git_head, '942cea34da6d8af81764e477e0541d870e1f9018');
  assert.equal(decodeSummary.arms.temperature_0_7.exact_ascii_code, 2);
  assert.equal(decodeSummary.arms.temperature_0.exact_ascii_code, 3);
  assert.equal(decodeSummary.human_review, 'missing');
  return {
    outcome: summary.outcome,
    checkpoint_count: summary.checkpoint_count,
    planned_cues: 1024,
    interrupted_checkpoint_count: summary.interrupted_checkpoint_count,
    accepted_lines: summary.outcomes['chat_completion:validated_line'],
    inserted_review_flags: 73,
    request_count: summary.request_count,
    chat_request_count: summary.chat_request_count,
    source_zh: source,
    raw_ru: failed.restored_candidate,
    no_partial_publication: true,
    summary_sha256: digest(summaryBytes),
    archive_sha256: digest(archiveBytes),
    correction_sha256: digest(correctionBytes),
    mixed_script_v1_line: mixedScript.observed_v1_line,
    decode: { summary_sha256: digest(await fs.readFile(path.join(reports,
      `${decodeStem}-summary.json`))),
    exact_0_7: decodeSummary.arms.temperature_0_7.exact_ascii_code,
    exact_0: decodeSummary.arms.temperature_0.exact_ascii_code },
  };
}

export function renderReg009LongCli(data) {
  return `<section id="reg009-long-cli" class="my-8 scroll-mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 md:p-7"><p class="text-sm font-semibold text-rose-800">Реальная модель · CLI и SQLite · синтетический файл на 1 024 реплики</p><h2 class="mt-2 text-2xl font-bold">Восстановление прошло, перевод остановлен на реплике 89</h2><p class="mt-3 max-w-4xl text-slate-700">После управляемой остановки на ${data.interrupted_checkpoint_count} блоках CLI возобновил работу с тем же профилем. Он сохранил ${data.checkpoint_count}/${data.planned_cues} реплик и отклонил следующую: исходный код <code>AUR-0089</code> модель написала кириллицей <code>АРУ-0089</code>. Это безопасный отказ проверки, а не завершённый длинный перевод. Готового результата и файла SRT нет.</p><div class="mt-5 grid gap-3 sm:grid-cols-3"><div class="rounded-xl bg-white p-4"><p class="text-sm text-slate-600">Сохранённые реплики</p><p class="text-2xl font-bold">${data.checkpoint_count} / ${data.planned_cues}</p></div><div class="rounded-xl bg-white p-4"><p class="text-sm text-slate-600">Проверенные строки</p><p class="text-2xl font-bold">${data.accepted_lines}</p></div><div class="rounded-xl bg-white p-4"><p class="text-sm text-slate-600">Вставки с флагом проверки</p><p class="text-2xl font-bold">${data.inserted_review_flags}</p></div></div><div class="mt-5 grid gap-3 md:grid-cols-2"><div class="rounded-xl border border-rose-200 bg-white p-4"><p class="text-sm font-semibold">Источник · 中文</p><p lang="zh">${escape(data.source_zh)}</p></div><div class="rounded-xl border border-rose-200 bg-white p-4"><p class="text-sm font-semibold">Отклонённый ответ · русский</p><p lang="ru">${escape(data.raw_ru)}</p></div></div><p class="mt-4 text-sm text-slate-700">SQLite сохранила ${data.request_count} запросов, включая ${data.chat_request_count} обращений к модели. Прежний экран 81 ответов остаётся ниже и имеет свой знаменатель; его 81/81 точных кодов после проекции не предсказали завершение файла. У проверки архива была неточная исходная отметка о частичной публикации: отдельная проверяемая поправка подтверждает ноль результатов и отсутствие SRT. Средняя и конечная часть файла не достигнуты; человек не оценивал русский.</p><p class="mt-3 text-sm text-slate-700">Отдельный проверочный пример REG-015 выявил обход старого правила смешанным кодом: <code>${escape(data.mixed_script_v1_line)}</code>. Новая версия правила отклоняет такой ответ в тесте до сохранения; реального прогона модели с ней ещё нет.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${repo}eval/experiments/2026-09-29-reg-009-long-cli-soak-results.md">Ход опыта и ограничения (EN)</a><a class="underline" href="${repo}eval/reports/${stem}-summary.json">Исходная сводка</a><a class="underline" href="${repo}eval/reports/${stem}-capture-correction.json">Проверяемая поправка</a><a class="underline" href="${repo}eval/reports/${stem}-archive.json.gz">Все сырые запросы и состояние</a><a class="underline" href="${repo}eval/regressions/long-v6-cyrillic-code-transposition-v1.json">REG-014 и контроли</a><a class="underline" href="${repo}eval/experiments/2026-09-29-reg-015-mixed-script-prefix-repair.md">REG-015 и новая проверка</a></div></section>`;
}

export function renderReg014Decode(data) {
  const result = data.decode;
  return `<section id="reg014-decode" class="my-8 scroll-mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-800">Проверка реплики 89 · реальная модель · синтетический источник</p><h2 class="mt-2 text-2xl font-bold">Температура 0.7: код в 2/3 ответов; 0.0: в 3/3</h2><p class="mt-3 max-w-4xl text-slate-700">Шесть заранее заданных запросов с одинаковым китайским источником и тремя парными seed. При 0.7 один ответ пропустил <code>AUR-0089</code> и смысл префикса. Все ответы сохранили <code>08:10</code>. Это один источник без человеческой оценки; настройка не выбрана для релиза.</p><p class="mt-3 max-w-4xl text-slate-700">Новый опциональный профиль строго отклоняет изменённое время до checkpoint в тесте. Старые профили сохраняют предупреждение <code>time_mismatch</code>. Полный длинный файл и пилот озвучки всё ещё не подтверждены.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${repo}eval/experiments/2026-09-29-reg014-cue89-decoding-results.md">Метод и результаты (EN)</a><a class="underline" href="${repo}eval/reports/2026-09-29-reg014-cue89-decode-summary.json">Сводка и хеши</a><a class="underline" href="${repo}eval/reports/2026-09-29-reg014-cue89-decode-archive.json.gz">Все сырые ответы</a><a class="underline" href="${repo}eval/regressions/cue89-omitted-code-and-time-guard-v1.json">REG-016 и контроли</a><a class="underline" href="${repo}docs/reference/strict-source-clock-time-v1.md">Новый контракт проверки времени</a></div><p class="sr-only">SHA-256 сводки ${result.summary_sha256}; код ${result.exact_0_7}/3 и ${result.exact_0}/3.</p></section>`;
}
