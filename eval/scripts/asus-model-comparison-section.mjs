import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const reportSha256 = 'f83c5b0826af78bd2977bc7a8b0d2452e0002c1791fbee4b654cd276107b428d';

export async function loadAsusModelComparison(root, prior) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-30-asus-1_8b-long-failure-summary.json'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), reportSha256);
  const current = JSON.parse(bytes);
  assert.equal(current.source_sha256, prior.asus.source_sha256);
  assert.equal(current.media_sha256, prior.asus.media_sha256);
  assert.equal(current.source_cues, prior.asus.source_cues);
  assert.equal(current.saved_checkpoints, 19);
  assert.equal(current.rejected_cue, 20);
  assert.equal(current.returned_neighbor_id, 21);
  assert.equal(current.complete_results, 0);
  assert.equal(current.partial_srt_published, false);
  assert.equal(current.human_bilingual_reviewed_cues, 0);
  assert.equal(current.source_rights_admitted, false);
  assert.equal(current.profile_selected, false);
  return { current, sha256: reportSha256 };
}

export function renderAsusModelComparison({ current, sha256 }, prior) {
  return `<section id="asus-model-comparison" class="my-8 scroll-mt-8 rounded-2xl border border-amber-300 bg-amber-50/60 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">Один естественный источник · 1.8B и 7B · v5</p><h2 class="mt-2 text-2xl font-bold">1.8B тоже остановилась: 19 из 268 реплик</h2><p class="mt-3 max-w-4xl text-slate-700">На том же китайском ASUS-файле 1.8B с тем же профилем сцен сохранила 19 реплик. В ответе для целевой реплики 20 она указала ID соседней 21. Защита отвергла ответ; результата и частичного SRT нет. Ранее 7B сохранила ${prior.asus.initial.saved_checkpoints} реплик и остановилась на другом дефекте в реплике 227. Оба исхода — неудачные полные прогоны. Длина сохранённого префикса не измеряет качество языка и не даёт сравнения скорости полного файла.</p><p class="mt-3 max-w-4xl text-slate-700">1.8B: ${current.chat_requests} chat / ${current.http_requests} HTTP, ${current.prompt_tokens.toLocaleString('ru-RU')} / ${current.completion_tokens.toLocaleString('ru-RU')} токенов, команда перевода ${(current.failed_translation_command_ms / 1000).toFixed(1)} с. Измеренный пик working set ${(current.sampled_server_working_set_peak_bytes / 1024 ** 3).toFixed(2)} GiB; GPU ${current.sampled_whole_device_gpu_memory_peak_mib} MiB — всего устройства. Сырые ответы и китайский текст приватны; независимых рецензий 0, права не подтверждены.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-commons-asus-full-1_8b-failure.md">Прогон и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/regressions/natural-asus-target-slot-neighbor-v1.json">REG-030 и контроли (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-30-asus-1_8b-long-failure-summary.json">Редактированный JSON</a></div><p class="mt-3 text-xs text-slate-500">SHA-256 редакционной сводки: <code class="hash">${sha256}</code>.</p></section>`;
}
