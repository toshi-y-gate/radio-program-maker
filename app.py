import os
import io
import time
import streamlit as st
from datetime import datetime
from pydub import AudioSegment

from core.config import MINIMAX_API_KEY, PRESET_VOICES, BGM_DIR, OUTPUT_DIR, SCRIPT_TEMPLATES, SUPPORTED_LANGUAGES
from core.tts import (
    text_to_speech,
    test_connection,
    upload_voice_file,
    clone_voice,
    load_custom_voices,
    save_custom_voice,
    delete_custom_voice,
    check_model_update,
)
from core.script_parser import parse_script, get_speakers
from core.audio_mixer import (
    combine_audio_segments,
    add_bgm,
    export_audio,
    normalize_audio,
)
from core.cache import get_cached_audio, save_to_cache, get_cache_stats, clear_cache
from core.history import save_history, load_history, delete_history, clear_history
from core.auth import register_user, authenticate, get_usage, increment_usage, create_session, validate_session, delete_session

st.set_page_config(
    page_title="ラジオ番組メーカー",
    page_icon="🎙️",
    layout="wide",
)

# --- 認証状態の初期化（リロード時はトークンから復元） ---
if "authenticated" not in st.session_state:
    st.session_state["authenticated"] = False
    st.session_state["user_email"] = None
    st.session_state["user_name"] = None

    token = st.query_params.get("token")
    if token:
        user = validate_session(token)
        if user:
            st.session_state["authenticated"] = True
            st.session_state["user_email"] = user["email"]
            st.session_state["user_name"] = user["display_name"]
            st.session_state["session_token"] = token


# === ログイン/登録画面 ===
def show_auth_page():
    st.title("🎙️ ラジオ番組メーカー")
    st.caption("ログインまたは新規登録してください")

    auth_tab1, auth_tab2 = st.tabs(["🔑 ログイン", "📝 新規登録"])

    with auth_tab1:
        with st.form("login_form"):
            login_email = st.text_input("メールアドレス", key="login_email")
            login_password = st.text_input("パスワード", type="password", key="login_password")
            login_submitted = st.form_submit_button("ログイン", use_container_width=True, type="primary")

        if login_submitted:
            if not login_email or not login_password:
                st.error("メールアドレスとパスワードを入力してください。")
            else:
                user = authenticate(login_email, login_password)
                if user:
                    token = create_session(user["email"])
                    st.session_state["authenticated"] = True
                    st.session_state["user_email"] = user["email"]
                    st.session_state["user_name"] = user["display_name"]
                    st.session_state["session_token"] = token
                    st.query_params["token"] = token
                    st.rerun()
                else:
                    st.error("メールアドレスまたはパスワードが正しくありません。")

    with auth_tab2:
        with st.form("register_form"):
            reg_name = st.text_input("表示名", key="reg_name", placeholder="例: 田中太郎")
            reg_email = st.text_input("メールアドレス", key="reg_email")
            reg_password = st.text_input("パスワード（8文字以上）", type="password", key="reg_password")
            reg_submitted = st.form_submit_button("登録", use_container_width=True, type="primary")

        if reg_submitted:
            success, message = register_user(reg_email, reg_password, reg_name)
            if success:
                st.success(message + " ログインタブからログインしてください。")
            else:
                st.error(message)


