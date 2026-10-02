export function validateCrossInventorySourceGroups(inventories) {
  const ids = new Set();
  const splits = new Map();
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
    }
  }
  return { source_count: ids.size, group_count: splits.size };
}
