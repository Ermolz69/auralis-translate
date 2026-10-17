import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const base = '4319177b7e41512a2aabfc5cd30f49357b25d405';
const baselineFile = join(root, `.Taskfile.mnt02-${randomUUID()}.yml`);
const moved = ['fmt', 'fmt:fix', 'lint', 'test', 'check', 'docs:check', 'plan:check', 'inspect', 'cli'];

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  return {
    stdout: result.stdout.replace(/\r\n/gu, '\n').trimEnd(),
    stderr: result.stderr.replace(/\r\n/gu, '\n').trimEnd(),
  };
}

function catalog(taskfile) {
  const tasks = JSON.parse(run('task', ['--taskfile', taskfile, '--list-all', '--json']).stdout).tasks;
  return new Map(tasks.map(({ name, task, desc, summary, aliases }) => [name, { task, desc, summary, aliases }]));
}

function dry(taskfile, name, args = []) {
  const result = run('task', ['--taskfile', taskfile, '--dry', name, ...args]);
  return [result.stdout, result.stderr].filter(Boolean).join('\n');
}

function missingVariable(taskfile, name) {
  const result = spawnSync('task', ['--taskfile', taskfile, '--dry', name], {
    cwd: root, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  assert.notEqual(result.status, 0, `${name} must still require its variables`);
  return [result.stdout, result.stderr].filter(Boolean).join('\n').replace(/\r\n/gu, '\n').trimEnd();
}

try {
  writeFileSync(baselineFile, run('git', ['show', `${base}:Taskfile.yml`]).stdout, { flag: 'wx' });
  assert.equal(process.cwd(), root, 'catalog check must execute from the Translate root');

  const before = catalog(baselineFile);
  const after = catalog('Taskfile.yml');
  for (const [name, metadata] of before) {
    assert.deepEqual(after.get(name), metadata, `public task changed or disappeared: ${name}`);
  }
  const added = [...after.keys()].filter((name) => !before.has(name)).sort();
  assert.deepEqual(added, [
    'maintenance:catalog:check',
    'maintenance:test:cli',
    'maintenance:test:provider',
    'maintenance:test:report',
  ]);
  assert.equal(before.has('default'), after.has('default'), 'default task changed');

  const scenarios = [
    ...moved.map((name) => ({ name, args: [] })),
    { name: 'inspect', args: ['--', 'crates/auralis-translation-formats/tests/fixtures/plain.srt'] },
    { name: 'cli', args: ['--', 'inspect', 'crates/auralis-translation-formats/tests/fixtures/plain.srt'] },
    { name: 'site:build', args: [] },
    { name: 'site:check', args: [] },
    { name: 'eval:cli:local:e2e', args: ['SERVER_EXE=synthetic-server.exe', 'MODEL_FILE=synthetic.gguf'] },
    { name: 'eval:token-count:parity', args: ['MODEL_FILE=synthetic.gguf', 'PROFILE_FILE=synthetic.json'] },
  ];
  for (const { name, args } of scenarios) {
    assert.equal(dry('Taskfile.yml', name, args), dry(baselineFile, name, args), `dry-run changed: ${name}`);
  }
  for (const name of ['eval:cli:local:e2e', 'eval:token-count:parity']) {
    assert.equal(missingVariable('Taskfile.yml', name), missingVariable(baselineFile, name),
      `required-variable refusal changed: ${name}`);
  }

  for (const name of added.filter((value) => value.startsWith('maintenance:test:'))) {
    const commands = dry('Taskfile.yml', name);
    assert.match(commands, /cargo test|node --test/u, `${name} must run contract tests`);
    assert.doesNotMatch(commands, /\b(?:fetch-release|serve-local-model|site:capture|--probe|--acquire)\b/u,
      `${name} must remain model/network/publication free`);
  }
  console.log(`Task catalog preserved: ${before.size} public entries; ${moved.length} moved commands and ${scenarios.length - moved.length} representative expansions match the base.`);
} finally {
  try { unlinkSync(baselineFile); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
