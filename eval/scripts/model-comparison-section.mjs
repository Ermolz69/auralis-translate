import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildSrt, digest } from './flores-file-fixture.mjs';

export function quantile(values, probability) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * probability) - 1)];
}

export async function loadModelComparison(root) {
  const bytes = await fs.readFile(path.join(root, 'eval/reports/model-size-comparison-2026-09-27.json'));
  const report = JSON.parse(bytes);
  const reviewBytes = await fs.readFile(path.join(root, 'eval/corpora/model-size-review-v1.json'));
  const review = JSON.parse(reviewBytes);
  const datasets = {};
  for (const [key, file] of [['demo', 'public-demo-v1.json'], ['controls', 'currency-controls-v1.json']]) {
    const datasetBytes = await fs.readFile(path.join(root, 'eval/corpora', file));
    datasets[key] = { data: JSON.parse(datasetBytes), sha256: digest(datasetBytes) };
  }
  assert.equal(report.result, 'passed');
  assert.equal(report.failures.length, 0);
  assert.deepEqual(report.cases.map(item => item.id), ['demo-small', 'demo-large', 'controls-large', 'controls-small']);
  let cliHash, runtimeHash;
  for (const item of report.cases) {
    const benchmark = item.benchmark;
    const dataset = datasets[item.id.split('-')[0]];
    assert.equal(item.report_sha256, digest(Buffer.from(JSON.stringify(benchmark, null, 2))));
    assert.equal(benchmark.result, 'passed');
    assert.equal(benchmark.failures.length, 0);
    assert.equal(benchmark.profile.prompt_version, 4);
    assert.equal(benchmark.dataset_sha256, dataset.sha256);
    assert.equal(benchmark.source_sha256, digest(buildSrt(dataset.data.examples)));
    assert.equal(benchmark.requests.length, 60);
    assert.equal(benchmark.runs.length, 3);
    assert.equal(benchmark.source_preservation, 'byte_identical');
    cliHash ??= benchmark.cli_sha256;
    runtimeHash ??= benchmark.runtime_sha256;
    assert.equal(benchmark.cli_sha256, cliHash);
    assert.equal(benchmark.runtime_sha256, runtimeHash);
    const profileFile = item.model === 'small' ? 'hy_mt2_1_8b_q4_k_m.fidelity.experimental.json' : 'hy_mt2_7b_q4_k_m.fidelity.experimental.json';
    assert.equal(benchmark.profile_sha256, digest(await fs.readFile(path.join(root, 'models/manifests', profileFile))));
    for (const run of benchmark.runs) {
      assert.equal(run.structural_checks, 'passed');
      assert.equal(run.offline_reexport, 'byte_identical');
      assert.equal(run.rows.length, 20);
      assert.equal(run.status.review_state, 'needs_review');
      for (const example of dataset.data.examples) {
        const requests = benchmark.requests.filter(row => row.example_id === example.id && row.run === run.repetition);
        assert.equal(requests.length, 1);
        const request = requests[0];
        assert.equal(request.http_status, 200);
        assert(request.elapsed_ms > 0 && request.usage.completion_tokens > 0);
        assert.equal(request.source_sha256, digest(Buffer.from(example.source)));
        assert.equal(request.accepted_candidate, run.rows.find(row => row.example_id === example.id).candidate);
        assert(!request.accepted_candidate.includes('__AURALIS_MONEY_'));
        if (example.expected_currency && example.expected_currency !== 'none') {
          assert.deepEqual(request.accepted_candidate.match(/\d+(?:,\d+)?/g), example.reference.match(/\d+(?:,\d+)?/g));
        }
      }
    }
  }
  for (const key of ['demo', 'controls']) {
    const small = report.cases.find(item => item.id === `${key}-small`).benchmark;
    const large = report.cases.find(item => item.id === `${key}-large`).benchmark;
    const smallPolicy = { ...small.profile }, largePolicy = { ...large.profile };
    for (const field of ['model_repo', 'model_revision', 'model_file_sha256', 'model_file_bytes', 'model_alias']) { delete smallPolicy[field]; delete largePolicy[field]; }
    assert.deepEqual(smallPolicy, largePolicy);
    for (const request of small.requests) assert.equal(request.prompt, large.requests.find(row => row.run === request.run && row.example_id === request.example_id).prompt);
    assert.equal(review.observations.filter(row => row.dataset === key).length, 20);
    for (const example of datasets[key].data.examples) {
      const observations = review.observations.filter(row => row.dataset === key && row.id === example.id);
      assert.equal(observations.length, 1);
      assert(['large_better', 'small_better', 'tie', 'mixed'].includes(observations[0].verdict));
    }
  }
  assert.equal(review.evidence_sha256, digest(bytes));
  return { report, review, datasets, evidence_sha256: digest(bytes), review_sha256: digest(reviewBytes) };
}

