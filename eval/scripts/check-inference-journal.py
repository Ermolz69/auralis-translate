"""Check real proxy observations against the durable v5 request journal."""

import hashlib
import json
import sqlite3
import sys
from pathlib import Path


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


PATH_KIND = {
    "/v1/chat/completions": "chat_completion",
    "/apply-template": "apply_template",
    "/tokenize": "tokenize",
}


def check_preflight(arm_key: str, entry: dict, body: bytes, raw: bytes) -> None:
    if raw is None:
        raise ValueError(f"{arm_key}: preflight response body is missing")
    request = json.loads(body)
    reply = json.loads(raw)
    if entry["path"] == "/apply-template":
        if request != entry["request"]:
            raise ValueError(f"{arm_key}: template request differs")
        rendered = reply.get("prompt")
        if not isinstance(rendered, str) or not rendered:
            raise ValueError(f"{arm_key}: rendered template is empty")
        if sha256(rendered.encode("utf-8")) != entry["rendered_prompt_sha256"]:
            raise ValueError(f"{arm_key}: rendered template hash differs")
    else:
        rendered = request.get("content")
        tokens = reply.get("tokens")
        if (not isinstance(rendered, str)
                or sha256(rendered.encode("utf-8")) != entry["rendered_prompt_sha256"]
                or not isinstance(tokens, list)
                or not tokens
                or any(not isinstance(token, int) or isinstance(token, bool) for token in tokens)
                or len(tokens) != entry["token_count"]):
            raise ValueError(f"{arm_key}: tokenizer request or token count differs")


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
            observed = [entry for entry in report["requests"]
                        if entry.get("arm") == arm_key
                        and entry.get("path") in PATH_KIND]
            database = Path(arm["state"]) / "auralis-translate.sqlite"
            uri = f"file:{database.as_posix()}?mode=ro"
            with sqlite3.connect(uri, uri=True) as connection:
                connection.execute("PRAGMA query_only = ON")
                has_kind = any(column[1] == "request_kind" for column in
                               connection.execute("PRAGMA table_info(inference_requests)"))
                kind_column = "request_kind" if has_kind else "'chat_completion'"
                rows = connection.execute(
                    f"SELECT request_id, run_id, {kind_column}, batch_fingerprint, segment_id, line_index, "
                    "request_sha256, rendered_request, outcome, raw_response, "
                    "restored_candidate, prompt_tokens, completion_tokens, elapsed_ms "
                    "FROM inference_requests WHERE run_id = ? ORDER BY sequence",
                    (arm["run_id"],),
                ).fetchall()
            if not has_kind:
                observed = [entry for entry in observed if entry["path"] == "/v1/chat/completions"]
            if len(rows) != len(observed) or not rows:
                raise ValueError(f"{arm_key}: journal/request count differs")
            chats_checked = 0
            preflights_checked = 0
            for row, entry in zip(rows, observed):
                (request_id, run_id, kind, fingerprint, segment_id, line_index, request_hash,
                 body, outcome, raw, restored, prompt_tokens, completion_tokens,
                 elapsed_ms) = row
                if (kind != PATH_KIND[entry["path"]]
                        or request_hash != entry["request_sha256"]
                        or request_hash != sha256(body)):
                    raise ValueError(f"{arm_key}: request body hash differs")
                if run_id != arm["run_id"] or len(request_id) != 36 or len(fingerprint) != 64:
                    raise ValueError(f"{arm_key}: run/request identity differs")
                if elapsed_ms is None or elapsed_ms < 0:
                    raise ValueError(f"{arm_key}: request duration is missing")
                if kind != "chat_completion":
                    if (outcome != "parsed_preflight_json" or restored is not None
                            or prompt_tokens is not None or completion_tokens is not None):
                        raise ValueError(f"{arm_key}: preflight has an invalid outcome")
                    check_preflight(arm_key, entry, body, raw)
                    preflights_checked += 1
                    continue
                chats_checked += 1
                if json.loads(body) != entry["request"]:
                    raise ValueError(f"{arm_key}: rendered chat request differs")
                prompt = entry["request"]["messages"][0]["content"]
                reference = case.get("proposed_reference_ru")
                if reference and reference in prompt:
                    raise ValueError(f"{arm_key}: proposed reference entered model input")
                if raw != entry["raw_response"].encode("utf-8"):
                    raise ValueError(f"{arm_key}: raw model response differs")
                if outcome != "validated_line" or not restored:
                    raise ValueError(f"{arm_key}: request was not validated")
                usage = entry.get("usage") or {}
                if prompt_tokens != usage.get("prompt_tokens") or completion_tokens != usage.get("completion_tokens"):
                    raise ValueError(f"{arm_key}: server token usage differs")
                if segment_id == case["target_id"] and line_index == 0 and restored != arm["accepted_target"]:
                    raise ValueError(f"{arm_key}: saved target differs from accepted text")
            checked.append({"arm": arm_key, "chats": chats_checked,
                            "preflights": preflights_checked, "run_id": arm["run_id"]})
    result = {"schema_version": 1, "experiment": report["experiment"],
              "report_sha256": sha256((workspace / "report.json").read_bytes()),
              "checked": checked, "status": "passed"}
    (workspace / "journal-check.json").write_bytes((json.dumps(result, indent=2) + "\n").encode("utf-8"))
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
