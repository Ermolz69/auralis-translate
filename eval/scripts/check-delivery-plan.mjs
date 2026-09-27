import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDeliveryPlan } from './delivery-progress-section.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const plan = await loadDeliveryPlan(root);
console.log(`Delivery backlog verified: ${plan.total_tasks} tasks, unique IDs, known statuses, acyclic prerequisites, linked completion evidence, three document identities.`);
