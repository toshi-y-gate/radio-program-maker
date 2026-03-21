import requests
from core.config import MINIMAX_API_KEY, MINIMAX_API_URL, DEFAULT_MODEL, AUDIO_SETTINGS


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
