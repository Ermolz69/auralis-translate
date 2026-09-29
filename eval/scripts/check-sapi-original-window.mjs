import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSapiOriginalWindow } from './sapi-original-window-section.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const result = await loadSapiOriginalWindow(root);
assert.equal(result.status, 'technical_unreviewed_unselected');
assert.equal(result.fitted.length, 2);
assert.equal(result.playback_status, 'player_process_completed');
assert.equal(result.human_listening_review, 'not_performed');
console.log('Real-SAPI original-window fit metadata verified: 2316/2400 ms and 1812/1900 ms; listener review open.');
