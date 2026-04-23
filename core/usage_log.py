import os
import json
from datetime import datetime, timezone

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
LOG_FILE = os.path.join(LOG_DIR, "api_usage.jsonl")


def log_api_call(
    function: str,
    voice_id: str | None = None,
    text_length: int = 0,
    model: str | None = None,
    user_id: str | None = None,
    success: bool = True,
    error: str | None = None,
    usage_characters: int | None = None,
) -> None:
    """MiniMax API呼び出しをlogs/api_usage.jsonlに記録する（失敗してもアプリは止めない）"""
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "function": function,
            "user_id": user_id,
            "voice_id": voice_id,
            "text_length": text_length,
            "model": model,
            "success": success,
            "error": error,
            "usage_characters": usage_characters,
        }
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        pass


def get_usage_summary(user_id: str | None = None, since_iso: str | None = None) -> dict:
    """使用量サマリを取得。user_id/時刻で絞り込み可能"""
    if not os.path.exists(LOG_FILE):
        return {"calls": 0, "characters": 0, "errors": 0}

    calls = 0
    characters = 0
    errors = 0
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if user_id and entry.get("user_id") != user_id:
                    continue
                if since_iso and entry.get("timestamp", "") < since_iso:
                    continue
                calls += 1
                characters += entry.get("usage_characters") or entry.get("text_length", 0) or 0
                if not entry.get("success"):
                    errors += 1
    except Exception:
        pass

    return {"calls": calls, "characters": characters, "errors": errors}
