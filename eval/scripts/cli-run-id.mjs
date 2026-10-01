export function extractCliRunId(stdout, stderr) {
  const all = `${stdout}\n${stderr}`;
  const ids = [...all.matchAll(/\brun_id=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/giu)]
    .map(match => match[1].toLowerCase());
  return ids.at(-1) ?? null;
}
