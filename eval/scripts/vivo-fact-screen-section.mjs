import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = '2286a6a9b7a92c558e57b404e93eda9bcb2ed5a728a4f48fdb3fed25854f3190';

export async function loadVivoFactScreen(root) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-30-vivo-fact-screen-summary.json'));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, expectedSha256);
  const summary = JSON.parse(bytes);
  assert.equal(summary.chat_requests, 56);
  assert.equal(summary.authored_related_controls, 9);
  assert.equal(summary.authored_negative_controls, 9);
  assert.deepEqual(summary.natural_focus_cue_ids, [60, 276, 280, 328, 466]);
  assert.deepEqual(summary.models.map(model => [model.key, model.structural_valid,
    model.requests]), [['1b', 27, 28], ['7b', 28, 28]]);
  assert.equal(summary.safely_rejected_neighbor_slot.regression_id, 'REG-028');
  assert.equal(summary.human_bilingual_reviewed_cases, 0);
  assert.equal(summary.release_model_selected, false);
  assert.equal(summary.approved_spoken_script, false);
  return { sha256, summary };
}

export function renderVivoFactScreen(data) {
  const rows = data.summary.models.map(model => `<tr><th scope="row">${model.key === '1b' ? 'Hy-MT2 1.8B Q4' : 'Hy-MT2 7B Q4'}</th><td>${model.structural_valid}/${model.requests}</td><td>${model.prompt_tokens.toLocaleString('ru-RU')} / ${model.completion_tokens.toLocaleString('ru-RU')}</td><td>${(model.sum_chat_http_ms / 1000).toFixed(1)} с</td><td>${(model.sampled_working_set_peak_bytes / 1024 ** 3).toFixed(2)} GiB</td><td>${model.sampled_whole_device_gpu_used_peak_mib} MiB</td></tr>`).join('');
  return `<section id="vivo-fact-screen" class="my-8 scroll-mt-8 rounded-2xl border border-slate-200 bg-white p-5 md:p-7"><p class="text-sm font-semibold text-blue-800">Один источник · два размера модели · два seed для пяти реальных окон</p><h2 class="mt-2 text-2xl font-bold">56 парных ответов, решение о модели открыто</h2><p class="mt-3 max-w-4xl text-slate-700">Пять окон интервью Vivo и 18 авторских связанных/противоположных случаев получили одинаковые исходные китайские тексты и настройки; в паре менялся только идентификатор модели. Среди 28 ответов каждой модели 1.8B один раз вернула ID соседней реплики 281 вместо 280, и защита отвергла её. Остальные слоты прошли проверку JSON. Ожидаемый смысл не входил в запросы.</p><div class="mt-4 overflow-x-auto"><table class="measurement"><caption class="mb-3 text-left text-sm text-slate-600">Одна структурная выборка: 10 реальных и 18 авторских ответов на модель. Память измерена на активной машине.</caption><thead><tr><th>Модель</th><th>Структура</th><th>Токены вход / выход</th><th>Сумма chat HTTP</th><th>Пик working set*</th><th>Пик GPU*</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-4 text-slate-700"><strong>ИИ-разбор:</strong> 7B при обоих seed выдумала «первое поколение» для 9400 и заменила 1–2 часа утра на 11–12 ночи; обе модели в реальном контексте подменяли вклад команды вложением средств. Авторские примеры с явными фактами часто переводились вернее, но выявили новые сдвиги действующего лица и получателя в 7B. Это целевые наблюдения, не оценка всего фильма и не выбор модели. Человеческая китайско-русская оценка: 0/23 случаев.</p><p class="mt-3 text-xs text-slate-600">Редактированная сводка SHA-256 <code class="hash">${data.sha256}</code>. Сырые запросы, ответы и натуральные субтитры остались приватными. * Пики сняты с работающей машины; GPU — использование всего устройства.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-vivo-fact-model-screen-result.md">Парная методика и разбор (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-30-vivo-fact-screen-summary.json">Редактированный JSON</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/regressions/natural-vivo-target-slot-neighbor-v1.json">REG-028 и контроли</a></div></section>`;
}
