import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveChineseSrt } from './mandarin-triline-srt.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const parent = path.join(root, '.cache/eval/youtube-mingfay');
const sourcePath = path.join(parent, 'caption-Vb3TuT/source.zh.srt');
const expectedSourceSha256 = 'a875c0a84ab0c3a9b44a1b5a2be0c6f3d5b885ed82d241d386057c0dbd5ab436';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceBytes = await fs.readFile(sourcePath);
assert.equal(sha256(sourceBytes), expectedSourceSha256, 'raw source changed');
const { srt, mapping } = deriveChineseSrt(sourceBytes.toString('utf8'));
assert.equal(mapping.length, 230, 'unexpected source cue count');
assert.equal(mapping.at(-1).end_ms, 826_566, 'unexpected final source media timing');
const bytes = Buffer.from(srt, 'utf8');
const workspace = await fs.mkdtemp(path.join(parent, 'derived-'));
const result = { experiment: 'DATA-03-youtube-mingfay-chinese-derivative-2026-09-29-v1',
  raw_source_sha256: expectedSourceSha256, derived_sha256: sha256(bytes),
  derived_bytes: bytes.length, cue_count: mapping.length,
  reordered_cues: mapping.filter(cue => cue.derived_label !== cue.original_index).length,
  last_raw_cue: mapping.find(cue => cue.original_label === 230),
  purpose: 'private development candidate; source admission and speech alignment unresolved',
  mapping };
await fs.writeFile(path.join(workspace, 'source.zh.srt'), bytes);
await fs.writeFile(path.join(workspace, 'derivation.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(`Chinese-only derivative retained: ${workspace}`);
console.log(JSON.stringify({ raw_source_sha256: result.raw_source_sha256,
  derived_sha256: result.derived_sha256, derived_bytes: result.derived_bytes,
  cue_count: result.cue_count, reordered_cues: result.reordered_cues,
  last_raw_cue: result.last_raw_cue, purpose: result.purpose }, null, 2));