export function renderModelComparison(comparison, escape, number) {
  const { report, review, datasets } = comparison;
  const median = values => { const sorted = [...values].sort((a,b)=>a-b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2; };
  const metrics = report.cases.map(item => {
    const b = item.benchmark;
    const requests = b.requests.map(row => row.elapsed_ms);
    const peakGpu = Math.max(...b.resource_samples.filter(row => typeof row.gpu === 'string').map(row => Number(row.gpu.split(',')[0])));
    const peakRam = Math.max(...b.resource_samples.map(row => row.working_set_bytes));
    return `<tr><th>${item.model === 'small' ? '1.8B' : '7B'} · ${item.id.startsWith('demo') ? 'реплики' : 'контроли'}</th><td>${number(b.server_startup_ms)}</td><td>${number(median(b.runs.map(run => run.translation_elapsed_ms)))}</td><td>${number(quantile(requests,.5))} / ${number(quantile(requests,.95))}</td><td>${number(peakGpu,0)}</td><td>${number(peakRam / 1024 ** 3,3)}</td><td>60 / 60</td></tr>`;
  }).join('');
  const times = report.cases.map(item => `<tr><th>${escape(item.id)}</th>${item.benchmark.runs.map(run => `<td>${number(run.translation_elapsed_ms)}<br><span class="text-slate-500">HTTP ${number(run.request_elapsed_sum_ms)}<br>export ${number(run.offline_reexport_ms)}</span></td>`).join('')}</tr>`).join('');
  const verdicts = { large_better: '7B лучше', small_better: '1.8B лучше', tie: 'Сопоставимо', mixed: 'Смешанный результат' };
  const rows = key => datasets[key].data.examples.map(example => {
    const small = report.cases.find(item => item.id === `${key}-small`).benchmark;
    const large = report.cases.find(item => item.id === `${key}-large`).benchmark;
    const observation = review.observations.find(row => row.dataset === key && row.id === example.id);
    return `<tr data-model-row="${key}:${example.id}"><th>${escape(example.id)}<p class="mt-2 font-normal" lang="zh-Hans">${escape(example.source)}</p><p class="mt-2 font-normal text-slate-500">Предлагаемый эталон: ${escape(example.reference)}</p></th><td class="model-small-candidate" data-dataset="${key}" data-example="${example.id}">${escape(small.runs[0].rows.find(row=>row.example_id===example.id).candidate)}</td><td class="model-large-candidate" data-dataset="${key}" data-example="${example.id}">${escape(large.runs[0].rows.find(row=>row.example_id===example.id).candidate)}</td><td><strong>${verdicts[observation.verdict]}</strong><p class="mt-2">${escape(observation.note)}</p></td></tr>`;
  }).join('');
  const examples = ['demo', 'controls'].map(key => `<details class="mt-5" ${key === 'demo' ? 'open' : ''}><summary class="cursor-pointer text-lg font-semibold">${key === 'demo' ? '20 исходных реплик' : '20 валютных и физических контролей'} · обе модели</summary><div class="mt-3 overflow-x-auto"><table class="measurement"><thead><tr><th>Исходник и эталон</th><th>1.8B Q4 · v4</th><th>7B Q4 · v4</th><th>Разбор Ули по трём повторам</th></tr></thead><tbody>${rows(key)}</tbody></table></div></details>`).join('');
  const identity = report.cases.filter(item => item.id.startsWith('demo')).map(item => `<div><h3 class="font-semibold">${item.model === 'small' ? '1.8B' : '7B'}</h3><p class="mt-2 text-sm">${number(item.benchmark.profile.model_file_bytes,0)} байт · Q4_K_M</p><p class="label mt-3">GGUF / profile SHA-256</p><p class="hash">${item.benchmark.profile.model_file_sha256}<br>${item.benchmark.profile_sha256}</p><a class="text-sm text-blue-700 underline" href="https://huggingface.co/${item.benchmark.profile.model_repo}/tree/${item.benchmark.profile.model_revision}">Официальная закреплённая ревизия</a></div>`).join('');
  return `<section id="model-comparison" class="mt-8 mb-8 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 md:p-7"><p class="text-sm font-semibold text-blue-800">Новое · реальное сравнение 1.8B и 7B · одинаковый профиль v4</p><h2 class="mt-2 text-3xl font-bold">${escape(review.headline)}</h2><div class="mt-4 space-y-3 text-slate-700">${review.conclusions.map(text=>`<p>${escape(text)}</p>`).join('')}</div><p class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Разбор предложен Улей, ИИ-ассистентом, по всем трём ответам каждой модели. Это редакционное сравнение 40 известных авторских примеров; независимая человеческая проверка и незнакомый holdout ещё не выполнены. Валюты сохраняет общий адаптер v4, поэтому их правильность не доказывает превосходство 7B.</p><div class="mt-5 overflow-x-auto"><table class="measurement"><caption class="mb-2 text-left text-sm">240 новых запросов · 12 полных файлов · 12 выгрузок без модели. Все длительности — мс.</caption><thead><tr><th>Модель / набор</th><th>Startup</th><th>Медиана файла</th><th>HTTP p50 / p95</th><th>Пик GPU*, MiB</th><th>Working set*, GiB</th><th>HTTP OK</th></tr></thead><tbody>${metrics}</tbody></table></div><p class="mt-3 text-sm text-slate-600">* Сэмплы примерно раз в секунду, начиная с запуска процесса. GPU включает остальные приложения; working set не равен приватной RAM. p50/p95 — ближайший ранг ceil(p × 60). Первый файл после readiness, два следующих используют тот же сервер; холодный кэш ОС не обеспечивался. Полное время файла включает проверку GGUF, SQLite, валидацию и экспорт.</p><div class="mt-5 flex flex-wrap gap-2" role="group" aria-label="Прогон сравнения моделей">${[1,2,3].map(n=>`<button class="run-button rounded-lg border border-blue-300 px-4 py-2 text-sm font-semibold" data-model-run="${n}" aria-pressed="${n===1}">Сравнение · прогон ${n}</button>`).join('')}</div>${examples}<details class="mt-6"><summary class="cursor-pointer font-semibold">Полные замеры, настройки и воспроизводимость</summary><div class="mt-4 overflow-x-auto"><table class="measurement"><thead><tr><th>Набор / модель</th><th>Прогон 1 · мс</th><th>Прогон 2 · мс</th><th>Прогон 3 · мс</th></tr></thead><tbody>${times}</tbody></table></div><p class="mt-3 text-sm">Одинаковые prompt v4, temperature 0,7, top-p 0,6, top-k 20, repeat penalty 1,05, лимит 256 токенов, context 2048, parallel 1, GPU layers 99, Jinja, cache-ram 0, runtime ${escape(report.cases[0].benchmark.profile.runtime_build_info)}. Различаются только идентичность и веса модели. Порядок: 1.8B → 7B на репликах; 7B → 1.8B на контролях. Случайный sampling и кэш могут влиять на результаты. Это сравнение размеров при Q4_K_M, а не отдельная проверка потерь от квантизации.</p><div class="mt-5 grid gap-5 md:grid-cols-2">${identity}</div><p class="label mt-5">Evidence SHA-256 / review SHA-256</p><p class="hash">${comparison.evidence_sha256}<br>${comparison.review_sha256}</p><p class="mt-3 text-sm">${escape(report.started_at)} — ${escape(report.finished_at)} · UTC. В полном JSON есть все запросы, prompt, сырой ответ с маркерами, сохранённый перевод, токены и сэмплы ресурсов. Исходные Google-наблюдения остаются ниже; Google не запускался заново.</p><pre class="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-white"><code>task model:7b:fetch
task model:7b:doctor
task model:7b:serve
# In a second terminal:
task cli -- translate source.srt state-7b models/manifests/hy_mt2_7b_q4_k_m.fidelity.experimental.json http://127.0.0.1:18080/ translated.ru.srt
task eval:models:compare</code></pre><p class="mt-3 text-sm">CLI и GPU-запуск 7B проверены на этой машине. Desktop-интерфейс и его закреплённый пакет не переключались. Старый прогон требует свой прежний профиль; для другой модели создаётся новый.</p></details></section>`;
}
