export function courierActionPreserved(sourceZh, candidateRu) {
  if (!sourceZh.includes('快递员') || !/[送交]/u.test(sourceZh)) return true;
  const target = candidateRu.toLowerCase();
  return /курьер|доставщик/u.test(target)
    && /достав|вруч|отн[её]с|передал|прин[её]с/u.test(target)
    && !/таксист|такси/u.test(target);
}

export function farewellPreserved(sourceZh, candidateRu) {
  if (!/再见|拜拜|下期见|下次见/u.test(sourceZh)) return true;
  const target = candidateRu.toLowerCase();
  return /увид|до свидан|пока|до встречи|прощ/u.test(target)
    && (/博彩|赌/u.test(sourceZh) || !/букмекер/u.test(target));
}
