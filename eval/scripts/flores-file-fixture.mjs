import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function timestamp(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')},${String(milliseconds % 1000).padStart(3, '0')}`;
}

export function buildSrt(rows) {
  return Buffer.from(rows.map((row, index) => {
    assert(row.source && !/[\r\n]/u.test(row.source), 'A transport cue must have exactly one text line');
    const start = index * 6000 + 1000;
    return `${index + 1}\r\n${timestamp(start)} --> ${timestamp(start + 4000)}\r\n${row.source}\r\n\r\n`;
  }).join(''));
}

export async function loadRows(root, sample, corpus) {
  assert.equal(sample.schema_version, 1);
  assert.equal(sample.language, 'zho_Hans', 'The durable CLI currently freezes Chinese runs only');
  assert.equal(sample.reference_language, 'rus_Cyrl');
  assert.equal(sample.subtitle_holdout, false);
  assert.equal(sample.timings, 'synthetic_transport_only');
  const split = corpus.splits.find((entry) => entry.name === sample.split);
  assert(split, 'Unknown corpus split');
  assert(sample.row_ids.length > 1 && sample.row_ids.length <= 32);
  assert.equal(new Set(sample.row_ids).size, sample.row_ids.length);
  const corpusRoot = path.join(root, '.cache/eval/flores200_dataset');
  const readLines = async (key) => {
    const entry = split.files[key];
    assert(entry, 'Unknown corpus file');
    const bytes = await fs.readFile(path.join(corpusRoot, entry.path));
    assert.equal(digest(bytes), entry.sha256, 'Corpus bytes changed after verification');
    return bytes.toString('utf8').trimEnd().split(/\r?\n/u);
  };
  const sources = await readLines(sample.language);
  const references = await readLines(sample.reference_language);
  const metadata = await readLines('metadata');
  return sample.row_ids.map((rowId) => {
    assert(Number.isInteger(rowId) && rowId >= 1 && rowId <= split.expected_rows, 'Invalid row ID');
    const [source_url, domain, topic] = metadata[rowId].split('\t');
    return { row_id: rowId, source: sources[rowId - 1], reference_ru: references[rowId - 1], source_url, domain, topic };
  });
}

export function verifyProtectedBytes(source, output, sourceInspection, outputInspection) {
  const ranges = (inspection) => [...inspection.matchAll(/^protected_bytes=(\d+)\.\.(\d+)$/gmu)].map((match) => [Number(match[1]), Number(match[2])]);
  const sourceRanges = ranges(sourceInspection);
  const outputRanges = ranges(outputInspection);
  assert(sourceRanges.length > 0, 'No protected ranges were inspected');
  assert.equal(outputRanges.length, sourceRanges.length, 'Protected range count changed');
  sourceRanges.forEach(([start, end], index) => {
    const [outputStart, outputEnd] = outputRanges[index];
    assert.deepEqual(output.subarray(outputStart, outputEnd), source.subarray(start, end), `Protected bytes changed at range ${index}`);
  });
  const headers = (inspection) => inspection.split(/\r?\n/u).filter((line) => /^(format=|id=)/u.test(line));
  assert.deepEqual(headers(outputInspection), headers(sourceInspection), 'Cue count, identity, order, or timing changed');
}
