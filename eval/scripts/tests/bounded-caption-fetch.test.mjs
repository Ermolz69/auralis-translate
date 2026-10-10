import assert from 'node:assert/strict';
import test from 'node:test';
import { captureBoundedCaption } from '../bounded-caption-fetch.mjs';

const budget = { timeout_ms: 1000, response_bytes: 8 };

test('bounded caption response returns normally after a complete body', async () => {
  let options;
  const result = await captureBoundedCaption(new URL('https://example.test/caption'),
    budget, async (_url, request) => {
      options = request;
      return new Response('字幕', { status: 200,
        headers: { 'content-type': 'text/plain; charset=UTF-8' } });
    });
  assert.equal(options.redirect, 'manual');
  assert.equal(result.status, 200);
  assert.equal(result.bytes.toString('utf8'), '字幕');
});

test('redirect response is observable without following it', async () => {
  const result = await captureBoundedCaption(new URL('https://example.test/caption'),
    budget, async (_url, options) => {
      assert.equal(options.redirect, 'manual');
      return new Response('go', { status: 302, headers: { location: '/elsewhere' } });
    });
  assert.equal(result.status, 302);
  assert.equal(result.bytes.toString('utf8'), 'go');
});

test('oversize body fails before it can be retained as an accepted caption', async () => {
  await assert.rejects(captureBoundedCaption(new URL('https://example.test/caption'),
    budget, async () => new Response('more than eight bytes', { status: 200 })),
  /exceeded the byte budget/);
});
