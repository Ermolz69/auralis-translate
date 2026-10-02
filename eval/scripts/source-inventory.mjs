const SHA256 = /^[a-f0-9]{64}$/u;
const ID = /^[a-z0-9][a-z0-9._-]*$/u;
const STATES = new Set(['discovered', 'inspected_candidate', 'rights_checked', 'source_checked', 'reference_reviewed', 'development_only', 'holdout_frozen', 'rejected']);
const SPLITS = new Set(['unassigned', 'training', 'development', 'holdout', 'excluded']);
const RIGHTS = new Set(['unknown', 'approved', 'rejected']);
const REVIEW = new Set(['none', 'ai_proposed', 'human_reviewed']);

function fail(path, message) { throw new Error(`${path}: ${message}`); }
function object(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'must be an object');
  return value;
}
function exactKeys(value, required, optional, path) {
  object(value, path);
  for (const key of required) if (!(key in value)) fail(`${path}.${key}`, 'is required');
  for (const key of Object.keys(value)) if (![...required, ...optional].includes(key)) fail(`${path}.${key}`, 'is unknown');
}
function id(value, path) { if (typeof value !== 'string' || !ID.test(value)) fail(path, 'must be a stable lowercase ID'); }
function text(value, path) { if (typeof value !== 'string' || !value.trim()) fail(path, 'must be nonempty text'); }
function url(value, path) {
  if (typeof value !== 'string') fail(path, 'must be an HTTPS URL');
  try { if (new URL(value).protocol !== 'https:') fail(path, 'must be an HTTPS URL'); }
  catch { fail(path, 'must be an HTTPS URL'); }
}
function positive(value, path) { if (!Number.isSafeInteger(value) || value < 1) fail(path, 'must be a positive integer'); }

function rights(value, path) {
  exactKeys(value, ['decision'], ['license', 'evidence_url', 'attribution', 'internal_use', 'public_redistribution'], path);
  if (!RIGHTS.has(value.decision)) fail(`${path}.decision`, 'has an unknown value');
  if (value.decision === 'approved') {
    text(value.license, `${path}.license`);
    url(value.evidence_url, `${path}.evidence_url`);
    text(value.attribution, `${path}.attribution`);
    if (value.internal_use !== true) fail(`${path}.internal_use`, 'must be explicitly true');
    if (typeof value.public_redistribution !== 'boolean') fail(`${path}.public_redistribution`, 'must be explicit');
  } else if (value.internal_use === true || value.public_redistribution === true) {
    fail(path, 'unknown or rejected rights cannot authorize use');
  }
}

function review(value, path) {
  exactKeys(value, ['state'], ['reviewer_id', 'evidence_id'], path);
  if (!REVIEW.has(value.state)) fail(`${path}.state`, 'has an unknown value');
  if (value.state === 'human_reviewed') {
    id(value.reviewer_id, `${path}.reviewer_id`);
    id(value.evidence_id, `${path}.evidence_id`);
  }
}

