import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyCurrentReport } from './verify-current-report.mjs';
import { verifyHistoricalReport } from './verify-historical-report.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const html = await fs.readFile(path.join(root, 'site/history.html'), 'utf8');
const current = await fs.readFile(path.join(root, 'site/index.html'), 'utf8');
assert.deepEqual(await fs.readdir(path.join(root, 'site')), ['history.html', 'index.html'],
  'Only the current and historical reports are public');
assert(html.includes('href="./index.html"'), 'History must link back to current state');
assert(html.includes('id="voa-caption-screen"'));
assert(html.includes('id="v7-batch-screen"'));
assert(html.includes('2026-10-02-voa-mandarin-caption-inventory-result.md'));
await verifyCurrentReport(root, current, html);
await verifyHistoricalReport(root, html);
console.log('Public HTML verified: focused current state, full historical measurements, reciprocal links, evidence identity and two-file publication boundary.');
