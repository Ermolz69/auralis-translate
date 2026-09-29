import { createHash, randomUUID } from 'node:crypto';
import { link, mkdir, open, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const target = path.join(root, '.cache/eval/commons-cc-commerce-906218083/source.zh.srt');
const url = 'https://commons.wikimedia.org/w/index.php?title=TimedText:Creative_Commons_and_Commerce.ogv.zh.srt&oldid=906218083&action=raw';
const expected = 'df2af6ad32f12b55c3067469228d3b9674b7c35e7d8540acd294dd0f986fe46f';
const maxBytes = 256 * 1024;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function verifyExisting() {
  try {
    const bytes = await readFile(target);
    if (bytes.length > maxBytes || digest(bytes) !== expected) {
      throw new Error('retained Commons candidate differs from the pinned bytes');
    }
    return bytes.length;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

const retained = await verifyExisting();
if (retained !== null) {
  console.log(`Pinned Commons candidate already retained: ${retained} bytes, sha256=${expected}`);
  process.exit(0);
}

const response = await fetch(url, {
  headers: { 'User-Agent': 'AuralisTranslateResearch/0.1 (https://github.com/Ermolz69/auralis-translate)' },
  redirect: 'error',
  signal: AbortSignal.timeout(30_000),
});
if (!response.ok || !response.body) throw new Error(`Commons returned HTTP ${response.status}`);
const declared = Number(response.headers.get('content-length'));
if (Number.isFinite(declared) && declared > maxBytes) throw new Error('Commons candidate exceeds the declared byte budget');
const reader = response.body.getReader();
const chunks = [];
let count = 0;
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  count += value.length;
  if (count > maxBytes) {
    await reader.cancel();
    throw new Error('Commons candidate exceeded the declared byte budget');
  }
  chunks.push(value);
}
const bytes = Buffer.concat(chunks, count);
if (digest(bytes) !== expected) throw new Error('Commons revision bytes differ from the pinned SHA-256');
await mkdir(path.dirname(target), { recursive: true });
const temporary = `${target}.${randomUUID()}.partial`;
const handle = await open(temporary, 'wx');
try {
  await handle.writeFile(bytes);
  await handle.sync();
} finally {
  await handle.close();
}
try {
  await link(temporary, target);
} catch (error) {
  if (error.code !== 'EEXIST' || await verifyExisting() === null) throw error;
} finally {
  await unlink(temporary);
}
console.log(`Pinned Commons candidate retained: ${bytes.length} bytes, sha256=${expected}`);
