import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/';

export async function loadIdentifierDiagnostic(root) {
  const pack = JSON.parse(await fs.readFile(path.join(root,
    'eval/regressions/long-v6-identifier-loss-v1.json')));
  const reportBytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-29-long-v6-postlength-v2-report.json'));
  const report = JSON.parse(reportBytes);
  assert.equal(pack.id, 'REG-009');
  assert.equal(digest(reportBytes), pack.source_report_sha256);
  assert.equal(pack.status, 'open_model_fact_preservation');
  assert.equal(pack.release_gate, 'open');
  assert.equal(report.identifier_violations.length, 665);
  assert(report.identifier_violations.some(row =>
    row.segment_id === pack.failure.segment_id
    && row.candidate_ru === pack.failure.accepted_ru));
  const screenBytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-29-reg-009-identifier-prompt-summary.json'));
  assert.equal(digest(screenBytes), 'ac70512ba2e3f60148fdbf832dd12cc746a1a5e048e1211bdac3d2ccd3c178e6');
  const screen = JSON.parse(screenBytes);
  assert.equal(screen.outcome, 'no_identifier_gain_unreviewed');
  assert.equal(screen.baseline.exact_identifier, 2);
  assert.equal(screen.reminder.exact_identifier, 2);
  assert.equal(screen.baseline.requests, 8);
  assert.equal(screen.reminder.requests, 8);
  assert.equal(screen.paired_code_gain, 0);
  const guardBytes = await fs.readFile(path.join(root,
    'models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_identifier_guard.experimental.json'));
  assert.equal(digest(guardBytes), 'e8ec9d8c8919141700e66ac6e6acc5f408ab5a96899566869cbfe0d2ea3d91e9');
  assert.equal(JSON.parse(guardBytes).strict_source_identifiers, true);
  return {
    id: pack.id,
    source_report_sha256: pack.source_report_sha256,
    related_controls: pack.related_controls.length,
    negative_controls: pack.negative_controls.length,
    release_gate: pack.release_gate,
    human_review: pack.human_review,
    screen_summary_sha256: digest(screenBytes),
    screen: { baseline: screen.baseline, reminder: screen.reminder,
      paired_code_gain: screen.paired_code_gain },
    guard_manifest_sha256: digest(guardBytes),
    guard_status: 'experimental_unselected',
  };
}

export function renderIdentifierDiagnostic(data) {
  return `<section id="identifier-diagnostic" class="my-8 scroll-mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7"><p class="text-sm font-semibold text-blue-800">${data.id} · проверка подтверждённого дефекта</p><h2 class="mt-2 text-2xl font-bold">Потеря кодов теперь видна в новых запусках</h2><p class="mt-3 max-w-4xl text-slate-700">Для каждой исходной и русской строки проверяются точные ASCII-коды и число их вхождений. Пропуск, замена цифр, кириллическая подмена и дубликат создают предупреждение <code>identifier_mismatch</code>, которое сохраняется в SQLite. Проверены ${data.related_controls} связанных и ${data.negative_controls} отрицательных контрольных случая, включая повторное открытие базы. Старый результат с 665 ошибками не изменён.</p><p class="mt-3 max-w-4xl text-slate-700">Парный опыт с той же 1.8B-моделью: исходная инструкция сохранила код в ${data.screen.baseline.exact_identifier}/${data.screen.baseline.requests} ответах, дополнительное напоминание — в ${data.screen.reminder.exact_identifier}/${data.screen.reminder.requests}. Все 16 ответов прошли структурную проверку; напоминание стоило ещё ${data.screen.reminder.prompt_tokens - data.screen.baseline.prompt_tokens} входных токенов и не дало выигрыша на этих четырёх авторских репликах с двумя затравками. Этот вариант не принят.</p><p class="mt-3 max-w-4xl text-slate-700">Отдельный экспериментальный профиль теперь отклоняет строку с потерянным кодом до сохранения блока и оставляет сырой и восстановленный ответ для разбора. Это проверено на управляемых ответах; полный реальный файл с этим профилем не проверен. Предупреждение и запрет защищают результат, но не исправляют перевод; выпуск и оценка китайско-русского редактора остаются открытыми.</p><div class="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="${repo}eval/experiments/2026-09-29-reg-009-identifier-diagnostic.md">Проверки и ограничения</a><a class="underline" href="${repo}eval/experiments/2026-09-29-reg-009-prompt-screen-results.md">Парный опыт</a><a class="underline" href="${repo}eval/reports/2026-09-29-reg-009-identifier-prompt-summary.json">Сводка и сырые ответы</a><a class="underline" href="${repo}eval/regressions/long-v6-identifier-loss-v1.json">Минимальный случай и контроли</a><a class="underline" href="${repo}docs/reference/strict-source-identifier-guard-v1.md">Строгий профиль</a><a class="underline" href="${repo}docs/reference/source-identifier-diagnostic-v1.md">Точное правило</a></div></section>`;
}
