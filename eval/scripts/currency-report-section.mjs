import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest, buildSrt } from './flores-file-fixture.mjs';

export async function loadCurrencyReport(root, originalDataset) {
  const controlsBytes = await fs.readFile(path.join(root, 'eval/corpora/currency-controls-v1.json'));
  const controls = JSON.parse(controlsBytes);
  const originalBytes = await fs.readFile(path.join(root, 'eval/corpora/public-demo-v1.json'));
  const reportBytes = await fs.readFile(path.join(root, 'eval/reports/public-demo-fidelity-2026-09-27.json'));
  const controlReportBytes = await fs.readFile(path.join(root, 'eval/reports/currency-controls-2026-09-27.json'));
  const benchmark = JSON.parse(reportBytes);
  const controlBenchmark = JSON.parse(controlReportBytes);
  for (const [report, dataset, bytes] of [[benchmark, originalDataset, originalBytes], [controlBenchmark, controls, controlsBytes]]) {
    assert.equal(report.result, 'passed');
    assert.equal(report.profile.prompt_version, 4);
    assert.equal(report.requests.length, 60);
    assert.equal(report.runs.length, 3);
    assert.equal(report.failures.length, 0);
    assert.equal(report.dataset_sha256, digest(bytes));
    assert.equal(report.source_sha256, digest(buildSrt(dataset.examples)));
    assert.equal(report.source_preservation, 'byte_identical');
    for (const run of report.runs) {
      assert.equal(run.rows.length, 20);
      assert.equal(run.structural_checks, 'passed');
      assert.equal(run.offline_reexport, 'byte_identical');
      for (const row of run.rows) {
        const request = report.requests.find(item => item.run === run.repetition && item.example_id === row.example_id);
        const example = dataset.examples.find(item => item.id === row.example_id);
        assert.equal(request.source_sha256, digest(Buffer.from(example.source)));
        assert.equal(request.accepted_candidate, row.candidate);
        assert.equal(request.http_status, 200);
        assert(!row.candidate.includes('__AURALIS_MONEY_'));
      }
    }
  }
  const currencies = { yuan: /юан/, dollar: /доллар/, euro: /евро/, yen: /иен/, ruble: /рубл/, shekel: /шекел/, shilling: /шиллинг/, hong_kong_dollar: /гонконгск.*доллар/ };
  for (const example of controls.examples) {
    for (const run of controlBenchmark.runs) {
      const candidate = run.rows.find(item => item.example_id === example.id).candidate;
      if (example.expected_currency === 'none') {
        assert(!/юан|доллар|евро|иен|рубл|шекел|шиллинг/.test(candidate));
      } else {
        assert(currencies[example.expected_currency].test(candidate), example.id);
        assert.deepEqual(candidate.match(/\d+(?:,\d+)?/g), example.reference.match(/\d+(?:,\d+)?/g), example.id);
      }
    }
  }
  return { controls, benchmark, control_benchmark: controlBenchmark, evidence_sha256: digest(reportBytes), control_evidence_sha256: digest(controlReportBytes) };
}

