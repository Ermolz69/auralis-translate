import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = '61ed1417bffcd9cb74598d55120a85dbd5ae64c225287fded0ce01089af85013';

export async function loadVivoGeneralFact(root) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-30-vivo-general-fact-reminder-summary.json'));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, expectedSha256);
  const summary = JSON.parse(bytes);
  assert.equal(summary.requests, 28);
  assert.equal(summary.structural_valid, 28);
  assert.equal(summary.natural_requests, 10);
  assert.equal(summary.authored_control_requests, 18);
  assert.equal(summary.human_bilingual_reviewed_cases, 0);
  assert.equal(summary.major_natural_facts_resolved, false);
  assert.equal(summary.promote_prompt, false);
  return { sha256, summary };
}

export function renderVivoGeneralFact(data, baseline) {
  assert.equal(baseline.key, '7b');
  const variant = data.summary;
  const row = (label, valid, requests, prompt, completion, http) =>
    `<tr><th scope="row">${label}</th><td>${valid}/${requests}</td><td>${prompt.toLocaleString('ru-RU')} / ${completion.toLocaleString('ru-RU')}</td><td>${(http / 1000).toFixed(1)} с</td></tr>`;
  return `<section id="vivo-general-fact" class="my-8 scroll-mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">CTX-02 · один фактор · тот же источник Vivo</p><h2 class="mt-2 text-2xl font-bold">Общее напоминание о фактах не исправило ключевые ошибки</h2><p class="mt-3 max-w-4xl text-slate-700">Те же 28 запросов к 7B Q4_K_M получили одну дополнительную инструкцию сохранять количества, действующих лиц, время и будущее/настоящее. Исходный китайский текст, seed и JSON-формат остались прежними; эталон не входил в запрос. Все 28 слотов прошли структурную проверку. По ИИ-разбору сдвиг 36 месяцев, подмена команды денежным вкладом и замена 1–2 часов ночи на 11–12 ночи остались. В одном из двух ответов про 9400 исчезло выдуманное «первое поколение», в другом ошибка повторилась.</p><div class="mt-4 overflow-x-auto"><table class="measurement"><caption class="mb-3 text-left text-sm text-slate-600">Суммы по тем же 10 натуральным и 18 авторским запросам; активное время разных запусков не сравнивается.</caption><thead><tr><th>Промпт 7B</th><th>Структура</th><th>Токены вход / выход</th><th>Сумма chat HTTP</th></tr></thead><tbody>${row('Исходный v5', baseline.structural_valid, baseline.requests, baseline.prompt_tokens, baseline.completion_tokens, baseline.sum_chat_http_ms)}${row('Общее напоминание', variant.structural_valid, variant.requests, variant.prompt_tokens, variant.completion_tokens, variant.sum_chat_http_ms)}</tbody></table></div><p class="mt-3 text-sm text-slate-700">Вход вырос на 1 568 токенов (24,1%). Экспериментальный текст не включён в релизный профиль. Человеческая китайско-русская оценка: 0/23 случаев; заключение о качестве всего файла и выборе модели остаётся открытым.</p><p class="mt-2 text-xs text-slate-600">Редактированная сводка SHA-256 <code class="hash">${data.sha256}</code>. Сырые ответы и исходные субтитры сохранены приватно.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-vivo-general-fact-reminder-result.md">План, замеры и ИИ-разбор (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-30-vivo-general-fact-reminder-summary.json">Редактированный JSON</a></div></section>`;
}
