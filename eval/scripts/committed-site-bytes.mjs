import { execFileSync } from 'node:child_process';

const names = new Set(['index.html', 'history.html']);

export function committedSiteBytes(root, name) {
  if (!names.has(name)) throw new Error(`Unsupported site page: ${name}`);
  return execFileSync('git', ['show', `HEAD:site/${name}`], {
    cwd: root, timeout: 10_000, maxBuffer: 3 * 1024 * 1024,
  });
}

export function assertSiteMatchesHead(root) {
  try {
    execFileSync('git', ['diff', '--quiet', 'HEAD', '--',
      'site/index.html', 'site/history.html'], {
      cwd: root, timeout: 10_000, stdio: 'ignore',
    });
  } catch {
    throw new Error('Generated site pages differ from committed HEAD');
  }
}
