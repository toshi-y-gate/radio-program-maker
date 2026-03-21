import os
import json
import requests
from core.config import MINIMAX_API_KEY, MINIMAX_API_URL, DEFAULT_MODEL, AUDIO_SETTINGS

MINIMAX_UPLOAD_URL = "https://api.minimax.io/v1/files/upload"
MINIMAX_CLONE_URL = "https://api.minimax.io/v1/voice_clone"
CUSTOM_VOICES_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "custom_voices.json")


def text_to_speech(
    text: str,
    voice_id: str,
    model: str = DEFAULT_MODEL,
    speed: float = 1.0,
    volume: float = 1.0,
    pitch: int = 0,
    emotion: str = "calm",
    language_boost: str = "auto",
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

    response = requests.post(MINIMAX_API_URL, headers=headers, json=payload, timeout=60)
    response.raise_for_status()

    data = response.json()

    if data.get("base_resp", {}).get("status_code", -1) != 0:
        error_msg = data.get("base_resp", {}).get("status_msg", "Unknown error")
        raise RuntimeError(f"MiniMax API error: {error_msg}")

    audio_hex = data["data"]["audio"]
    audio_bytes = bytes.fromhex(audio_hex)

    return audio_bytes


def upload_voice_file(file_path: str) -> str:
    """音声ファイルをMiniMax APIにアップロードし、file_idを返す"""
    headers = {"Authorization": f"Bearer {MINIMAX_API_KEY}"}
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
    file_id = data.get("file", {}).get("file_id")
    if not file_id:
        raise RuntimeError(f"ファイルアップロード失敗: {data}")
    return file_id


def clone_voice(file_id: str, voice_id: str, demo_text: str = "こんにちは、ボイスクローンのテストです。") -> bytes:
    """ボイスクローンを作成し、デモ音声を返す"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MINIMAX_API_KEY}",
    }
    payload = {
        "file_id": file_id,
        "voice_id": voice_id,
        "text": demo_text,
        "model": DEFAULT_MODEL,
    }
    response = requests.post(MINIMAX_CLONE_URL, headers=headers, json=payload, timeout=120)
    response.raise_for_status()
    data = response.json()

    if data.get("base_resp", {}).get("status_code", -1) != 0:
        error_msg = data.get("base_resp", {}).get("status_msg", "Unknown error")
        raise RuntimeError(f"ボイスクローン失敗: {error_msg}")

    audio_hex = data["data"]["audio"]
    return bytes.fromhex(audio_hex)


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
    return {
        "success": data.get("base_resp", {}).get("status_code") == 0,
        "message": data.get("base_resp", {}).get("status_msg", ""),
        "usage_characters": data.get("extra_info", {}).get("usage_characters", 0),
    }
