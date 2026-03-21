import os
from dotenv import load_dotenv

load_dotenv()

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_API_URL = "https://api.minimax.io/v1/t2a_v2"

DEFAULT_MODEL = "speech-2.8-hd"

PRESET_VOICES = {
    "Japanese_Whisper_Belle": "日本語 - ウィスパーベル（女性）",
    "moss_audio_24875c4a-7be4-11f0-9359-4e72c55db738": "日本語 - 男性A",
    "moss_audio_7f4ee608-78ea-11f0-bb73-1e2a4cfcd245": "日本語 - 男性B",
    "moss_audio_c1a6a3ac-7be6-11f0-8e8e-36b92fbb4f95": "日本語 - 女性A",
    "English_Graceful_Lady": "英語 - グレイスフルレディ（女性）",
    "English_Persuasive_Man": "英語 - パースエイシブマン（男性）",
    "English_radiant_girl": "英語 - ラディアントガール（女性）",
    "English_Insightful_Speaker": "英語 - インサイトフルスピーカー（男性）",
}

AUDIO_SETTINGS = {
    "sample_rate": 44100,
    "bitrate": 128000,
    "format": "mp3",
    "channel": 1,
}

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "output")
BGM_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "bgm")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(BGM_DIR, exist_ok=True)
