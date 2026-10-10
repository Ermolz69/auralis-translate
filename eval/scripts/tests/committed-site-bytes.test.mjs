import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { assertSiteMatchesHead, committedSiteBytes } from '../committed-site-bytes.mjs';

const root = resolve('.');

for (const name of ['index.html', 'history.html']) {
  test(`${name} uses committed bytes even with a CRLF checkout`, () => {
    const committed = committedSiteBytes(root, name);
    const expected = execFileSync('git', ['show', `HEAD:site/${name}`], {
      cwd: root, maxBuffer: 3 * 1024 * 1024,
    });
    assert(committed.equals(expected));
    const local = readFileSync(resolve(root, 'site', name));
    const withCrlf = Buffer.from(committed.toString('utf8').replace(/\r?\n/gu, '\r\n'));
    assert(!withCrlf.equals(committed));
    assert(committed.equals(committedSiteBytes(root, name)));
    assert(local.length > 0);
  });
}

test('only the two published page paths are readable', () => {
  assert.throws(() => committedSiteBytes(root, '../AGENTS.md'), /Unsupported site page/u);
});

test('generated pages have no staged or unstaged content changes', () => {
  assert.doesNotThrow(() => assertSiteMatchesHead(root));
});
