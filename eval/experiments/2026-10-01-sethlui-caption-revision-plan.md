# Restaurant interview: bounded Chinese-caption revision inventory

Date: 1 October 2026. Backlog: `DATA-03` source discovery only. The
[12:18 Commons video](https://commons.wikimedia.org/wiki/File:Inside_One_Of_Singapore%E2%80%99s_Most_Refined_Cantonese_Kitchen_-_Behind_The_Plate_(Turn_on_CC).webm)
has a [Simplified Chinese timed-text page](https://commons.wikimedia.org/wiki/TimedText:Inside_One_Of_Singapore%E2%80%99s_Most_Refined_Cantonese_Kitchen_-_Behind_The_Plate_(Turn_on_CC).webm.zh-hans.srt).
The first displayed lines are Chinese, but the page does not establish that
every line transcribes Chinese speech. The media is an imported YouTube copy
whose stated CC BY license is marked unreviewed. Caption authorship, license,
audio alignment, speakers, scene suitability and references remain unknown.

`task eval:data:commons:sethlui:revision:inventory` makes one Commons
MediaWiki API GET for the exact TimedText title with `rvlimit=1`, a 90-second
timeout, 1 MiB response limit and no retries. It retains the complete raw API
response, status, digest, duration and errors under ignored
`.cache/eval/commons-sethlui-caption/revision-*`. If the title resolves to one
revision, record its ID, edit actor and timestamp. This probe downloads no
caption or media bytes, makes no model/TTS calls and assigns no corpus split.
Any later caption download must pin the observed revision and have a separate
bounded acquisition record. The holdout and human reviews remain independent.
