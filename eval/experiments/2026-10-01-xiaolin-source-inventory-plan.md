# Mandarin finance video: bounded source inventory plan

Date: 1 October 2026. Backlog: `DATA-03` discovery only. No model inference,
translation comparison, audio synthesis, media download, corpus admission or
holdout assignment is authorized by this probe.

The candidate is the creator's [12:56 YouTube video](https://www.youtube.com/watch?v=i0hac3c_xhs),
ID `i0hac3c_xhs`, titled `〖特别篇〗真实版华尔街之狼 - 一马基金 1MDB Scandal`.
The [Commons copy](https://commons.wikimedia.org/wiki/File:%E3%80%90%E7%89%B9%E5%88%AB%E7%AF%87%E3%80%91%E7%9C%9F%E5%AE%9E%E7%89%88%E5%8D%8E%E5%B0%94%E8%A1%97%E4%B9%8B%E7%8B%BC_-_%E4%B8%80%E9%A9%AC%E5%9F%BA%E9%87%91_1MDB_Scandal.webm)
is categorized as Standard Mandarin and declares CC BY 3.0 for the video, but
Commons marks the imported license as **not reviewed**. A Chinese timed-text
track and its authorship/license are unverified. These are explicit failure
conditions for source admission.

`task eval:data:youtube:xiaolin:inventory` invokes the existing pinned
`yt-dlp` executable exactly once in metadata-only mode with a 90-second wall
limit, 12 MiB combined-output limit and zero downloads/retries. It records the
complete extractor response, stderr, arguments, executable digest, result and
selected track metadata in an ignored `.cache/eval/youtube-xiaolin/inventory-*`
directory. A failed run is retained. No caption URL from the result may be
fetched before its identity, track language, format, rights status and a separate
bounded acquisition plan have been recorded. References and the eventual
Chinese-to-Russian review remain independent of model requests.
