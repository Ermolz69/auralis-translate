import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from './build-reg-062-occurrences-v1.mjs';

const verdict = (fact_verdict,severity,reason) => ({fact_verdict,severity,reason});
const pass = reason => verdict('pass','none',reason);
const fail = reason => verdict('fail','major',reason);
const unclear = reason => verdict('needs_review','uncertain',reason);
const all = item => [item,item,item];
const judgments = {
  multicore_positive: {
    baseline:all(fail('Multi-core testing is changed to multithread testing; the ten-thousand score remains.')),
    occurrence:all(pass('Multi-core testing and the ten-thousand score are retained.'))
  },
  multiprocessor_negative: {
    baseline:all(pass('Multiple processors remain multiple processors; no core-count substitution.')),
    occurrence:all(pass('Multiple processors remain multiple processors; no core-count substitution.'))
  },
  multicore_extra: {
    baseline:all(pass('Eight chip cores and only one device processor remain distinct.')),
    occurrence:all(pass('Eight chip cores and only one device processor remain distinct.'))
  },
  multicore_thread_contrast: {
    baseline:all(pass('Core and thread tests remain distinct; the former is higher by two points.')),
    occurrence:all(pass('Core and thread tests remain distinct; the former is higher by two points.'))
  },
  multithread_negative: {
    baseline:all(pass('Only the multithread result is reported; the multicore result is absent.')),
    occurrence:all(pass('Only the multithread result is reported; the multicore result is absent.'))
  },
  mouse_pad_positive: {
    baseline:all(fail('The sold mouse pad is rendered as a mouse stand.')),
    occurrence:all(pass('The sold item is a mouse pad.'))
  },
  mouse_stand_negative: {
    baseline:all(pass('The sold item remains a mouse stand.')),
    occurrence:all(pass('The sold item remains a mouse stand.'))
  },
  mouse_pad_extra: {
    baseline:[
      fail('The present pad becomes an unintelligible mouse item; the absent stand remains a stand.'),
      fail('The present pad and absent stand are both rendered as stands, losing the pad identity.'),
      fail('The present pad becomes an unintelligible mouse item; the absent stand remains a stand.')],
    occurrence:all(pass('The box contains a mouse pad and lacks a distinct mouse stand.'))
  },
  mouse_pad_price_contrast: {
    baseline:all(pass('The pad is twenty yuan cheaper than the separate stand.')),
    occurrence:all(pass('The pad is twenty yuan cheaper than the separate stand.'))
  },
  stand_only_new: {
    baseline:all(unclear('The stand stockout survives, but the forbidden pad name becomes a nonstandard mouse-pillow term.')),
    occurrence:[
      fail('The stand stockout survives, but the prohibition says not to call it a mouse, not a pad.'),
      unclear('The stand stockout survives, but the forbidden pad name becomes a mouse-pillow term.'),
      unclear('The stand stockout survives, but the forbidden pad name becomes a mouse-pillow term.')]
  },
  dual_cpu_each_eight_cores: {
    baseline:all(pass('Two processors, each with eight cores, retain their count and attribution.')),
    occurrence:all(pass('Two processors, each with eight cores, retain their count and attribution.'))
  },
  stand_not_pad_in_box: {
    baseline:all(unclear('The stand is present and pad absent, but the pad is called a nonstandard mouse pillow.')),
    occurrence:[
      fail('The box first contains only a stand, then incorrectly says the stand is absent.'),
      unclear('The stand is present and pad absent, but the pad is called a mouse pillow.'),
      unclear('The stand is present and pad absent, but the pad is called a nonstandard mouse pillow.')]
  },
  pad_out_stand_available: {
    baseline:all(pass('The pad is out of stock and the separate stand remains available.')),
    occurrence:all(fail('Both stock statements refer to a mouse pad; the available stand identity is lost.'))
  },
  multicore_term_positive: {
    baseline:all(fail('The multi-core test is changed to multithread testing; ten thousand points remain.')),
    occurrence:all(pass('The multi-core test and ten-thousand score are retained.'))
  },
  mouse_pad_term_positive: {
    baseline:all(fail('The sold mouse pad is rendered as a mouse stand.')),
    occurrence:all(pass('The sold item is a mouse pad.'))
  },
  stand_stockout_pad_available: {
    baseline:all(pass('The stand is out of stock while the separate pad remains available.')),
    occurrence:all(pass('The stand is out of stock while the separate pad remains available.'))
  },
  pad_bought_stand_not_bought: {
    baseline:[
      pass('The pad was bought and the separate stand was not bought.'),
      pass('The pad was bought and the separate stand was not bought.'),
      unclear('The pad was bought, but the unbought stand becomes an unclear tracer item.')],
    occurrence:all(pass('The pad was bought and the separate stand was not bought.'))
  },
  stand_only_available: {
    baseline:all(pass('Only the mouse stand is stated to remain available.')),
    occurrence:all(pass('Only the mouse stand is stated to remain available.'))
  },
  reverse_availability_at_start: {
    baseline:all(pass('The stand remains available while the pad is out of stock.')),
    occurrence:all(pass('The stand remains available while the pad is out of stock; one run has minor Russian grammar awkwardness.'))
  },
  speaker_split_at_end: {
    baseline:all(fail('Speaker A attributes the stockout to a stand rather than the pad; speaker B still has a stand available.')),
    occurrence:all(fail('Speaker A has the pad stockout, but speaker B has a generic mouse place rather than the available stand.'))
  }
};

const reportPath = path.join(root,'eval/reports/2026-10-03-reg-062-occurrence-terms-v1.json');
const report = JSON.parse(await fs.readFile(reportPath));
assert.equal(report.experiment,'reg-062-occurrence-terms-v1');
assert.equal(report.status,'complete_responses_unreviewed');
assert.equal(report.decision,'pending_AI_review');
assert.equal(report.rows.length,120);
assert.deepEqual(new Set(report.rows.map(row=>row.id)),new Set(Object.keys(judgments)));
const rows = report.rows.map(row => {
  const judgment = judgments[row.id]?.[row.variant]?.[row.run-1];
  assert(judgment,`${row.id}/${row.run}/${row.variant}`);
  return {id:row.id,run:row.run,variant:row.variant,
    raw_response_sha256:row.raw_response_sha256,...judgment};
});
const review = {schema_version:1,experiment:report.experiment,
  reviewer_type:'AI_source_aware_not_independent_human',
  reviewer_provenance:'Codex Ulya self-review of all 120 visible Russian candidates against frozen Chinese source facts; no independent bilingual reviewer',
  reviewed_at:new Date().toISOString(),
  private_report_sha256:report.private_report_sha256,
  source_fact_rubric:'Frozen plan: noun identities, processor/core/thread counts, availability, polarity, amount, actor attribution and neighbor exclusion; unclear is not a pass.',
  scope:'All exposed development outputs, three paired runs per arm; no sealed holdout or reference translation in requests.',
  human_bilingual_review_count:0,rows};
const output = `${JSON.stringify(review,null,2)}\n`;
await fs.writeFile(path.join(root,
  'eval/reports/2026-10-03-reg-062-occurrence-terms-v1-ai-review.json'),output,{flag:'wx'});
console.log('Recorded 120 source-aware AI fact decisions; independent human review remains zero.');