# === メインアプリ ===
def show_main_app():
    user_email = st.session_state["user_email"]
    user_name = st.session_state["user_name"]

    st.title("🎙️ ラジオ番組メーカー")
    st.caption("スクリプトを入力して、AIボイスでラジオ番組を作成")

    # --- ボイス選択肢の構築（プリセット＋カスタム） ---
    custom_voices = load_custom_voices()
    all_voices = {}
    for vid, name in PRESET_VOICES.items():
        all_voices[vid] = name
    for vid, name in custom_voices.items():
        all_voices[vid] = f"🎤 {name}（クローン）"

    # --- サイドバー ---
    with st.sidebar:
        # ユーザー情報
        st.markdown(f"👤 **{user_name}**")
        st.caption(user_email)

        # 利用量
        usage = get_usage(user_email)
        st.metric("今月の生成回数", f"{usage['generation_count']}回")
        st.caption(f"合計文字数: {usage['total_characters']:,}文字")

        if st.button("🚪 ログアウト"):
            token = st.session_state.get("session_token")
            if token:
                delete_session(token)
            st.session_state["authenticated"] = False
            st.session_state["user_email"] = None
            st.session_state["user_name"] = None
            st.session_state["session_token"] = None
            st.query_params.clear()
            st.rerun()

        # モデル更新チェック
        new_model = check_model_update()
        if new_model:
            st.warning(f"MiniMaxの新モデル **{new_model}** が利用可能です。config.pyのDEFAULT_MODELを更新してください。")

        st.divider()
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

        # F2-2: Turboプレビュー
        use_turbo_preview = st.checkbox(
            "⚡ Turboプレビューモード",
            value=False,
            help="プレビュー時はTurboモデル（高速・低コスト）で生成。本番生成時にHDモデルを使用。",
        )

        # 言語設定
        st.subheader("🌐 言語設定")
        lang_options = list(SUPPORTED_LANGUAGES.keys())
        default_language = st.selectbox(
            "デフォルト言語",
            options=lang_options,
            format_func=lambda x: SUPPORTED_LANGUAGES[x],
            index=lang_options.index("Japanese") if "Japanese" in lang_options else 0,
            help="「自動検出」はAPIが言語を自動判定します。日英混在スクリプトでは話者ごとに言語を指定できます。",
        )
        per_speaker_lang = st.checkbox(
            "話者ごとに言語を指定",
            value=False,
            help="話者ごとに異なる言語を設定できます（日英混在スクリプト向け）",
        )

        st.divider()

        # 音声設定
        st.subheader("🔊 音声設定")
        speed = st.slider("話速", 0.5, 2.0, 1.0, 0.1)
        volume = st.slider("音量", 0.1, 10.0, 3.0, 0.1)
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
            bgm_volume = st.slider("BGM音量 (dB)", -30, 0, -20)
            intro_sec = st.slider("イントロ長さ (秒)", 0, 10, 3)
            outro_sec = st.slider("アウトロ長さ (秒)", 0, 15, 5)

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
    tab1, tab2, tab3, tab4 = st.tabs(["📝 番組作成", "🎤 ボイスクローン", "📂 生成履歴", "📖 使い方"])

    # === タブ4: 使い方 ===
    with tab4:
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

        ### Turboプレビューモード
        - サイドバーで有効にすると、プレビュー時はTurbo（高速・低コスト）で生成
        - 「HD本番生成」ボタンで高品質版を一発で再生成できます
        """)

    # === タブ2: ボイスクローン ===
    with tab2:
        st.subheader("🎤 ボイスクローン")
        st.markdown("音声サンプルをアップロードして、カスタムボイスを作成できます。")

        st.info("📋 音声サンプルの要件: MP3/M4A/WAV/MP4形式、10秒〜5分、20MB以下")

        clone_file = st.file_uploader(
            "音声サンプルをアップロード",
            type=["mp3", "m4a", "wav", "mp4"],
            key="clone_upload",
        )

        clone_name = st.text_input(
            "ボイス名",
            placeholder="例: 田中さんの声",
        )

        demo_text = st.text_input(
            "試聴テキスト",
            value="こんにちは、ボイスクローンのテストです。",
        )

        if st.button("🎙️ ボイスクローンを作成", type="primary", disabled=not (clone_file and clone_name)):
            if not MINIMAX_API_KEY:
                st.error("APIキーが設定されていません。`.env` ファイルを確認してください。")
            else:
                import uuid
                clone_id = "voice" + uuid.uuid4().hex[:12]
                with st.spinner("音声ファイルをアップロード中..."):
                    try:
                        # 一時ファイルに保存
                        temp_path = os.path.join(BGM_DIR, f"_temp_clone_{clone_file.name}")
                        with open(temp_path, "wb") as f:
                            f.write(clone_file.getbuffer())

                        # MP4の場合はMP3に変換（ffmpegで確実に変換）
                        if temp_path.lower().endswith(".mp4"):
                            mp3_path = temp_path.rsplit(".", 1)[0] + ".mp3"
                            import subprocess
                            subprocess.run(
                                ["ffmpeg", "-i", temp_path, "-vn", "-acodec", "libmp3lame", "-y", mp3_path],
                                capture_output=True, timeout=60,
                            )
                            os.remove(temp_path)
                            temp_path = mp3_path

                        # アップロード
                        file_id = upload_voice_file(temp_path)

                        # クリーンアップ
                        os.remove(temp_path)

                        st.info("ボイスクローンを作成中...")
                        audio_bytes = clone_voice(file_id, clone_id, demo_text)

                        # カスタムボイスとして保存
                        save_custom_voice(clone_id, clone_name)

                        st.success(f"ボイスクローン「{clone_name}」を作成しました！")
                        st.audio(io.BytesIO(audio_bytes), format="audio/mp3")

                    except Exception as e:
                        st.error(f"エラー: {e}")
                        if os.path.exists(temp_path):
                            os.remove(temp_path)

        # 登録済みカスタムボイス一覧
        if custom_voices:
            st.divider()
            st.subheader("📋 登録済みカスタムボイス")
            for vid, vname in custom_voices.items():
                col_name, col_id, col_del = st.columns([3, 3, 1])
                with col_name:
                    st.write(f"**{vname}**")
                with col_id:
                    st.code(vid)
                with col_del:
                    if st.button("🗑️", key=f"del_{vid}"):
                        delete_custom_voice(vid)
                        st.rerun()

    # === タブ3: 生成履歴 ===
    with tab3:
        st.subheader("📂 生成履歴")
        history_items = load_history(user_email=user_email)

        if not history_items:
            st.info("まだ生成履歴がありません。番組を生成すると、ここに表示されます。")
        else:
            st.caption(f"全{len(history_items)}件")

            if st.button("🗑️ 履歴をすべて削除"):
                deleted = clear_history(user_email=user_email)
                st.success(f"{deleted}件の履歴を削除しました")
                st.rerun()

            for item in history_items:
                ts = item.get("timestamp", "不明")
                duration = item.get("duration_sec", 0)
                mdl = item.get("model", "不明")
                spkrs = item.get("speakers", [])
                fname = item.get("filename", "")

                with st.expander(f"🕐 {ts} ｜ {duration}秒 ｜ {mdl} ｜ 話者{len(spkrs)}名"):
                    st.markdown(f"**話者**: {', '.join(spkrs)}")
                    st.markdown(f"**モデル**: {mdl}")
                    settings = item.get("settings", {})
                    if settings:
                        st.markdown(
                            f"**設定**: 話速{settings.get('speed', '-')} / "
                            f"音量{settings.get('volume', '-')} / "
                            f"ピッチ{settings.get('pitch', '-')} / "
                            f"感情{settings.get('emotion', '-')}"
                        )

                    st.markdown("**スクリプト:**")
                    st.code(item.get("script", ""), language=None)

                    col_dl, col_reuse, col_del = st.columns(3)

                    # 再ダウンロード
                    with col_dl:
                        filepath = os.path.join(OUTPUT_DIR, fname)
                        if os.path.exists(filepath):
                            with open(filepath, "rb") as f:
                                st.download_button(
                                    "💾 ダウンロード",
                                    data=f.read(),
                                    file_name=fname,
                                    mime="audio/mpeg",
                                    key=f"dl_{ts}",
                                    use_container_width=True,
                                )
                        else:
                            st.button("💾 ファイルなし", disabled=True, key=f"dl_{ts}", use_container_width=True)

                    # スクリプト再利用
                    with col_reuse:
                        if st.button("📝 スクリプト再利用", key=f"reuse_{ts}", use_container_width=True):
                            st.session_state["reuse_script"] = item.get("script", "")
                            st.rerun()

                    # 個別削除
                    with col_del:
                        if st.button("🗑️ 削除", key=f"del_hist_{ts}", use_container_width=True):
                            delete_history(ts, user_email=user_email)
                            st.rerun()

    # === タブ1: 番組作成 ===
    with tab1:
        # F2-3: テンプレート選択
        st.subheader("📄 テンプレート")
        template_names = ["カスタム（自由入力）"] + list(SCRIPT_TEMPLATES.keys())
        selected_template = st.selectbox(
            "テンプレートを選択",
            template_names,
            index=0,
            label_visibility="collapsed",
        )

        if selected_template != "カスタム（自由入力）":
            tmpl = SCRIPT_TEMPLATES[selected_template]
            st.caption(f"💡 {tmpl['description']}")
            default_script = tmpl["script"]
        else:
            default_script = """[ホスト] こんにちは！「テックラジオ」のお時間です。パーソナリティの田中です。
