import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = '44da5f277dd9eb5f905cbbbd5f568c213ce88dadb96e362e68157481356f8088';

export async function loadAsusContextWidth(root) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/asus-context-width-paired-v1.json'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedSha256);
  const report = JSON.parse(bytes);
  assert.equal(report.id, 'asus-context-width-paired-v1');
  assert.equal(report.chat_requests, 88);
  assert.equal(report.preflight_requests, 176);
  assert.equal(report.token_preflight_chat_mismatches, 0);
  assert.equal(report.arms.length, 4);
  assert.deepEqual(report.arms.map(row => row.outer_json_valid), [22, 22, 21, 22]);
  assert.equal(report.human_bilingual_review_count, 0);
  assert.equal(report.wider_context_selected, false);
  assert.equal(report.release_gate, 'open');
  return { report, sha256: expectedSha256 };
}

export function renderAsusContextWidth({ report, sha256 }) {
  const rows = report.arms.map(row => `<tr><th scope="row">${row.model === '1b' ? '1.8B' : '7B'}</th><td>${row.width}</td><td>${row.outer_json_valid}/${row.cases}</td><td>${row.prompt_tokens.toLocaleString('ru-RU')} / ${row.completion_tokens.toLocaleString('ru-RU')}</td><td>${row.chat_http_ms.toLocaleString('ru-RU')}</td><td>${row.max_prompt_tokens}</td></tr>`).join('');
  return `<section id="asus-context-width" class="my-8 scroll-mt-8 rounded-2xl border border-violet-200 bg-violet-50/50 p-5 md:p-7"><p class="text-sm font-semibold text-violet-900">CTX-02 / EVAL-04 · парный реальный экран · 1 октября 2026</p><h2 class="mt-2 text-2xl font-bold">Шире контекст: локальная польза и новая ошибка</h2><p class="mt-3 max-w-4xl text-slate-700">Для тех же 11 китайских реплик сравнили 1 и 3 соседние реплики с каждой стороны: Hy-MT2 1.8B и 7B, два одинаковых seed на вариант. Сохранены 88 сырых ответов, 176 проверок фактических токенов и один отказ по лимиту ответа; повторов после ошибки не было. Все промпты ниже предела 1728 токенов, максимальный — ${report.max_prompt_tokens}. Полное время — ${report.wall_elapsed_ms.toLocaleString('ru-RU')} мс.</p><div class="mt-4 overflow-x-auto"><table class="measurement"><caption class="mb-3 text-left text-sm text-slate-600">Одинаковые цели, источник, схема и параметры внутри пар; HTTP — сумма времени чатов без запуска моделей.</caption><thead><tr><th>Модель</th><th>Соседей с каждой стороны</th><th>Внешний JSON</th><th>Токены вход / выход</th><th>HTTP, мс</th><th>Макс. вход</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-3 max-w-4xl text-slate-700">ИИ-разбор исходника: у 1.8B широкое окно исправило категорию устройства в реплике 91 в двух seed, но в реплике 133 оба раза заменило «время автономной работы» на «выживаемость», а один ответ изменил смысл степени необходимости улучшения. В узком окне реплика 3 содержала лишь незавершённое начало фразы внутри корректного JSON. У 7B узкая реплика 227 один раз исчерпала 256 токенов; оба широких ответа завершились. Термины для управляющих кнопок, однопоточной производительности и гиперпоточности всё ещё требуют проверки.</p><p class="mt-3 max-w-4xl text-slate-700">Три соседа не выбраны для рабочего профиля. Это 11 известных примеров одного видео, человеческих китайско-русских оценок — ${report.human_bilingual_review_count}; допуск прав, проверка звука и релизные G1–G9/A1–A6 остаются открытыми. REG-038 хранит два точных воспроизведения и 11 новых авторских контролей; запусков модели на контролях пока 0.</p><p class="mt-3 text-xs text-slate-600">SHA-256 отчёта без текста субтитров: <code class="hash">${sha256}</code>. Сырые запросы и ответы остались в частном журнале.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-asus-context-width-paired-result.md">Протокол и разбор 11 реплик (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/asus-context-width-paired-v1.json">Сводка без исходных строк (JSON)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/regressions/catalog-v23.json">REG-038 и контроли</a></div></section>`;
}
