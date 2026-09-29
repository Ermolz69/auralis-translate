import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const IDS = ['p01', 'p02', 'p03', 'p04'];
const FILES = {
  small: ['pronouns-1b-p01-p04-2026-09-29.json', 'pronouns-1b-p01-p04-journal-check-2026-09-29.json', 'hy_mt2_1_8b_q4_k_m'],
  large: ['pronouns-7b-p01-p04-2026-09-29.json', 'pronouns-7b-p01-p04-journal-check-2026-09-29.json', 'hy_mt2_7b_q4_k_m'],
};

export async function loadPronounCrossModel(root) {
  const corpusBytes = await fs.readFile(path.join(root, 'eval/corpora/context-contrasts-v1.json'));
  const corpus = JSON.parse(corpusBytes);
  assert.equal(corpus.split, 'development');
  assert.equal(corpus.provenance, 'ai_authored_unreviewed');
  const index = JSON.parse(await fs.readFile(path.join(root, 'eval/regressions/scene-pronoun-v1.json')));
  const models = {};
  const observations = {};
  for (const [key, [reportFile, checkFile, stem]] of Object.entries(FILES)) {
    const reportBytes = await fs.readFile(path.join(root, 'eval/reports', reportFile));
    const checkBytes = await fs.readFile(path.join(root, 'eval/reports', checkFile));
    const report = JSON.parse(reportBytes);
    const check = JSON.parse(checkBytes);
    const reportSha = digest(reportBytes);
    assert.equal(reportSha, index.cross_model_report_sha256[key]);
    assert.equal(check.status, 'passed');
    assert.equal(check.report_sha256, reportSha);
    assert.deepEqual(check.checked.map(row => row.arm), IDS.flatMap(id => [`${id}:baseline`, `${id}:scene`]));
    assert.equal(check.checked.reduce((sum, row) => sum + row.chats, 0), 20);
    assert.equal(check.checked.reduce((sum, row) => sum + row.preflights, 0), 20);
    assert.equal(report.status, 'passed_structural_probe');
    assert.deepEqual(report.failures, []);
    assert.equal(report.corpus_sha256, digest(corpusBytes));
    assert.deepEqual(report.cases.map(row => row.id), IDS);
    assert.equal(report.requests.length, 64);
    assert.equal(report.limits.repetitions, 1);
    assert.equal(report.limits.files, 8);
    assert(report.requests.length <= report.limits.all_http_requests);
    const chats = report.requests.filter(row => row.path === '/v1/chat/completions');
    const tokens = report.requests.filter(row => row.path === '/tokenize');
    assert.equal(chats.length, 20);
    assert.equal(tokens.length, 10);
    assert(chats.length <= report.limits.chat_requests);
    assert(chats.every(row => row.http_status === 200 && row.raw_response && row.usage?.prompt_tokens > 0));
    const baselineBytes = await fs.readFile(path.join(root, `models/manifests/${stem}.context_v5.experimental.json`));
    const sceneBytes = await fs.readFile(path.join(root, `models/manifests/${stem}.context_v5_scene.experimental.json`));
    assert.equal(report.profile_sha256.baseline, digest(baselineBytes));
    assert.equal(report.profile_sha256.scene, digest(sceneBytes));
    assert.equal(report.model_sha256_verified_by_doctor, JSON.parse(sceneBytes).model_file_sha256);
    assert.equal(report.model_variant, key === 'small' ? '1.8b' : '7b');
    for (const row of report.cases) {
      const source = corpus.cases.find(caseRow => caseRow.id === row.id);
      assert(source);
      assert.equal(row.target_id, source.relevant.before_zh.length + 1);
      assert.deepEqual(row.arms.map(arm => arm.arm), ['baseline', 'scene']);
      assert(row.arms.every(arm => arm.status.state === 'validated' && arm.offline_reexport === 'byte_identical'));
      for (const arm of row.arms) {
        const active = `${row.id}:${arm.arm}`;
        const armChats = chats.filter(request => request.arm === active);
        assert.equal(armChats.length, source.relevant.before_zh.length + source.relevant.after_zh.length + 1);
        for (const request of armChats) {
          const prompt = request.request.messages[0].content;
          assert(!corpus.cases.some(other => prompt.includes(other.relevant.reference_ru)), 'reference entered a model request');
          const decoded = JSON.parse(request.raw_candidate).translations;
          assert.equal(decoded.length, 1);
          const slot = JSON.parse(prompt.split('Input JSON:\n')[1]).target_slots[0];
          assert.equal(decoded[0].segment_id, slot.segment_id);
          if (slot.segment_id === row.target_id) assert.equal(decoded[0].text, arm.accepted_target);
        }
        if (arm.arm === 'scene') {
          const armTokens = tokens.filter(request => request.arm === active);
          assert.equal(armTokens.length, armChats.length);
          armTokens.forEach((request, position) => {
            assert.equal(request.token_count, armChats[position].usage.prompt_tokens);
            assert(request.token_count + 256 + 64 <= 2048);
          });
        }
      }
    }
    observations[key] = report.cases;
    const samples = report.resource_samples.filter(sample => Number.isFinite(sample.working_set_bytes));
    models[key] = {
      label: key === 'small' ? '1.8B Q4_K_M' : '7B Q4_K_M',
      report_sha256: reportSha,
      journal_sha256: digest(checkBytes),
      model_sha256: report.model_sha256_verified_by_doctor,
      cli_sha256: report.cli_sha256,
      runtime_sha256: report.runtime_sha256,
      revision: report.revision,
      chat_requests: chats.length,
      token_preflights: tokens.length,
      prompt_tokens: chats.reduce((sum, row) => sum + row.usage.prompt_tokens, 0),
      completion_tokens: chats.reduce((sum, row) => sum + row.usage.completion_tokens, 0),
      chat_http_ms: chats.reduce((sum, row) => sum + row.elapsed_ms, 0),
      wall_ms: Date.parse(report.finished_at) - Date.parse(report.started_at),
      peak_working_set_bytes: Math.max(...samples.map(sample => sample.working_set_bytes)),
      peak_device_gpu_mib: Math.max(...report.resource_samples.map(sample => Number.parseInt(sample.gpu?.split(',')[0] ?? '', 10)).filter(Number.isFinite)),
    };
  }
  assert.equal(models.small.revision, models.large.revision);
  assert.equal(models.small.cli_sha256, models.large.cli_sha256);
  assert.equal(models.small.runtime_sha256, models.large.runtime_sha256);
  const rows = IDS.map(id => {
    const source = corpus.cases.find(row => row.id === id);
    const small = observations.small.find(row => row.id === id);
    const large = observations.large.find(row => row.id === id);
    assert.equal(small.source_sha256, large.source_sha256);
    assert.equal(small.scene_map_sha256, large.scene_map_sha256);
    return {
      id, before: source.relevant.before_zh.join(' '), target: source.target_zh,
      proposed: source.relevant.reference_ru,
      small: small.arms.map(arm => arm.accepted_target),
      large: large.arms.map(arm => arm.accepted_target),
    };
  });
  assert.deepEqual(rows[0].small, ['Пришло.', 'Приехали.']);
  assert.deepEqual(rows[0].large, ['Прибыли.', 'Мы прибыли.']);
  return { models, rows, corpus_sha256: digest(corpusBytes), human_review: 'missing' };
}

