import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadApprovedTermDiagnostic(root) {
  const directory = path.join(root, 'eval/regressions');
  const catalog = JSON.parse(await fs.readFile(path.join(directory, 'catalog-v29.json')));
  const entry = catalog.entries.find(row => row.id === 'REG-045');
  assert(entry);
  const bytes = await fs.readFile(path.join(directory, entry.pack_file));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, entry.pack_sha256);
  const pack = JSON.parse(bytes);
  assert.equal(pack.status, 'fixed_in_new_checkpoints_contract_only');
  assert.equal(pack.related_controls.length, 3);
  assert.equal(pack.negative_controls.length, 3);
  assert.equal(pack.control_model_runs, 0);
  assert.equal(pack.human_review, 'missing');
  return {
    pack_sha256: sha256,
    related_controls: pack.related_controls.length,
    negative_controls: pack.negative_controls.length,
    model_runs: pack.control_model_runs,
    human_review: pack.human_review,
  };
}

export function renderApprovedTermDiagnostic(data) {
  return `<section id="approved-term-diagnostic" class="my-8 scroll-mt-8 rounded-2xl border border-sky-200 bg-sky-50/50 p-5 md:p-7"><p class="text-sm font-semibold text-sky-900">CTX-02 · EVAL-04 · REG-045 · проверка контракта</p><h2 class="mt-2 text-2xl font-bold">Пропущенный утверждённый термин теперь виден в новом checkpoint</h2><p class="mt-3 max-w-4xl text-slate-700">Когда в целевой строке нет утверждённой русской формы для указанного китайского термина, система сохраняет предупреждение с номером сегмента и строки. Проверка не заменяет текст модели и не повторяет запрос. Минимальное воспроизведение, ${data.related_controls} связанных и ${data.negative_controls} отрицательных контрольных случая прошли на составленных примерах; запросов к модели ${data.model_runs}, независимых оценок 0. Уже сохранённый ресторанный черновик с тремя вариантами названия (REG-044) не исправлен. Полная проверка файла и рецензент по-прежнему нужны.</p><p class="mt-3 text-xs text-slate-600">Пакет REG-045 SHA-256 <code class="hash">${data.pack_sha256}</code>.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-v5-approved-term-diagnostic.md">Протокол и границы проверки (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/regressions/catalog-v29.json">REG-045 и контроли (EN)</a></div></section>`;
}
