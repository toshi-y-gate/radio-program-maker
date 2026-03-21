import os
import io
import time
import streamlit as st
from datetime import datetime
from pydub import AudioSegment

from core.config import MINIMAX_API_KEY, PRESET_VOICES, BGM_DIR, OUTPUT_DIR
from core.tts import text_to_speech, test_connection
from core.script_parser import parse_script, get_speakers
from core.audio_mixer import (
    combine_audio_segments,
    add_bgm,
    export_audio,
    normalize_audio,
)
from core.cache import get_cached_audio, save_to_cache, get_cache_stats, clear_cache

st.set_page_config(
    page_title="ラジオ番組メーカー",
    page_icon="🎙️",
    layout="wide",
)

st.title("🎙️ ラジオ番組メーカー")
st.caption("スクリプトを入力して、AIボイスでラジオ番組を作成")

# --- サイドバー ---
with st.sidebar:
    st.header("⚙️ 設定")

    # API接続確認
    if st.button("🔌 API接続テスト"):
        with st.spinner("接続確認中..."):
            try:
                result = test_connection()
                if result["success"]:
                    st.success("接続成功！")
                else:
                    st.error(f"エラー: {result['message']}")
            except Exception as e:
                st.error(f"接続失敗: {e}")

    st.divider()

    # モデル選択
    model = st.selectbox(
        "音声モデル",
        ["speech-2.8-hd", "speech-2.8-turbo", "speech-2.6-hd", "speech-2.6-turbo"],
        index=0,
        help="HD = 高品質、Turbo = 高速",
    )

    # 音声設定
    st.subheader("🔊 音声設定")
    speed = st.slider("話速", 0.5, 2.0, 1.0, 0.1)
    volume = st.slider("音量", 0.1, 10.0, 1.0, 0.1)
    pitch = st.slider("ピッチ", -12, 12, 0)
    emotion = st.selectbox(
        "感情",
        ["calm", "happy", "sad", "angry", "surprised", "fluent", "whisper"],
        index=0,
    )

    st.divider()

    # BGM設定
    st.subheader("🎵 BGM設定")
    bgm_file = st.file_uploader(
        "BGMファイルをアップロード",
        type=["mp3", "wav", "ogg"],
    )
    if bgm_file:
        bgm_path = os.path.join(BGM_DIR, bgm_file.name)
        with open(bgm_path, "wb") as f:
            f.write(bgm_file.getbuffer())
        st.success(f"BGM保存: {bgm_file.name}")

    bgm_mode = st.selectbox(
        "BGM挿入モード",
        ["なし", "番組全体", "番組前のみ", "番組後のみ", "番組前後"],
        index=0,
    )
    bgm_mode_map = {
        "なし": None,
        "番組全体": "full",
        "番組前のみ": "intro",
        "番組後のみ": "outro",
        "番組前後": "intro_outro",
    }

    if bgm_mode != "なし":
        bgm_volume = st.slider("BGM音量 (dB)", -30, 0, -15)
        intro_sec = st.slider("イントロ長さ (秒)", 1, 10, 3)
        outro_sec = st.slider("アウトロ長さ (秒)", 1, 15, 5)

    st.divider()

    # キャッシュ情報
    st.subheader("💾 キャッシュ")
    stats = get_cache_stats()
    st.metric("キャッシュ済み音声", f"{stats['count']}件")
    st.caption(f"使用容量: {stats['size_mb']} MB")
    if stats["count"] > 0:
        if st.button("🗑️ キャッシュをクリア"):
            deleted = clear_cache()
            st.success(f"{deleted}件削除しました")

# --- メインエリア ---
tab1, tab2 = st.tabs(["📝 番組作成", "📖 使い方"])

with tab2:
    st.markdown("""
    ### スクリプトの書き方

    以下のいずれかの形式で話者とセリフを記述してください：

    ```
    [話者名] セリフテキスト
    【話者名】 セリフテキスト
    話者名: セリフテキスト
    話者名： セリフテキスト
    ```

    #### 例：2人の掛け合い
    ```
    [ホスト] こんにちは！本日の「テックニュース」のお時間です。
    [ゲスト] 今日は最新のAI事情についてお伝えします。
    [ホスト] まずはこちらのニュースから。
    ```

    #### 例：1人のナレーション
    ```
    [ナレーター] 皆さんこんにちは。今日のテーマは「朝の習慣」です。
    [ナレーター] 朝起きて最初にすることは何ですか？
    ```

    ### 話者について
    - 最大4名まで対応
    - 各話者に異なるボイスを割り当てられます
    - プリセットボイスまたはクローンボイスが使用可能
    """)

