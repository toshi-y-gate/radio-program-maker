import re
from dataclasses import dataclass


@dataclass
class ScriptLine:
    speaker: str
    text: str


def parse_script(script: str) -> list[ScriptLine]:
    """スクリプトを話者ごとのセリフに分割する

    対応フォーマット:
        [話者名] セリフテキスト
        【話者名】 セリフテキスト
        話者名: セリフテキスト
        話者名： セリフテキスト
    """
    lines = []
    pattern = re.compile(
        r"(?:\[(.+?)\]|【(.+?)】|(.+?)[：:])\s*(.*)"
    )

    hashtag_line_pattern = re.compile(r"^[\s#\uFF03]+[\w\u3000-\u9FFF]+([\s]+[#\uFF03][\w\u3000-\u9FFF]+)*\s*$")

    for raw_line in script.strip().splitlines():
        raw_line = raw_line.strip()
        if not raw_line:
            continue

        # ハッシュタグのみで構成される行をスキップ
        if hashtag_line_pattern.match(raw_line):
            continue

        match = pattern.match(raw_line)
        if match:
            speaker = match.group(1) or match.group(2) or match.group(3)
            text = match.group(4).strip()
            if speaker and text:
                lines.append(ScriptLine(speaker=speaker.strip(), text=text))
        else:
            # 話者指定なしの行は直前の話者を引き継ぐ
            if lines:
                lines[-1].text += "\n" + raw_line
            else:
                lines.append(ScriptLine(speaker="ナレーター", text=raw_line))

    return lines


def get_speakers(script_lines: list[ScriptLine]) -> list[str]:
    """スクリプトに含まれるユニークな話者リストを返す"""
    seen = set()
    speakers = []
    for line in script_lines:
        if line.speaker not in seen:
            seen.add(line.speaker)
            speakers.append(line.speaker)
    return speakers
