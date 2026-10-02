import assert from 'node:assert/strict';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, '.cache/eval/paywall-volunteer-review-v1');
const latest = path.join(directory, 'latest.txt');
const create = process.argv[2] === '--create';
assert.equal(process.argv.length, create ? 3 : 2, 'Use no arguments or --create');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const jsonBytes = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const sourceSha256 = '3406fcd365446d727f31c4ecf576de6c3b5e168658c3f5d276fea8142ddb5a4b';
const pinned = {
  '1b': { run: 'run-0uz6uR', sha256: '4be2d6f641338e5690ad4a3c8cf9ab2e3f908ec61ecfbbde2a90def3981af3eb' },
  '7b': { run: 'run-y7vfu5', sha256: 'bf68b06e7c69eb68e677f2c6ba447e01cde04e4dd1527155a4a366131e68b0fa' },
};
const windows = [['amount', 15, 18], ['peer-review', 465, 468],
  ['closing', 861, 864]];

async function originals() {
  const sourceBytes = await fs.readFile(path.join(root,
    '.cache/eval/paywall-chinese-caption/source.zh.srt'));
  assert.equal(sha256(sourceBytes), sourceSha256);
  const blocks = sourceBytes.toString('utf8').trimEnd().split(/\n\n+/u);
  assert.equal(blocks.length, 880);
  const cues = new Map(blocks.map(block => {
    const [id, timing, ...text] = block.split('\n');
    return [Number(id), { cue_id: Number(id), timing, source_text: text.join('\n') }];
  }));
  assert.equal(cues.size, 880);
  const accepted = {};
  for (const variant of ['1b', '7b']) {
    const pin = pinned[variant];
    const reportBytes = await fs.readFile(path.join(root,
      `.cache/eval/paywall-review-seed-${variant}-v1/${pin.run}/report.json`));
    assert.equal(sha256(reportBytes), pin.sha256);
    const report = JSON.parse(reportBytes);
    assert.equal(report.status, 'passed_structural_probe');
    assert.equal(report.source_sha256, sourceSha256);
    accepted[variant] = new Map(report.cases.flatMap(row =>
      row.original_cue_ids.map((id, index) =>
        [id, row.arms[0].accepted_lines[index]])));
    assert.equal(accepted[variant].size, 12);
  }
  return { cues, accepted };
}

