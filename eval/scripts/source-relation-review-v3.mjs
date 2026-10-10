import { sourceRelations } from './source-relation-review-v1.mjs';
import { sourceRelationWarningsV2 } from './source-relation-review-v2.mjs';

const HALL_STICK_DENIAL = /(?:并)?没有(?:使用|用)霍尔(?:摇杆|传感器)/u;
const BIOS_DISABLE_ABSENCE =
  /(?:没有在BIOS(?:里|中)提供|BIOS(?:里|中)没有提供).{0,10}关核.{0,10}关超线程.{0,5}选项/iu;
const PRICE_UNANNOUNCED = /(?:价格|售价)(?:还没|尚未|没有)(?:公布|发布)/u;

const CONTRADICTIONS = {
  hall_stick_denial:
    /(?:стик|джойстик|датчик)\p{L}*.{0,35}(?:использу\p{L}*|оснащен\p{L}*|оснащён\p{L}*|установлен\p{L}*|есть|стоят).{0,35}Холл\p{L}*|(?:использу\p{L}*|оснащен\p{L}*|оснащён\p{L}*|установлен\p{L}*|есть|стоят).{0,35}(?:стик|джойстик|датчик)\p{L}*.{0,35}Холл\p{L}*/iu,
  bios_disable_absence:
    /(?:BIOS|биос).{0,30}(?:можно|есть|доступн\p{L}*|позволя\p{L}*).{0,45}(?:отключ\p{L}*|выключ\p{L}*).{0,25}(?:ядр\p{L}*|гиперпоточн\p{L}*|hyper.threading)/iu,
  price_unannounced_at_review:
    /(?:цена|цены|цену|стоимость).{0,28}(?<!\p{L})(?:известн\p{L}*|объявлен\p{L}*|назван\p{L}*|опубликован\p{L}*)/iu,
};

const NEGATION = /(?:^|[^\p{L}])(?:не|нет|нельзя|без)(?:$|[^\p{L}])/iu;

export function sourceRelationsV3(current, previous, next) {
  const kinds = sourceRelations(current, previous, next);
  const text = current.text.replace(/\s+/gu, '');
  if (HALL_STICK_DENIAL.test(text)) kinds.push('hall_stick_denial');
  if (BIOS_DISABLE_ABSENCE.test(text)) kinds.push('bios_disable_absence');
  if (PRICE_UNANNOUNCED.test(text))
    kinds.push('price_unannounced_at_review');
  return kinds;
}

export function sourceRelationWarningsV3(current, previous, next,
  translatedText) {
  const warnings = sourceRelationWarningsV2(current, previous, next,
    translatedText);
  for (const kind of sourceRelationsV3(current, previous, next)) {
    const pattern = CONTRADICTIONS[kind];
    if (!pattern) continue;
    const match = pattern.exec(translatedText);
    if (!match) continue;
    const prefix = translatedText.slice(Math.max(0, match.index - 18),
      match.index);
    if (!NEGATION.test(prefix + match[0]))
      warnings.push({ cue_id: current.id, kind });
  }
  return warnings;
}
