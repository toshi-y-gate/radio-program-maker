import crypto from "crypto";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath = require("ffmpeg-static") as string;
import { config } from "../config";
import { prisma } from "../db";

const CACHE_DIR = path.resolve(__dirname, "../../cache");
const OUTPUT_DIR = path.resolve(__dirname, "../../output");

type Speaker = { speaker: string; voiceId: string };
type Settings = {
  speed: number;
  volume: number;
  pitch: number;
  emotion: string;
  model: string;
};
type BgmOptions = { insertMode: string; volume: number; outroDuration?: number } | undefined;

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateCacheKey(
  text: string,
  voiceId: string,
  settings: Settings
): string {
  const input = `${text}|${voiceId}|${settings.model}|${settings.speed}|${settings.volume}|${settings.pitch}|${settings.emotion}`;
  return crypto.createHash("sha256").update(input).digest("hex");
}

function splitLongText(text: string, maxLen = 500): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[。！？\n])/);
  let current = "";
  for (const s of sentences) {
    if (current.length + s.length > maxLen && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += s;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function parseScript(
  script: string,
  speakerNames: string[]
): { speaker: string; text: string }[] {
  const lines = script.split("\n").filter((l) => l.trim());
  const patterns = [
    /^\[(.+?)\]\s*(.+)$/,
    /^【(.+?)】\s*(.+)$/,
    /^(.+?):\s*(.+)$/,
    /^(.+?)：\s*(.+)$/,
  ];

  const result: { speaker: string; text: string }[] = [];
  for (const line of lines) {
    let matched = false;
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const speaker = match[1].trim();
        const text = match[2].trim();
        for (const chunk of splitLongText(text)) {
          result.push({ speaker, text: chunk });
        }
        matched = true;
        break;
      }
    }
    if (!matched) {
      // タグなしのテキスト行 → 最初の話者名でチャンク分割
      const defaultSpeaker = speakerNames[0] || "ナレーター";
      for (const chunk of splitLongText(line.trim())) {
        result.push({ speaker: defaultSpeaker, text: chunk });
      }
    }
  }
  return result;
}

