import os
import json
import hashlib
from core.config import HISTORY_DIR


def _get_history_file(user_email: str = None) -> str:
    """ユーザー別の履歴ファイルパスを返す"""
    if user_email:
        email_hash = hashlib.sha256(user_email.encode()).hexdigest()[:16]
        return os.path.join(HISTORY_DIR, f"{email_hash}.json")
    return os.path.join(HISTORY_DIR, "history.json")


def save_history(entry: dict, user_email: str = None) -> None:
    """生成履歴を保存"""
    filepath = _get_history_file(user_email)
    history = _load_raw(filepath)
    history.append(entry)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def load_history(user_email: str = None) -> list[dict]:
    """履歴一覧を新しい順で返す"""
    filepath = _get_history_file(user_email)
    history = _load_raw(filepath)
    history.reverse()
    return history


def delete_history(timestamp: str, user_email: str = None) -> None:
    """指定タイムスタンプの履歴を削除"""
    filepath = _get_history_file(user_email)
    history = _load_raw(filepath)
    history = [h for h in history if h.get("timestamp") != timestamp]
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def clear_history(user_email: str = None) -> int:
    """全履歴を削除。削除件数を返す"""
    filepath = _get_history_file(user_email)
    history = _load_raw(filepath)
    count = len(history)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump([], f)
    return count


def _load_raw(filepath: str) -> list[dict]:
    """JSONファイルから履歴を読み込む"""
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []
