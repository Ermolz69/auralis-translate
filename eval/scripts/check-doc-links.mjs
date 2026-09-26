import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const files = ['README.md', 'AGENTS.md'].map((file) => path.join(root, file));
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(target);
    else if (entry.name.endsWith('.md')) files.push(target);
  }
}
collect(path.join(root, 'docs'));
collect(path.join(root, 'eval/experiments'));
const failures = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8').replace(/```[^\n]*\n[\s\S]*?```/gu, '');
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
    const destination = match[1].replace(/^<|>$/gu, '');
    if (/^[a-z][a-z\d+.-]*:/iu.test(destination) || destination.startsWith('#')) continue;
    try {
      const relative = decodeURIComponent(destination.split('#')[0]);
      if (!fs.existsSync(path.resolve(path.dirname(file), relative))) {
        failures.push(`${path.relative(root, file)}: missing ${destination}`);
      }
    } catch {
      failures.push(`${path.relative(root, file)}: invalid ${destination}`);
    }
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Documentation file links are valid (${files.length} Markdown files; external links and anchors are not checked).`);
}
