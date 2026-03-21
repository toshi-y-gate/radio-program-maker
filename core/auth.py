import os
import json
import hashlib
import secrets
import re
from datetime import datetime
from core.config import USERS_DIR

USERS_FILE = os.path.join(USERS_DIR, "users.json")


def _hash_password(password: str, salt: str = None) -> tuple[str, str]:
    """パスワードをPBKDF2でハッシュ化。(hash, salt) を返す"""
    if salt is None:
        salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return pw_hash.hex(), salt


def _load_users() -> dict:
    """ユーザーデータを読み込む"""
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}


def _save_users(users: dict) -> None:
    """ユーザーデータを保存"""
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)


def register_user(email: str, password: str, display_name: str) -> tuple[bool, str]:
    """ユーザー登録。(成功フラグ, メッセージ) を返す"""
    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
        return False, "メールアドレスの形式が正しくありません。"

    if len(password) < 8:
        return False, "パスワードは8文字以上で設定してください。"

    if not display_name.strip():
        return False, "表示名を入力してください。"

    users = _load_users()
    if email in users:
        return False, "このメールアドレスは既に登録されています。"

    pw_hash, salt = _hash_password(password)
    users[email] = {
        "display_name": display_name.strip(),
        "password_hash": pw_hash,
        "salt": salt,
        "created_at": datetime.now().isoformat(),
        "usage": {},
    }
    _save_users(users)
    return True, "登録が完了しました。"


def authenticate(email: str, password: str) -> dict | None:
    """ログイン認証。成功時はユーザー情報を返す、失敗時はNone"""
    users = _load_users()
    user = users.get(email)
    if not user:
        return None

    pw_hash, _ = _hash_password(password, user["salt"])
    if pw_hash != user["password_hash"]:
        return None

    return {"email": email, "display_name": user["display_name"]}


def get_user(email: str) -> dict | None:
    """ユーザー情報を取得"""
    users = _load_users()
    user = users.get(email)
    if not user:
        return None
    return {"email": email, "display_name": user["display_name"]}


def get_usage(email: str) -> dict:
    """当月の利用量を返す {generation_count, total_characters}"""
    users = _load_users()
    user = users.get(email)
    if not user:
        return {"generation_count": 0, "total_characters": 0}

    current_month = datetime.now().strftime("%Y-%m")
    monthly = user.get("usage", {}).get(current_month, {})
    return {
        "generation_count": monthly.get("generation_count", 0),
        "total_characters": monthly.get("total_characters", 0),
    }


def increment_usage(email: str, characters: int) -> None:
    """利用量を加算"""
    users = _load_users()
    user = users.get(email)
    if not user:
        return

    current_month = datetime.now().strftime("%Y-%m")
    if "usage" not in user:
        user["usage"] = {}
    if current_month not in user["usage"]:
        user["usage"][current_month] = {"generation_count": 0, "total_characters": 0}

    user["usage"][current_month]["generation_count"] += 1
    user["usage"][current_month]["total_characters"] += characters
    _save_users(users)