export function renderCurrencySection(currency, baseline, escape, number) {
  const after = currency.benchmark.runs[0].rows.find(row => row.example_id === 'zh05').candidate;
  const before = baseline.runs[0].rows.find(row => row.example_id === 'zh05').candidate;
  const controls = currency.controls.examples.map(example => `<tr><th scope="row">${example.id}</th><td lang="zh-Hans">${escape(example.source)}<p class="mt-2 text-slate-500">Эталон: ${escape(example.reference)}</p></td>${currency.control_benchmark.runs.map(run => `<td>${escape(run.rows.find(row => row.example_id === example.id).candidate)}</td>`).join('')}</tr>`).join('');
  const timings = [currency.benchmark, currency.control_benchmark].map((report, index) => `<div class="mt-4"><h3 class="font-semibold">${index === 0 ? 'Исходные 20 реплик · v4' : '20 валютных контролей · v4'}</h3><p class="mt-1 text-sm">Запуск сервера: ${number(report.server_startup_ms)} мс.</p><div class="mt-2 overflow-x-auto"><table class="measurement"><thead><tr><th>Прогон</th><th>Файл, мс</th><th>Сумма HTTP, мс</th><th>Offline export, мс</th></tr></thead><tbody>${report.runs.map(run=>`<tr><th>${run.repetition}</th><td>${number(run.translation_elapsed_ms)}</td><td>${number(run.request_elapsed_sum_ms)}</td><td>${number(run.offline_reexport_ms)}</td></tr>`).join('')}</tbody></table></div><p class="mt-2 text-sm text-slate-500">${report.started_at} — ${report.finished_at}. UTC. Три новых SQLite-состояния, один сервер на набор; метод замера тот же, что у v1. Замеры v4 выполнены позже, это не изолированный тест скорости между профилями.</p></div>`).join('');
  return `<section id="currency-fix" class="mb-9 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 md:p-7"><p class="text-sm font-semibold text-emerald-800">Исправление валют · отдельный профиль v4</p><h2 class="mt-2 text-2xl font-semibold">Теперь 3,5 и 7 юаней</h2><p class="mt-3">Исходная фраза исправлена во всех трёх новых прогонах. Дополнительно: 17 денежных примеров × 3 — суммы и валюты совпали; 3 примера с камнями, шоколадом и минутами × 3 — валюта не добавлена. Это проверка чисел и валют, а не оценка точности всего перевода.</p><div class="mt-5 grid gap-5 lg:grid-cols-2"><div class="rounded-xl bg-white p-4"><p class="label">До · фактический ответ v1</p><p>${escape(before)}</p></div><div class="rounded-xl border border-emerald-200 bg-white p-4"><p class="label text-emerald-800">После · сохранённый результат v4</p><p>${escape(after)}</p></div></div><p class="mt-4 text-sm">Распознанные денежные выражения заменяются маркерами только в запросе к модели. Адаптер проверяет их число и порядок, затем восстанавливает точные суммы и валюты из исходника. Настоящие шекели, шиллинги, доллары, евро, иены, рубли и гонконгские доллары сохраняются. Исходный файл неизменен.</p><p class="mt-3 text-sm font-medium">Ограничения: общий смысл и грамматика всё ещё требуют проверки — например, в контроле сдачи модель пишет «Ищу тебя» вместо «Твоя сдача». Защита охватывает ограниченные формы чисел и денежного контекста; неизвестные формы переводит модель. Старый desktop package продолжает выбирать v1; v4 включается явно для нового CLI-прогона.</p><details class="mt-5"><summary class="cursor-pointer font-semibold">Все 20 контрольных примеров и три ответа</summary><div class="mt-3 overflow-x-auto"><table class="measurement"><thead><tr><th>ID</th><th>Исходник / предлагаемый эталон</th><th>Результат 1</th><th>Результат 2</th><th>Результат 3</th></tr></thead><tbody>${controls}</tbody></table></div></details><details class="mt-4"><summary class="cursor-pointer font-semibold">Точные замеры, профиль и запуск v4</summary>${timings}<p class="label mt-5">Профиль SHA-256</p><p class="hash">${currency.benchmark.profile_sha256}</p><p class="label mt-4">JSON: исходные реплики / валютные контроли SHA-256</p><p class="hash">${currency.evidence_sha256}<br>${currency.control_evidence_sha256}</p><pre class="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-white"><code>task cli -- translate source.srt state-v4 models/manifests/hy_mt2_1_8b_q4_k_m.fidelity.experimental.json http://127.0.0.1:18080/ translated.ru.srt
task eval:public-demo:fidelity
task eval:currency-controls</code></pre><p class="mt-3 text-sm">В JSON скачивания есть все 120 новых запросов, точные prompt, сырой ответ модели с маркерами и отдельно восстановленный результат. Метрики токенов относятся к сырому ответу. Веса и параметры sampling прежние; версия кода проверяется по SHA-256 исходных файлов и CLI.</p></details></section>`;
}