with tab1:
    # スクリプト入力
    sample_script = """[ホスト] こんにちは！「テックラジオ」のお時間です。パーソナリティの田中です。
[ゲスト] ゲストの佐藤です。今日もよろしくお願いします。
[ホスト] 今日のテーマは「AIと音声技術の未来」です。佐藤さん、最近のAI音声技術、すごいですよね。
[ゲスト] 本当にそうですね。わずか5秒の音声サンプルから、その人そっくりの声を再現できるんですから。"""

    script_text = st.text_area(
        "スクリプトを入力",
        value=sample_script,
        height=250,
        placeholder="[話者名] セリフを入力してください...",
    )

    # スクリプト解析
    if script_text:
        script_lines = parse_script(script_text)
        speakers = get_speakers(script_lines)

        if len(speakers) > 4:
            st.warning("⚠️ 話者は最大4名までです。最初の4名のみ使用されます。")
            speakers = speakers[:4]

        if speakers:
            st.subheader("🎤 話者ごとのボイス割り当て")

            voice_options = list(PRESET_VOICES.items())
            speaker_voices = {}

            cols = st.columns(min(len(speakers), 4))
            for i, speaker in enumerate(speakers):
                with cols[i]:
                    st.markdown(f"**{speaker}**")
                    selected = st.selectbox(
                        f"{speaker} のボイス",
                        options=[vid for vid, _ in voice_options],
                        format_func=lambda x: PRESET_VOICES[x],
                        key=f"voice_{speaker}",
                        index=min(i, len(voice_options) - 1),
                        label_visibility="collapsed",
                    )
                    speaker_voices[speaker] = selected

            st.divider()

            # プレビュー
            st.subheader("📋 スクリプトプレビュー")
            for line in script_lines:
                st.markdown(f"**{line.speaker}**: {line.text}")

            st.divider()

            # 生成ボタン
            if st.button("🚀 音声を生成する", type="primary", use_container_width=True):
                if not MINIMAX_API_KEY:
                    st.error("APIキーが設定されていません。`.env` ファイルを確認してください。")
                else:
                    progress_bar = st.progress(0)
                    status_text = st.empty()
                    audio_segments = []
                    total = len(script_lines)
                    cache_hits = 0
                    api_calls = 0

                    for i, line in enumerate(script_lines):
                        if line.speaker not in speaker_voices:
                            continue
                        voice_id = speaker_voices[line.speaker]

                        # キャッシュを確認
                        cached = get_cached_audio(
                            text=line.text,
                            voice_id=voice_id,
                            model=model,
                            speed=speed,
                            volume=volume,
                            pitch=pitch,
                            emotion=emotion,
                        )

                        if cached:
                            status_text.text(
                                f"キャッシュ利用 ({i + 1}/{total}) {line.speaker}: {line.text[:30]}..."
                            )
                            audio_segments.append(cached)
                            cache_hits += 1
                        else:
                            status_text.text(
                                f"生成中... ({i + 1}/{total}) {line.speaker}: {line.text[:30]}..."
                            )
                            try:
                                audio_bytes = text_to_speech(
                                    text=line.text,
                                    voice_id=voice_id,
                                    model=model,
                                    speed=speed,
                                    volume=volume,
                                    pitch=pitch,
                                    emotion=emotion,
                                )
                                # キャッシュに保存
                                save_to_cache(
                                    audio_bytes=audio_bytes,
                                    text=line.text,
                                    voice_id=voice_id,
                                    model=model,
                                    speed=speed,
                                    volume=volume,
                                    pitch=pitch,
                                    emotion=emotion,
                                )
                                audio_segments.append(audio_bytes)
                                api_calls += 1
                            except Exception as e:
                                st.error(f"エラー ({line.speaker}): {e}")
                                break

                        progress_bar.progress((i + 1) / total)

                    if audio_segments:
                        status_text.text("音声を結合中...")
                        combined = combine_audio_segments(audio_segments)
                        combined = normalize_audio(combined)

                        # BGM合成
                        selected_bgm_mode = bgm_mode_map.get(bgm_mode)
                        if selected_bgm_mode and bgm_file:
                            status_text.text("BGMを合成中...")
                            bgm_filepath = os.path.join(BGM_DIR, bgm_file.name)
                            combined = add_bgm(
                                voice_audio=combined,
                                bgm_path=bgm_filepath,
                                bgm_volume_db=bgm_volume,
                                intro_duration_ms=intro_sec * 1000,
                                outro_duration_ms=outro_sec * 1000,
                                bgm_mode=selected_bgm_mode,
                            )

                        # ファイル保存
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        filename = f"radio_{timestamp}"
                        filepath = export_audio(combined, filename)

                        # 完了
                        progress_bar.progress(1.0)
                        status_text.text("✅ 生成完了！")

                        # 再生 & ダウンロード
                        st.subheader("🎧 生成結果")

                        audio_buffer = io.BytesIO()
                        combined.export(audio_buffer, format="mp3")
                        audio_buffer.seek(0)

                        st.audio(audio_buffer, format="audio/mp3")

                        st.download_button(
                            label="💾 MP3をダウンロード",
                            data=audio_buffer.getvalue(),
                            file_name=f"{filename}.mp3",
                            mime="audio/mpeg",
                            use_container_width=True,
                        )

                        duration_sec = len(combined) / 1000
                        st.info(
                            f"📊 音声長さ: {duration_sec:.1f}秒 | "
                            f"話者数: {len(speakers)}名 | "
                            f"保存先: {filepath}"
                        )

                        # キャッシュ効果の表示
                        if cache_hits > 0:
                            st.success(
                                f"💾 キャッシュ効果: {cache_hits}/{total}件がキャッシュから取得 "
                                f"（API呼び出し{api_calls}回に削減！）"
                            )
