import os
import json
import requests
from core.config import ELEVENLABS_API_KEY, DEFAULT_MODEL

ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech"
ELEVENLABS_VOICES_URL = "https://api.elevenlabs.io/v1/voices"
CUSTOM_VOICES_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "custom_voices.json")


def text_to_speech(
    text: str,
    voice_id: str,
    model: str = DEFAULT_MODEL,
    speed: float = 1.0,
    stability: float = 0.5,
    similarity_boost: float = 0.75,
) -> bytes:
    """ElevenLabs APIでテキストを音声に変換する"""
    headers = {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
        "Accept": "audio/mpeg",
    }

    payload = {
        "text": text,
        "model_id": model,
        "voice_settings": {
            "stability": stability,
            "similarity_boost": similarity_boost,
            "speed": speed,
        },
    }

    response = requests.post(
        f"{ELEVENLABS_TTS_URL}/{voice_id}",
        headers=headers,
        json=payload,
        timeout=60,
    )
    response.raise_for_status()
    return response.content


def clone_voice(file_path: str, voice_name: str) -> str:
    """ボイスクローンを作成し、voice_idを返す"""
    headers = {"xi-api-key": ELEVENLABS_API_KEY}
    with open(file_path, "rb") as f:
        response = requests.post(
            f"{ELEVENLABS_VOICES_URL}/add",
            headers=headers,
            data={"name": voice_name},
            files={"files": f},
            timeout=120,
        )
    response.raise_for_status()
    data = response.json()
    return data["voice_id"]


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
    """ElevenLabs API接続テスト"""
    headers = {"xi-api-key": ELEVENLABS_API_KEY}
    response = requests.get(ELEVENLABS_VOICES_URL, headers=headers, timeout=30)
    response.raise_for_status()
    data = response.json()
    return {
        "success": True,
        "voice_count": len(data.get("voices", [])),
    }
