import crypto from "crypto";
import fs from "fs";
import path from "path";
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
type BgmOptions = { insertMode: string; volume: number } | undefined;

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

function parseScript(script: string): { speaker: string; text: string }[] {
  const lines = script.split("\n").filter((l) => l.trim());
  const patterns = [
    /^\[(.+?)\]\s*(.+)$/,
    /^【(.+?)】\s*(.+)$/,
    /^(.+?):\s*(.+)$/,
    /^(.+?)：\s*(.+)$/,
  ];

  const result: { speaker: string; text: string }[] = [];
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const speaker = match[1].trim();
        const text = match[2].trim();
        for (const chunk of splitLongText(text)) {
          result.push({ speaker, text: chunk });
        }
        break;
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
        sample_rate: 32000,
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

  // Auto-detect hex vs base64 encoding
  const isHex = /^[0-9a-fA-F]+$/.test(audioData.substring(0, 100));
  const buf = isHex
    ? Buffer.from(audioData, "hex")
    : Buffer.from(audioData, "base64");
  console.log(`[tts] Audio decoded: ${isHex ? "hex" : "base64"}, ${buf.length} bytes`);
  return buf;
}

export async function generateRadio(
  userId: string,
  script: string,
  speakers: Speaker[],
  settings: Settings,
  _bgm?: BgmOptions
): Promise<{ audioUrl: string; durationSec: number; speakers: string[] }> {
  ensureDir(CACHE_DIR);
  ensureDir(OUTPUT_DIR);

  const parsedLines = parseScript(script);
  if (parsedLines.length === 0) {
    throw new Error("スクリプトからセリフを検出できませんでした");
  }

  const speakerMap = new Map(speakers.map((s) => [s.speaker, s.voiceId]));
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

  const combined = Buffer.concat(audioBuffers);
  const filename = `radio_${crypto.randomUUID()}.mp3`;
  const outputPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outputPath, combined);

  console.log(`[generate] Total: ${audioBuffers.length} chunks, ${combined.length} bytes`);
  const estimatedDuration = Math.round(combined.length / 4000);

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
