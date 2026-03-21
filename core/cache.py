import os
import json
import hashlib
from core.config import OUTPUT_DIR

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache")
os.makedirs(CACHE_DIR, exist_ok=True)


def _make_cache_key(
    text: str,
    voice_id: str,
    model: str,
    speed: float,
    volume: float,
    pitch: int,
    emotion: str,
) -> str:
    """テキスト+設定からユニークなキャッシュキーを生成"""
    params = json.dumps(
        {
            "text": text,
            "voice_id": voice_id,
            "model": model,
            "speed": speed,
            "volume": volume,
            "pitch": pitch,
            "emotion": emotion,
        },
        sort_keys=True,
        ensure_ascii=False,
    )
    return hashlib.sha256(params.encode()).hexdigest()


def get_cached_audio(
    text: str,
    voice_id: str,
    model: str,
    speed: float,
    volume: float,
    pitch: int,
    emotion: str,
) -> bytes | None:
    """キャッシュから音声を取得。なければNoneを返す"""
    key = _make_cache_key(text, voice_id, model, speed, volume, pitch, emotion)
    cache_path = os.path.join(CACHE_DIR, f"{key}.mp3")

    if os.path.exists(cache_path):
        with open(cache_path, "rb") as f:
            return f.read()
    return None


def save_to_cache(
    audio_bytes: bytes,
    text: str,
    voice_id: str,
    model: str,
    speed: float,
    volume: float,
    pitch: int,
    emotion: str,
) -> None:
    """音声をキャッシュに保存"""
    key = _make_cache_key(text, voice_id, model, speed, volume, pitch, emotion)
    cache_path = os.path.join(CACHE_DIR, f"{key}.mp3")

    with open(cache_path, "wb") as f:
        f.write(audio_bytes)


def get_cache_stats() -> dict:
    """キャッシュの統計情報を返す"""
    files = [f for f in os.listdir(CACHE_DIR) if f.endswith(".mp3")]
    total_size = sum(os.path.getsize(os.path.join(CACHE_DIR, f)) for f in files)
    return {
        "count": len(files),
        "size_mb": round(total_size / (1024 * 1024), 2),
    }


def clear_cache() -> int:
    """キャッシュを全削除。削除したファイル数を返す"""
    files = [f for f in os.listdir(CACHE_DIR) if f.endswith(".mp3")]
    for f in files:
        os.remove(os.path.join(CACHE_DIR, f))
    return len(files)
