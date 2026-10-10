import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import sys
from time import perf_counter


ASSET_ROOT = Path(os.environ["AURALIS_VIVO_ASSET_ROOT"])
MEDIA = ASSET_ROOT / ".cache/eval/commons-vivo-media/media-46745446-cc07-4cff-b5e3-f98fe08262f0/source.240p.webm"
PACKAGES = ASSET_ROOT / ".cache/eval/vivo-asr-packages"
MODEL = ASSET_ROOT / ".cache/eval/vivo-asr-model"
ATTEMPT = Path(os.environ["AURALIS_ASR_ATTEMPT_DIR"])


def sha256(file: Path) -> str:
    digest = hashlib.sha256()
    with file.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1_048_576), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run() -> None:
    report = {
        "schema_version": 1,
        "experiment": "DATA-03-vivo-full-audio-asr-2026-10-10-v1",
        "media_sha256": None,
        "model_repo": "Systran/faster-whisper-base",
        "model_revision": "ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66",
        "compute": "cpu_int8",
        "language": "zh_forced",
        "beam_size": 5,
        "vad_filter": False,
        "condition_on_previous_text": False,
        "segments": [],
        "status": "running",
    }
    started = perf_counter()
    try:
        assert sha256(MEDIA) == "7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507"
        report["media_sha256"] = sha256(MEDIA)
        sys.path.insert(0, str(PACKAGES))
        from faster_whisper import WhisperModel

        report["packages"] = {
            name: importlib.metadata.version(name)
            for name in ("faster-whisper", "ctranslate2", "av", "huggingface-hub", "tokenizers")
        }
        model = WhisperModel(str(MODEL), device="cpu", compute_type="int8")
        segments, info = model.transcribe(
            str(MEDIA), language="zh", task="transcribe", beam_size=5,
            vad_filter=False, condition_on_previous_text=False,
        )
        report["detected_language"] = info.language
        report["language_probability"] = info.language_probability
        for segment in segments:
            report["segments"].append({
                "start": segment.start, "end": segment.end, "text": segment.text,
            })
            assert len(report["segments"]) <= 2000, "segment cap exceeded"
        report["status"] = "complete_ai_unreviewed"
    except Exception as error:
        report["status"] = "failed"
        report["error"] = repr(error)
        raise
    finally:
        report["elapsed_seconds"] = round(perf_counter() - started, 3)
        (ATTEMPT / "raw.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print(json.dumps({"status": report["status"],
                          "segments": len(report["segments"]),
                          "elapsed_seconds": report["elapsed_seconds"]}))


if __name__ == "__main__":
    run()