function scenes(source, path) {
  if (!Array.isArray(source.scenes) || !source.scenes.length) fail(`${path}.scenes`, 'must contain admitted scenes');
  const seenScenes = new Set();
  const seenCues = new Set();
  let nextCue = 1;
  for (const [index, scene] of source.scenes.entries()) {
    const at = `${path}.scenes[${index}]`;
    exactKeys(scene, ['id', 'cue_ids', 'exclusions', 'alignment', 'reference'], [], at);
    id(scene.id, `${at}.id`);
    if (seenScenes.has(scene.id)) fail(`${at}.id`, 'is duplicated');
    seenScenes.add(scene.id);
    if (!Array.isArray(scene.cue_ids) || !scene.cue_ids.length) fail(`${at}.cue_ids`, 'must be nonempty');
    for (const cue of scene.cue_ids) {
      positive(cue, `${at}.cue_ids`);
      if (seenCues.has(cue)) fail(`${at}.cue_ids`, `cue ${cue} is duplicated across scenes`);
      if (cue !== nextCue) fail(`${at}.cue_ids`, `expected source cue ${nextCue}`);
      seenCues.add(cue);
      nextCue += 1;
    }
    if (!Array.isArray(scene.exclusions)) fail(`${at}.exclusions`, 'must be an array');
    const excluded = new Set();
    for (const [excludedIndex, item] of scene.exclusions.entries()) {
      const itemAt = `${at}.exclusions[${excludedIndex}]`;
      exactKeys(item, ['cue_id', 'reason'], [], itemAt);
      positive(item.cue_id, `${itemAt}.cue_id`);
      text(item.reason, `${itemAt}.reason`);
      if (!scene.cue_ids.includes(item.cue_id) || excluded.has(item.cue_id)) fail(itemAt, 'must identify one unique scene cue');
      excluded.add(item.cue_id);
    }
    review(scene.alignment, `${at}.alignment`);
    review(scene.reference, `${at}.reference`);
    if (['reference_reviewed', 'development_only', 'holdout_frozen'].includes(source.state)
        && (scene.alignment.state !== 'human_reviewed' || scene.reference.state !== 'human_reviewed')) {
      fail(at, 'admitted references require human alignment and source-aware review');
    }
  }
  if (seenCues.size !== source.cue_count || [...seenCues].some(cue => cue > source.cue_count)) {
    fail(`${path}.scenes`, 'must account for every inspected internal cue ID exactly once');
  }
}

