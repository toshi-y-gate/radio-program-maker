import { useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useVoices } from "@/hooks/useVoices"

const ACCEPTED_EXTENSIONS = [".mp3", ".wav", ".mp4", ".m4a"]

function isAcceptedFile(file: File): boolean {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
  return ACCEPTED_EXTENSIONS.includes(ext)
}

export function VoiceClonePage() {
  const [voiceName, setVoiceName] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { customVoices, presetVoices, loading, error, createVoice, deleteVoice } = useVoices()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const handleDropAreaClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && isAcceptedFile(file)) {
      setUploadedFile(file)
    }
  }

  const handleCreate = async () => {
    if (!voiceName.trim() || !uploadedFile) return
    setCreating(true)
    try {
      await createVoice(voiceName.trim(), uploadedFile)
      setVoiceName("")
      setUploadedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch {
      // error is handled by the hook
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteVoice(id)
    } catch {
      // error is handled by the hook
    }
  }

  const languageLabel = (lang: "ja" | "en") => (lang === "ja" ? "日本語" : "英語")

  if (loading) {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">ボイスクローン</h2>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">ボイスクローン</h2>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* カスタムボイス作成セクション */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">カスタムボイス作成</CardTitle>
          <CardDescription>
            音声サンプルからオリジナルのボイスを作成します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voice-name">ボイス名</Label>
            <Input
              id="voice-name"
              placeholder="例: ナレーション用ボイス"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>音声サンプル</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.mp4,.m4a"
              className="hidden"
              onChange={handleFileChange}
            />
            <Card
              size="sm"
              className={`cursor-pointer border-dashed transition-colors hover:bg-muted/50 ${dragOver ? "border-primary bg-primary/5" : ""}`}
              onClick={handleDropAreaClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-2 text-3xl">🎵</div>
                {uploadedFile ? (
                  <p className="text-sm font-medium">{uploadedFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      クリックまたはドラッグ&ドロップで音声ファイルを選択
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MP3 / WAV / MP4 / M4A（5秒以上・最大50MB）
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Button
            disabled={!voiceName.trim() || !uploadedFile || creating}
            onClick={handleCreate}
          >
            {creating ? "作成中..." : "ボイスを作成"}
          </Button>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p>💡 作成時の注意事項:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>5秒以上の音声サンプルが推奨されます</li>
              <li>ノイズの少ないクリアな音声がより良い結果につながります</li>
              <li>1人の話者のみが含まれる音声をご使用ください</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 登録済みカスタムボイス一覧 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">登録済みカスタムボイス</h3>
        {customVoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                カスタムボイスはまだ登録されていません
              </p>
              <p className="text-xs text-muted-foreground">
                上のフォームから音声サンプルをアップロードして作成できます
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {customVoices.map((voice) => (
              <Card key={voice.id}>
                <CardHeader>
                  <CardTitle className="text-base">{voice.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span>{voice.createdAt}</span>
                    <Badge
                      variant={voice.status === "available" ? "default" : "secondary"}
                    >
                      {voice.status === "available" ? "利用可能" : voice.status === "creating" ? "作成中" : "失敗"}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  {voice.status === "available" && (
                    <audio controls className="h-8 w-full">
                      <source src={voice.sampleUrl} />
                    </audio>
                  )}
                </CardContent>
                <div className="px-4 pb-4">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(voice.id)}>
                    削除
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* プリセットボイス一覧 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">プリセットボイス</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {presetVoices.map((voice) => (
            <Card key={voice.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span>{voice.gender === "female" ? "👩" : "👨"}</span>
                  <span>{voice.name}</span>
                </CardTitle>
                <CardDescription>
                  <Badge variant="outline">{languageLabel(voice.language)}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <audio controls className="h-8 w-full">
                  <source src="" />
                </audio>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
