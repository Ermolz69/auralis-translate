import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractCliRunId } from '../cli-run-id.mjs';

const id = 'ef5f83be-05ab-4410-90ff-ddeb0c4a9c89';

test('retains a durable run identifier when the CLI fails after saved progress', () => {
  assert.equal(extractCliRunId('', `run_id=${id}\nSRT target line violates supported text grammar`), id);
});

test('retains a successful CLI run identifier', () => {
  assert.equal(extractCliRunId(`run_id=${id}\ncompleted_blocks=263`, ''), id);
});

test('ignores unrelated UUIDs and incomplete identifiers', () => {
  assert.equal(extractCliRunId('translation_id=ef5f83be-05ab-4410-90ff-ddeb0c4a9c89',
    'run_id=ef5f83be-05ab'), null);
});