export function renderPronounCrossModel(summary, escape) {
  const repo = 'https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/';
  const rows = summary.rows.map(row => `<tr data-pronoun-row="${escape(row.id)}"><th scope="row">${escape(row.id)}<span class="block font-normal text-slate-500" lang="zh-Hans">${escape(row.before)} → ${escape(row.target)}</span></th><td>${escape(row.proposed)}</td><td>${escape(row.small[0])}<br><strong>${escape(row.small[1])}</strong></td><td>${escape(row.large[0])}<br><strong>${escape(row.large[1])}</strong></td></tr>`).join('');
  const metrics = Object.values(summary.models).map(model => `<tr><th scope="row">${escape(model.label)}</th><td>${model.chat_requests}</td><td>${model.token_preflights}</td><td>${model.prompt_tokens} / ${model.completion_tokens}</td><td>${Math.round(model.wall_ms / 1000)} с</td><td>${Math.round(model.peak_working_set_bytes / 1024 ** 2)} MiB</td><td>${model.peak_device_gpu_mib} MiB</td></tr>`).join('');
  const links = Object.entries(FILES).map(([key, [report, check]]) => `<li>${escape(summary.models[key].label)}: <a class="text-blue-700 underline" href="${repo}${report}">сырые запросы и ответы</a> · <a class="text-blue-700 underline" href="${repo}${check}">сверка SQLite</a> · SHA-256 <code class="hash">${summary.models[key].report_sha256}</code></li>`).join('');
  return `<section id="pronoun-cross-model" class="scroll-mt-8 border-t border-slate-200 py-10"><p class="text-sm font-semibold uppercase tracking-[.12em] text-amber-800">Четыре парные сцены · 29 сентября 2026</p><h2 class="mt-2 text-2xl font-semibold">Ошибка числа сохраняется у 1.8B и 7B</h2><p class="mt-3 max-w-5xl text-slate-600">Обе модели получили одни и те же четыре авторские китайские сцены: отдельно и с соседним исходным текстом. Журнал SQLite сверил все 40 chat-ответов и 40 вызовов токенизатора/шаблона; исходные и выходные SRT проверены, повторная выгрузка совпала побайтно. Предложенные русские варианты не входили в запросы. Это один прогон на модель, без человеческой оценки.</p><div class="mt-5 overflow-x-auto"><table class="measurement"><thead><tr><th>Сцена · исходник</th><th>Предложенный смысл*</th><th>1.8B<br>без / с контекстом</th><th>7B<br>без / с контекстом</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-2 text-sm text-slate-500">* В p01 до цели назван один старший брат. Контекстные «Приехали.» и «Мы прибыли.» передают множественного действующего лица. В p02–p04 этого дефекта в данном повторе не наблюдалось. Это ИИ-разбор исходника; независимый китайско-русский рецензент ещё нужен. Ни один вариант не объявлен релизным переводом.</p><div class="mt-5 overflow-x-auto"><table class="measurement"><thead><tr><th>Модель</th><th>Chat</th><th>Token preflight</th><th>Вход / выход токенов</th><th>Весь прогон*</th><th>Пик working set*</th><th>Пик GPU*</th></tr></thead><tbody>${metrics}</tbody></table></div><p class="mt-2 text-sm text-slate-500">* Прогоны шли последовательно на работающем ПК. Полное время включает проверку модели, запуск сервера, CLI и выгрузку; это не парный тест скорости. Память измерялась примерно раз в секунду, GPU включает другие приложения. Первый запуск 1.8B был остановлен sandbox EPERM до инференса и повторён с тем же планом.</p><details class="mt-5"><summary class="cursor-pointer font-semibold text-blue-700">Исходные отчёты и сверка</summary><ul class="mt-3 list-disc space-y-2 pl-6 text-sm">${links}</ul><p class="mt-3 text-sm text-slate-600">Оба прогона использовали commit <code>${summary.models.small.revision.slice(0, 7)}</code> и одинаковые исполняемые файлы CLI/runtime; модельные и профильные хеши различаются по плану. Все предыдущие измерения сохранены выше и ниже.</p></details></section>`;
}
