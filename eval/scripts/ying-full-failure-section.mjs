import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const expectedSha256 = '64a349892fd1ed70a175aa3ba64c56fbabd2d1caa236ad8492773141389d5286';

export async function loadYingFullFailure(root) {
  const bytes = await fs.readFile(path.join(root,
    'eval/reports/2026-09-30-commons-ying-full-summary.json'));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, expectedSha256);
  const summary = JSON.parse(bytes);
  assert.equal(summary.source_srt_sha256,
    '505913bd7046b28c873307562a55d567043f8703bc00375c3485853b87c420d9');
  assert.equal(summary.media_sha256,
    'bc19430cf2a64e37ac1b0883599041989e3444697738f234a23484d620eb4ac7');
  assert.equal(summary.source_cues, 93);
  assert.deepEqual(summary.scene_ends, [15, 32, 42, 54, 66, 79, 93]);
  assert.deepEqual(summary.runs.map(run => [run.phase, run.checkpoints, run.chats]), [
    ['initial', 26, 27], ['copied-state resume', 93, 67],
  ]);
  assert.equal(summary.results, 0);
  assert.equal(summary.published_russian_srt, false);
  assert.equal(summary.human_bilingual_review, 0);
  assert.equal(summary.audio_listener_review, 0);
  assert.equal(summary.release_admitted, false);
  return { sha256, summary };
}

export function renderYingFullFailure(data) {
  const rows = data.summary.runs.map(run => `<tr><th scope="row">${run.phase === 'initial' ? 'Первый запуск' : 'Копия, продолжение'}</th><td>${run.checkpoints}/93</td><td>${run.chats} / ${run.http_requests}</td><td>${run.prompt_tokens.toLocaleString('ru-RU')} / ${run.completion_tokens.toLocaleString('ru-RU')}</td><td>${(run.chat_http_ms / 1000).toFixed(1)} с</td><td>${(run.full_elapsed_ms / 1000).toFixed(1)} с</td><td>${(run.working_set_peak_bytes / 1024 ** 3).toFixed(2)} GiB</td><td>${run.device_gpu_used_peak_mib} MiB</td></tr>`).join('');
  return `<section id="ying-full-failure" class="my-8 scroll-mt-8 rounded-2xl border border-amber-300 bg-amber-50/70 p-5 md:p-7"><p class="text-sm font-semibold text-amber-900">DATA-03 / CTX-02 / EVAL-04 · естественный файл и совпадающее видео</p><h2 class="mt-2 text-2xl font-bold">Ying: 93 реплики, итоговый перевод не создан</h2><p class="mt-3 max-w-4xl text-slate-700">Частный кандидат Commons: 3:38, 93 китайские реплики и видео VP9/Opus. Один запуск Hy-MT2 7B Q4 остановился на 27-й реплике после лимита 256 токенов. Продолжение на копии состояния дошло до 93 чекпойнтов, но финальный SRT отверг некорректную строку 27. Русского результата и утверждённого сценария озвучки нет. Исходник и неудачные ответы сохранены отдельно.</p><div class="mt-4 overflow-x-auto"><table class="measurement"><caption class="mb-3 text-left text-sm text-slate-600">Показаны две фазы одного кандидата. HTTP включает проверки токенизатора; Chat HTTP — только запросы перевода. Память измерена на активной машине.</caption><thead><tr><th>Фаза</th><th>Чекпойнты</th><th>Chat / HTTP</th><th>Токены вход / выход</th><th>Chat HTTP</th><th>Вся фаза</th><th>Пик working set</th><th>Пик GPU</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mt-4 text-sm text-slate-700">REG-020 сохраняет ограниченный длиной ответ и контрольные случаи; REG-021 — ошибочный SRT-чекпойнт и проверки грамматики до сохранения. Новый защитный код ещё не прошёл полный повторный естественный файл. Это не сравнение 1.8B/7B на Ying и не оценка качества перевода. Человеческая китайско-русская оценка: 0/93; прослушивание: 0; допуск к релизу: нет.</p><p class="mt-3 text-xs text-slate-600">Сводные данные SHA-256 <code class="hash">${data.sha256}</code>. Китайские субтитры, видео, запросы и ответы не опубликованы; происхождение таймкодов, точное совпадение речи и права на русский производный материал требуют проверки.</p><div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-30-commons-ying-full-model-failures.md">Методика и сбои (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/reports/2026-09-30-commons-ying-full-summary.json">Редактированный JSON</a><a class="underline" href="https://commons.wikimedia.org/wiki/File:WIKITONGUES-_Ying_speaking_Henan_Chinese.webm">Страница медиа</a></div></section>`;
}
