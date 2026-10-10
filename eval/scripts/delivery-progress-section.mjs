import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const statuses = ['done', 'ready', 'in_progress', 'planned', 'deferred', 'blocked'];
const labels = { done: 'Готово', ready: 'Можно начинать', in_progress: 'В работе', planned: 'Запланировано', deferred: 'Отложено / по условию', blocked: 'Блокировано' };
const phases = [
  { title: 'База и план', prefixes: ['BASE', 'PLAN'] },
  { title: 'Данные и сравнения', prefixes: ['DATA', 'EVAL'] },
  { title: 'Контекст и термины', prefixes: ['CTX', 'NAME', 'TERM'] },
  { title: 'Куски и длинные файлы', prefixes: ['LONG'] },
  { title: 'Выбор и дообучение', prefixes: ['DECIDE', 'TUNE', 'PRECISION'] },
  { title: 'Доставка и релиз перевода', prefixes: ['CLI', 'HOST', 'RELEASE'] },
  { title: 'Настоящая озвучка', prefixes: ['VOICE'] },
  { title: 'Следующие направления', prefixes: ['ASR', 'LANGUAGE'] },
];

export async function loadDeliveryPlan(root) {
  const files = ['DELIVERY_PLAN.md', 'IMPLEMENTATION_BACKLOG.md', 'AGENT_WORKFLOW.md', 'RELEASE_ACCEPTANCE.md', 'evaluation/008-regression-and-adversarial-checks.md', 'GOAL_PROMPT.md'];
  const documents = await Promise.all(files.map(async name => {
    const bytes = await fs.readFile(path.join(root, 'docs', name));
    const text = bytes.toString('utf8').replaceAll('\r\n', '\n');
    return { name, sha256: digest(text), text };
  }));
  const backlog = documents.find(item => item.name === 'IMPLEMENTATION_BACKLOG.md');
  const updated = backlog.text.match(/^Updated: (\d{4}-\d{2}-\d{2})\./m)?.[1];
  assert(updated, 'Backlog must have an explicit update date');
  const table = backlog.text.split('## Task table')[1]?.split(/\r?\n## /)[0];
  assert(table, 'Canonical task table is missing');
  const tableRows = table.split(/\r?\n/).filter(line => line.startsWith('|'));
  assert.equal(tableRows[0], '| ID | Work | Status | Depends on | Acceptance / evidence |', 'Canonical columns changed');
  const tasks = tableRows.slice(2).map(line => {
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    assert.equal(cells.length, 5, `Five backlog columns required: ${line}`);
    const [id, work, status, dependencies, acceptance] = cells;
    assert(/^[A-Z]+-\d{2}$/.test(id), `Invalid task ID: ${id}`);
    assert(statuses.includes(status), `${id}: unknown status ${status}`);
    assert(work && acceptance, `${id}: work and acceptance required`);
    const depends_on = dependencies === '-' ? [] : dependencies.split(',').map(value => value.trim());
    assert.equal(new Set(depends_on).size, depends_on.length, `${id}: duplicate dependency`);
    const phase = phases.find(item => item.prefixes.includes(id.split('-')[0]));
    assert(phase, `${id}: add the new phase to the progress renderer`);
    if (status === 'done') assert(/\[[^\]]+\]\([^)]+\)/.test(acceptance), `${id}: done requires linked evidence`);
    return { id, work, status, depends_on, acceptance, phase: phase.title };
  });
  assert(tasks.length > 0, 'No tasks parsed');
  const byId = new Map(tasks.map(task => [task.id, task]));
  assert.equal(byId.size, tasks.length, 'Backlog IDs must be unique');
  const visiting = new Set();
  const visited = new Set();
  function visit(task) {
    assert(!visiting.has(task.id), `${task.id}: dependency cycle`);
    if (visited.has(task.id)) return;
    visiting.add(task.id);
    for (const id of task.depends_on) {
      assert(byId.has(id), `${task.id}: missing dependency ${id}`);
      const dependency = byId.get(id);
      if (['done', 'ready'].includes(task.status)) assert.equal(dependency.status, 'done', `${task.id}: prerequisite ${id} is not done`);
      visit(dependency);
    }
    visiting.delete(task.id);
    visited.add(task.id);
  }
  tasks.forEach(visit);
  const counts = Object.fromEntries(statuses.map(status => [status, tasks.filter(task => task.status === status).length]));
  return { updated, total_tasks: tasks.length, counts, tasks, document_hash_encoding: 'UTF-8 with LF line endings', documents: documents.map(({ name, sha256 }) => ({ name, sha256 })) };
}

