import { useState, useMemo } from "react"
import { useGenerate } from "@/hooks/useGenerate"
import { useVoicePresets } from "@/hooks/useVoicePresets"
import { useVoices } from "@/hooks/useVoices"
import type { Emotion, TTSModel, BGMInsertMode } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

const TEMPLATES = [
  {
    id: "solo",
    label: "ソロトーク",
    icon: "🎙️",
    description: "パーソナリティ1名の番組",
    script: `[パーソナリティ] みなさんこんにちは！今週もやってまいりました。
[パーソナリティ] 今日のテーマは「最近ハマっていること」です。
[パーソナリティ] 実は最近、朝の散歩を始めたんですよ。
[パーソナリティ] これがもう、めちゃくちゃ気持ちいいんです。`,
  },
  {
    id: "guest",
    label: "ゲスト回",
    icon: "🎤",
    description: "パーソナリティ＋ゲストの番組",
    script: `[パーソナリティ] 今日は素敵なゲストをお迎えしています！
[ゲスト] お招きいただきありがとうございます！
[パーソナリティ] 早速ですが、最近のご活動について教えてください。
[ゲスト] はい、実は新しいプロジェクトを始めまして。
[パーソナリティ] おお、それは気になりますね！詳しく聞かせてください。`,
  },
  {
    id: "dialogue",
    label: "対談",
    icon: "💬",
    description: "2名での対談番組",
    script: `[ホストA] さあ始まりました、今週のラジオです！
[ホストB] 今週もよろしくお願いします！
[ホストA] 今日は何の話する？
[ホストB] 最近気になった話題があってさ。
[ホストA] いいね、聞かせて聞かせて！`,
  },
  {
    id: "custom",
    label: "カスタム",
    icon: "✏️",
    description: "自由にスクリプトを作成",
    script: "",
  },
] as const

const EMOTIONS = [
  { id: "neutral", label: "ニュートラル" },
  { id: "happy", label: "嬉しい" },
  { id: "sad", label: "悲しい" },
  { id: "angry", label: "怒り" },
  { id: "fearful", label: "恐怖" },
  { id: "disgusted", label: "嫌悪" },
  { id: "surprised", label: "驚き" },
] as const

const BGM_MODES = [
  { id: "background", label: "バックグラウンド" },
  { id: "intro", label: "イントロのみ" },
  { id: "outro", label: "アウトロのみ" },
  { id: "intro_outro", label: "イントロ＋アウトロ" },
  { id: "full", label: "フル" },
] as const

// --- 話者検出 ---

const DEFAULT_SPEAKER = "ナレーター"

function hasSpeakerTags(script: string): boolean {
  return /\[.+?\]|【.+?】|^.+?[:：]\s/m.test(script)
}

function detectSpeakers(script: string): string[] {
  if (!hasSpeakerTags(script) && script.trim().length > 0) {
    return [DEFAULT_SPEAKER]
  }
  const patterns = [
    /\[(.+?)\]/g,
    /【(.+?)】/g,
    /^(.+?)[:：]\s/gm,
  ]
  const speakers = new Set<string>()
  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(script)) !== null) {
      const name = match[1].trim()
      if (name && speakers.size < 4) {
        speakers.add(name)
      }
    }
  }
  return Array.from(speakers)
}

