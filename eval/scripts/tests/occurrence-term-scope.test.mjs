import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { occurrenceRequest, scopedOccurrences } from '../occurrence-term-scope.mjs';

const policy = JSON.parse(await fs.readFile(new URL(
  '../../profiles/reg-062-occurrence-terms-v1.json', import.meta.url)));
const reg061 = JSON.parse(await fs.readFile(new URL(
  '../../regressions/reg-061-term-hint-contamination-v1.json', import.meta.url)));
const reg062 = JSON.parse(await fs.readFile(new URL(
  '../../regressions/reg-062-contrast-referent-contamination-v1.json', import.meta.url)));
const reg058 = JSON.parse(await fs.readFile(new URL(
  '../../regressions/reg-058-provisional-terms-controls-v1.json', import.meta.url)));

const make = (source, { id = 267, context = [{source_original:'鼠标垫。多核测试。'}],
  speaker = '甲', start_ms = 0 } = {}) => ({
  model:'unchanged-v8',max_tokens:256,messages:[{role:'user',content:
    'Unchanged v8 instruction. Input JSON:\n' + JSON.stringify({schema_version:7,
      target_slots:[{segment_id:id,line_index:0,start_ms,end_ms:start_ms+1000,
        speaker,source_original:source,source_for_translation:source,
        approved_terms:[],protected_facts:[]}],source_context:context})}] });
const input = request => JSON.parse(request.messages[0].content.split('Input JSON:\n')[1]);
const matched = (source, term) => scopedOccurrences(source,policy)
  .find(item => item.source===term);

test('REG-062 reproducer binds the pad span and protects the contrasting stand span', () => {
  const source = reg062.minimal_reproducers[0].source;
  const result = occurrenceRequest(make(source),policy);
  const pad = result.decisions[0].terms.find(item => item.source==='鼠标垫');
  assert.deepEqual(pad.occurrences,[{start:0,end:3,source:'鼠标垫'}]);
  assert.deepEqual(pad.distinct_referents,[{start:6,end:10,source:'鼠标支架',
    sense:'mouse stand, a separate accessory'}]);
  const note = result.request.messages[0].content.split('Input JSON:\n')[0];
  assert.match(note,/\[0,3\) "鼠标垫"/u);
  assert.match(note,/\[6,10\) "鼠标支架"/u);
  assert.match(note,/Never transfer this term to another source noun/u);
  assert(!note.includes(reg062.minimal_reproducers[0].expected_fact));
  assert.deepEqual(input(result.request),input(make(source)));
});

test('REG-062 three previously unrun controls keep correct exact occurrences', () => {
  for (const control of [...reg062.related_controls,...reg062.negative_controls]) {
    const baseline = make(control.source);
    const result = occurrenceRequest(baseline,policy);
    assert.deepEqual(input(result.request),input(baseline));
    assert(!result.request.messages[0].content.includes(control.expected_meaning));
    if (control.id==='stand_only_available') {
      assert.equal(JSON.stringify(result.request),JSON.stringify(baseline));
      assert(result.baseline_identical);
    } else {
      const pad = result.decisions[0].terms.find(item=>item.source==='鼠标垫');
      assert.equal(pad.occurrences.length,1);
      assert.equal(pad.distinct_referents.length,1);
      assert.match(result.request.messages[0].content,/Separate unhinted referent/u);
    }
  }
});

test('REG-061 positives activate independently; negatives and negated mentions keep v8 bytes', () => {
  for (const source of ['多核测试得分达到一万分。','我们也卖鼠标垫。',
    ...reg061.negative_controls.map(row=>row.source)]) {
    const result = occurrenceRequest(make(source),policy);
    assert.equal(result.baseline_identical,false,source);
  }
  for (const source of [
    ...reg061.minimal_reproducers.map(row=>row.source),
    reg061.related_controls[0].source,reg061.related_controls[1].source,
    '这里只报告多线程成绩，没有多核成绩。',
    '不要把鼠标支架称为鼠标垫。']) {
    const baseline = make(source);
    const result = occurrenceRequest(baseline,policy);
    assert.equal(JSON.stringify(result.request),JSON.stringify(baseline),source);
  }
});

