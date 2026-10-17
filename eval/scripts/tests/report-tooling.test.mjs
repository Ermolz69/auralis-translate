import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadYoutubeSourceEvidence } from '../youtube-source-report.mjs';
import { verifyCurrentReport } from '../verify-current-report.mjs';
import { verifyHistoricalReport } from '../verify-historical-report.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('missing current evidence cannot become a report success', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'auralis-report-'));
  try {
    await assert.rejects(loadYoutubeSourceEvidence(fixtureRoot), { code: 'ENOENT' });
  } finally {
    await fs.rm(fixtureRoot, { recursive: true, force: true });
  }
});

test('invalid current evidence fails its pinned hash', async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'auralis-report-'));
  try {
    const reportPath = path.join(fixtureRoot,
      'eval/reports/youtube-geekerwan-vivo-caption-v1.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, '{}');
    await assert.rejects(loadYoutubeSourceEvidence(fixtureRoot),
      /Expected values to be strictly equal/);
  } finally {
    await fs.rm(fixtureRoot, { recursive: true, force: true });
  }
});

test('current verifier rejects raw model markup in embedded data', async () => {
  const [current, history] = await Promise.all([
    fs.readFile(path.join(root, 'site/index.html'), 'utf8'),
    fs.readFile(path.join(root, 'site/history.html'), 'utf8'),
  ]);
  const unsafe = current.replace('"model":"1b"',
    '"model":"<img src=x onerror=alert(1)>"');
  assert.notEqual(unsafe, current);
  await assert.rejects(verifyCurrentReport(root, unsafe, history),
    /Current report JSON must escape source and model markup/);
});

test('historical verifier rejects raw source markup in embedded data', async () => {
  const history = await fs.readFile(path.join(root, 'site/history.html'), 'utf8');
  const match = history.match(/<script id="report-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert(match);
  const unsafeData = match[1].replace('"source":"',
    '"source":"<svg onload=alert(1)>');
  assert.notEqual(unsafeData, match[1]);
  await assert.rejects(verifyHistoricalReport(root, history.replace(match[1], unsafeData)),
    /Historical report JSON must escape source and model markup/);
});
