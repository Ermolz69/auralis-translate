function youtubeId(value) {
  if (!value) return null;
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  let id = null;
  if (host === 'youtu.be') id = url.pathname.split('/')[1];
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else if (/^\/(?:shorts|embed|live)\//u.test(url.pathname)) id = url.pathname.split('/')[2];
  }
  return id && /^[A-Za-z0-9_-]{11}$/u.test(id) ? `youtube:${id}` : null;
}

function mediaIdentities(source) {
  const identities = new Set();
  for (const field of ['source_url', 'media_url', 'original_media_url']) {
    const value = source[field];
    if (!value) continue;
    const youtube = youtubeId(value);
    if (youtube) identities.add(youtube);
    if (field === 'source_url') continue;
    const url = new URL(value);
    url.hash = '';
    if (url.hostname === 'commons.wikimedia.org' && url.pathname.startsWith('/wiki/File:')) {
      url.search = '';
    }
    if (!youtube) identities.add(`media:${url.href}`);
  }
  return identities;
}

export function validateCrossInventorySourceGroups(inventories) {
  const ids = new Set();
  const splits = new Map();
  const subtitles = new Map();
  const media = new Map();
  for (const inventory of inventories) {
    for (const source of inventory.sources) {
      if (ids.has(source.id)) {
        throw new Error(`Source ID ${source.id} appears in multiple inventories`);
      }
      ids.add(source.id);
      const prior = splits.get(source.group_id);
      if (prior !== undefined && prior !== source.split) {
        throw new Error(`Related source group ${source.group_id} crosses inventory splits`);
      }
      splits.set(source.group_id, source.split);
      if (source.sha256) {
        const priorSubtitle = subtitles.get(source.sha256);
        if (priorSubtitle) {
          throw new Error(`Sources ${priorSubtitle.id} and ${source.id} have identical subtitle bytes`);
        }
        subtitles.set(source.sha256, source);
      }
      for (const identity of mediaIdentities(source)) {
        const priorMedia = media.get(identity);
        if (priorMedia && priorMedia.group_id !== source.group_id) {
          throw new Error(`Sources ${priorMedia.id} and ${source.id} refer to the same media item in different groups`);
        }
        media.set(identity, source);
      }
    }
  }
  return { source_count: ids.size, group_count: splits.size };
}
