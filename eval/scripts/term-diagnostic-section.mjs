import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

async function loadPack(directory, catalogVersion, regressionId, expectedStatus) {
  const catalog = JSON.parse(await fs.readFile(path.join(directory, `catalog-v${catalogVersion}.json`)));
  const entry = catalog.entries.find(row => row.id === regressionId);
  assert(entry);
  const bytes = await fs.readFile(path.join(directory, entry.pack_file));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, entry.pack_sha256);
  const pack = JSON.parse(bytes);
  assert.equal(pack.status, expectedStatus);
  assert.equal(pack.related_controls.length, 3);
  assert.equal(pack.negative_controls.length, 3);
  assert.equal(pack.control_model_runs, 0);
  assert.equal(pack.human_review, 'missing');
  return { sha256, pack };
}

export async function loadApprovedTermDiagnostic(root) {
  const directory = path.join(root, 'eval/regressions');
  const earlier = await loadPack(directory, 29, 'REG-045', 'fixed_in_new_checkpoints_contract_only');
  const pair = await loadPack(directory, 30, 'REG-046', 'fixed_in_whole_result_audit_v2_contract_only');
  assert.equal(pair.pack.minimal_reproducer.expected_checked_pairs, 2);
  assert.equal(pair.pack.minimal_reproducer.expected_missing_pairs, 2);
  assert.equal(pair.pack.minimal_reproducer.observed_old_warnings, 1);
  return {
    pack_sha256: earlier.sha256,
    related_controls: earlier.pack.related_controls.length,
    negative_controls: earlier.pack.negative_controls.length,
    model_runs: earlier.pack.control_model_runs,
    human_review: earlier.pack.human_review,
    pair_audit: {
      pack_sha256: pair.sha256,
      related_controls: pair.pack.related_controls.length,
      negative_controls: pair.pack.negative_controls.length,
      checked_pairs: pair.pack.minimal_reproducer.expected_checked_pairs,
      missing_pairs: pair.pack.minimal_reproducer.expected_missing_pairs,
      old_warnings: pair.pack.minimal_reproducer.observed_old_warnings,
      model_runs: pair.pack.control_model_runs,
      human_review: pair.pack.human_review,
    },
  };
}

export function renderApprovedTermDiagnostic(data) {
  return `<section id="approved-term-diagnostic" class="my-8 scroll-mt-8 rounded-2xl border border-sky-200 bg-sky-50/50 p-5 md:p-7">
    <p class="text-sm font-semibold text-sky-900">CTX-02 · EVAL-04 · REG-045/046 · проверка контракта</p>
    <h2 class="mt-2 text-2xl font-bold">Проверка утверждённых терминов в checkpoint и готовом SRT</h2>
    <p class="mt-3 max-w-4xl text-slate-700">Когда в целевой строке нет утверждённой русской формы для указанного китайского термина, новый checkpoint сохраняет предупреждение с номером сегмента и строки. Отдельная команда audit-terms читает весь экспортированный SRT, проверяет неизменность структуры и связку с картой сцен и словарём, затем сообщает о пропусках без изменения файлов. На составленном файле из 1024 реплик обнаружены пропуски в первой, на границе сцен и в последней реплике; соседнее похожее название не вызвало предупреждения. Проверка не заменяет текст модели и не повторяет запрос. Минимальное воспроизведение, ${data.related_controls} связанных и ${data.negative_controls} отрицательных контрольных случая прошли на составленных примерах; запросов к модели ${data.model_runs}, независимых оценок 0. Уже сохранённый ресторанный черновик с тремя вариантами названия (REG-044) не исправлен. Для оценки его качества нужны утверждённый словарь и независимый рецензент.</p>
    <p class="mt-3 max-w-4xl text-slate-700">REG-046 выявил недосчёт в полном SRT: при двух пропущенных формах в одной строке старая схема показывала ${data.pair_audit.old_warnings} предупреждение на ${data.pair_audit.checked_pairs} проверки. Схема отчёта 2 выдаёт ${data.pair_audit.missing_pairs} предупреждения и индекс каждого термина. Три связанных и три отрицательных контрольных случая пройдены на составленных данных; запросов к модели и независимых оценок нет. Это проверка наличия форм, а не оценка точности перевода.</p>
    <p class="mt-3 text-xs text-slate-600">REG-045 SHA-256 <code class="hash">${data.pack_sha256}</code>; REG-046 SHA-256 <code class="hash">${data.pair_audit.pack_sha256}</code>.</p>
    <div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-v5-approved-term-diagnostic.md">Протокол checkpoint (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-02-v5-whole-result-term-audit.md">Протокол полного файла (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-02-reg-046-term-pair-audit.md">REG-046: недосчёт предупреждений (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/regressions/catalog-v30.json">Каталог REG-046 (EN)</a></div>
  </section>`;
}
