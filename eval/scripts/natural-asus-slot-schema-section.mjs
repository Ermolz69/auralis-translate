import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const reportSha256 = 'e323df1f6d56b1f422ad6fd306f89e166525b57f36a441120ce3817089bead5f';

export async function loadNaturalAsusSlotSchema(root, modelComparison) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-30-natural-asus-slot-schema-summary.json'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), reportSha256);
  const summary = JSON.parse(bytes);
  assert.equal(summary.source_sha256, modelComparison.current.source_sha256);
  assert.equal(summary.model_sha256, modelComparison.current.model_sha256);
  assert.equal(summary.profile_sha256, modelComparison.current.profile_sha256);
  assert.equal(summary.target_cue, modelComparison.current.rejected_cue);
  assert.equal(summary.following_context_cue, modelComparison.current.returned_neighbor_id);
  assert.equal(summary.chat_requests, summary.paired_seeds * 2);
  assert.equal(summary.baseline_neighbor_ids, summary.paired_seeds);
  assert.equal(summary.constrained_target_ids, summary.paired_seeds);
  assert.equal(summary.human_bilingual_reviewed_cues, 0);
  assert.equal(summary.full_file_completed, false);
  assert.equal(summary.profile_promoted, false);
  assert.equal(summary.raw_source_or_candidate_published, false);
  return { summary, sha256: reportSha256 };
}

export function renderNaturalAsusSlotSchema({ summary, sha256 }) {
  return `<section id="natural-asus-slot-schema" class="my-8 scroll-mt-8 rounded-2xl border border-blue-200 bg-blue-50/40 p-5 md:p-7"><p class="text-sm font-semibold text-blue-800">Контроль структуры · тот же ASUS-фрагмент · 1.8B</p><h2 class="mt-2 text-2xl font-bold">Фиксированный ID помог в 3 парах, качество текста открыто</h2><p class="mt-3 max-w-4xl text-slate-700">На точном запросе для реплики ${summary.target_cue} обычная схема в ${summary.baseline_neighbor_ids}/${summary.paired_seeds} ответах указала соседний ID ${summary.following_context_cue}. При том же исходнике, контексте, модели и параметрах схема с обязательным ID ${summary.target_cue} вернула его в ${summary.constrained_target_ids}/${summary.paired_seeds} ответах. Это ${summary.chat_requests} запросов и ${summary.prompt_tokens.toLocaleString('ru-RU')} / ${summary.completion_tokens} входных / выходных токенов. ИИ-разбор отмечает нестабильные технические термины; независимая оценка перевода — 0. Полный файл не завершён, профиль не выбран.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-natural-asus-slot-schema-screen-result.md">Пары, замеры и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-30-natural-asus-slot-schema-summary.json">Редактированный JSON</a></div><p class="mt-3 text-xs text-slate-500">SHA-256 редакционной сводки: <code class="hash">${sha256}</code>.</p></section>`;
}
