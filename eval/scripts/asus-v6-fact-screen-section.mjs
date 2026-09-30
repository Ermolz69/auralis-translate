import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const summarySha256 = 'd1f1703e37d9ca878275707e54cee0714c7653bc7890b89f5df14fe3cd7af068';

export async function loadAsusV6FactScreen(root, longRun) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-30-asus-v6-fact-screen-summary.json'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), summarySha256);
  const summary = JSON.parse(bytes);
  assert.equal(summary.source_sha256, longRun.summary.source_sha256);
  assert.equal(summary.natural_focus_cues, 11);
  assert.equal(summary.authored_related_and_negative_controls, 21);
  assert.equal(summary.paired_cases, 32);
  assert.equal(summary.chat_requests, 64);
  assert.equal(summary.outer_json_and_target_id_valid, 64);
  assert.deepEqual(summary.leaked_tail_case_ids,
    ['asus-227', 'REG-032-negative-actual_phone_variant']);
  assert.equal(summary.models[0].model_sha256, longRun.summary.model_sha256);
  assert.equal(summary.models[0].profile_sha256, longRun.summary.profile_sha256);
  assert.equal(summary.human_bilingual_reviewed_cases, 0);
  assert.equal(summary.source_rights_admitted, false);
  assert.equal(summary.source_audio_alignment_reviewed, false);
  assert.equal(summary.profile_selected, false);
  assert.equal(summary.approved_spoken_script, false);
  assert.equal(summary.raw_source_or_candidate_published, false);
  return { summary, sha256: summarySha256 };
}

export function renderAsusV6FactScreen({ summary, sha256 }) {
  const rows = summary.models.map(model => `<tr><th scope="row" class="px-3 py-2 text-left">${model.key}</th><td class="px-3 py-2">${model.chat_requests}/${model.chat_requests}</td><td class="px-3 py-2">${model.prompt_tokens.toLocaleString('ru-RU')} / ${model.completion_tokens.toLocaleString('ru-RU')}</td><td class="px-3 py-2">${(model.summed_chat_http_ms / 1000).toFixed(1)} с</td><td class="px-3 py-2">${(model.sampled_server_working_set_peak_bytes / 1024 ** 3).toFixed(2)} GiB</td><td class="px-3 py-2">${model.sampled_whole_device_gpu_memory_peak_mib} MiB</td></tr>`).join('');
  return `<section id="asus-v6-fact-screen" class="my-8 scroll-mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">Тот же ASUS-источник · 1.8B / 7B v6 · реальная модель</p><h2 class="mt-2 text-2xl font-bold">64 парных ответа, ошибки текста остались</h2><p class="mt-3 max-w-4xl text-slate-700">Для обеих моделей использованы одинаковые китайские строки, соседний контекст и настройки: 11 проблемных реплик из полного ASUS-файла и 21 новый связанный или отрицательный случай. Все ${summary.chat_requests} ответа имели корректные внешние JSON и целевой ID. Но 7B дважды вставила хвост JSON внутрь русского текста; обе модели сохранили ошибки классов устройства, аксессуаров или технических терминов. Исходные 268 реплик и прежние результаты не изменены.</p><div class="mt-4 overflow-x-auto"><table class="w-full min-w-[650px] border-collapse text-left text-sm"><caption class="pb-2 text-left text-slate-600">Один seed 101 на каждый случай; память измерена на активной машине с редкими сэмплами.</caption><thead><tr class="border-b border-amber-200"><th class="px-3 py-2">Модель</th><th class="px-3 py-2">Слоты</th><th class="px-3 py-2">Токены вход / выход</th><th class="px-3 py-2">Chat HTTP</th><th class="px-3 py-2">Working set*</th><th class="px-3 py-2">GPU*</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-3 max-w-4xl text-slate-700">Узкая защита теперь отвергает такой хвост до контрольной точки и сохраняет сырой ответ. Это проверено фиксированными случаями; нового полного прогона после исправления ещё нет. ИИ-разбор не заменяет человеческую оценку: ${summary.human_bilingual_reviewed_cases}/32, сценарий озвучки не утверждён, модель для релиза не выбрана.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-asus-v6-fact-model-screen-result.md">Парные ответы и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-30-asus-v6-fact-screen-summary.json">Редактированный JSON</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/regressions/catalog-v19.json">REG-034 и контроли (EN)</a></div><p class="mt-3 text-xs text-slate-500">* Нижние наблюдаемые пики по ${summary.models[0].resource_samples} и ${summary.models[1].resource_samples} сэмплам. SHA-256 редакционной сводки: <code class="hash">${sha256}</code>.</p></section>`;
}
