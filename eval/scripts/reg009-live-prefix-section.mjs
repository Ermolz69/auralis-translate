import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const stem = '2026-09-29-reg009-live-prefix-repair';
const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/';
const escape = value => String(value).replace(/[&<>"']/g,
  char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export async function loadReg009LivePrefix(root) {
  const summaryBytes = await fs.readFile(path.join(root, `eval/reports/${stem}-summary.json`));
  assert.equal(digest(summaryBytes), '5388be229dae37710322f1143497d48e5e98037437fa11319943d03dd2e51c64');
  const summary = JSON.parse(summaryBytes);
  const requestBytes = await fs.readFile(path.join(root, `eval/reports/${summary.requests_file}`));
  assert.equal(digest(requestBytes), summary.requests_gzip_sha256);
  const rows = gunzipSync(requestBytes).toString('utf8').trim().split('\n').map(JSON.parse);
  assert.equal(rows.length, 81);
  assert.deepEqual(summary.counts, {
    requests: 81, raw_exact_identifiers: 36, accepted_exact_identifiers: 81,
    inserted_review_required: 45, rejected: 0,
    raw_exact_numeric_facts: 81, accepted_exact_numeric_facts: 81,
  });
  assert.equal(summary.human_review, 'missing');
  assert.equal(summary.release_gate, 'open');
  const sampleRows = [[2, 101], [3, 101], [1022, 101]].map(([cue, seed]) => {
    const row = rows.find(candidate => candidate.cue_id === cue && candidate.seed === seed);
    assert(row);
    return { cue_id: cue, seed, source_zh: row.source_zh,
      raw_ru: row.restored_candidate, accepted_ru: row.accepted_candidate,
      review_flag: row.review_flag };
  });
  assert.equal(sampleRows[0].review_flag, true);
  assert(sampleRows[1].accepted_ru.includes('Им также нужно'));
  assert(sampleRows[2].accepted_ru.includes('необходимо перезапускать не нужно'));
  return { summary_sha256: digest(summaryBytes), counts: summary.counts,
    usage: summary.usage, resources: summary.resources,
    wall_elapsed_ms: summary.wall_elapsed_ms, human_review: summary.human_review,
    release_gate: summary.release_gate, sample_rows: sampleRows };
}

export function renderReg009LivePrefix(data) {
  const rows = data.sample_rows.map(row => `<tr><th scope="row">${row.cue_id} · ${row.seed}</th><td lang="zh">${escape(row.source_zh)}</td><td lang="ru">${escape(row.raw_ru)}</td><td lang="ru">${escape(row.accepted_ru)}</td><td>${row.review_flag ? 'Да' : 'Нет'}</td></tr>`).join('');
  const count = data.counts;
  return `<section id="reg009-live-prefix" class="my-8 scroll-mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">Реальная 1.8B-модель · 27 мест синтетического файла × 3 seed · ИИ-разбор</p><h2 class="mt-2 text-2xl font-bold">Коды восстановлены, смысловые ошибки остались</h2><p class="mt-3 max-w-4xl text-slate-700">На одних и тех же ${count.requests} запросах сырой ответ содержал точный код в ${count.raw_exact_identifiers}/${count.requests} строках. Узкая политика добавила пропущенный код в ${count.inserted_review_required} строках и пометила каждую для проверки: после вставки ${count.accepted_exact_identifiers}/${count.requests} строк имеют точный код. Это проекция проверенной Rust-политики на ответы модели, а не полный прогон SQLite или оценка качества русского.</p><div class="mt-5 grid gap-3 sm:grid-cols-3"><div class="rounded-xl bg-white p-4"><p class="text-sm text-slate-600">Сырой код</p><p class="text-2xl font-bold">${count.raw_exact_identifiers}/${count.requests}</p></div><div class="rounded-xl bg-white p-4"><p class="text-sm text-slate-600">После вставки</p><p class="text-2xl font-bold">${count.accepted_exact_identifiers}/${count.requests}</p></div><div class="rounded-xl bg-white p-4"><p class="text-sm text-slate-600">Нужна проверка</p><p class="text-2xl font-bold">${count.inserted_review_required}/${count.requests}</p></div></div><div class="mt-5 overflow-x-auto"><table class="measurement"><thead><tr><th>Реплика · seed</th><th>Китайский источник</th><th>Сырой русский</th><th>После политики</th><th>Флаг</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-4 text-slate-700">Реплика 3 меняет китайское «мы» на русское «им»; реплика 1022 остаётся неестественной: «необходимо перезапускать не нужно». Вставка кода эти ошибки не исправляет. Совпадение чисел ${count.raw_exact_numeric_facts}/${count.requests} тоже не выявляет их. Это исходно-ориентированный ИИ-разбор. Независимый китайско-русский редактор не оценивал текст, профиль для выпуска не выбран.</p><p class="mt-3 text-sm text-slate-600">Время: ${Math.round(data.wall_elapsed_ms / 1000)} с на все запросы с запуском; p50/p95 запроса ${data.usage.request_elapsed_p50_ms}/${data.usage.request_elapsed_p95_ms} мс. Пик рабочей памяти отслеживаемого процесса ${(data.resources.peak_tracked_working_set_bytes / 1024 ** 3).toFixed(2)} ГиБ; GPU ${data.resources.peak_device_gpu_mib} МиБ по всему устройству. Нужны естественные сцены, полный файл, проверка восстановления и человек-рецензент.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${repo}eval/experiments/2026-09-29-reg-009-live-prefix-repair-results.md">Условия и разбор (EN)</a><a class="underline" href="${repo}eval/reports/${stem}-summary.json">Сводка, версии и хеши</a><a class="underline" href="${repo}eval/reports/${stem}-requests.jsonl.gz">81 сырой запрос и ответ</a><a class="underline" href="${repo}eval/regressions/long-v6-first-person-loss-v1.json">REG-012</a><a class="underline" href="${repo}eval/regressions/long-v6-restart-grammar-v1.json">REG-013</a></div></section>`;
}
