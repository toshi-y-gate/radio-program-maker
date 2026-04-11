import os
from dotenv import load_dotenv

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

DEFAULT_MODEL = "eleven_multilingual_v2"

PRESET_VOICES = {
    "pNInz6obpgDQGcFmaJgB": "Adam（落ち着いた男性）",
    "ErXwobaYiN019PkySvjV": "Antoni（温かい男性）",
    "VR6AewLTigWG4xSOukaG": "Arnold（力強い男性）",
    "TxGEqnHWrfWFTfGW9XjX": "Josh（若い男性）",
    "21m00Tcm4TlvDq8ikWAM": "Rachel（知的な女性）",
    "EXAVITQu4vr4xnSDxMaL": "Bella（明るい女性）",
    "MF3mGyEYCl7XYWbV9V6O": "Elli（若い女性）",
    "XB0fDUnXU5powFXDhCwa": "Charlotte（上品な女性）",
}

SUPPORTED_LANGUAGES = {
    "auto": "自動検出",
    "Japanese": "日本語",
    "English": "英語",
    "Chinese": "中国語",
    "Korean": "韓国語",
    "French": "フランス語",
    "German": "ドイツ語",
    "Spanish": "スペイン語",
    "Italian": "イタリア語",
    "Portuguese": "ポルトガル語",
    "Russian": "ロシア語",
    "Arabic": "アラビア語",
    "Thai": "タイ語",
    "Vietnamese": "ベトナム語",
    "Indonesian": "インドネシア語",
    "Malay": "マレー語",
    "Hindi": "ヒンディー語",
    "Turkish": "トルコ語",
    "Filipino": "フィリピン語",
    "Burmese": "ビルマ語",
    "Dutch": "オランダ語",
    "Polish": "ポーランド語",
    "Swedish": "スウェーデン語",
    "Norwegian": "ノルウェー語",
    "Danish": "デンマーク語",
    "Finnish": "フィンランド語",
    "Greek": "ギリシャ語",
    "Czech": "チェコ語",
    "Romanian": "ルーマニア語",
    "Hungarian": "ハンガリー語",
    "Ukrainian": "ウクライナ語",
    "Hebrew": "ヘブライ語",
    "Persian": "ペルシア語",
    "Bengali": "ベンガル語",
    "Tamil": "タミル語",
    "Telugu": "テルグ語",
    "Urdu": "ウルドゥー語",
    "Swahili": "スワヒリ語",
    "Afrikaans": "アフリカーンス語",
    "Croatian": "クロアチア語",
}


SCRIPT_TEMPLATES = {
    "ニュース番組": {
        "description": "2人構成のニュース番組（アンカー＋リポーター）",
        "script": """[アンカー] こんばんは。ニュースの時間です。本日のトップニュースをお伝えします。
[リポーター] 最初のニュースです。本日、新しいAI技術に関する国際会議が開幕しました。
[アンカー] 世界各国から研究者が集まっているそうですね。
[リポーター] はい、50カ国以上から参加者が集まり、最新の研究成果が発表されています。
[アンカー] 続いてのニュースです。""",
    },
    "対談・トーク": {
        "description": "2人の掛け合いトーク番組",
        "script": """[ホスト] 皆さんこんにちは！今日のゲストをお迎えしましょう。
[ゲスト] よろしくお願いします！今日は楽しみにしてきました。
[ホスト] 早速ですが、最近ハマっていることはありますか？
[ゲスト] 実は最近、朝の散歩にハマっていて。毎朝5時に起きて歩いています。
[ホスト] 5時！それは早いですね。何かきっかけがあったんですか？
[ゲスト] 健康診断の結果が少し気になって、運動を始めたんです。""",
    },
    "英会話レッスン": {
        "description": "先生と生徒の英会話練習",
        "script": """[Teacher] Good morning! Today we're going to practice ordering food at a restaurant.
[Student] Sounds great! I always get nervous when ordering in English.
[Teacher] Don't worry, let's start with something simple. Imagine you're at a cafe.
[Student] OK, I'm ready.
[Teacher] I'll be the waiter. Good afternoon, welcome! What can I get for you?
[Student] Hi, can I have a coffee and a sandwich, please?
[Teacher] Of course! What kind of sandwich would you like?
[Student] I'd like a chicken sandwich, please.""",
    },
    "一人語り・ナレーション": {
        "description": "1人のナレーターによる語り",
        "script": """[ナレーター] 皆さん、こんにちは。今日のテーマは「朝の過ごし方」です。
[ナレーター] 朝の時間をどう過ごすかで、一日の質が大きく変わると言われています。
[ナレーター] まず大切なのは、決まった時間に起きること。
[ナレーター] そして、起きたらまずコップ一杯の水を飲みましょう。
[ナレーター] 簡単なストレッチをするだけでも、体が目覚めますよ。""",
    },
}

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "output")
BGM_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "bgm")
HISTORY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "history")
USERS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "users")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(BGM_DIR, exist_ok=True)
os.makedirs(HISTORY_DIR, exist_ok=True)
os.makedirs(USERS_DIR, exist_ok=True)