function counterbalancedOrder() {
  const choices = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

function buildPacket({ cues, accepted }, order) {
  const rows = [];
  const mapping = [];
  let index = 0;
  for (const [windowId, first, last] of windows) {
    for (let id = first; id <= last; id++) {
      const source = cues.get(id);
      assert(source && accepted['1b'].has(id) && accepted['7b'].has(id));
      const firstVariant = order[index++] === 0 ? '1b' : '7b';
      const secondVariant = firstVariant === '1b' ? '7b' : '1b';
      const candidates = { A: accepted[firstVariant].get(id),
        B: accepted[secondVariant].get(id) };
      rows.push({ window_id: windowId, ...source,
        adjacent_chinese_cues: [id - 1, id + 1]
          .filter(neighbor => neighbor >= first && neighbor <= last)
          .map(neighbor => ({ cue_id: neighbor,
            source_text: cues.get(neighbor).source_text })),
        candidates });
      mapping.push({ cue_id: id, window_id: windowId,
        A: { model: firstVariant, text_sha256: sha256(Buffer.from(candidates.A)) },
        B: { model: secondVariant, text_sha256: sha256(Buffer.from(candidates.B)) } });
    }
  }
  assert.equal(rows.length, 12);
  assert.equal(mapping.filter(row => row.A.model === '1b').length, 6);
  const packet = { schema_version: 1,
    id: 'paywall-volunteer-development-packet-v1',
    source_id: 'paywall-chinese-4b4ffc0c', source_sha256: sourceSha256,
    split: 'inspected_development_only', source_admission: 'unassigned_unreviewed',
    subtitle_license: 'CC BY 4.0',
    attribution: 'Traditional Chinese subtitles: Sau-Chin Chen; film: Jason Schmitt. Candidate Russian translations are modified derivatives for private review.',
    scope: 'Written Chinese to Russian adequacy only; the film speech is English, and no audio is supplied.',
    scene_boundaries: 'unverified; adjacent text is context, not a certified scene',
    trial_cue_ids: [15, 16, 17, 18],
    instructions: [
      'Read the Chinese source and adjacent Chinese context before either Russian candidate.',
      'Score A and B independently from 1 to 5 for preserved meaning; cite Chinese words for any factual error.',
      'Check names, amounts, negation, actors and continuity; mark uncertain if the written source lacks context.',
      'Do not infer candidate quality from label order. The model identities are sealed separately.',
      'Use the separate blank form only after agreeing to the invitation terms; this packet has no human judgments.',
    ],
    human_review_count: 0, rows };
  const sealed = { schema_version: 1, packet_id: packet.id,
    source_sha256: sourceSha256, input_report_sha256: pinned,
    assignment: mapping };
  const form = { schema_version: 1, packet_id: packet.id,
    packet_sha256: sha256(jsonBytes(packet)), reviewer_id: null,
    consent_record_id: null, reviewer_languages_self_report: null,
    review_utc: null, judgments: rows.flatMap(row => ['A', 'B'].map(label => ({
      cue_id: row.cue_id, candidate: label, adequacy_1_to_5: null,
      severity: null, categories: [], source_span: null,
      rationale: null, suggested_correction: null, uncertain: null,
    }))) };
  return { packet, sealed, form };
}

async function verify(runPath, evidence) {
  const { cues, accepted } = await originals();
  const bytes = {};
  for (const name of ['packet', 'mapping', 'blank-form']) {
    bytes[name] = await fs.readFile(path.join(runPath, `${name}.json`));
    assert.equal(sha256(bytes[name]), evidence[`${name}_sha256`]);
  }
  const packet = JSON.parse(bytes.packet);
  const mapping = JSON.parse(bytes.mapping);
  const form = JSON.parse(bytes['blank-form']);
  assert.equal(packet.id, 'paywall-volunteer-development-packet-v1');
  assert.equal(packet.source_sha256, sourceSha256);
  assert.equal(packet.human_review_count, 0);
  assert.equal(packet.rows.length, 12);
  assert.equal(mapping.assignment.length, 12);
  assert.deepEqual(mapping.input_report_sha256, pinned);
  assert.equal(mapping.source_sha256, sourceSha256);
  assert.equal(form.packet_sha256, sha256(bytes.packet));
  assert.equal(form.judgments.length, 24);
  assert.deepEqual(form.judgments.map(item =>
    [item.cue_id, item.candidate]),
  packet.rows.flatMap(row => ['A', 'B'].map(label =>
    [row.cue_id, label])));
  assert.equal(form.reviewer_id, null);
  assert.equal(form.consent_record_id, null);
  assert(form.judgments.every(item => item.adequacy_1_to_5 === null
    && item.severity === null && item.categories.length === 0
    && item.source_span === null && item.rationale === null
    && item.suggested_correction === null && item.uncertain === null));
  assert(!/Hy-MT2|1\.8B|7B|model_variant|profile_sha256/u.test(bytes.packet.toString('utf8')));
  const expectedIds = windows.flatMap(([, first, last]) =>
    Array.from({ length: last - first + 1 }, (_, index) => first + index));
  assert.deepEqual(packet.rows.map(row => row.cue_id), expectedIds);
  assert.deepEqual(mapping.assignment.map(row => row.cue_id), expectedIds);
  assert.equal(mapping.assignment.filter(row => row.A.model === '1b').length, 6);
  for (const [index, row] of packet.rows.entries()) {
    assert.deepEqual({ cue_id: row.cue_id, timing: row.timing,
      source_text: row.source_text }, cues.get(row.cue_id));
    const [, first, last] = windows.find(([id]) => id === row.window_id);
    assert.deepEqual(row.adjacent_chinese_cues,
      [row.cue_id - 1, row.cue_id + 1]
        .filter(neighbor => neighbor >= first && neighbor <= last)
        .map(neighbor => ({ cue_id: neighbor,
          source_text: cues.get(neighbor).source_text })));
    const assignment = mapping.assignment[index];
    assert.deepEqual([assignment.A.model, assignment.B.model].sort(), ['1b', '7b']);
    for (const label of ['A', 'B']) {
      const variant = assignment[label].model;
      assert.equal(row.candidates[label], accepted[variant].get(row.cue_id));
      assert.equal(sha256(Buffer.from(row.candidates[label])),
        assignment[label].text_sha256);
    }
  }
  return { packet_sha256: sha256(bytes.packet),
    mapping_sha256: sha256(bytes.mapping),
    blank_form_sha256: sha256(bytes['blank-form']), cues: 12,
    scored_candidates: 0 };
}

if (create) {
  await fs.mkdir(directory, { recursive: true });
  try {
    await fs.access(latest);
    throw new Error('A packet already exists; immutable evidence must not be replaced');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const runName = `packet-${randomUUID()}`;
  const runPath = path.join(directory, runName);
  await fs.mkdir(runPath);
  const built = buildPacket(await originals(), counterbalancedOrder());
  const files = { packet: built.packet, mapping: built.sealed,
    'blank-form': built.form };
  const evidence = { schema_version: 1, packet_id: built.packet.id,
    source_sha256: sourceSha256,
    created_utc: new Date().toISOString(), human_review_count: 0 };
  for (const [name, value] of Object.entries(files)) {
    const bytes = jsonBytes(value);
    await fs.writeFile(path.join(runPath, `${name}.json`), bytes, { flag: 'wx' });
    evidence[`${name}_sha256`] = sha256(bytes);
  }
  await fs.writeFile(path.join(runPath, 'receipt.json'), jsonBytes(evidence),
    { flag: 'wx' });
  await verify(runPath, evidence);
  await fs.writeFile(latest, `${runName}\n`, { flag: 'wx' });
}
const runName = (await fs.readFile(latest, 'utf8')).trim();
assert(/^packet-[0-9a-f-]{36}$/u.test(runName));
const runPath = path.join(directory, runName);
const evidence = JSON.parse(await fs.readFile(path.join(runPath, 'receipt.json')));
const checked = await verify(runPath, evidence);
console.log(JSON.stringify({ path: runPath, receipt_sha256: sha256(await fs.readFile(
  path.join(runPath, 'receipt.json'))), ...checked, human_review_count: 0 }));
