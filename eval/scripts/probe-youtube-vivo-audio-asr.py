import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import re
import sys
from time import perf_counter


ROOT = Path(__file__).resolve().parents[2]
AUDIO = ROOT / ".cache/eval/vivo-original-source-audio"
SOURCE = ROOT / ".cache/eval/youtube-geekerwan-vivo-original-caption/attempt-LQWxgw/source.zh.srt"
PACKAGES = ROOT / ".cache/eval/vivo-asr-packages"
MODEL = ROOT / ".cache/eval/vivo-asr-model"
REVISION = "ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66"
WINDOWS = (
    ("start", 0, "1774c0fe3449dd594af58cf4ebf8f037cc0df0b0812f6727e7338c71d680e402"),
    ("middle", 563, "851cf0e806a10b0b1e85eefe39229fc4eb7c551a3f331693730afd4ac9c837d3"),
    ("end", 1102, "1259b66490f21ef5a43d88feacbb5238a64cfbb220eb512e260d896b47d0c970"),
)


def sha256(file: Path) -> str:
    digest = hashlib.sha256()
    with file.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1_048_576), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_inputs() -> dict:
    expected_source = "b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4"
    assert sha256(SOURCE) == expected_source
    for label, _, expected in WINDOWS:
        assert sha256(AUDIO / f"{label}.wav") == expected
    return {"source_srt_sha256": expected_source,
            "audio_sha256": {label: expected for label, _, expected in WINDOWS}}


def source_cues() -> list[dict]:
    cues = []
    raw = SOURCE.read_text(encoding="utf-8").strip()
    for block in re.split(r"\n\n+", raw):
        label, timing, *text = block.splitlines()
        start, end = timing.split(" --> ")

        def seconds(value: str) -> float:
            hours, minutes, rest = value.split(":")
            second, millis = rest.split(",")
            return int(hours) * 3600 + int(minutes) * 60 + int(second) + int(millis) / 1000

        cues.append({"id": int(label), "start": seconds(start),
                     "end": seconds(end), "text": "\n".join(text)})
    assert len(cues) == 467
    return cues


def run() -> None:
    verified = verify_inputs()
    if sys.argv[1:] == ["--preflight"]:
        print(json.dumps({"experiment": "DATA-03-vivo-audio-asr-three-windows-2026-10-09-v1",
                          "inputs": verified, "model_revision": REVISION,
                          "audio_windows_seconds": [12, 12, 12],
                          "compute": "cpu_int8", "beam_size": 5,
                          "model_size_cap_bytes": 220 * 1024 * 1024,
                          "process_timeout_ms": 600_000}, indent=2))
        return
    assert not sys.argv[1:]
    attempt = Path(os.environ["AURALIS_ASR_ATTEMPT_DIR"])
    assert attempt.is_dir()
    sys.path.insert(0, str(PACKAGES))
    from faster_whisper import WhisperModel
    from huggingface_hub import snapshot_download

    started = perf_counter()
    report = {"schema_version": 1,
              "experiment": "DATA-03-vivo-audio-asr-three-windows-2026-10-09-v1",
              "inputs": verified, "model_repo": "Systran/faster-whisper-base",
              "model_revision": REVISION, "compute": "cpu_int8",
              "beam_size": 5, "language": "zh", "windows": [],
              "status": "running"}
    try:
        snapshot_download(repo_id=report["model_repo"], revision=REVISION,
                          local_dir=MODEL,
                          allow_patterns=["config.json", "model.bin", "tokenizer.json",
                                          "vocabulary.txt"])
        files = sorted(file for file in MODEL.iterdir() if file.is_file())
        report["model_files"] = {file.name: {"bytes": file.stat().st_size,
                                             "sha256": sha256(file)} for file in files}
        assert sum(item["bytes"] for item in report["model_files"].values()) <= 220 * 1024 * 1024
        report["packages"] = {name: importlib.metadata.version(name)
                              for name in ("faster-whisper", "ctranslate2", "av",
                                           "huggingface-hub", "tokenizers")}
        model = WhisperModel(str(MODEL), device="cpu", compute_type="int8")
        for label, position, _ in WINDOWS:
            window_start = perf_counter()
            segments, info = model.transcribe(str(AUDIO / f"{label}.wav"),
                                               language="zh", task="transcribe",
                                               beam_size=5, vad_filter=False,
                                               condition_on_previous_text=False)
            transcribed = [{"start": segment.start, "end": segment.end,
                            "text": segment.text} for segment in segments]
            report["windows"].append({"label": label, "source_start_seconds": position,
                                      "detected_language": info.language,
                                      "language_probability": info.language_probability,
                                      "elapsed_seconds": round(perf_counter() - window_start, 3),
                                      "segments": transcribed})
        cues = source_cues()
        for window in report["windows"]:
            begin = window["source_start_seconds"]
            window["overlapping_source_cues"] = [cue for cue in cues
                                                  if cue["start"] < begin + 12 and cue["end"] > begin]
        report["status"] = "ai_transcript_unreviewed"
    except Exception as error:
        report["status"] = "failed"
        report["error"] = repr(error)
        raise
    finally:
        report["total_elapsed_seconds"] = round(perf_counter() - started, 3)
        (attempt / "raw.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n",
                                           encoding="utf-8")
        print(json.dumps({"status": report["status"],
                          "completed_windows": len(report["windows"]),
                          "elapsed_seconds": report["total_elapsed_seconds"]}))


if __name__ == "__main__":
    run()
