import hashlib
import importlib.metadata
import json
from pathlib import Path
import sys
from time import perf_counter


ROOT = Path(__file__).resolve().parents[2]
WHEEL = ROOT / ".cache/eval/vivo-opencc-wheel/opencc-1.4.2-cp310-cp310-win_amd64.whl"
PACKAGE = ROOT / ".cache/eval/vivo-opencc-package"
RAW = ROOT / ".cache/eval/vivo-full-audio-asr-v1/attempt-AdDOL7/raw.json"
OUTPUT = ROOT / ".cache/eval/vivo-opencc-conversion-v1/converted.json"
WHEEL_SHA = "b2af32959214ba7fd475991aaf2476e1f775061708c154cd39782485365dc781"
RAW_SHA = "a1f92de3e5d2a84baf070851e8248e6455ad432f1e63241749e543865f10d78e"


def sha256(file: Path) -> str:
    digest = hashlib.sha256()
    with file.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1_048_576), b""):
            digest.update(chunk)
    return digest.hexdigest()


def converter():
    assert sha256(WHEEL) == WHEEL_SHA, "Pinned OpenCC wheel changed"
    sys.path.insert(0, str(PACKAGE))
    import opencc

    assert importlib.metadata.version("opencc") == "1.4.2"
    return opencc.OpenCC("t2s.json")


def test(cc):
    assert cc.convert("我們在東莞見面") == "我们在东莞见面"
    assert cc.convert("從專業測試裡面") == "从专业测试里面"
    assert cc.convert("謝謝") == "谢谢"
    assert cc.convert("我們在東莞見面") != cc.convert("他們在東莞見面")
    assert cc.convert("不支持") != cc.convert("支持")
    assert cc.convert("天璣9300") != cc.convert("天璣9400")
    print(json.dumps({"opencc_version": "1.4.2", "config": "t2s.json",
                      "wheel_sha256": WHEEL_SHA, "controls": 6}))


def convert(cc):
    started = perf_counter()
    assert sha256(RAW) == RAW_SHA, "Single raw ASR response changed"
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    assert raw["status"] == "complete_ai_unreviewed"
    assert len(raw["segments"]) == 499
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    report = {"schema_version": 1,
              "experiment": "DATA-03-vivo-opencc-recall-2026-10-10-v1",
              "raw_asr_sha256": RAW_SHA, "wheel_sha256": WHEEL_SHA,
              "opencc_version": "1.4.2", "config": "t2s.json",
              "segments": [], "status": "running"}
    try:
        for segment in raw["segments"]:
            report["segments"].append({"start": segment["start"],
                                       "end": segment["end"],
                                       "text": cc.convert(segment["text"])})
        report["changed_segments"] = sum(
            old["text"] != new["text"]
            for old, new in zip(raw["segments"], report["segments"])
        )
        report["status"] = "converted_unreviewed"
    except Exception as error:
        report["status"] = "failed"
        report["error"] = repr(error)
        raise
    finally:
        report["elapsed_seconds"] = round(perf_counter() - started, 3)
        with OUTPUT.open("x", encoding="utf-8") as stream:
            stream.write(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps({"status": report["status"],
                          "segments": len(report["segments"]),
                          "changed_segments": report.get("changed_segments"),
                          "elapsed_seconds": report["elapsed_seconds"]}))


if __name__ == "__main__":
    assert sys.argv[1:] in (["--test"], ["--convert"])
    instance = converter()
    if sys.argv[1:] == ["--test"]:
        test(instance)
    else:
        convert(instance)
