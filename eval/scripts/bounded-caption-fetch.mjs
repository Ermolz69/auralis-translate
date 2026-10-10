import assert from 'node:assert/strict';

export async function captureBoundedCaption(url, budget, fetchResponse = fetch) {
  const response = await fetchResponse(url, { redirect: 'manual',
    signal: AbortSignal.timeout(budget.timeout_ms) });
  const reader = response.body?.getReader();
  assert(reader, 'Caption response has no body');
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > budget.response_bytes) {
      await reader.cancel();
      throw new Error('Caption response exceeded the byte budget');
    }
    chunks.push(value);
  }
  return { status: response.status,
    content_type: response.headers.get('content-type'),
    bytes: Buffer.concat(chunks, received) };
}
