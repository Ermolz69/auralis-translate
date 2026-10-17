import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadSourceRelationEvidence(root, sourceSha256, draftSha256) {
  const factsRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-09-source-fact-hints-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(factsRaw).digest('hex'),
    'fd7a661edd0aa09cafba16fddeda1d598ad8973abd8da3f6e4a4cba02dea6b96');
  const facts = JSON.parse(factsRaw);
  const factsReviewRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-09-source-fact-hints-v1-ai-review.json'), 'utf8');
  assert.equal(createHash('sha256').update(factsReviewRaw).digest('hex'),
    '6879f07f4d7b1343d9fe9e85abd2857449b6ea17d68f165013484fd3df6af90b');
  const factsReview = JSON.parse(factsReviewRaw);
  assert.equal(factsReview.machine_report_sha256,
    createHash('sha256').update(factsRaw).digest('hex'));
  assert.equal(facts.chat_requests, 36);
  assert.equal(facts.template_token_preflights, 72);
  assert.equal(facts.identical_no_hint_pairs, 5);
  assert.equal(facts.json_structure_leak_count, 1);
  assert.equal(factsReview.summary.new_natural_major_fact_errors, 1);
  assert.equal(factsReview.summary.candidate_promoted, false);
  const factsCatalogRaw = await fs.readFile(path.join(root,
    'eval/regressions/catalog-v49.json'), 'utf8');
  assert.equal(createHash('sha256').update(factsCatalogRaw).digest('hex'),
    '48799628072487c3924f99835944c76cb8da2af1f13840cacca6f8df6851ff97');
  assert.deepEqual(JSON.parse(factsCatalogRaw).entries.slice(-2).map(row => row.id),
    ['REG-069', 'REG-070']);
  const clockRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-09-source-clock-review-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(clockRaw).digest('hex'),
    '403f27b26e9b9f7562b44079ae509075d13e96d0fe6121a8e0a42c1ba6d955cd');
  const clock = JSON.parse(clockRaw);
  assert.equal(clock.source_cues, 467);
  assert.equal(clock.recognized_source_clocks.length, 1);
  assert.equal(clock.full_draft_warnings.length, 1);
  assert.equal(clock.full_draft_warnings[0].cue_id, 328);
  assert.equal(clock.paired_natural_328.baseline.warning, null);
  assert.equal(clock.paired_natural_328.candidate.warning.cue_id, 328);
  assert.equal(clock.model_requests, 0);
  assert.equal(clock.human_bilingual_reviews, 0);
  const relationRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-source-relation-review-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(relationRaw).digest('hex'),
    '86900f84bc40afc63c46796bf4375e2d9096c13497a301c3dbda7d73ce3763b8');
  const relation = JSON.parse(relationRaw);
  assert.equal(relation.source_sha256, sourceSha256);
  assert.equal(relation.draft_sha256, draftSha256);
  assert.deepEqual(relation.full_draft_warnings.map(row => row.cue_id),
    [276, 280, 466]);
  assert.equal(relation.paired_natural_replay.length, 6);
  assert.equal(relation.model_requests, 0);
  assert.equal(relation.human_bilingual_reviews, 0);
  const focusRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-focus-slot-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(focusRaw).digest('hex'),
    'd779f08043e3410f78f25613ed7bf3ed1ef6c15d75019ed3494b9860e6dd2b75');
  const focus = JSON.parse(focusRaw);
  assert.equal(focus.source_sha256, sourceSha256);
  assert.equal(focus.chats, 20);
  assert.equal(focus.preflights, 40);
  assert.equal(focus.ai_triage.known_relation_errors_repaired, 0);
  assert.equal(focus.ai_triage.focus_candidate_shortlisted, false);
  const relationV2Raw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-source-relation-review-v2.json'), 'utf8');
  assert.equal(createHash('sha256').update(relationV2Raw).digest('hex'),
    '98d72ac7e45beb9dab56ebc9c82b840b38c59e023727f46d63d3dbbacf88d0c9');
  const relationV2 = JSON.parse(relationV2Raw);
  assert.equal(relationV2.focus_report_sha256,
    createHash('sha256').update(focusRaw).digest('hex'));
  assert.equal(relationV2.v2_full_draft_warnings.length, 3);
  assert.equal(relationV2.new_full_draft_warnings.length, 0);
  assert.equal(relationV2.model_requests, 0);
  const relationCrossRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-source-relation-cross-source-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(relationCrossRaw).digest('hex'),
    'd1141b970dd5ee6871024443f98189a4619c141e3c09dd2520acf0f9379bb6b6');
  const relationCross = JSON.parse(relationCrossRaw);
  assert.equal(relationCross.source_groups.length, 2);
  assert.equal(relationCross.unique_source_cues, 531);
  assert.equal(relationCross.source_target_pairs, 794);
  assert.equal(relationCross.recognized_relation_count, 0);
  assert.equal(relationCross.warning_count, 0);
  assert.equal(relationCross.warning_precision, null);
  assert.equal(relationCross.release_admitted, false);
  const countCategoryRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-reg040-count-category-review-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(countCategoryRaw).digest('hex'),
    'cf4967f718ee1d0b1dd4bd940ed315e26ef64421a777ea1680fa8d2e2c11d960');
  const countCategory = JSON.parse(countCategoryRaw);
  assert.equal(countCategory.source_cues, 263);
  assert.equal(countCategory.source_target_pairs, 526);
  assert.equal(countCategory.control_count, 18);
  assert.deepEqual(countCategory.arms[0].warnings,
    [{ cue_id: 35, kind: 'count_category_swap' }]);
  assert.deepEqual(countCategory.arms[1].warnings, []);
  assert.equal(countCategory.product_rule_admitted, false);
  const catalogV50Raw = await fs.readFile(path.join(root,
    'eval/regressions/catalog-v50.json'), 'utf8');
  assert.equal(createHash('sha256').update(catalogV50Raw).digest('hex'),
    'fc2523ce1361e48c49d8a0bbf6ebaeba5c7f987bc3207bc5bf51b298f73486c1');
  assert.equal(JSON.parse(catalogV50Raw).entries.at(-1).id, 'REG-071');
  return { factsRaw, facts, factsReviewRaw, factsReview, factsCatalogRaw, clockRaw, clock, relationRaw, relation, focusRaw, focus, relationV2Raw, relationV2, relationCrossRaw, relationCross, countCategoryRaw, countCategory };
}

