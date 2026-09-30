import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = '69262f857d8901528faa09094cbcff9663eaceeff07c2842270a8cee220dae0e';

export async function loadMeasurementV3(root) {
  const bytes = await fs.readFile(path.join(root,
    'eval/regressions/uppercase-g-capacity-v1.json'));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, expectedSha256);
  const pack = JSON.parse(bytes);
  assert.equal(pack.id, 'REG-036');
  assert.deepEqual(pack.private_reproducer.before_fix_warning_ids,
    [12, 81, 83, 127, 145, 227]);
  assert.deepEqual(pack.private_reproducer.after_fix_warning_ids,
    [12, 127, 145, 227]);
  assert.equal(pack.minimal_reproducer.length, 2);
  assert.equal(pack.related_controls.length, 5);
  assert.equal(pack.negative_controls.length, 5);
  assert.equal(pack.control_model_runs, 0);
  assert.equal(pack.human_review, 'missing');
  assert.equal(pack.release_gate, 'open');
  return {
    sha256,
    total_cues: 268,
    before_warning_ids: pack.private_reproducer.before_fix_warning_ids,
    after_warning_ids: pack.private_reproducer.after_fix_warning_ids,
    false_positive_ids: pack.private_reproducer.cue_ids,
    minimal_reproducer_count: pack.minimal_reproducer.length,
    related_controls: pack.related_controls.length,
    negative_controls: pack.negative_controls.length,
    control_model_runs: pack.control_model_runs,
    human_review: pack.human_review,
    release_gate: pack.release_gate,
  };
}

export function renderMeasurementV3(data) {
  return `<section id="measurement-v3" class="my-8 scroll-mt-8 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 md:p-7"><p class="text-sm font-semibold text-blue-900">REG-036 · весь архивный ASUS-файл · 1 октября 2026</p><h2 class="mt-2 text-2xl font-bold">Проверка 268 реплик: ложные предупреждения о граммах убраны</h2><p class="mt-3 max-w-4xl text-slate-700">Диагностика сравнила все ${data.total_cues} пары китайских и русских реплик без нового перевода. Прежняя версия отметила ${data.before_warning_ids.length} реплик; две из них, ${data.false_positive_ids.join(' и ')}, ошибочно принимали заглавную G в ёмкости памяти или накопителя за граммы. После исправления остаются ${data.after_warning_ids.length} предупреждения: ${data.after_warning_ids.join(', ')}. Файлы и прежние замеры сохранены.</p><p class="mt-3 max-w-4xl text-slate-700">Это узкая проверка физических единиц. В реплике 83 отдельно замечена ошибка ёмкости в черновом переводе, которую она не умеет распознавать; её должен оценить независимый рецензент. ${data.minimal_reproducer_count} минимальных воспроизведения, ${data.related_controls} связанных и ${data.negative_controls} отрицательных контролей прошли; запросов к модели ${data.control_model_runs}, человеческих оценок 0. G3–G5 и озвучка не приняты.</p><p class="mt-3 text-xs text-slate-600">SHA-256 набора REG-036: <code class="hash">${data.sha256}</code>.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-asus-whole-file-measurement-v3-result.md">Полная проверка и пределы (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/regressions/catalog-v21.json">REG-036 и контроли (EN)</a></div></section>`;
}