function normalizeScript(script: string): string {
  if (hasSpeakerTags(script)) return script
  // 句点（。！？）で文を分割し、各文を1行にする
  const sentences = script
    .replace(/\n+/g, "")
    .split(/(?<=[。！？])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (sentences.length === 0) return script
  return sentences.map((s) => `[${DEFAULT_SPEAKER}] ${s}`).join("\n")
}

// --- コンポーネント ---

export function ProgramPage() {
  // テンプレート・スクリプト
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom")
  const [script, setScript] = useState("")

  // ボイス割り当て: { [話者名]: ボイスID }
  const [voiceAssignments, setVoiceAssignments] = useState<Record<string, string>>({})

  // 設定
  const [model, setModel] = useState<TTSModel>("speech-2.8-hd")
  const [speed, setSpeed] = useState([1.0])
  const [volume, setVolume] = useState([1.0])
  const [pitch, setPitch] = useState([0])
  const [emotion, setEmotion] = useState<Emotion>("neutral")
  const [turboPreview, setTurboPreview] = useState(false)

  // BGM
  const [bgmFile, setBgmFile] = useState<File | null>(null)
  const [bgmMode, setBgmMode] = useState<BGMInsertMode>("background")
  const [bgmVolume, setBgmVolume] = useState([0.3])
  const [bgmDragOver, setBgmDragOver] = useState(false)

  // フック
  const { isGenerating, progress, resultAudioUrl, error, generate } = useGenerate()
  const { presets: voicePresets, loading: presetsLoading } = useVoicePresets()
  const { customVoices } = useVoices()

  // 話者検出
  const speakers = useMemo(() => detectSpeakers(script), [script])

  // テンプレート選択
  function handleTemplateSelect(templateId: string) {
    setSelectedTemplate(templateId)
    const tpl = TEMPLATES.find((t) => t.id === templateId)
    if (tpl && tpl.script) {
      setScript(tpl.script)
    }
  }

  // 生成処理
  function handleGenerate() {
    const effectiveModel: TTSModel = turboPreview ? "speech-2.8-turbo" : model
    const defaultVoiceId = voicePresets.length > 0 ? voicePresets[0].id : ""
    const normalizedScript = normalizeScript(script)

    generate({
      script: normalizedScript,
      speakers: speakers.map((s) => ({
        speaker: s,
        voiceId: voiceAssignments[s] ?? defaultVoiceId,
      })),
      settings: {
        speed: speed[0],
        volume: volume[0],
        pitch: pitch[0],
        emotion,
        model: effectiveModel,
      },
      bgm: bgmFile
        ? { insertMode: bgmMode, volume: bgmVolume[0] }
        : undefined,
    }, bgmFile || undefined)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">番組作成</h2>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* 左カラム: メインコンテンツ */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* テンプレート選択 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">テンプレート</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleTemplateSelect(tpl.id)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:bg-muted ${
                      selectedTemplate === tpl.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <span className="text-2xl">{tpl.icon}</span>
                    <span className="text-sm font-medium">{tpl.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {tpl.description}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* スクリプト入力 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">スクリプト入力</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`スクリプトを入力してください。\nそのまま文章を入力すればOKです（自動でナレーターとして処理されます）。\n\n複数話者の場合:\n[話者名] セリフ\n【話者名】 セリフ`}
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="min-h-48 font-mono text-sm"
              />

              {/* 話者検出表示 */}
              {speakers.length > 0 && (
                <div className="space-y-2">
                  <Label>検出された話者</Label>
                  <div className="flex flex-wrap gap-2">
                    {speakers.map((speaker) => (
                      <Badge key={speaker} variant="secondary">
                        {speaker}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ボイス割り当て */}
          {speakers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ボイス割り当て</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {presetsLoading ? (
                  <p className="text-sm text-muted-foreground">ボイスプリセット読み込み中...</p>
                ) : (
                  speakers.map((speaker) => (
                    <div key={speaker} className="flex items-center gap-4">
                      <Label className="w-32 shrink-0">{speaker}</Label>
                      <Select
                        value={voiceAssignments[speaker] ?? (voicePresets[0]?.id ?? "")}
                        onValueChange={(val) =>
                          setVoiceAssignments((prev) => ({
                            ...prev,
                            [speaker]: val as string,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="ボイスを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {customVoices.filter(v => v.status === "available").length > 0 && (
                            <>
                              {customVoices.filter(v => v.status === "available").map((voice) => (
                                <SelectItem key={voice.id} value={voice.sampleUrl}>
                                  🎤 {voice.name}（カスタム）
                                </SelectItem>
                              ))}
                              <Separator className="my-1" />
                            </>
                          )}
                          {voicePresets.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* 生成ボタン */}
          <Button
            size="lg"
            className="w-full h-12 text-base font-bold"
            onClick={handleGenerate}
            disabled={isGenerating || !script.trim()}
          >
            {isGenerating ? "生成中..." : "番組を生成する"}
          </Button>

          {/* プログレス表示 */}
          {isGenerating && (
            <Card>
              <CardContent className="pt-6">
                <Progress value={progress}>
                  <ProgressLabel>生成中</ProgressLabel>
                  <ProgressValue />
                </Progress>
              </CardContent>
            </Card>
          )}

          {/* エラー表示 */}
          {error && !isGenerating && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* 結果エリア */}
          {resultAudioUrl && !isGenerating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">生成結果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <audio controls src={resultAudioUrl} className="w-full" />
                <a
                  href={resultAudioUrl}
                  download="radio_program.wav"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background h-8 gap-1.5 px-2.5 text-sm font-medium hover:bg-muted hover:text-foreground transition-all"
                >
                  ダウンロード
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右カラム: 設定パネル */}
        <div className="w-full space-y-6 lg:w-80 shrink-0">
          {/* モデル・パラメータ設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">音声設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* モデル選択 */}
              <div className="space-y-2">
                <Label>モデル</Label>
                <Select value={model} onValueChange={(val) => setModel(val as TTSModel)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="speech-2.8-hd">speech-2.8-hd（高品質）</SelectItem>
                    <SelectItem value="speech-2.8-turbo">speech-2.8-turbo（高速）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* 話速 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>話速</Label>
                  <span className="text-sm text-muted-foreground">{(speed[0] ?? 1.0).toFixed(1)}</span>
                </div>
                <Slider
                  value={speed}
                  onValueChange={(val) => setSpeed(Array.isArray(val) ? val : [val])}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                />
              </div>

              {/* 音量 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>音量</Label>
                  <span className="text-sm text-muted-foreground">{(volume[0] ?? 1.0).toFixed(1)}</span>
                </div>
                <Slider
                  value={volume}
                  onValueChange={(val) => setVolume(Array.isArray(val) ? val : [val])}
                  min={0.1}
                  max={10.0}
                  step={0.1}
                />
              </div>

              {/* ピッチ */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>ピッチ</Label>
                  <span className="text-sm text-muted-foreground">{(pitch[0] ?? 0) > 0 ? `+${pitch[0]}` : (pitch[0] ?? 0)}</span>
                </div>
                <Slider
                  value={pitch}
                  onValueChange={(val) => setPitch(Array.isArray(val) ? val : [val])}
                  min={-12}
                  max={12}
                  step={1}
                />
              </div>

              <Separator />

              {/* 感情 */}
              <div className="space-y-2">
                <Label>感情</Label>
                <Select value={emotion} onValueChange={(val) => setEmotion(val as Emotion)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMOTIONS.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Turboプレビュー */}
              <div className="flex items-center justify-between">
                <Label>Turboプレビュー</Label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={turboPreview}
                  onClick={() => setTurboPreview(!turboPreview)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
                    turboPreview ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                      turboPreview ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* BGM設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">BGM設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* ファイルアップロード */}
              <div className="space-y-2">
                <Label>BGMファイル</Label>
                <input
                  id="bgm-upload"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setBgmFile(e.target.files?.[0] ?? null)}
                />
                <div
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors hover:bg-muted/50 ${bgmDragOver ? "border-primary bg-primary/5" : "border-border"}`}
                  onClick={() => document.getElementById("bgm-upload")?.click()}
                  onDragOver={(e) => { e.preventDefault(); setBgmDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setBgmDragOver(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setBgmDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) setBgmFile(file);
                  }}
                >
                  {bgmFile ? (
                    <p className="text-sm font-medium">{bgmFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">クリックまたはドラッグ&ドロップ</p>
                      <p className="text-xs text-muted-foreground">MP3 / WAV / M4A</p>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* 挿入モード */}
              <div className="space-y-2">
                <Label>挿入モード</Label>
                <Select value={bgmMode} onValueChange={(val) => setBgmMode(val as BGMInsertMode)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BGM_MODES.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* BGM音量 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>BGM音量</Label>
                  <span className="text-sm text-muted-foreground">{(bgmVolume[0] ?? 0.3).toFixed(1)}</span>
                </div>
                <Slider
                  value={bgmVolume}
                  onValueChange={(val) => setBgmVolume(Array.isArray(val) ? val : [val])}
                  min={0}
                  max={1.0}
                  step={0.05}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
