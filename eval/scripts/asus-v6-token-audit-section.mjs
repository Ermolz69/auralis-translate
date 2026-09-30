import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = 'fd992a84395c1484744a1e9e5a87043b17435728c094089f746a6931c7c6c1b0';

export async function loadAsusV6TokenAudit(root, asusV6Long) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/asus-v6-token-budget-audit-v1.json'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedSha256);
  const report = JSON.parse(bytes);
  assert.equal(report.id, 'asus-v6-rendered-token-audit-v1');
  assert.equal(report.source_sha256, asusV6Long.summary.source_sha256);
  assert.equal(report.model_sha256, asusV6Long.summary.model_sha256);
  assert.equal(report.cue_count, 268);
  assert.equal(report.context_tokens, 2048);
  assert.equal(report.prompt_ceiling_tokens, 1728);
  assert.equal(report.prompt_min_tokens, 227);
  assert.equal(report.prompt_median_tokens, 276);
  assert.equal(report.prompt_p95_tokens, 288);
  assert.equal(report.prompt_max_tokens, 300);
  assert.deepEqual(report.prompt_max_cue_ids, [81]);
  assert.equal(report.minimum_headroom_tokens, 1428);
  assert.equal(report.context_trimmed_cues, 0);
  assert.equal(report.prompt_total_tokens, asusV6Long.summary.prompt_tokens);
  assert.equal(report.completion_total_tokens, asusV6Long.summary.completion_tokens);
  assert.equal(report.model_requests, 0);
  return { report, sha256: expectedSha256 };
}

export function renderAsusV6TokenAudit({ report, sha256 }) {
  return `<section id="asus-v6-token-audit" class="my-8 scroll-mt-8 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 md:p-7"><p class="text-sm font-semibold text-indigo-900">LONG-01 · реальные токены архивного ASUS-прогона · 1 октября 2026</p><h2 class="mt-2 text-2xl font-bold">268 реплик: токенизатор и сервер совпали</h2><p class="mt-3 max-w-4xl text-slate-700">Для каждой из ${report.cue_count} реплик сохранённые счётчики токенизатора совпали с фактическими токенами запроса. При контексте ${report.context_tokens} токенов, резерве ответа ${report.response_reserve_tokens} и запасе ${report.safety_margin_tokens} предел промпта — ${report.prompt_ceiling_tokens}. Максимум составил ${report.prompt_max_tokens} (реплика ${report.prompt_max_cue_ids.join(', ')}), сокращений соседнего контекста — ${report.context_trimmed_cues}.</p><div class="mt-4 grid gap-3 sm:grid-cols-3"><div class="rounded-xl bg-white p-4"><p class="text-sm text-slate-600">Медиана</p><p class="text-2xl font-bold">${report.prompt_median_tokens}</p></div><div class="rounded-xl bg-white p-4"><p class="text-sm text-slate-600">95-й процентиль</p><p class="text-2xl font-bold">${report.prompt_p95_tokens}</p></div><div class="rounded-xl bg-white p-4"><p class="text-sm text-slate-600">Минимальный запас</p><p class="text-2xl font-bold">${report.minimum_headroom_tokens}</p></div></div><p class="mt-3 max-w-4xl text-slate-700">Это архивный анализ одной модели и запросов с одной переводимой строкой. Новых запросов к модели ${report.model_requests}. Разбиение нескольких строк по токенам, качество смысла и выпуск озвучки здесь не проверялись; сохранённый перевод содержит серьёзные ошибки и ждёт независимого рецензента.</p><p class="mt-3 text-xs text-slate-600">SHA-256 обезличенной сводки: <code class="hash">${sha256}</code>.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-asus-v6-token-budget-audit-result.md">Протокол и пределы (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/asus-v6-token-budget-audit-v1.json">Сводка без текста субтитров (JSON)</a></div></section>`;
}