[ゲスト] ゲストの佐藤です。今日もよろしくお願いします。
[ホスト] 今日のテーマは「AIと音声技術の未来」です。佐藤さん、最近のAI音声技術、すごいですよね。
[ゲスト] 本当にそうですね。わずか5秒の音声サンプルから、その人そっくりの声を再現できるんですから。"""

        # 履歴からの再利用スクリプトがあれば優先
        if "reuse_script" in st.session_state:
            default_script = st.session_state.pop("reuse_script")

        # スクリプト入力
        script_text = st.text_area(
            "スクリプトを入力",
            value=default_script,
            height=400,
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

                voice_options = list(all_voices.items())
                speaker_voices = {}
                speaker_languages = {}

                cols = st.columns(min(len(speakers), 4))
                for i, speaker in enumerate(speakers):
                    with cols[i]:
                        st.markdown(f"**{speaker}**")
                        selected = st.selectbox(
                            f"{speaker} のボイス",
                            options=[vid for vid, _ in voice_options],
                            format_func=lambda x: all_voices[x],
                            key=f"voice_{speaker}",
                            index=min(i, len(voice_options) - 1),
                            label_visibility="collapsed",
                        )
                        speaker_voices[speaker] = selected

                        if per_speaker_lang:
                            speaker_lang = st.selectbox(
                                f"{speaker} の言語",
                                options=lang_options,
                                format_func=lambda x: SUPPORTED_LANGUAGES[x],
                                key=f"lang_{speaker}",
                                index=0,
                                label_visibility="collapsed",
                            )
                            speaker_languages[speaker] = speaker_lang
                        else:
                            speaker_languages[speaker] = default_language

                st.divider()

                # F2-2: Turboプレビュー対応の生成ボタン
                if use_turbo_preview:
                    btn_col1, btn_col2 = st.columns(2)
                    with btn_col1:
                        preview_clicked = st.button(
                            "⚡ Turboプレビュー",
                            use_container_width=True,
                            help="Turboモデルで高速プレビュー生成",
                        )
                    with btn_col2:
                        hd_clicked = st.button(
                            "🎬 HD本番生成",
                            type="primary",
                            use_container_width=True,
                            help="HDモデルで高品質生成",
                        )
                    generate_clicked = preview_clicked or hd_clicked
                    if preview_clicked:
                        gen_model = model.replace("-hd", "-turbo") if "-hd" in model else model
                    elif hd_clicked:
                        gen_model = model.replace("-turbo", "-hd") if "-turbo" in model else model
                    else:
                        gen_model = model
                else:
                    generate_clicked = st.button(
                        "🚀 音声を生成する", type="primary", use_container_width=True
                    )
                    gen_model = model

                if generate_clicked:
                    if not MINIMAX_API_KEY:
                        st.error("APIキーが設定されていません。`.env` ファイルを確認してください。")
                    else:
                        # モデル表示
                        if use_turbo_preview:
                            if preview_clicked:
                                st.info(f"⚡ Turboプレビューモード（モデル: {gen_model}）")
                            else:
                                st.info(f"🎬 HD本番生成モード（モデル: {gen_model}）")

                        progress_bar = st.progress(0)
                        status_text = st.empty()
                        audio_segments = []
                        total = len(script_lines)
                        cache_hits = 0
                        api_calls = 0
                        total_characters = 0

                        for i, line in enumerate(script_lines):
                            if line.speaker not in speaker_voices:
                                continue
                            voice_id = speaker_voices[line.speaker]
                            lang = speaker_languages.get(line.speaker, default_language)

                            # キャッシュを確認
                            cached = get_cached_audio(
                                text=line.text,
                                voice_id=voice_id,
                                model=gen_model,
                                speed=speed,
                                volume=volume,
                                pitch=pitch,
                                emotion=emotion,
                                language_boost=lang,
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
                                        model=gen_model,
                                        speed=speed,
                                        volume=volume,
                                        pitch=pitch,
                                        emotion=emotion,
                                        language_boost=lang,
                                    )
                                    # キャッシュに保存
                                    save_to_cache(
                                        audio_bytes=audio_bytes,
                                        text=line.text,
                                        voice_id=voice_id,
                                        model=gen_model,
                                        speed=speed,
                                        volume=volume,
                                        pitch=pitch,
                                        emotion=emotion,
                                        language_boost=lang,
                                    )
                                    audio_segments.append(audio_bytes)
                                    api_calls += 1
                                    total_characters += len(line.text)
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

                            # session_stateに保存して再実行後も表示
                            audio_buffer = io.BytesIO()
                            combined.export(audio_buffer, format="mp3")
                            st.session_state["last_audio"] = audio_buffer.getvalue()
                            st.session_state["last_filename"] = f"{filename}.mp3"
                            st.session_state["last_info"] = (
                                f"📊 音声長さ: {len(combined) / 1000:.1f}秒 | "
                                f"話者数: {len(speakers)}名 | "
                                f"モデル: {gen_model} | "
                                f"保存先: {filepath}"
                            )

                            # 履歴に保存
                            save_history({
                                "timestamp": timestamp,
                                "script": script_text,
                                "speakers": speakers,
                                "voice_assignments": speaker_voices,
                                "model": gen_model,
                                "settings": {
                                    "speed": speed,
                                    "volume": volume,
                                    "pitch": pitch,
                                    "emotion": emotion,
                                },
                                "filename": f"{filename}.mp3",
                                "duration_sec": round(len(combined) / 1000, 1),
                            }, user_email=user_email)

                            # 利用量を記録
                            increment_usage(user_email, total_characters)

                            # キャッシュ効果の表示
                            if cache_hits > 0:
                                st.success(
                                    f"💾 キャッシュ効果: {cache_hits}/{total}件がキャッシュから取得 "
                                    f"（API呼び出し{api_calls}回に削減！）"
                                )

        # --- 生成結果の表示（session_stateから復元） ---
        if "last_audio" in st.session_state:
            import base64
            st.divider()
            st.subheader("🎧 生成結果")
            audio_b64 = base64.b64encode(st.session_state["last_audio"]).decode()
            dl_filename = st.session_state.get("last_filename", "radio.mp3")
            st.components.v1.html(
                f"""
                <audio controls style="width:100%; margin-bottom:12px" src="data:audio/mp3;base64,{audio_b64}"></audio>
                <a href="data:audio/mpeg;base64,{audio_b64}" download="{dl_filename}"
                   style="display:inline-block; width:100%; padding:10px 0; background:#4CAF50; color:white;
                          text-align:center; border-radius:6px; text-decoration:none; font-size:15px;">
                   💾 MP3をダウンロード
                </a>
                """,
                height=120,
            )
            st.caption(st.session_state.get("last_info", ""))


# --- ルーティング ---
if st.session_state["authenticated"]:
    show_main_app()
else:
    show_auth_page()