export function renderDeliveryProgress(plan, escape) {
  const cards = phases.map(phase => {
    const tasks = plan.tasks.filter(task => task.phase === phase.title);
    const done = tasks.filter(task => task.status === 'done').length;
    const deferred = tasks.filter(task => task.status === 'deferred').length;
    return `<div class="rounded-xl border border-slate-200 bg-white p-4"><h3 class="font-semibold">${phase.title}</h3><p class="mt-2 text-sm">Готово ${done} из ${tasks.length} задач${deferred ? ` · отложено ${deferred}` : ''}</p></div>`;
  }).join('');
  const taskRows = plan.tasks.map(task => `<tr data-plan-task="${task.id}"><th scope="row" class="whitespace-nowrap font-mono">${task.id}</th><td>${escape(task.work)}</td><td>${labels[task.status]}</td><td class="font-mono text-xs">${task.depends_on.join(', ') || '—'}</td></tr>`).join('');
  const counts = Object.entries(plan.counts).filter(([, value]) => value > 0).map(([status, value]) => `${labels[status]}: ${value}`).join(' · ');
  return `<section id="delivery-plan" class="my-8 rounded-2xl border border-slate-300 bg-slate-50 p-5 md:p-7"><p class="text-sm font-semibold text-slate-600">План завершения · ${plan.updated}</p><h2 class="mt-2 text-2xl font-bold md:text-3xl">От отдельных реплик к длинному переводу и озвучке</h2><p class="mt-4 leading-relaxed">Сначала собираем сцены и проверяем контекст, затем объединяем контекст, термины и защиту фактов в новом профиле v5. Проверяем разбиение длинных файлов, память, скорость и восстановление. По результатам решаем, нужно ли дообучение весов. Реальную речь и монтаж проверяем отдельно в Auralis.</p><div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">${cards}</div><p class="mt-4 text-sm"><strong>${plan.counts.done} из ${plan.total_tasks} задач завершено.</strong> ${counts}.</p><p class="mt-2 text-sm text-slate-600">Это счётчик задач, а не процент качества или готовности продукта. Отложенные этапы остаются открытыми. Названия и состояния взяты из единого backlog; дообучение и новый интерфейс сейчас не выполнены.</p><div class="mt-5 grid gap-5 md:grid-cols-2"><div><h3 class="font-semibold">Контекст и длинные эксперименты</h3><ul class="mt-2 list-disc space-y-2 pl-5 text-sm"><li>60 целевых реплик: местоимения, разорванные фразы, имена, деньги, ирония. Для каждой — изолированный вариант, подходящий контекст, посторонний контекст и другая исходная сцена.</li><li>Начальные пакеты: 1 / 4 / 8 реплик; смещения границ: 0 / 1 / 3. Лимит задаётся фактическими токенами, время и IDs сохраняются.</li><li>Инженерные нагрузки: 1 024 / 4 096 / 10 000 реплик. Отдельно — настоящие полные источники около 30 / 90 / 180 минут при доступности и подтверждённых правах.</li><li>Цель сбора: примерно 200 dev + 300 независимых holdout реплик. Человеческий разбор смысла, ошибок и терминов; данные ещё предстоит собрать.</li></ul></div><div><h3 class="font-semibold">Как агент ведёт работу</h3><ul class="mt-2 list-disc space-y-2 pl-5 text-sm"><li>Берёт готовую задачу, меняет контракт до кода, проверяет её критерии и сохраняет доказательства. Моки не подтверждают качество перевода или звука.</li><li>Сравнивает одинаковые источники, фиксирует модель, профиль, контекст, токены, время, память, сбои и сырые ответы. Человеческий и ИИ-разбор помечаются отдельно.</li><li>Автор и коммиттер — основная Git-учётная запись компьютера. Коммиты небольшие, с объяснением; чужие изменения сохраняются.</li><li>Релиз перевода требует G1–G9. Озвучка — настоящего TTS, прослушивания, проверки длительности, стыков, имён, сумм и полного файла.</li></ul></div></div><div class="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/docs/DELIVERY_PLAN.md">Полный план (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/docs/IMPLEMENTATION_BACKLOG.md">Backlog и критерии (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/docs/AGENT_WORKFLOW.md">Правила агента и коммитов (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/docs/RELEASE_ACCEPTANCE.md">Критерии завершения Goal (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/docs/evaluation/008-regression-and-adversarial-checks.md">Будущие проверки и регрессии (EN)</a><a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/docs/GOAL_PROMPT.md">Готовый промпт Goal (EN)</a></div><p class="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm">Дополнено: фиксируем границы Goal и матрицу G1–G9 / A1–A6, сохраняем найденные ошибки в регрессиях, проверяем посторонние инструкции и повреждённые ответы, ограничиваем повторные попытки, испытываем обновление и откат на копиях. Финальный аудит сверяет код, артефакты и доказательства. Goal запущен: <a class="underline" href="https://github.com/Ermolz69/auralis-translate/blob/main/eval/experiments/2026-09-28-goal-scope-v1.md">PLAN-03 зафиксировал объём</a>; обязательные проверки G1–G9 и A1–A6 остаются открытыми до реальных результатов.</p><p class="mt-4 text-sm"><strong>Следующие задачи:</strong> ${plan.tasks.filter(task => task.status === 'ready').map(task => task.id).join(', ') || 'смотрите backlog'}.</p><details class="mt-5"><summary class="cursor-pointer font-semibold">Все задачи (${plan.total_tasks}) · названия из канонического плана (EN)</summary><div class="mt-4 overflow-x-auto"><table class="measurement"><thead><tr><th>ID</th><th>Задача</th><th>Статус</th><th>Зависит от</th></tr></thead><tbody>${taskRows}</tbody></table></div><p class="mt-3 text-sm text-slate-600">Критерии приёмки и ссылки на доказательства находятся в backlog. Хеши ${plan.documents.length} документов и все состояния входят в полный JSON отчёта.</p></details></section>`;
}
