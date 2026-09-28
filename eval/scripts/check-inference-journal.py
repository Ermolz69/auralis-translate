"""Check real proxy observations against the durable v5 chat request journal."""

import hashlib
import json
import sqlite3
import sys
from pathlib import Path


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: check-inference-journal.py <latest-path-file>")
    latest = Path(sys.argv[1])
    workspace = Path(latest.read_text(encoding="utf-8").strip())
    report = json.loads((workspace / "report.json").read_text(encoding="utf-8"))
    if report["status"] != "passed_structural_probe":
        raise ValueError("paired experiment did not pass its structural checks")
    checked = []
    for case in report["cases"]:
        for arm in case["arms"]:
            arm_key = f"{case['id']}:{arm['arm']}"
            chats = [entry for entry in report["requests"]
                     if entry.get("arm") == arm_key
                     and entry.get("path") == "/v1/chat/completions"]
            database = Path(arm["state"]) / "auralis-translate.sqlite"
            uri = f"file:{database.as_posix()}?mode=ro"
            with sqlite3.connect(uri, uri=True) as connection:
                connection.execute("PRAGMA query_only = ON")
                rows = connection.execute(
                    "SELECT request_id, run_id, batch_fingerprint, segment_id, line_index, "
                    "request_sha256, rendered_request, outcome, raw_response, "
                    "restored_candidate, prompt_tokens, completion_tokens, elapsed_ms "
                    "FROM inference_requests WHERE run_id = ? ORDER BY sequence",
                    (arm["run_id"],),
                ).fetchall()
            if len(rows) != len(chats) or not rows:
                raise ValueError(f"{arm_key}: journal/chat request count differs")
            by_hash = {entry["request_sha256"]: entry for entry in chats}
            if len(by_hash) != len(chats):
                raise ValueError(f"{arm_key}: repeated chat body cannot be paired")
            for row in rows:
                (request_id, run_id, fingerprint, segment_id, line_index, request_hash,
                 body, outcome, raw, restored, prompt_tokens, completion_tokens,
                 elapsed_ms) = row
                entry = by_hash.pop(request_hash, None)
                if entry is None or request_hash != sha256(body):
                    raise ValueError(f"{arm_key}: request body hash differs")
                if run_id != arm["run_id"] or len(request_id) != 36 or len(fingerprint) != 64:
                    raise ValueError(f"{arm_key}: run/request identity differs")
                if json.loads(body) != entry["request"]:
                    raise ValueError(f"{arm_key}: rendered request differs")
                if raw != entry["raw_response"].encode("utf-8"):
                    raise ValueError(f"{arm_key}: raw model response differs")
                if outcome != "validated_line" or not restored or elapsed_ms < 0:
                    raise ValueError(f"{arm_key}: request was not validated")
                usage = entry.get("usage") or {}
                if prompt_tokens != usage.get("prompt_tokens") or completion_tokens != usage.get("completion_tokens"):
                    raise ValueError(f"{arm_key}: server token usage differs")
                if segment_id == case["target_id"] and line_index == 0 and restored != arm["accepted_target"]:
                    raise ValueError(f"{arm_key}: saved target differs from accepted text")
            if by_hash:
                raise ValueError(f"{arm_key}: model chat lacks journal row")
            checked.append({"arm": arm_key, "chats": len(chats), "run_id": arm["run_id"]})
    result = {"schema_version": 1, "experiment": report["experiment"],
              "report_sha256": sha256((workspace / "report.json").read_bytes()),
              "checked": checked, "status": "passed"}
    (workspace / "journal-check.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