export function projectSourceRelationEvidence({ factsRaw, facts, factsReviewRaw, factsReview, factsCatalogRaw, clockRaw, clock, relationRaw, relation, focusRaw, focus, relationV2Raw, relationV2, relationCrossRaw, relationCross, countCategoryRaw, countCategory }) {
  return {
    source_fact_hints: { chats: facts.chat_requests,
      preflights: facts.template_token_preflights,
      exact_abstentions: facts.identical_no_hint_pairs,
      prompt_tokens_baseline: facts.arm_usage.baseline.prompt_tokens,
      prompt_tokens_candidate: facts.arm_usage.candidate.prompt_tokens,
      new_major_fact_errors: factsReview.summary.new_natural_major_fact_errors,
      decoder_rejections: factsReview.summary.new_natural_product_decoder_rejections,
      human_bilingual_reviews: facts.human_bilingual_reviews,
      candidate_promoted: factsReview.summary.candidate_promoted,
      machine_report_sha256: createHash('sha256').update(factsRaw).digest('hex'),
      ai_review_sha256: createHash('sha256').update(factsReviewRaw).digest('hex'),
      catalog_sha256: createHash('sha256').update(factsCatalogRaw).digest('hex') },
    source_clock_review: { scanned_cues: clock.source_cues,
      recognized: clock.recognized_source_clocks.length,
      full_warnings: clock.full_draft_warnings.length,
      baseline_warning: clock.paired_natural_328.baseline.warning !== null,
      rejected_candidate_warning:
        clock.paired_natural_328.candidate.warning !== null,
      model_requests: clock.model_requests,
      human_bilingual_reviews: clock.human_bilingual_reviews,
      report_sha256: createHash('sha256').update(clockRaw).digest('hex') },
    source_relation_review: { scanned_cues: relation.source_cues,
      recognized: relation.recognized_source_relations.length,
      full_warnings: relation.full_draft_warnings.length,
      paired_replies: relation.paired_natural_replay.length,
      paired_warnings: relation.paired_natural_replay.filter(row =>
        row.warnings.length > 0).length,
      model_requests: relation.model_requests,
      human_bilingual_reviews: relation.human_bilingual_reviews,
      report_sha256: createHash('sha256').update(relationRaw).digest('hex') },
    focus_slot: { chats: focus.chats, preflights: focus.preflights,
      total_tokens: focus.total_tokens, wall_elapsed_ms: focus.wall_elapsed_ms,
      batch_prompt_tokens: focus.arms.batch.prompt_tokens,
      focus_prompt_tokens: focus.arms.focus.prompt_tokens,
      known_relation_repairs:
        focus.ai_triage.known_relation_errors_repaired,
      clock_fact_improved: focus.ai_triage.clock_fact_improved,
      authored_controls_preserved:
        focus.ai_triage.authored_controls_preserved,
      shortlisted: focus.ai_triage.focus_candidate_shortlisted,
      human_bilingual_reviews: focus.ai_triage.human_bilingual_reviews,
      report_sha256: createHash('sha256').update(focusRaw).digest('hex') },
    source_relation_v2: { scanned_cues: relationV2.source_cues,
      full_warnings: relationV2.v2_full_draft_warnings.length,
      new_full_warnings: relationV2.new_full_draft_warnings.length,
      replayed_replies: relationV2.replay.length,
      reg071_v1_missed: relationV2.replay.some(row => row.family === 'focus' &&
        row.case_id === 'natural_466' && row.arm === 'focus' &&
        row.v1_warnings.length === 0),
      reg071_v2_warned: relationV2.replay.some(row => row.family === 'focus' &&
        row.case_id === 'natural_466' && row.arm === 'focus' &&
        row.v2_warnings.length === 1),
      model_requests: relationV2.model_requests,
      human_bilingual_reviews: relationV2.human_bilingual_reviews,
      report_sha256: createHash('sha256').update(relationV2Raw).digest('hex') },
    source_relation_cross_source: { groups: relationCross.source_groups.length,
      unique_source_cues: relationCross.unique_source_cues,
      source_target_pairs: relationCross.source_target_pairs,
      recognized_relations: relationCross.recognized_relation_count,
      warnings: relationCross.warning_count,
      warning_precision: relationCross.warning_precision,
      model_requests: relationCross.model_requests,
      human_bilingual_reviews: relationCross.human_bilingual_reviews,
      release_admitted: relationCross.release_admitted,
      report_sha256: createHash('sha256').update(relationCrossRaw).digest('hex') },
    reg040_count_category: { source_cues: countCategory.source_cues,
      source_target_pairs: countCategory.source_target_pairs,
      authored_controls: countCategory.control_count,
      source_relations: countCategory.arms[0].source_relation_cue_ids.length,
      one_b_warnings: countCategory.arms[0].warnings.length,
      seven_b_warnings: countCategory.arms[1].warnings.length,
      seven_b_target_relations: countCategory.arms[1].target_relation_cue_ids.length,
      model_requests: countCategory.model_requests,
      human_bilingual_reviews: countCategory.arms[0].human_bilingual_reviews,
      product_rule_admitted: countCategory.product_rule_admitted,
      report_sha256: createHash('sha256').update(countCategoryRaw).digest('hex') },
  };
}
