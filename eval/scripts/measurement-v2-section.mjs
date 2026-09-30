import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = 'dcf3945cfd6fea01b41be5889475bde8eae77315538773d03b6964ee937e5e88';

export async function loadMeasurementV2(root) {
  const bytes = await fs.readFile(path.join(root,
    'eval/regressions/signed-fullwidth-measurement-v1.json'));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, expectedSha256);
  const pack = JSON.parse(bytes);
  assert.equal(pack.id, 'REG-035');
  assert.equal(pack.minimal_reproducer.length, 2);
  assert.equal(pack.related_controls.length, 6);
  assert.equal(pack.negative_controls.length, 7);
  assert.equal(pack.control_model_runs, 0);
  assert.equal(pack.human_review, 'missing');
  assert.equal(pack.release_gate, 'open');
  return {
    sha256,
    reproduced_failures: pack.minimal_reproducer.length,
    related_controls: pack.related_controls.length,
    negative_controls: pack.negative_controls.length,
    control_model_runs: pack.control_model_runs,
    human_review: pack.human_review,
    release_gate: pack.release_gate,
  };
}

export function renderMeasurementV2(data) {
  return `<section id="measurement-v2" class="my-8 scroll-mt-8 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 md:p-7"><p class="text-sm font-semibold text-blue-900">REG-035 · проверка фактов · 1 октября 2026</p><h2 class="mt-2 text-2xl font-bold">Минус и полноширинные цифры: исправлена диагностическая проверка</h2><p class="mt-3 max-w-4xl text-slate-700">Два воспроизведённых дефекта: прежняя проверка не замечала потерю знака в −60 г и ошибочно считала код A-60g физической величиной. Теперь она учитывает знак и полноширинные цифры в распознанных единицах. Прошли ${data.related_controls} связанных и ${data.negative_controls} отрицательных контрольных случаев, включая равноценное русское «минус 60 г» и коды моделей. Старый перевод ASUS и его ошибки сохранены.</p><p class="mt-3 max-w-4xl text-slate-700">Это предупреждение для рецензента, а не исправленный перевод: запросов к модели для этих контролей ${data.control_model_runs}, человеческих оценок 0. Китайские числительные, смысловые сравнения и релизные G3–G5 остаются открытыми.</p><p class="mt-3 text-xs text-slate-600">SHA-256 набора REG-035: <code class="hash">${data.sha256}</code>.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-signed-fullwidth-measurement-regression.md">Воспроизведение и пределы (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/regressions/catalog-v20.json">REG-035 и контроли (EN)</a></div></section>`;
}
