import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const marker = 'Input JSON:\n';
const timingPrefix = 'auralis_eval_timing ';
export const inventory = [
  ['natural_1_8b', 'v8-asus-natural-long-v1/attempt-UhjJZn/1_8b/state/auralis-translate.sqlite', 'e0d87164c730c362168e8109b3adbea9bb23965845f69f0bb31f02eac5a5f851'],
  ['natural_7b', 'v8-asus-natural-long-v1/attempt-UhjJZn/7b/state/auralis-translate.sqlite', '142290cb9cad56b83013fb00db57de7611a80ee6e8a7072a85d3410a1ca575c0'],
  ['resume_1_8b', 'v8-asus-copy-resume-v1/attempt-1LHWcZ/1_8b/state/auralis-translate.sqlite', '520d7628753ca8db2a8d94e8e3c9130fddb9b588aa658924b2f8c0a665d78b44'],
  ['resume_7b', 'v8-asus-copy-resume-v1/attempt-1LHWcZ/7b/state/auralis-translate.sqlite', 'f488d248e4ca99cc6c7f9b0efa1a7307f6d7b3e99876213b2df190b7399310f4'],
];

export async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

export function statistics(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return { count: 0, sum: 0, p50: null, p95: null, max: null };
  return {
    count: sorted.length,
    sum: sorted.reduce((sum, value) => sum + value, 0),
    p50: sorted[Math.ceil(0.5 * sorted.length) - 1],
    p95: sorted[Math.ceil(0.95 * sorted.length) - 1],
    max: sorted.at(-1),
  };
}

function slotCount(body) {
  const content = body.messages?.[0]?.content;
  if (typeof content !== 'string') return null;
  const offset = content.lastIndexOf(marker);
  if (offset < 0) return null;
  try {
    const slots = JSON.parse(content.slice(offset + marker.length)).target_slots;
    return Array.isArray(slots) ? slots.length : null;
  } catch {
    return null;
  }
}

function tally(values) {
  const counts = {};
  for (const value of values) counts[String(value)] = (counts[String(value)] ?? 0) + 1;
  return counts;
}

export function summarizeDatabase(file) {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const rows = db.prepare('SELECT request_kind, batch_fingerprint, rendered_request, raw_response, outcome, prompt_tokens, completion_tokens, elapsed_ms FROM inference_requests ORDER BY sequence').all();
    const chats = rows.filter(row => row.request_kind === 'chat_completion').map(row => {
      const body = JSON.parse(Buffer.from(row.rendered_request).toString('utf8'));
      let finishReason = null;
      try {
        finishReason = JSON.parse(Buffer.from(row.raw_response).toString('utf8'))
          .choices?.[0]?.finish_reason ?? null;
      } catch { /* Missing or malformed response is counted separately. */ }
      return {
        batch: row.batch_fingerprint,
        outcome: row.outcome,
        prompt: row.prompt_tokens,
        completion: row.completion_tokens,
        elapsed: row.elapsed_ms,
        reserve: body.max_tokens ?? null,
        slots: slotCount(body),
        finishReason,
      };
    });
    const preflights = rows.filter(row => row.request_kind !== 'chat_completion');
    const byOutcome = {};
    for (const outcome of new Set(chats.map(row => row.outcome))) {
      const selected = chats.filter(row => row.outcome === outcome);
      byOutcome[outcome] = {
        chats: selected.length,
        prompt_tokens: statistics(selected.map(row => row.prompt)),
        completion_tokens: statistics(selected.map(row => row.completion)),
        chat_elapsed_ms: statistics(selected.map(row => row.elapsed)),
        finish_reasons: tally(selected.map(row => row.finishReason ?? 'missing')),
      };
    }
    return {
      schema_version: db.prepare('PRAGMA user_version').get().user_version,
      chats: chats.length,
      unique_batches: new Set(chats.map(row => row.batch)).size,
      chats_per_batch: statistics(Object.values(tally(chats.map(row => row.batch)))),
      outcomes: tally(chats.map(row => row.outcome)),
      by_outcome: byOutcome,
      finish_reasons: tally(chats.map(row => row.finishReason ?? 'missing')),
      prompt_tokens: statistics(chats.map(row => row.prompt)),
      completion_tokens: statistics(chats.map(row => row.completion)),
      max_tokens: statistics(chats.map(row => row.reserve)),
      completion_reserve_ratio: statistics(chats.filter(row => row.completion !== null && row.reserve > 0)
        .map(row => row.completion / row.reserve)),
      target_slots: statistics(chats.map(row => row.slots)),
      chat_elapsed_ms: statistics(chats.map(row => row.elapsed)),
      preflight_kinds: tally(preflights.map(row => row.request_kind)),
      preflight_elapsed_ms: statistics(preflights.map(row => row.elapsed_ms)),
      checkpoints: db.prepare('SELECT COUNT(*) AS count FROM block_checkpoints').get().count,
      results: db.prepare('SELECT COUNT(*) AS count FROM results').get().count,
    };
  } finally {
    db.close();
  }
}

export function summarizeTiming(stderr) {
  const records = stderr.split(/\r?\n/u).filter(line => line.startsWith(timingPrefix))
    .map(line => JSON.parse(line.slice(timingPrefix.length)));
  for (const record of records) {
    assert.equal(record.schema_version, 1);
    assert(Number.isSafeInteger(record.elapsed_us) && record.elapsed_us >= 0);
    assert(['ok', 'failed'].includes(record.outcome));
    assert(typeof record.phase === 'string');
    assert.deepEqual(Object.keys(record).sort(), ['elapsed_us', 'outcome', 'phase', 'schema_version']);
  }
  const phases = {};
  for (const phase of new Set(records.map(row => row.phase))) {
    const selected = records.filter(row => row.phase === phase);
    phases[phase] = {
      ...statistics(selected.map(row => row.elapsed_us)),
      failed: selected.filter(row => row.outcome === 'failed').length,
    };
  }
  return { record_count: records.length, phases };
}

async function main() {
  const [operation] = process.argv.slice(2);
  if (operation === '--inventory') {
    const entries = [];
    for (const [id, relative, expected] of inventory) {
      const file = path.join(root, '.cache/eval', relative);
      assert.equal(await sha256(file), expected, `${id} SQLite identity differs`);
      entries.push({ id, sqlite_sha256: expected, summary: summarizeDatabase(file) });
    }
    console.log(JSON.stringify({ schema_version: 1, entries }));
  } else if (operation === '--check') {
    const pointer = path.join(root, '.cache/eval/stage-timing-v1/latest.txt');
    const reportPath = (await fs.readFile(pointer, 'utf8')).trim();
    const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    for (const arm of report.arms) {
      if (!arm.database_path) continue;
      assert.deepEqual(summarizeDatabase(arm.database_path), arm.database_summary);
      assert.deepEqual(summarizeTiming(arm.cli_stderr ?? ''), arm.timing_summary);
      assert.equal(await sha256(arm.database_path), arm.database_sha256);
    }
    console.log(JSON.stringify({ status: 'passed', arms: report.arms.length, report_path: reportPath }));
  } else {
    throw new Error('Use --inventory or --check');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
