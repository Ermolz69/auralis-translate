import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';
import { longFileFixture } from './long-file-fixture.mjs';

const STEM = '2026-09-29-long-v5-scene-failure';

export async function loadLongV5Failure(root) {
  const reportBytes = await fs.readFile(path.join(root, `eval/reports/${STEM}.json`));
  const archiveBytes = await fs.readFile(path.join(root, `eval/reports/${STEM}-journal.json.gz`));
  const report = JSON.parse(reportBytes);
  const regression = JSON.parse(await fs.readFile(path.join(root, 'eval/regressions/long-v5-neighbor-slot-v1.json')));
  const journalBytes = gunzipSync(archiveBytes);
  const journal = JSON.parse(journalBytes);
  const fixtureBytes = await fs.readFile(path.join(root, 'eval/fixtures/long-file-v1.json'));
  const fixture = longFileFixture(JSON.parse(fixtureBytes), 'srt');
  const profileBytes = await fs.readFile(path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v5_scene.experimental.json'));
  assert.equal(report.outcome, 'failed_invalid_candidate');
  assert.equal(regression.report_sha256, digest(reportBytes));
  assert.equal(regression.journal_gzip_sha256, digest(archiveBytes));
  assert.equal(report.source_sha256, digest(fixture.source));
  assert.equal(report.fixture_manifest_sha256, digest(fixtureBytes));
  assert.equal(report.profile_sha256, digest(profileBytes));
  assert.equal(report.source_cues, 1024);
  assert.equal(report.text_slots, 1280);
  assert.equal(report.saved_blocks, 71);
  assert.equal(report.interrupted_blocks, 16);
  assert.equal(report.planned_blocks, 1024);
  assert.equal(report.partial_result_count, 0);
  assert.equal(report.partial_output_present, false);
  assert.equal(report.saved_prefix_preserved, true);
  assert.equal(report.journal_gzip_sha256, digest(archiveBytes));
  assert.equal(report.journal_uncompressed_sha256, digest(journalBytes));
  assert.equal(journal.run_id, report.run_id);
  assert.equal(journal.requests.length, report.request_count);
  const invalid = journal.requests.filter(row => row.outcome === 'invalid_candidate');
  assert.equal(invalid.length, 1);
  assert.equal(invalid[0].segment_id, 72);
  assert.equal(invalid[0].request_kind, 'chat_completion');
  assert.equal(invalid[0].request_id, report.failing_request.request_id);
  assert.equal(invalid[0].raw_response, report.raw_response);
  const prompt = JSON.parse(invalid[0].rendered_request).messages[0].content;
  const slot = JSON.parse(prompt.split('Input JSON:\n')[1]).target_slots[0];
  const returned = JSON.parse(JSON.parse(invalid[0].raw_response).choices[0].message.content).translations[0];
  assert.deepEqual(slot, report.failed_slot);
  assert.equal(slot.segment_id, 72);
  assert.equal(returned.segment_id, 73);
  assert.equal(returned.line_index, 0);
  assert.deepEqual(report.supplied_context.map(row => row.segment_id), [71, 73]);
  assert.equal(journal.requests.filter(row => row.request_kind === 'chat_completion' && row.outcome === 'validated_line').length, 88);
  assert.equal(journal.requests.filter(row => row.outcome === 'pending').length, 1);
  return {
    report_sha256: digest(reportBytes), journal_sha256: digest(archiveBytes),
    run_id: report.run_id, saved_blocks: report.saved_blocks, planned_blocks: report.planned_blocks,
    request_count: report.request_count, failed_source: slot.source_original,
    context_before: report.supplied_context[0].lines[0],
    context_after: report.supplied_context[1].lines[0],
    returned_text: returned.text, expected_slot: slot.segment_id, returned_slot: returned.segment_id,
    prompt_tokens: report.failing_request.prompt_tokens,
    completion_tokens: report.failing_request.completion_tokens,
    elapsed_ms: report.failing_request.elapsed_ms,
    quality_verdict: report.quality_verdict,
  };
}

export function renderLongV5Failure(summary, escape) {
  const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/';
  return `<section id="long-v5-failure" class="scroll-mt-8 border-t border-slate-200 py-10"><p class="text-sm font-semibold uppercase tracking-[.12em] text-amber-800">Длинный файл · реальная модель · 29 сентября 2026</p><h2 class="mt-2 text-2xl font-semibold">Восстановление сработало; полный перевод остановлен</h2><p class="mt-3 max-w-5xl text-slate-700">Авторский файл: 1 024 китайские реплики, 1 280 текстовых слотов, восемь сцен. После остановки CLI сохранённые 16 блоков восстановились без замены; новый сервер продолжил до ${summary.saved_blocks}/${summary.planned_blocks}. На следующем целевом слоте модель вернула ID соседней реплики. Проверка отвергла ответ, не выпустила частичный SRT и оставила один незавершённый token-запрос от принудительно убитого процесса в журнале. Полного перевода и оценки качества здесь нет.</p><div class="mt-5 grid gap-3 sm:grid-cols-3"><div class="rounded-xl border border-slate-200 bg-slate-50 p-4"><p class="label">Сохранено после рестарта</p><p class="text-xl font-semibold">${summary.saved_blocks} / ${summary.planned_blocks}</p></div><div class="rounded-xl border border-slate-200 bg-slate-50 p-4"><p class="label">HTTP-запросы в SQLite</p><p class="text-xl font-semibold">${summary.request_count}</p></div><div class="rounded-xl border border-slate-200 bg-slate-50 p-4"><p class="label">Частичный результат</p><p class="text-xl font-semibold">0</p></div></div><div class="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5"><p class="label text-amber-900">Подтверждённый минимальный случай · цель ${summary.expected_slot}</p><p lang="zh-Hans" class="text-slate-700">До: ${escape(summary.context_before)}</p><p lang="zh-Hans" class="mt-2 font-semibold">Цель: ${escape(summary.failed_source)}</p><p lang="zh-Hans" class="mt-2 text-slate-700">После: ${escape(summary.context_after)}</p><p class="mt-3">Модель: <strong>${escape(summary.returned_text)}</strong>, но <code>segment_id=${summary.returned_slot}</code>. Она перепутала ID с последующим контекстом. Ответ отвергнут без автоматического повтора.</p><p class="mt-2 text-sm text-slate-600">290 / 33 токена, ${summary.elapsed_ms} мс для ошибочного chat-ответа; это одно наблюдение, не оценка скорости длинного файла.</p></div><p class="mt-4 text-sm text-slate-600">Этот повторяющийся синтетический источник проверяет инженерную устойчивость, но не подтверждает связность естественных сцен. Китайско-русская человеческая оценка отсутствует.</p><details class="mt-5"><summary class="cursor-pointer font-semibold text-blue-700">Полный журнал и воспроизведение</summary><ul class="mt-3 list-disc space-y-2 pl-6 text-sm"><li><a class="text-blue-700 underline" href="${repo}${STEM}.json">Сводка и сырой ошибочный ответ</a> · SHA-256 <code class="hash">${summary.report_sha256}</code></li><li><a class="text-blue-700 underline" href="${repo}${STEM}-journal.json.gz">Все ${summary.request_count} запросов и ответов</a> · SHA-256 <code class="hash">${summary.journal_sha256}</code></li><li><a class="text-blue-700 underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-29-long-v5-scene-failure.md">Условия, регрессия и ограничения</a></li></ul></details></section>`;
}
