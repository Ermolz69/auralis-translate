import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = '02d11f629f879c5ccf6364d1874f51e6ca69dc075e522d75bdffbce13759f2ca';

export async function loadCapacityWarning(root) {
  const bytes = await fs.readFile(path.join(root,
    'eval/regressions/contextual-capacity-v1.json'));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, expectedSha256);
  const pack = JSON.parse(bytes);
  assert.equal(pack.id, 'REG-037');
  assert.equal(pack.private_reproducer.whole_file_audit_cues, 268);
  assert.deepEqual(pack.private_reproducer.capacity_warning_ids, [83]);
  assert.deepEqual(pack.private_reproducer.physical_warning_ids, [12, 127, 145, 227]);
  assert.equal(pack.minimal_reproducer.length, 1);
  assert.equal(pack.related_controls.length, 8);
  assert.equal(pack.negative_controls.length, 14);
  assert.equal(pack.control_model_runs, 0);
  assert.equal(pack.human_review, 'missing');
  assert.equal(pack.release_gate, 'open');
  return {
    sha256,
    total_cues: pack.private_reproducer.whole_file_audit_cues,
    capacity_warning_ids: pack.private_reproducer.capacity_warning_ids,
    physical_warning_ids: pack.private_reproducer.physical_warning_ids,
    minimal_reproducer_count: pack.minimal_reproducer.length,
    related_controls: pack.related_controls.length,
    negative_controls: pack.negative_controls.length,
    control_model_runs: pack.control_model_runs,
    human_review: pack.human_review,
    release_gate: pack.release_gate,
  };
}

export function renderCapacityWarning(data) {
  return `<section id="capacity-warning" class="my-8 scroll-mt-8 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 md:p-7"><p class="text-sm font-semibold text-blue-900">REG-037 · защита числовых фактов · 1 октября 2026</p><h2 class="mt-2 text-2xl font-bold">Ёмкость накопителя: новое предупреждение для реплики 83</h2><p class="mt-3 max-w-4xl text-slate-700">Отдельная диагностика памяти и накопителей проверила все ${data.total_cues} пары архивного ASUS-файла и отметила только реплику ${data.capacity_warning_ids.join(', ')}: число ёмкости в черновом русском переводе отличается от китайского источника. Физические единицы проверяются отдельно; их прежние ${data.physical_warning_ids.length} предупреждения (${data.physical_warning_ids.join(', ')}) сохранены. Исходный и русский файлы не менялись.</p><p class="mt-3 max-w-4xl text-slate-700">Проверка допускает число с GB либо одиночной заглавной G в однозначном контексте памяти; коды моделей, гигабиты, скорость передачи и смешанные строки оставляет человеку. Прошли ${data.minimal_reproducer_count} минимальное воспроизведение, ${data.related_controls} связанных и ${data.negative_controls} отрицательных контролей, а предупреждение сохранилось после открытия SQLite. Запросов к модели ${data.control_model_runs}; человеческих оценок 0. Это ИИ-триаж, не принятый перевод или сценарий озвучки.</p><p class="mt-3 text-xs text-slate-600">SHA-256 набора REG-037: <code class="hash">${data.sha256}</code>.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-asus-capacity-warning-result.md">Протокол и пределы (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/regressions/catalog-v22.json">REG-037 и контроли (EN)</a></div></section>`;
}
