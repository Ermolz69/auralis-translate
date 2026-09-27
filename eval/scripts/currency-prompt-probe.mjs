import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { startProcess, stopProcess, freeLoopbackPort, waitForHealthyServer } from './local-process.mjs';

const root = process.cwd();
const dataset = JSON.parse(await fs.readFile('eval/corpora/currency-controls-v1.json', 'utf8'));
const profile = JSON.parse(await fs.readFile('models/manifests/hy_mt2_1_8b_q4_k_m.fidelity.experimental.json', 'utf8'));
assert(process.env.AURALIS_TEST_LLAMA_SERVER && process.env.AURALIS_TEST_GGUF);
const port = await freeLoopbackPort();
const url = `http://127.0.0.1:${port}/`;
const server = startProcess(process.env.AURALIS_TEST_LLAMA_SERVER, ['--model', process.env.AURALIS_TEST_GGUF, '--alias', profile.model_alias, '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99', '--cache-ram', '0', '--parallel', '1', '--jinja'], root);
const prompts = [
  source => `Reference the following translations:\n人民币 translates to юань\n块钱 translates to юань\n元 translates to юань\n毛钱 translates to цзяо\n角 translates to цзяо\n分（货币） translates to фэнь\nTranslate the following Chinese text into Russian. Preserve named foreign currencies and physical pieces. For Chinese prices, 块 means yuan, 毛 and 角 mean one tenth of a yuan, 分 means one hundredth. Express fractional amounts as a decimal in yuan. Only output the translated result without explanation:\n${source}`,
  source => `将以下中文文本翻译成俄语，只输出译文。\n金额中的元、块、块钱在俄语中译为「юань」，不是其他币种；毛、角是0.1 юаня，分是0.01 юаня。用小数表示金额。保留明确写出的外币。物品数量中的块不是钱。\n${source}`,
];
const report = { purpose: 'Exploratory direct HTTP terminology prompts; not durable file acceptance', started_at: new Date().toISOString(), rows: [] };
try {
  await waitForHealthyServer(url, server, 180_000);
  for (let variant = 0; variant < prompts.length; variant++) {
    for (const row of dataset.examples) {
      const prompt = prompts[variant](row.source);
      const started = performance.now();
      const response = await fetch(new URL('v1/chat/completions', url), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: profile.model_alias, messages: [{ role: 'user', content: prompt }], temperature: profile.temperature, top_p: profile.top_p, top_k: profile.top_k, repeat_penalty: profile.repeat_penalty, max_tokens: profile.max_tokens_per_line, stream: false }) });
      const body = await response.json();
      assert.equal(response.status, 200);
      report.rows.push({ variant, id: row.id, source: row.source, prompt, candidate: body.choices[0].message.content, elapsed_ms: performance.now() - started, usage: body.usage });
      console.log(variant, row.id, body.choices[0].message.content);
    }
  }
} finally {
  await stopProcess(server);
  const directory = await fs.mkdtemp(path.join(root, '.cache/eval/public-demo/prompt-probe-'));
  await fs.writeFile(path.join(directory, 'probe.json'), JSON.stringify(report, null, 2));
  console.log(directory);
}
