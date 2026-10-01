import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadSethluiRetry(root) {
  const first = JSON.parse(await fs.readFile(path.join(root,
    'eval/reports/2026-10-01-sethlui-json-tail-retry-summary.json')));
  const second = JSON.parse(await fs.readFile(path.join(root,
    'eval/reports/2026-10-01-sethlui-json-tail-length-retry-summary.json')));
  assert.equal(first.schema_version, 1);
  assert.equal(second.schema_version, 1);
  assert.equal(first.source_sha256, second.source_sha256);
  assert.equal(first.source_cues, 263);
  assert.equal(second.source_cues, 263);
  assert.equal(first.status, 'failed');
  assert.equal(first.checkpoints, 61);
  assert.equal(first.result_rows, 0);
  assert.equal(first.failure_finish_reason, 'length');
  assert.equal(second.status, 'passed_structural_probe');
  assert.equal(second.checkpoints, 263);
  assert.equal(second.result_rows, 1);
  assert.deepEqual(second.retried_cue_ids, [62]);
  assert.equal(first.independent_human_reviewed_cues, 0);
  assert.equal(second.independent_human_reviewed_cues, 0);
  assert.equal(second.release_decision, 'no_candidate_selected');
  return { first, second };
}

export function renderSethluiRetry({ first, second }) {
  return `<section id="sethlui-retry" class="my-8 scroll-mt-8 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 md:p-7"><p class="text-sm font-semibold text-blue-900">CTX-02 · LONG-04 · версия после сохранённых отказов · качество открыто</p><h2 class="mt-2 text-2xl font-bold">7B завершила 263 китайские реплики после одного ограниченного повтора</h2><p class="mt-3 max-w-4xl text-slate-700">На том же 12:18 исходнике первая проверенная версия сохранила 61 реплику и остановилась на 62-й: модель исчерпала 256 токенов в петле скобок, итогового файла не было. Отдельная v2-версия создала русский SRT 263/263 с теми же номерами и таймкодами. На 62-й реплике она отвергла ответ с посторонним JSON-хвостом и приняла только второй, прошедший обычную проверку. После остановки сервера повторный экспорт совпал побайтно. Старые неудачные результаты сохранены.</p><div class="mt-4 overflow-x-auto"><table class="measurement"><caption class="mb-3 text-left text-sm text-slate-600">По одному новому запуску каждой версии; разные ответы при одинаковом запросе не дают оценки вероятности сбоя.</caption><thead><tr><th>7B на том же файле</th><th>Реплики / итог</th><th>Chat</th><th>Токены вход / выход</th><th>Команда</th><th>Пик RAM / GPU всего</th></tr></thead><tbody><tr><th scope="row">Повтор v1</th><td>${first.checkpoints}/263, нет файла</td><td>${first.chat_requests}</td><td>${first.prompt_tokens.toLocaleString('ru-RU')} / ${first.completion_tokens.toLocaleString('ru-RU')}</td><td>${(first.translation_elapsed_ms / 1000).toFixed(1)} с</td><td>${(first.peak_sampled_server_working_set_bytes / 1024 ** 3).toFixed(2)} GiB / ${first.peak_sampled_device_gpu_used_mib} MiB</td></tr><tr><th scope="row">Повтор v2</th><td>${second.checkpoints}/263, черновик</td><td>${second.chat_requests}</td><td>${second.prompt_tokens.toLocaleString('ru-RU')} / ${second.completion_tokens.toLocaleString('ru-RU')}</td><td>${(second.translation_elapsed_ms / 1000).toFixed(1)} с</td><td>${(second.peak_sampled_server_working_set_bytes / 1024 ** 3).toFixed(2)} GiB / ${second.peak_sampled_device_gpu_used_mib} MiB</td></tr></tbody></table></div><p class="mt-3 text-sm text-slate-700">В полном запуске реально сработало правило для завершённого JSON-ответа. Новое правило для ответа <code>finish_reason=length</code> прошло контрактные проверки, но модель на этом запуске его не вызвала. ИИ-разбор выборки заметил улучшение сохранения имени и чисел относительно старого 1.8B, однако специалист по димсам назван специалистом по десертам, а одно название ресторана переведено тремя способами (REG-044). Это не человеческая оценка: независимых китайско-русских проверок ${second.independent_human_reviewed_cues}, слушателей 0. Права на субтитры и соответствие речи не подтверждены; модель и сценарий озвучки не утверждены.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-sethlui-json-tail-length-retry-result.md">Полный протокол и ограничения (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-10-01-sethlui-json-tail-length-retry-summary.json">Агрегированные замеры JSON</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-10-01-release-readiness-after-sethlui-retry.md">Неполный аудит релиза (EN)</a></div></section>`;
}
