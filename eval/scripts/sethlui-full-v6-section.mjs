import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadSethluiFullV6(root) {
  const summary = JSON.parse(await fs.readFile(path.join(root,
    'eval/reports/2026-10-01-sethlui-full-v6-summary.json')));
  assert.equal(summary.schema_version, 1);
  assert.equal(summary.source_cues, 263);
  assert.equal(summary.matched_request_prefix, 61);
  assert.equal(summary.review.independent_human_cues, 0);
  assert.equal(summary.arms[0].checkpoints, 263);
  assert.equal(summary.arms[1].checkpoints, 61);
  assert.equal(summary.arms[1].result_rows, 0);
  assert.equal(summary.release_decision, 'no_candidate_selected');
  return summary;
}

export function renderSethluiFullV6(summary) {
  const rows = summary.arms.map(arm => `<tr><th scope="row">${arm.model}</th><td>${arm.chat_requests}</td><td>${arm.prompt_tokens.toLocaleString('ru-RU')} / ${arm.completion_tokens.toLocaleString('ru-RU')}</td><td>${(arm.translation_command_ms / 1000).toFixed(1)} с</td><td>${(arm.peak_sampled_working_set_bytes / 1024 ** 3).toFixed(2)} GiB / ${arm.peak_sampled_device_gpu_used_mib} MiB</td><td>${arm.checkpoints}/${summary.source_cues}</td><td>${arm.status === 'complete_unreviewed' ? 'Структурно готов, требует проверки' : 'Отказ на реплике 62, нет итогового файла'}</td></tr>`).join('');
  return `<section id="sethlui-full-v6" class="my-8 scroll-mt-8 rounded-2xl border border-amber-300 bg-amber-50/50 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">CTX-02 · LONG-04 · реальный файл · решение открыто</p><h2 class="mt-2 text-2xl font-bold">12:18 китайских субтитров: 1.8B завершила 263 реплики, 7B остановилась на 62-й</h2><p class="mt-3 max-w-4xl text-slate-700">Обе модели получили одинаковые первые 61 запрос, кроме имени модели. 1.8B сохранила отдельный русский SRT, но ИИ-разбор нашёл пропущенное имя, переставленные категории блюд и подменённую соседней фразой реплику. 7B сохранила 61 контрольную точку, а проверка формата отвергла 62-й ответ с посторонним хвостом JSON; частичный перевод не выпущен. Человеческих оценок: ${summary.review.independent_human_cues}; слушателей: ${summary.review.human_listeners}. Кандидат для озвучки и релиза не выбран.</p><div class="mt-4 overflow-x-auto"><table class="measurement"><caption class="mb-3 text-left text-sm text-slate-600">Один исследовательский запуск каждой модели; время команды и выборочные пики памяти не задают SLA.</caption><thead><tr><th>Модель</th><th>Chat</th><th>Токены вход / выход</th><th>Команда перевода</th><th>Память процесса / GPU всего</th><th>Сохранено</th><th>Итог</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-3 text-sm text-slate-700">REG-040 закрепляет три ошибки смысла 1.8B; REG-041 — повтор структурного сбоя 7B. Права, совпадение речи с субтитрами и независимая китайско-русская проверка остаются открытыми. Исходник, сырые ответы и кандидат не публикуются.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-sethlui-full-v6-model-comparison-result.md">Протокол и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-10-01-sethlui-full-v6-summary.json">Агрегированные замеры JSON</a></div></section>`;
}
