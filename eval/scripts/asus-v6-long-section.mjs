import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const reportSha256 = '1ab55b39ede27569fcecf416185516fadcd5df59591a5d913b120aa743429959';

export async function loadAsusV6Long(root, previous) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-30-asus-v6-long-summary.json'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), reportSha256);
  const summary = JSON.parse(bytes);
  assert.equal(summary.source_sha256, previous.current.source_sha256);
  assert.equal(summary.media_sha256, previous.current.media_sha256);
  assert.equal(summary.model_sha256, previous.current.model_sha256);
  assert.equal(summary.source_cues, 268);
  assert.equal(summary.saved_checkpoints, 268);
  assert.equal(summary.complete_results, 1);
  assert.equal(summary.review_state, 'needs_review');
  assert.equal(summary.offline_reexport, 'byte_identical');
  assert.equal(summary.source_selected_ai_review_cues, 44);
  assert.equal(summary.human_bilingual_reviewed_cues, 0);
  assert.deepEqual(summary.read_only_measurement_warning_ids, [12, 227]);
  assert.equal(summary.source_rights_admitted, false);
  assert.equal(summary.source_audio_alignment_reviewed, false);
  assert.equal(summary.profile_selected, false);
  assert.equal(summary.approved_spoken_script, false);
  assert.equal(summary.raw_source_or_candidate_published, false);
  return { summary, sha256: reportSha256 };
}

export function renderAsusV6Long({ summary, sha256 }) {
  return `<section id="asus-v6-long" class="my-8 scroll-mt-8 rounded-2xl border border-rose-200 bg-rose-50/50 p-5 md:p-7"><p class="text-sm font-semibold text-rose-800">Длинный китайский файл · ASUS · 1.8B v6</p><h2 class="mt-2 text-2xl font-bold">268/268 структурно, перевод не принят</h2><p class="mt-3 max-w-4xl text-slate-700">Схема с фиксированным ID позволила сохранить все ${summary.saved_checkpoints} реплик и повторно экспортировать тот же SRT побайтно. В заранее выбранных по китайскому исходнику ${summary.source_selected_ai_review_cues}/${summary.source_cues} репликах ИИ-разбор нашёл серьёзные ошибки: граммы стали гигабайтами, 9 Вт превратились в 9 В, портативная консоль названа планшетом, смысл реплики об автономности искажён. Это проверка ИИ, человеческая оценка — ${summary.human_bilingual_reviewed_cues}. Статус результата: needs_review; текст не утверждён для озвучки.</p><p class="mt-3 max-w-4xl text-slate-700">Новая проверка физических единиц в отдельном чтении архивной выборки отметила реплики ${summary.read_only_measurement_warning_ids.join(' и ')}. Она не меняла сохранённый перевод; REG-031–033 содержат новые связанные и отрицательные контроли, пока без модельных прогонов.</p><p class="mt-3 max-w-4xl text-slate-700">${summary.chat_requests} запросов к модели / ${summary.http_requests} HTTP, ${summary.prompt_tokens.toLocaleString('ru-RU')} / ${summary.completion_tokens.toLocaleString('ru-RU')} токенов, команда перевода ${(summary.translation_command_ms / 1000).toFixed(1)} с. Измеренный пик памяти сервера ${(summary.sampled_server_working_set_peak_bytes / 1024 ** 3).toFixed(2)} GiB; GPU ${summary.sampled_whole_device_gpu_memory_peak_mib} MiB — всего устройства. Субтитры, ответы и медиа приватны; права, совпадение речи с субтитрами и независимая рецензия не подтверждены.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-commons-asus-full-v6-slot-result.md">Прогон и ИИ-разбор (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-30-asus-v6-long-summary.json">Редактированный JSON</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/regressions/catalog-v18.json">REG-031–033 и контроли (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/docs/reference/measurement-warning-v1.md">Проверка единиц (EN)</a></div><p class="mt-3 text-xs text-slate-500">SHA-256 редакционной сводки: <code class="hash">${sha256}</code>.</p></section>`;
}
