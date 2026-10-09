import assert from 'node:assert/strict';
import { sourceRelations } from './source-relation-review-v1.mjs';
import { sourceRelationWarningsV2 } from './source-relation-review-v2.mjs';

function timestampMs(value) {
  const match = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/u.exec(value);
  assert(match, 'Invalid SRT timestamp');
  return (((Number(match[1]) * 60 + Number(match[2])) * 60 +
    Number(match[3])) * 1000 + Number(match[4]));
}

export function parsePinnedSrt(bytes) {
  const raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    .replace(/^\uFEFF/u, '').trimEnd();
  assert(raw, 'Empty SRT');
  return raw.split(/\r?\n\r?\n/u).map((block, index) => {
    const lines = block.split(/\r?\n/u);
    assert.equal(lines[0], String(index + 1), 'SRT cue identity changed');
    const timing = /^(\S+) --> (\S+)$/u.exec(lines[1] ?? '');
    assert(timing && lines.length >= 3 && lines.slice(2).every(Boolean),
      'Invalid SRT cue');
    const startMs = timestampMs(timing[1]);
    const endMs = timestampMs(timing[2]);
    assert(endMs > startMs, 'Invalid SRT duration');
    return { id: index + 1, startMs, endMs, timing: lines[1],
      text: lines.slice(2).join('\n') };
  });
}

export function screenSourceAndDrafts(source, drafts) {
  assert(source.length > 0 && drafts.length > 0);
  const recognized = [];
  const warningsByDraft = Object.fromEntries(drafts.map(draft => {
    assert.equal(draft.cues.length, source.length, 'Draft cue count differs');
    return [draft.id, []];
  }));
  assert.equal(Object.keys(warningsByDraft).length, drafts.length,
    'Duplicate draft identity');
  for (let i = 0; i < source.length; i += 1) {
    const previous = source[i - 1] ?? null;
    const next = source[i + 1] ?? null;
    const relations = sourceRelations(source[i], previous, next);
    for (const kind of relations) recognized.push({ cue_id: source[i].id, kind });
    for (const draft of drafts) {
      const target = draft.cues[i];
      assert.equal(target.id, source[i].id, 'Draft cue identity differs');
      assert.equal(target.timing, source[i].timing, 'Draft timing differs');
      const warnings = sourceRelationWarningsV2(source[i], previous, next,
        target.text);
      assert(warnings.every(row => relations.includes(row.kind)));
      warningsByDraft[draft.id].push(...warnings);
    }
  }
  return { source_cues: source.length, recognized_relations: recognized,
    drafts: drafts.map(draft => ({ id: draft.id,
      warning_count: warningsByDraft[draft.id].length,
      warnings: warningsByDraft[draft.id],
      warning_precision: null,
      warning_precision_reason: recognized.length === 0
        ? 'no_source_relations_recognized' : 'no_independent_source_review' })) };
}