test('reversed availability, price and buying contrasts retain separate source spans', () => {
  for (const source of [
    '鼠标支架缺货，鼠标垫仍有现货。',
    '鼠标支架仍有现货，鼠标垫缺货。',
    '鼠标垫比鼠标支架便宜二十元。',
    '我买了鼠标垫，但没有买鼠标支架。']) {
    const result = occurrenceRequest(make(source),policy);
    const pad = result.decisions[0].terms.find(item=>item.source==='鼠标垫');
    assert.equal(pad.outcome,'eligible',source);
    assert.equal(pad.occurrences.length,1);
    assert.equal(pad.distinct_referents.length,1);
    assert.notDeepEqual(pad.occurrences[0],pad.distinct_referents[0]);
    assert.deepEqual(input(result.request).target_slots[0].source_original,source);
  }
});

test('context, distinct speakers, cue IDs and seam positions never activate or redirect a term', () => {
  for (const id of [1,267,268,999]) for (const speaker of ['甲','乙']) {
    const options = {id,speaker,start_ms:id*1000,
      context:[{segment_id:id-1,speaker:'乙',source_original:'鼠标垫缺货。'},
        {segment_id:id+1,speaker:'甲',source_original:'多核测试。'}]};
    const noTarget = make('鼠标支架仍有现货。',options);
    assert.equal(JSON.stringify(occurrenceRequest(noTarget,policy).request),JSON.stringify(noTarget));
    const yesTarget = make('鼠标垫缺货，鼠标支架仍有现货。',options);
    const result = occurrenceRequest(yesTarget,policy);
    assert.match(result.request.messages[0].content,new RegExp(`Target ${id}/0:`,'u'));
    assert.equal(result.decisions.length,1);
    assert.deepEqual(input(result.request),input(yesTarget));
  }
});

test('two different speakers in one batch receive independent slot bindings', () => {
  const baseline = make('甲说鼠标垫缺货。',{id:50,speaker:'甲'});
  const envelope = input(baseline);
  envelope.target_slots.push({...envelope.target_slots[0],segment_id:51,
    speaker:'乙',source_original:'乙说鼠标支架仍有现货。',
    source_for_translation:'乙说鼠标支架仍有现货。'});
  baseline.messages[0].content = baseline.messages[0].content.split('Input JSON:\n')[0]
    + 'Input JSON:\n' + JSON.stringify(envelope);
  const result = occurrenceRequest(baseline,policy);
  assert.equal(result.decisions.length,2);
  assert.equal(result.decisions[0].terms.find(item=>item.source==='鼠标垫').outcome,'eligible');
  assert.equal(result.decisions[1].terms.find(item=>item.source==='鼠标垫').outcome,'absent');
  assert.match(result.request.messages[0].content,/Target 50\/0:/u);
  assert(!result.request.messages[0].content.includes('Target 51/0:'));
  assert.deepEqual(input(result.request),input(baseline));
});

test('one negated occurrence prevents partial admission of repeated same term', () => {
  const source = '鼠标垫有货，但没有鼠标垫。';
  const baseline = make(source);
  const result = occurrenceRequest(baseline,policy);
  assert.equal(matched(source,'鼠标垫').outcome,'needs_review');
  assert.equal(result.review_state,'needs_review');
  assert.equal(JSON.stringify(result.request),JSON.stringify(baseline));
});

test('repeated occurrences use code-point offsets and never imply a sentence replacement', () => {
  const source = '甲说鼠标垫缺货，乙说鼠标垫有货，鼠标支架也有货。';
  const pad = matched(source,'鼠标垫');
  assert.equal(pad.outcome,'eligible');
  assert.equal(pad.occurrences.length,2);
  for (const span of [...pad.occurrences,...pad.distinct_referents])
    assert.equal([...source].slice(span.start,span.end).join(''),span.source);
  const result = occurrenceRequest(make(source),policy);
  assert(!result.request.messages[0].content.includes('Коврик для мыши отсутствует'));
  assert.deepEqual(input(result.request),input(make(source)));
});

test('source facts from all prior controls remain offline, with unchanged target JSON', () => {
  for (const control of [...reg058.controls,...reg061.related_controls,
    ...reg061.negative_controls,...reg062.related_controls,...reg062.negative_controls]) {
    const baseline = make(control.source);
    const result = occurrenceRequest(baseline,policy);
    assert.deepEqual(input(result.request),input(baseline));
    assert(!result.request.messages[0].content.includes(control.expected_meaning));
  }
});
