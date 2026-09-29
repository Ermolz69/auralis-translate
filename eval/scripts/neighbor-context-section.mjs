import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/';
const stem = '2026-09-29-reg-010-neighbor-context';

export async function loadNeighborContext(root) {
  const pack = JSON.parse(await fs.readFile(path.join(root,
    'eval/regressions/long-v6-neighbor-content-v1.json')));
  const summaryBytes = await fs.readFile(path.join(root,
    `eval/reports/${stem}-summary.json`));
  const summary = JSON.parse(summaryBytes);
  assert.equal(pack.id, 'REG-010');
  assert.equal(digest(summaryBytes), 'c2b290906e8f34e595721e7cce7d9e67e5cefbb0304e4bec8a690bdaed604638');
  assert.equal(summary.outcome, 'inconclusive_no_baseline_recurrence_unreviewed');
  assert.equal(summary.release_gate, 'open');
  assert.equal(summary.baseline.source_time, 15);
  assert.equal(summary.no_next_context.source_time, 15);
  const archiveBytes = await fs.readFile(path.join(root,
    `eval/reports/${stem}-requests.jsonl.gz`));
  assert.equal(digest(archiveBytes), summary.requests_gzip_sha256);
  const entries = gunzipSync(archiveBytes).toString('utf8').trim().split('\n').map(JSON.parse);
  assert.equal(entries.length, 30);
  const cue129 = [101, 202, 303].map(seed => {
    const pair = entries.filter(row => row.cue_id === 129 && row.seed === seed);
    assert.equal(pair.length, 2);
    return { seed, baseline: pair.find(row => row.arm === 'baseline').accepted_candidate,
      no_next_context: pair.find(row => row.arm === 'no_next_context').accepted_candidate };
  });
  return {
    id: pack.id,
    source_zh: pack.failure.source_zh,
    next_context_zh: pack.failure.next_context_zh,
    archived_wrong_ru: pack.failure.accepted_ru,
    baseline: summary.baseline,
    no_next_context: summary.no_next_context,
    cue129,
    wall_elapsed_ms: summary.wall_elapsed_ms,
    peak_tracked_working_set_bytes: summary.resources.peak_tracked_working_set_bytes,
    peak_device_gpu_mib: summary.resources.peak_device_gpu_mib,
    summary_sha256: digest(summaryBytes),
    requests_sha256: summary.requests_gzip_sha256,
    human_review: summary.human_review,
    release_gate: summary.release_gate,
  };
}

export function renderNeighborContext(data, escape) {
  const rows = data.cue129.map(row => `<tr><th scope="row">${row.seed}</th><td>${escape(row.baseline)}</td><td>${escape(row.no_next_context)}</td></tr>`).join('');
  return `<section id="neighbor-context" class="my-8 scroll-mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">${data.id} · реальная модель · результат не подтверждён человеком</p><h2 class="mt-2 text-2xl font-bold">Подмена следующей репликой остаётся открытой ошибкой</h2><p class="mt-3 max-w-4xl text-slate-700">В архивном длинном прогоне исходник <span lang="zh-Hans">${escape(data.source_zh)}</span> получил ответ «${escape(data.archived_wrong_ru)}». Это содержание следующей реплики <span lang="zh-Hans">${escape(data.next_context_zh)}</span>, хотя JSON-идентификатор целевой реплики был верным. Для новых запусков потеря времени <code>08:10</code> создаёт сохраняемое предупреждение <code>time_mismatch</code>; оно не исправляет русский текст.</p><p class="mt-3 max-w-4xl text-slate-700">Парное сравнение на пяти одинаковых авторских парах и трёх затравках: с соседним контекстом — ${data.baseline.source_time}/${data.baseline.requests} сохранённых времён и ${data.baseline.exact_identifier}/${data.baseline.requests} кодов; без следующей реплики — ${data.no_next_context.source_time}/${data.no_next_context.requests} и ${data.no_next_context.exact_identifier}/${data.no_next_context.requests}. Все 30 ответов структурно валидны; точная фраза предупреждения из следующей реплики не появилась. Исходный сбой не повторился, поэтому это сравнение не доказывает пользу удаления контекста и профиль не меняется.</p><div class="mt-4 overflow-x-auto"><table class="w-full min-w-[640px] text-left text-sm"><thead><tr><th class="p-2">Затравка</th><th class="p-2">С контекстом, cue 129</th><th class="p-2">Без следующей реплики, cue 129</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-3 max-w-4xl text-sm text-slate-600">30 запросов за ${(data.wall_elapsed_ms / 1000).toFixed(2)} с; входные токены ${data.baseline.prompt_tokens} / ${data.no_next_context.prompt_tokens}, выходные ${data.baseline.completion_tokens} / ${data.no_next_context.completion_tokens}. Выборочный максимум RAM процесса ${(data.peak_tracked_working_set_bytes / (1024 ** 3)).toFixed(2)} GiB; занятость всей GPU до ${data.peak_device_gpu_mib} MiB, включая другие процессы. Пять повторяющихся синтетических фраз не проверяют связность длинного сюжета. Оценка китайско-русского редактора отсутствует; G1–G9 открыты.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-amber-900"><a class="underline" href="${repo}eval/experiments/2026-09-29-reg-010-neighbor-content.md">План и вывод</a><a class="underline" href="${repo}eval/regressions/long-v6-neighbor-content-v1.json">Сбой и контроли</a><a class="underline" href="${repo}eval/reports/${stem}-summary.json">Замеры и хеши</a><a class="underline" href="${repo}eval/reports/${stem}-requests.jsonl.gz">30 сырых ответов</a><a class="underline" href="${repo}docs/reference/source-clock-time-diagnostic-v1.md">Правило времени</a></div></section>`;
}
