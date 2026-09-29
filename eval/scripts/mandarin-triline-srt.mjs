const timestamp = /^(\d\d):(\d\d):(\d\d),(\d\d\d) --> (\d\d):(\d\d):(\d\d),(\d\d\d)$/;
const han = /\p{Script=Han}/u;
const millis = (hours, minutes, seconds, fraction) =>
  (((Number(hours) * 60 + Number(minutes)) * 60 + Number(seconds)) * 1000 + Number(fraction));

export function deriveChineseSrt(source) {
  if (!source || /\r(?!\n)/.test(source)) throw new Error('unsupported source line endings');
  const blocks = source.replaceAll('\r\n', '\n').trimEnd().split(/\n\n+/);
  const labels = new Set();
  const cues = blocks.map((block, originalIndex) => {
    const lines = block.split('\n');
    if (lines.length !== 5 || !/^[1-9]\d*$/.test(lines[0])) {
      throw new Error(`cue ${originalIndex + 1}: expected label, timing and three text lines`);
    }
    const label = Number(lines[0]);
    if (!Number.isSafeInteger(label) || labels.has(label)) throw new Error(`cue ${originalIndex + 1}: repeated or unsafe label`);
    labels.add(label);
    const match = timestamp.exec(lines[1]);
    if (!match) throw new Error(`cue ${originalIndex + 1}: unsupported timestamp`);
    const startMs = millis(...match.slice(1, 5));
    const endMs = millis(...match.slice(5, 9));
    if (startMs >= endMs || endMs > 827_000) throw new Error(`cue ${originalIndex + 1}: timing outside source media`);
    const [pinyin, chinese, english] = lines.slice(2);
    if (!pinyin || !english || !chinese || han.test(pinyin) || !han.test(chinese) || han.test(english)) {
      throw new Error(`cue ${originalIndex + 1}: Chinese is not exactly the middle text line`);
    }
    return { original_label: label, original_index: originalIndex + 1,
      start_ms: startMs, end_ms: endMs, timing: lines[1], chinese };
  });
  cues.sort((a, b) => a.start_ms - b.start_ms || a.original_index - b.original_index);
  const mapping = cues.map((cue, index) => ({
    derived_label: index + 1, original_label: cue.original_label,
    original_index: cue.original_index, start_ms: cue.start_ms, end_ms: cue.end_ms,
  }));
  const srt = cues.map((cue, index) => `${index + 1}\n${cue.timing}\n${cue.chinese}`).join('\n\n') + '\n';
  return { srt, mapping };
}