async function callMinimaxTTS(
  text: string,
  voiceId: string,
  settings: Settings
): Promise<Buffer> {
  if (!config.minimaxApiKey) {
    throw new Error("MINIMAX_API_KEY is not configured");
  }

  const response = await fetch("https://api.minimax.io/v1/t2a_v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.minimaxApiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      text,
      stream: false,
      language_boost: "Japanese",
      voice_setting: {
        voice_id: voiceId,
        speed: settings.speed,
        vol: settings.volume,
        pitch: settings.pitch,
        emotion: settings.emotion,
      },
      audio_setting: {
        format: "mp3",
        sample_rate: 44100,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    base_resp?: { status_code: number; status_msg?: string };
    data?: { audio?: string };
  };
  if (data.base_resp?.status_code !== 0) {
    throw new Error(
      `MiniMax API error: ${data.base_resp?.status_msg || "Unknown error"}`
    );
  }

  const audioData = data.data?.audio;
  if (!audioData) {
    throw new Error("MiniMax API returned no audio data");
  }

  // MiniMax T2A v2 returns hex-encoded audio
  // Check if it starts with valid MP3 hex signature (fff3, fffa, fffb, 4944)
  const firstBytes = audioData.substring(0, 8).toLowerCase();
  console.log(`[tts] Audio data: length=${audioData.length}, first8=${firstBytes}`);

  // Try hex decode first, check if result is valid MP3
  const hexBuf = Buffer.from(audioData, "hex");
  const b64Buf = Buffer.from(audioData, "base64");

  // MP3 starts with 0xff or 0x49 (ID3), pick the one that looks right
  const hexHead = hexBuf.length > 0 ? hexBuf[0] : 0;
  const b64Head = b64Buf.length > 0 ? b64Buf[0] : 0;

  const useHex = hexHead === 0xff || hexHead === 0x49;
  const buf = useHex ? hexBuf : b64Buf;
  console.log(`[tts] Decoded as ${useHex ? "hex" : "base64"}: ${buf.length} bytes, head=0x${buf.slice(0, 2).toString("hex")}`);
  return buf;
}

function getSpeechDuration(filePath: string): number {
  try {
    // ffmpegに-iだけ渡してstderrからDuration情報を取得（デコード不要で高速）
    const result = execSync(
      `"${ffmpegPath}" -i "${filePath}" 2>&1 || true`,
      { timeout: 5000, shell: "/bin/bash" }
    ).toString();
    const match = result.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (match) {
      return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
    }
  } catch {}
  return 0;
}

function mixBgm(
  speechPath: string,
  bgmFilePath: string,
  bgmVolume: number,
  outputPath: string,
  outroDurationSec: number = 5
): void {
  const speechDuration = getSpeechDuration(speechPath);
  const totalDuration = speechDuration > 0 ? speechDuration + outroDurationSec : 0;

  if (totalDuration > 0) {
    // BGMをループ→音声+アウトロ分の長さにカット→アウトロ部分でフェードアウト
    const fadeStart = speechDuration;
    execSync(
      `"${ffmpegPath}" -i "${speechPath}" -i "${bgmFilePath}" -filter_complex "` +
        `[1:a]aloop=loop=-1:size=2e+09,volume=${bgmVolume},atrim=0:${totalDuration},afade=t=out:st=${fadeStart}:d=${outroDurationSec}[bgm];` +
        `[0:a]apad=pad_dur=${outroDurationSec}[speech];` +
        `[speech][bgm]amix=inputs=2:duration=longest:dropout_transition=0[out]` +
        `" -map "[out]" -y "${outputPath}" 2>/dev/null`,
      { timeout: 120000 }
    );
  } else {
    // フォールバック: 音声長さ取得失敗時は従来方式+dropout_transitionでフェードアウト
    execSync(
      `"${ffmpegPath}" -i "${speechPath}" -i "${bgmFilePath}" -filter_complex "[1:a]aloop=loop=-1:size=2e+09,volume=${bgmVolume}[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=5[out]" -map "[out]" -y "${outputPath}" 2>/dev/null`,
      { timeout: 120000 }
    );
  }
}

export async function generateRadio(
  userId: string,
  script: string,
  speakers: Speaker[],
  settings: Settings,
  bgmOptions?: BgmOptions,
  bgmFilePath?: string
): Promise<{ audioUrl: string; durationSec: number; speakers: string[] }> {
  ensureDir(CACHE_DIR);
  ensureDir(OUTPUT_DIR);

  const speakerMap = new Map(speakers.map((s) => [s.speaker, s.voiceId]));
  const parsedLines = parseScript(script, speakers.map((s) => s.speaker));
  if (parsedLines.length === 0) {
    throw new Error("スクリプトからセリフを検出できませんでした");
  }
  const audioBuffers: Buffer[] = [];
  const uniqueSpeakers = [...new Set(parsedLines.map((l) => l.speaker))];

  console.log(`[generate] Processing ${parsedLines.length} chunks`);
  for (let i = 0; i < parsedLines.length; i++) {
    const line = parsedLines[i];
    const voiceId = speakerMap.get(line.speaker);
    if (!voiceId) {
      throw new Error(`話者 "${line.speaker}" のボイスが割り当てられていません`);
    }

    const cacheKey = generateCacheKey(line.text, voiceId, settings);
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.mp3`);

    if (fs.existsSync(cachePath)) {
      console.log(`[generate] Chunk ${i + 1}/${parsedLines.length}: cache hit (${line.text.length} chars)`);
      audioBuffers.push(fs.readFileSync(cachePath));
    } else {
      console.log(`[generate] Chunk ${i + 1}/${parsedLines.length}: calling API (${line.text.length} chars)`);
      const audio = await callMinimaxTTS(line.text, voiceId, settings);
      console.log(`[generate] Chunk ${i + 1}: got ${audio.length} bytes`);
      fs.writeFileSync(cachePath, audio);
      audioBuffers.push(audio);
    }
  }

  // MP3チャンクをffmpegで再エンコードなし結合（-c copy）
  const chunkFiles: string[] = [];
  for (let i = 0; i < audioBuffers.length; i++) {
    const chunkPath = path.join(CACHE_DIR, `chunk_${Date.now()}_${i}.mp3`);
    fs.writeFileSync(chunkPath, audioBuffers[i]);
    chunkFiles.push(chunkPath);
  }

  const filename = `radio_${crypto.randomUUID()}.mp3`;
  const outputPath = path.join(OUTPUT_DIR, filename);
  const concatListPath = path.join(CACHE_DIR, `concat_${Date.now()}.txt`);
  fs.writeFileSync(concatListPath, chunkFiles.map((f) => `file '${f}'`).join("\n"));

  try {
    execSync(
      `"${ffmpegPath}" -f concat -safe 0 -i "${concatListPath}" -c copy -y "${outputPath}" 2>/dev/null`,
      { timeout: 120000 }
    );
  } catch {
    fs.writeFileSync(outputPath, Buffer.concat(audioBuffers));
  } finally {
    for (const f of chunkFiles) { try { fs.unlinkSync(f); } catch {} }
    try { fs.unlinkSync(concatListPath); } catch {}
  }

  const outputStats = fs.statSync(outputPath);

  if (bgmFilePath && bgmOptions && fs.existsSync(bgmFilePath)) {
    // Mix BGM with the already-created output file
    const tempSpeechPath = path.join(OUTPUT_DIR, `temp_speech_${Date.now()}.mp3`);
    fs.renameSync(outputPath, tempSpeechPath);
    try {
      mixBgm(tempSpeechPath, bgmFilePath, bgmOptions.volume, outputPath, bgmOptions.outroDuration ?? 5);
      console.log("[generate] BGM mixed successfully");
    } catch (err) {
      console.error("[generate] BGM mix failed, using speech only:", err instanceof Error ? err.message : err);
      fs.renameSync(tempSpeechPath, outputPath);
    } finally {
      if (fs.existsSync(tempSpeechPath)) try { fs.unlinkSync(tempSpeechPath); } catch {}
      if (fs.existsSync(bgmFilePath)) try { fs.unlinkSync(bgmFilePath); } catch {}
    }
  }

  console.log(`[generate] Total: ${audioBuffers.length} chunks, ${outputStats.size} bytes`);
  const estimatedDuration = Math.round(outputStats.size / 16000);

  await prisma.history.create({
    data: {
      script,
      speakers: JSON.stringify(uniqueSpeakers),
      model: settings.model,
      filename,
      durationSec: estimatedDuration,
      settings: JSON.stringify(settings),
      audioUrl: `/output/${filename}`,
      userId,
    },
  });

  return {
    audioUrl: `/output/${filename}`,
    durationSec: estimatedDuration,
    speakers: uniqueSpeakers,
  };
}
