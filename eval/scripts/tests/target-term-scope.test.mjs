import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { checkBudget, decodeCandidate, resumeIdentity, scopedRequest, scopeTerms,
  sha256 } from '../target-term-scope.mjs';

const policyBytes = await fs.readFile(new URL('../../profiles/reg-061-target-terms-v1.json', import.meta.url));
const policy = JSON.parse(policyBytes);
const make = (source, context = '多核测试。鼠标垫。', id = 17) => ({
  model: 'frozen-v8', max_tokens: 256, messages: [{ role: 'user', content:
    'Unchanged v8 instruction. Input JSON:\n' + JSON.stringify({ schema_version: 7,
      target_slots: [{segment_id:id,line_index:0,source_original:source,
        source_for_translation:source,approved_terms:[],protected_facts:[]}],
      source_context:[{source_original:context}] }) }] });

test('absent terms and misleading neighbors preserve every request byte', () => {
  for (const source of ['这是一套多处理器系统。','我们也卖鼠标支架。','多线程测试得分两分。',
    '这颗芯片有八个核心，但设备只有一个处理器。','这台工作站装了两颗处理器，每颗各有八个核心。']) {
    const baseline = make(source);
    const result = scopedRequest(baseline, policy);
    assert.equal(Buffer.compare(Buffer.from(JSON.stringify(baseline)), Buffer.from(JSON.stringify(result.request))), 0);
    assert(result.baseline_identical);
  }
});

test('positive terms are independent of IDs, timing and neighboring terms', () => {
  for (const id of [1, 23, 268, 999]) {
    const result = scopedRequest(make('我们也卖鼠标垫。','多核测试。',id),policy);
    const content = result.request.messages[0].content;
    assert(content.includes('鼠标垫 = коврик для мыши'));
    assert(!content.includes('多核 = многоядерный'));
    const envelope = JSON.parse(content.split('Input JSON:\n')[1]);
    assert.deepEqual(envelope, JSON.parse(make('我们也卖鼠标垫。','多核测试。',id).messages[0].content.split('Input JSON:\n')[1]));
    assert.deepEqual(envelope.target_slots[0].approved_terms,[]);
  }
});

test('negation, quoted mentions and uncertain uses are explicit needs_review with v8 bytes', () => {
  for (const source of ['包装里只有鼠标支架，没有鼠标垫。','鼠标支架缺货了，但别把它叫作鼠标垫。',
    '不要把鼠标支架称为鼠标垫。','这里只报告多线程成绩，没有多核成绩。',
    '这不是多核测试。','这个多核怎么解释？','“鼠标垫”是什么意思？','并非没有鼠标垫。']) {
    const result = scopedRequest(make(source),policy);
    assert.equal(result.review_state,'needs_review');
    assert.equal(JSON.stringify(result.request),JSON.stringify(make(source)));
  }
});

test('contrasts keep their exact Chinese referents, numbers and negations', () => {
  for (const source of ['鼠标垫比鼠标支架便宜二十元。','鼠标垫缺货，鼠标支架仍有现货。',
    '盒子里有鼠标垫，没有鼠标支架。','多核测试和多线程测试不是同一项，前者高了两分。']) {
    const baseline = make(source);
    const result = scopedRequest(baseline,policy);
    const payload = result.request.messages[0].content.split('Input JSON:\n')[1];
    assert.equal(payload,baseline.messages[0].content.split('Input JSON:\n')[1]);
    assert.equal(scopeTerms(source,policy).some(row => row.usage === 'contrast' || row.outcome === 'needs_review'),true);
  }
});

test('resume identity is repeatable and changes with policy, code, context, model, runtime and source', () => {
  const request = scopedRequest(make('多核测试得分一万分。'),policy).request;
  const identities = Object.fromEntries(['source_sha256','model_sha256','runtime_sha256',
    'manifest_sha256','policy_sha256','implementation_sha256'].map(field => [field,sha256(field)]));
  identities.policy_sha256 = sha256(policyBytes);
  const first = resumeIdentity(request,identities);
  assert.equal(resumeIdentity(JSON.parse(JSON.stringify(request)),{...identities}),first);
  for (const field of Object.keys(identities)) {
    assert.notEqual(resumeIdentity(request,{...identities,[field]:sha256('changed')}),first);
  }
  assert.notEqual(resumeIdentity(scopedRequest(make('多核测试得分一万分。','新场景。'),policy).request,identities),first);
});

test('the full rendered budget reserves completion and safety without truncating targets', () => {
  checkBudget(1728,policy.limits);
  assert.throws(() => checkBudget(1729,policy.limits));
  for (const invalid of [-1,1.5,NaN,Infinity]) assert.throws(() => checkBudget(invalid,policy.limits));
});

test('malformed responses remain raw observations and never become checkpoint candidates', () => {
  const raw = text => ({http_status:200,raw_response:JSON.stringify({choices:[{
    finish_reason:'stop',message:{content:text}}]})});
  const slot = {segment_id:17,line_index:0};
  const good = text => JSON.stringify({translations:[{...slot,text}]});
  const errors = [raw('{'),raw(good('wrong"}]}')),raw(good('')),
    raw(JSON.stringify({translations:[{segment_id:18,line_index:0,text:'Ответ.'}]})),
    raw(JSON.stringify({translations:[{...slot,text:'Ответ.',extra:true}]}))];
  for (const observation of errors) {
    const original = observation.raw_response;
    assert.throws(() => decodeCandidate(observation,slot));
    assert.equal(observation.raw_response,original);
  }
  assert.equal(decodeCandidate(raw(good('Оценка — десять тысяч.')),slot),'Оценка — десять тысяч.');
});
