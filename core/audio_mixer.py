import io
import os
from pydub import AudioSegment
from core.config import OUTPUT_DIR


def combine_audio_segments(segments: list[bytes], pause_ms: int = 500) -> AudioSegment:
    """複数の音声セグメントを結合する（間にポーズを挿入）"""
    silence = AudioSegment.silent(duration=pause_ms)
    combined = AudioSegment.empty()

    for i, seg_bytes in enumerate(segments):
        segment = AudioSegment.from_mp3(io.BytesIO(seg_bytes))
        combined += segment
        if i < len(segments) - 1:
            combined += silence

    return combined


def add_bgm(
    voice_audio: AudioSegment,
    bgm_path: str,
    bgm_volume_db: float = -15.0,
    intro_duration_ms: int = 3000,
    outro_duration_ms: int = 5000,
    bgm_mode: str = "full",
) -> AudioSegment:
    """音声にBGMを合成する

    bgm_mode:
        "full"  - 番組全体にBGMを重ねる
        "intro" - 番組前のみ
        "outro" - 番組後のみ
        "intro_outro" - 番組前後のみ
    """
    bgm = AudioSegment.from_file(bgm_path)
    bgm = bgm + bgm_volume_db  # 音量調整

    if bgm_mode == "full":
        # BGMを番組全体の長さにループ
        total_duration = len(voice_audio) + intro_duration_ms + outro_duration_ms
        bgm_loop = _loop_bgm(bgm, total_duration)

        # イントロ（BGMのみ）+ 音声 + アウトロ（BGMのみ）
        intro_bgm = bgm_loop[:intro_duration_ms].fade_in(1000)
        main_bgm = bgm_loop[intro_duration_ms:intro_duration_ms + len(voice_audio)]
        outro_bgm = bgm_loop[intro_duration_ms + len(voice_audio):].fade_out(outro_duration_ms)

        result = intro_bgm + voice_audio.overlay(main_bgm) + outro_bgm

    elif bgm_mode == "intro":
        intro_bgm = _loop_bgm(bgm, intro_duration_ms).fade_in(1000).fade_out(1000)
        result = intro_bgm + voice_audio

    elif bgm_mode == "outro":
        outro_bgm = _loop_bgm(bgm, outro_duration_ms).fade_in(1000).fade_out(outro_duration_ms)
        result = voice_audio + outro_bgm

    elif bgm_mode == "intro_outro":
        intro_bgm = _loop_bgm(bgm, intro_duration_ms).fade_in(1000).fade_out(1000)
        outro_bgm = _loop_bgm(bgm, outro_duration_ms).fade_in(1000).fade_out(outro_duration_ms)
        result = intro_bgm + voice_audio + outro_bgm

    else:
        result = voice_audio

    return result


def _loop_bgm(bgm: AudioSegment, target_duration_ms: int) -> AudioSegment:
    """BGMを指定の長さになるまでループする"""
    if len(bgm) == 0:
        return AudioSegment.silent(duration=target_duration_ms)

    loops_needed = (target_duration_ms // len(bgm)) + 1
    looped = bgm * loops_needed
    return looped[:target_duration_ms]


def export_audio(
    audio: AudioSegment,
    filename: str,
    format: str = "mp3",
) -> str:
    """音声をファイルに書き出す"""
    if not filename.endswith(f".{format}"):
        filename = f"{filename}.{format}"

    filepath = os.path.join(OUTPUT_DIR, filename)
    audio.export(filepath, format=format)
    return filepath


def normalize_audio(audio: AudioSegment, target_dbfs: float = -14.0) -> AudioSegment:
    """音量を正規化する"""
    change_in_dbfs = target_dbfs - audio.dBFS
    return audio.apply_gain(change_in_dbfs)