export function validateSourceInventory(inventory) {
  exactKeys(inventory, ['schema_version', 'inventory_id', 'fixture_only', 'sources'], [], 'inventory');
  if (inventory.schema_version !== 1) fail('inventory.schema_version', 'is unsupported');
  id(inventory.inventory_id, 'inventory.inventory_id');
  if (typeof inventory.fixture_only !== 'boolean') fail('inventory.fixture_only', 'must be a boolean');
  if (!Array.isArray(inventory.sources)) fail('inventory.sources', 'must be an array');
  const sourceIds = new Set();
  const groupSplits = new Map();
  let eligibleCues = 0;
  let inspectedCandidateCues = 0;
  for (const [index, source] of inventory.sources.entries()) {
    const at = `inventory.sources[${index}]`;
    exactKeys(source, ['id', 'group_id', 'split', 'state', 'source_url', 'revision', 'retrieved_at', 'sha256', 'language', 'script', 'format', 'cue_count', 'rights', 'scenes'], ['media_url', 'media_duration_ms', 'media_duration_evidence_url', 'rejection_reason', 'local_fixture_path', 'local_candidate_path'], at);
    if (!Array.isArray(source.scenes)) fail(`${at}.scenes`, 'must be an array');
    id(source.id, `${at}.id`);
    id(source.group_id, `${at}.group_id`);
    if (sourceIds.has(source.id)) fail(`${at}.id`, 'is duplicated');
    sourceIds.add(source.id);
    if (!SPLITS.has(source.split) || !STATES.has(source.state)) fail(at, 'has unknown split or state');
    const previousSplit = groupSplits.get(source.group_id);
    if (previousSplit && previousSplit !== source.split) fail(`${at}.group_id`, 'related sources cross splits');
    groupSplits.set(source.group_id, source.split);
    url(source.source_url, `${at}.source_url`);
    text(source.revision, `${at}.revision`);
    if (source.media_url !== undefined && source.media_url !== null) url(source.media_url, `${at}.media_url`);
    if (source.media_duration_ms !== undefined) {
      positive(source.media_duration_ms, `${at}.media_duration_ms`);
      url(source.media_duration_evidence_url, `${at}.media_duration_evidence_url`);
    } else if (source.media_duration_evidence_url !== undefined) {
      fail(`${at}.media_duration_evidence_url`, 'requires media_duration_ms');
    }
    if (source.local_fixture_path !== undefined && (!inventory.fixture_only || typeof source.local_fixture_path !== 'string'
        || !/^eval\/corpora\/fixtures\/[a-z0-9._-]+\.srt$/u.test(source.local_fixture_path))) {
      fail(`${at}.local_fixture_path`, 'must name an owned SRT fixture only in a fixture inventory');
    }
    if (source.local_candidate_path !== undefined && (inventory.fixture_only || source.state !== 'inspected_candidate'
        || typeof source.local_candidate_path !== 'string'
        || !/^\.cache\/eval\/[a-z0-9][a-z0-9-]*\/source\.zh\.srt$/u.test(source.local_candidate_path))) {
      fail(`${at}.local_candidate_path`, 'must name an ignored source candidate only in inspected_candidate state');
    }
    if (source.language !== 'zh' || !['Hans', 'Hant'].includes(source.script) || source.format !== 'strict_srt_v1') {
      fail(at, 'is outside the frozen Chinese strict-SRT scope');
    }
    exactKeys(source.rights, ['subtitle', 'reference', 'audio'], [], `${at}.rights`);
    for (const kind of ['subtitle', 'reference', 'audio']) rights(source.rights[kind], `${at}.rights.${kind}`);
    if (source.state === 'rejected') {
      text(source.rejection_reason, `${at}.rejection_reason`);
      if (source.split !== 'excluded') fail(`${at}.split`, 'rejected sources must be excluded');
    }
    if (source.state === 'discovered' || source.state === 'rejected') {
      if (source.sha256 !== null || source.cue_count !== null || source.scenes.length !== 0) {
        fail(at, 'metadata-only sources cannot claim inspected bytes or scenes');
      }
      continue;
    }
    if (source.state === 'inspected_candidate') {
      if (source.split !== 'unassigned' || source.sha256 === null
          || source.cue_count === null || source.scenes.length !== 0
          || source.local_candidate_path === undefined) {
        fail(at, 'inspected candidates require unassigned split, parsed bytes and no admitted scenes');
      }
      if (typeof source.retrieved_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/u.test(source.retrieved_at)
          || Number.isNaN(Date.parse(source.retrieved_at))) fail(`${at}.retrieved_at`, 'must be a UTC retrieval timestamp');
      if (typeof source.sha256 !== 'string' || !SHA256.test(source.sha256)) fail(`${at}.sha256`, 'must be a lowercase SHA-256');
      positive(source.cue_count, `${at}.cue_count`);
      inspectedCandidateCues += source.cue_count;
      continue;
    }
    if (source.rights.subtitle.decision !== 'approved') fail(`${at}.rights.subtitle`, 'must approve subtitle rights before source admission');
    if (source.state === 'rights_checked') {
      if (source.sha256 !== null || source.cue_count !== null || source.scenes.length !== 0) fail(at, 'rights-only state cannot claim parsed source');
      continue;
    }
    if (typeof source.retrieved_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/u.test(source.retrieved_at)
        || Number.isNaN(Date.parse(source.retrieved_at))) fail(`${at}.retrieved_at`, 'must be a UTC retrieval timestamp');
    if (typeof source.sha256 !== 'string' || !SHA256.test(source.sha256)) fail(`${at}.sha256`, 'must be a lowercase SHA-256');
    positive(source.cue_count, `${at}.cue_count`);
    scenes(source, at);
    if (['reference_reviewed', 'development_only', 'holdout_frozen'].includes(source.state)) {
      eligibleCues += source.scenes.reduce((sum, scene) => sum + scene.cue_ids.length - scene.exclusions.length, 0);
    }
    if (['reference_reviewed', 'development_only', 'holdout_frozen'].includes(source.state)
        && source.rights.reference.decision !== 'approved') fail(`${at}.rights.reference`, 'must approve reference rights');
    if (source.state === 'development_only' && source.split !== 'development') fail(`${at}.split`, 'development-only source must be in development');
    if (source.state === 'holdout_frozen' && (source.split !== 'holdout' || inventory.fixture_only)) {
      fail(`${at}.split`, 'holdout requires a non-fixture sealed inventory');
    }
  }
  return { source_count: sourceIds.size, group_count: groupSplits.size, inspected_candidate_cues: inspectedCandidateCues, eligible_cues: eligibleCues };
}
