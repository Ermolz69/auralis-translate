export function sourceAliasMissing({ source, translation, sourceName, acceptedForms }) {
  if (!source.includes(sourceName)) return false;
  return !acceptedForms.some(form => translation.toLocaleLowerCase('ru')
    .includes(form.toLocaleLowerCase('ru')));
}

export function ambiguousRussianDigitGrouping(translation) {
  return /(?<!\d)\d{1,3},\d{3}(?!\d)/u.test(translation);
}
