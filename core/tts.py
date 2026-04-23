import os
import json
import re
import requests
from datetime import datetime, timedelta
from core.config import MINIMAX_API_KEY, MINIMAX_API_URL, DEFAULT_MODEL, AUDIO_SETTINGS
from core.usage_log import log_api_call

MINIMAX_UPLOAD_URL = "https://api.minimax.io/v1/files/upload"
MINIMAX_CLONE_URL = "https://api.minimax.io/v1/voice_clone"
MINIMAX_DOCS_URL = "https://platform.minimax.io/docs/guides/text-to-speech"
CUSTOM_VOICES_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "custom_voices.json")
_MODEL_CHECK_CACHE = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".model_check_cache.json")


def text_to_speech(
    text: str,
    voice_id: str,
    model: str = DEFAULT_MODEL,
    speed: float = 1.0,
    volume: float = 1.0,
    pitch: int = 0,
    emotion: str = "calm",
    language_boost: str = "auto",
    user_id: str | None = None,
) -> bytes:
    """MiniMax APIでテキストを音声に変換する"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MINIMAX_API_KEY}",
    }

    payload = {
        "model": model,
        "text": text,
        "stream": False,
        "language_boost": language_boost,
        "voice_setting": {
            "voice_id": voice_id,
            "speed": speed,
            "vol": volume,
            "pitch": pitch,
            "emotion": emotion,
        },
        "audio_setting": AUDIO_SETTINGS,
    }

    try:
        response = requests.post(MINIMAX_API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()

        if data.get("base_resp", {}).get("status_code", -1) != 0:
            error_msg = data.get("base_resp", {}).get("status_msg", "Unknown error")
            log_api_call("text_to_speech", voice_id=voice_id, text_length=len(text),
                         model=model, user_id=user_id, success=False, error=error_msg)
            raise RuntimeError(f"MiniMax API error: {error_msg}")

        audio_hex = data["data"]["audio"]
        audio_bytes = bytes.fromhex(audio_hex)
        usage = data.get("extra_info", {}).get("usage_characters")
        log_api_call("text_to_speech", voice_id=voice_id, text_length=len(text),
                     model=model, user_id=user_id, success=True, usage_characters=usage)
        return audio_bytes
    except requests.RequestException as e:
        log_api_call("text_to_speech", voice_id=voice_id, text_length=len(text),
                     model=model, user_id=user_id, success=False, error=str(e))
        raise


def upload_voice_file(file_path: str, user_id: str | None = None) -> int:
    """音声ファイルをMiniMax APIにアップロードし、file_idを返す"""
    headers = {"Authorization": f"Bearer {MINIMAX_API_KEY}"}
    try:
        with open(file_path, "rb") as f:
            response = requests.post(
                MINIMAX_UPLOAD_URL,
                headers=headers,
                data={"purpose": "voice_clone"},
                files={"file": f},
                timeout=60,
            )
        response.raise_for_status()
        data = response.json()
        if data.get("base_resp", {}).get("status_code", -1) != 0:
            error_msg = data.get("base_resp", {}).get("status_msg", "Unknown error")
            log_api_call("upload_voice_file", user_id=user_id, success=False, error=error_msg)
            raise RuntimeError(f"ファイルアップロード失敗: {error_msg}")
        file_obj = data.get("file")
        if not file_obj:
            log_api_call("upload_voice_file", user_id=user_id, success=False, error="no_file_in_response")
            raise RuntimeError(f"ファイルアップロード失敗: レスポンスにfileがありません: {data}")
        file_id = file_obj.get("file_id")
        if not file_id:
            log_api_call("upload_voice_file", user_id=user_id, success=False, error="no_file_id")
            raise RuntimeError(f"ファイルアップロード失敗: file_idがありません: {data}")
        log_api_call("upload_voice_file", user_id=user_id, success=True)
        return file_id
    except requests.RequestException as e:
        log_api_call("upload_voice_file", user_id=user_id, success=False, error=str(e))
        raise


def clone_voice(file_id, voice_id: str, demo_text: str = "こんにちは、ボイスクローンのテストです。", user_id: str | None = None) -> bytes:
    """ボイスクローンを登録し、デモ音声を生成して返す"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MINIMAX_API_KEY}",
    }
    payload = {
        "file_id": file_id,
        "voice_id": voice_id,
    }
    try:
        response = requests.post(MINIMAX_CLONE_URL, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        data = response.json()

        if data.get("base_resp", {}).get("status_code", -1) != 0:
            error_msg = data.get("base_resp", {}).get("status_msg", "Unknown error")
            log_api_call("clone_voice", voice_id=voice_id, user_id=user_id, success=False, error=error_msg)
            raise RuntimeError(f"ボイスクローン登録失敗: {error_msg}")

        log_api_call("clone_voice", voice_id=voice_id, user_id=user_id, success=True)
        return text_to_speech(demo_text, voice_id, user_id=user_id)
    except requests.RequestException as e:
        log_api_call("clone_voice", voice_id=voice_id, user_id=user_id, success=False, error=str(e))
        raise


def load_custom_voices() -> dict[str, str]:
    """保存済みカスタムボイスを読み込む {voice_id: display_name}"""
    if not os.path.exists(CUSTOM_VOICES_FILE):
        return {}
    with open(CUSTOM_VOICES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_custom_voice(voice_id: str, display_name: str) -> None:
    """カスタムボイスを保存する"""
    voices = load_custom_voices()
    voices[voice_id] = display_name
    with open(CUSTOM_VOICES_FILE, "w", encoding="utf-8") as f:
        json.dump(voices, f, ensure_ascii=False, indent=2)


def delete_custom_voice(voice_id: str) -> None:
    """カスタムボイスを削除する"""
    voices = load_custom_voices()
    voices.pop(voice_id, None)
    with open(CUSTOM_VOICES_FILE, "w", encoding="utf-8") as f:
        json.dump(voices, f, ensure_ascii=False, indent=2)


def test_connection() -> dict:
    """API接続テスト（短いテキストで確認）"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MINIMAX_API_KEY}",
    }

    payload = {
        "model": DEFAULT_MODEL,
        "text": "接続テストです。",
        "stream": False,
        "language_boost": "auto",
        "voice_setting": {
            "voice_id": "Japanese_Whisper_Belle",
            "speed": 1.0,
            "vol": 1.0,
            "pitch": 0,
        },
        "audio_setting": AUDIO_SETTINGS,
    }

    response = requests.post(MINIMAX_API_URL, headers=headers, json=payload, timeout=30)
    response.raise_for_status()

    data = response.json()
    success = data.get("base_resp", {}).get("status_code") == 0
    msg = data.get("base_resp", {}).get("status_msg", "")
    usage = data.get("extra_info", {}).get("usage_characters", 0)
    log_api_call("test_connection", text_length=len("接続テストです。"),
                 model=DEFAULT_MODEL, success=success, error=None if success else msg,
                 usage_characters=usage)
    return {"success": success, "message": msg, "usage_characters": usage}


def check_model_update() -> str | None:
    """MiniMaxドキュメントから最新モデルを確認。新バージョンがあればモデル名を返す。1日1回のみチェック。"""
    # キャッシュ確認（1日1回に制限）
    if os.path.exists(_MODEL_CHECK_CACHE):
        with open(_MODEL_CHECK_CACHE, "r") as f:
            cache = json.load(f)
        checked_at = datetime.fromisoformat(cache.get("checked_at", "2000-01-01"))
        if datetime.now() - checked_at < timedelta(days=1):
            return cache.get("new_model")

    new_model = None
    try:
        resp = requests.get(MINIMAX_DOCS_URL, timeout=10)
        # ドキュメントからspeech-X.X-hd パターンを抽出
        models = re.findall(r"speech-(\d+\.\d+)-hd", resp.text)
        if models:
            # バージョン番号で降順ソートして最新を取得
            latest = sorted(set(models), key=lambda v: float(v), reverse=True)[0]
            current = re.search(r"(\d+\.\d+)", DEFAULT_MODEL)
            if current and float(latest) > float(current.group(1)):
                new_model = f"speech-{latest}-hd"
    except Exception:
        pass

    # 結果をキャッシュ
    with open(_MODEL_CHECK_CACHE, "w") as f:
        json.dump({"checked_at": datetime.now().isoformat(), "new_model": new_model}, f)

    return new_model
