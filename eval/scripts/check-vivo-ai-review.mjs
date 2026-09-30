import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const firstDirectory = path.join(root, '.cache/eval/commons-vivo-full-7b-v1/run-zxrN7F');
const secondDirectory = path.join(root, '.cache/eval/commons-vivo-full-7b-resume-v1/run-ndCw9w');
const sampleDirectory = path.join(root,
  '.cache/eval/commons-vivo-review/sample-v2-5ac57770-9a60-4644-af30-88452b050865');
const readPinned = (file, expected) => {
  const bytes = fs.readFileSync(file);
  assert.equal(hash(bytes), expected);
  return bytes;
};
const source = readPinned(path.join(root, '.cache/eval/commons-vivo-979826861/source.zh.srt'),
  '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000');
const target = readPinned(path.join(secondDirectory, 'candidate.ru.srt'),
  '96f9c31d6feb22a4619ecc528f8c17313caea356103e65707f86904a783c31af');
const first = JSON.parse(readPinned(path.join(firstDirectory, 'report.json'),
  'acce4016734648c500a4abeb5ae7619e138d1af46955c50232a39cb450ec59b2'));
const second = JSON.parse(readPinned(path.join(secondDirectory, 'report.json'),
  'fd8c5b52e2cc229a052812cea353d0b8a0f1c555d773f5c7ffc67a9175808ebe'));
const review = JSON.parse(readPinned(path.join(sampleDirectory, 'private-review.json'),
  'd2bb2e0c5be10f98d740c6519720a1492ed6767e2bcb18a2c68989af1352bb92'));
assert.equal(first.status, 'failed');
assert.equal(second.status, 'passed_structural_probe');
assert.deepEqual(review.negation_focus_ids, [30, 157, 327]);
assert.equal(review.selected_ids.length, 62);
const blocks = bytes => bytes.toString('utf8').trimEnd().split(/\r?\n\r?\n/u);
const sourceBlocks = blocks(source);
const targetBlocks = blocks(target);
assert.equal(sourceBlocks.length, 467);
assert.equal(targetBlocks.length, 467);
const firstChats = first.requests.filter(row => row.path === '/v1/chat/completions');
const secondChats = second.requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(firstChats.length, 276);
assert.equal(secondChats.length, 192);
const windows = [
  { start: 57, end: 61, focus: 60,
    source: '3c954158802dbf435f1c9d0e7a2903154f03efbf760701077ff59538bc2e388e',
    target: '1a6e9fc6afc6778c60b660855f304bf4b0360b0a552b9940410d95b0d27f41f2',
    request: '3432a3119fe7424e906b699548d53e556077c4fb9b4fbdf4ba8e7fbddf5c8c63',
    response: 'a055f190eb08f71b764f80f60df3fb79747b0c3b8e25f60836aa64707dafa71a' },
  { start: 275, end: 279, focus: 276,
    source: '7e30a5e0e0f99c9fbdbe491b21b2651b19be24779fba89ff3e401cf54e9b08f1',
    target: '534f724bf6258add39f674b1bc9042afb834c91d9f8ee20f1410c36aab36e30a',
    request: '24b553c5217f75f55232adeb2b646acb3c865cfb834f972731dfba3b3960081d',
    response: 'bbfcd9a342190c0a22704ce5d7b907039f5a339f201be743fb51a2002c96fb3a' },
  { start: 280, end: 282, focus: 280,
    source: '95a680af08d5257dbdbc74d8c7e07eae1c3b68774c621e6dd4496f2bdb6f1de7',
    target: 'a784f432add094deb1d8e298f5eb63dc34cad180296e7800b785d77e65109a21',
    request: 'd49c1497db10660c5aa9dd3fadfe066bfb4b9c110f657f9dfd6a989415e39814',
    response: '69985a06b0b57b4588ec12ee4536a71926784a7ec29d1f9fbc3842217ad45b0d' },
  { start: 326, end: 328, focus: 328,
    source: 'a5c8da97986513062045800f4c94c8f34bb19bd7a1ad74241538c1ec87638c68',
    target: 'b30b4397df3bdbf48ca9d7bd2c14265d0a78c528d02f66b217e2d5705500e3e5',
    request: 'f66225dce8581aa2b692d5a2fc6c3cd8c5e5fed42aaeccca1d5a9ce3291b9455',
    response: '3a26c4c03e7db108889c2def4f0f29f7d0d2719a83ffc9e8a0e58657d204865e' },
  { start: 465, end: 466, focus: 466,
    source: '25f56d869eb3a0388b8a21e760d9cb271d6dceb838d8c06579c42187e0e8b0c6',
    target: '7e3bc926ae20d0ab10dc70ebcb406e7ad71f64376dc2f16d31d909cecae89f8f',
    request: 'f7db980bb58a408f262b7b1812311aeba49cea3fec31eeb0dd4c8bdcd3aa464c',
    response: 'e9e7bc54e249f68f1bb1e317bfac0a70ff8751c15cef7a1bec972ab6c71ece3e',
  },
];
for (const window of windows) {
  assert(review.selected_ids.includes(window.focus));
  assert.equal(hash(Buffer.from(sourceBlocks.slice(window.start - 1, window.end).join('\n\n'))),
    window.source);
  assert.equal(hash(Buffer.from(targetBlocks.slice(window.start - 1, window.end).join('\n\n'))),
    window.target);
  const chat = window.focus <= 275 ? firstChats[window.focus - 1]
    : secondChats[window.focus - 276];
  assert.equal(chat.request_sha256, window.request);
  assert.equal(hash(Buffer.from(chat.raw_response)), window.response);
  assert.equal(JSON.parse(chat.raw_candidate).translations[0].segment_id, window.focus);
}
console.log('Vivo AI review evidence verified: 62/467 source-selected cues; five exact raw/accepted fact windows; human review missing.');
