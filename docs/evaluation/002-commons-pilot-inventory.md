# Commons subtitle pilot inventory

Status: metadata audit on 25 September 2026. These are **discovery candidates**, not an approved corpus or language-gate evidence. No subtitle or video bytes were copied into this repository, no source SHA-256 was recorded, and no bilingual reviewer has checked the text.

## Candidate and fixed page revisions

| Role | Commons revision seen | What is established | Open before inclusion |
| --- | --- | --- | --- |
| [Video: The Impact Of Wikipedia.webm](https://commons.wikimedia.org/w/index.php?title=File:The_Impact_Of_Wikipedia.webm&oldid=1272829523) | Media page `oldid=1272829523`; uploaded media history lists 26 November 2012. | The media page describes a 4 min 10 s English-language work and gives the video a CC BY-SA 3.0 Unported license with attribution to Wikimedia Foundation and Victor Grigas. It separately warns about Wikimedia trademarks. | Verify the exact media revision and applicable rights if video context is retained or redistributed. |
| [Traditional Chinese SRT](https://commons.wikimedia.org/w/index.php?title=TimedText:The_Impact_Of_Wikipedia.webm.zh-hant.srt&oldid=84912590) | TimedText `oldid=84912590`, page edited 13 December 2012. | A timed SRT page exists. Its visible tail has a repeated external cue label and a later jump to label 79. The final scene includes lengthy end-card/license material. | Retrieve the exact raw revision outside the code repository, record bytes/hash and author history, verify text rights, and run the strict inspector. |
| [Japanese SRT](https://commons.wikimedia.org/w/index.php?title=TimedText:The_Impact_Of_Wikipedia.webm.ja.srt&oldid=112529340) | TimedText `oldid=112529340`, page edited 25 December 2013. | A timed SRT page exists. Its visible tail jumps from label 66 to 79 and includes end-card/license material. | Same rights, raw-byte, parser, source-language, and reviewer checks. |
| [Russian SRT](https://commons.wikimedia.org/w/index.php?title=TimedText:The_Impact_Of_Wikipedia.webm.ru.srt&oldid=181468670) | TimedText `oldid=181468670`, page edited 9 December 2015. | A same-video Russian track exists. Its cue timing and grouping differ from the Chinese track at several visible positions. | Treat only as context until semantic alignment and human reference quality are established. It is not a cue-by-cue gold translation. |

The Chinese and Japanese tracks are caption text for a video whose publisher labels the original work as English. **Inference:** they likely exercise translation of existing Chinese/Japanese subtitle files, but are weak evidence for native Chinese/Japanese dialogue. This single video also cannot fill both language holdouts: all of its tracks belong to one scene group and must share one split. Traditional Chinese alone does not establish simplified-Chinese coverage.

The TimedText pages carry a general Commons unstructured-text license notice; the [Commons reuse guidance](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia) distinguishes text from media licenses and requires checking the particular work, attribution and derivative obligations. The video's CC BY-SA 3.0 tag therefore does **not** by itself clear the subtitle pages or a new Russian reference for redistribution. Record a separate rights decision for each source track and commissioned reference before importing it.

## Pilot decision and next operations

1. Keep this video in **candidate** state. It can become a parser/structure pilot only after exact revisions and rights are recorded; it is excluded from the frozen S8/S9 language holdouts for now.
2. Use internal segment IDs and source timing for alignment. External SRT cue labels can repeat or jump, so never join source and Russian tracks by label alone. A reviewer must map meaning across cue splits and exclude the end card deliberately.
3. Obtain licensed material with original Chinese and Japanese speech and matching human-reviewed source subtitles for the eventual product holdouts. Use the [evaluation protocol](001-open-data-and-language-gates.md) to freeze per-language scenes, commission source-aware Russian references, and separate development from holdout by media item.
4. If this pilot is imported later, preserve the immutable raw revision in a separately licensed corpus store, run `inspect` before inference, record parser acceptance/rejection and SHA-256, and store only links, hashes, provenance and aggregate results in the code repository.
