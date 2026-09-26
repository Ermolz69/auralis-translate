import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';
import { runFloresFile } from './flores-file-run.mjs';
import { profileVariants } from './profile-matrix.mjs';
import { compareProfiles, profileComparisonMarkdown } from './profile-comparison-report.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function main() {
  const matrixBytes = await fs.readFile(path.join(root, 'eval/profiles/hy-mt2-dev-decoding-v1.json'));
  const matrix = JSON.parse(matrixBytes);
  const variants = profileVariants(matrix, await fs.readFile(path.join(root, matrix.base_profile)), await fs.readFile(path.join(root, matrix.sample_manifest)));
  const parent = path.join(root, '.cache/eval/profile-runs');
  await fs.mkdir(parent, { recursive: true });
  const workspace = await fs.mkdtemp(path.join(parent, 'flores-dev-'));
  console.log(`Local profile comparison: ${workspace}`);
  await fs.writeFile(path.join(workspace, 'matrix.json'), matrixBytes, { flag: 'wx' });
  const entries = [];
  for (const variant of variants) {
    const profileFile = path.join(workspace, `${variant.id}.json`);
    await fs.writeFile(profileFile, `${JSON.stringify(variant.profile, null, 2)}\n`, { flag: 'wx' });
    console.log(`Running ${variant.id}`);
    try {
      const { runRoot, report } = await runFloresFile({ profileFile, sampleFile: matrix.sample_manifest, destinationRoot: path.join(workspace, variant.id), label: variant.id });
      entries.push({ id: variant.id, workspace: path.relative(workspace, runRoot), report });
    } catch (error) {
      entries.push({ id: variant.id, workspace: variant.id, error: error.message });
      console.error(`${variant.id} failed; retained local logs and continuing the other variants`);
    }
    await fs.writeFile(path.join(workspace, 'progress.json'), `${JSON.stringify(entries, null, 2)}\n`);
  }
  const comparison = compareProfiles(entries, digest(matrixBytes));
  await fs.writeFile(path.join(workspace, 'comparison.json'), `${JSON.stringify(comparison, null, 2)}\n`, { flag: 'wx' });
  await fs.writeFile(path.join(workspace, 'comparison.md'), profileComparisonMarkdown(comparison), { flag: 'wx' });
  console.log(`Comparison report: ${path.join(workspace, 'comparison.md')}`);
  if (!comparison.all_transport_checks_passed) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
