import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PlayIcon,
  DownloadIcon,
  CopyIcon,
  Trash2Icon,
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  RadioIcon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-react"
import type { HistoryItem } from "@/types"
import { useHistory } from "@/hooks/useHistory"

// --- ユーティリティ ---

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function truncateScript(script: string): string {
  const lines = script.split("\n")
  const truncated = lines.slice(0, 2).join("\n")
  return truncated.length > 100 ? truncated.slice(0, 100) + "..." : truncated
}


// --- コンポーネント ---

function HistoryCard({
  item,
  onDelete,
}: {
  item: HistoryItem
  onDelete: (id: string) => void
}) {
  const [showSettings, setShowSettings] = useState(false)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  function handlePlayToggle() {
    if (!audioRef) return
    if (isPlaying) {
      audioRef.pause()
      audioRef.currentTime = 0
      setIsPlaying(false)
    } else {
      audioRef.play()
      setIsPlaying(true)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        {/* ヘッダ: 日時 + モデル + 長さ */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{item.timestamp}</span>
          <Badge variant="default">
            {item.model === "chirp3-hd" ? "Chirp 3 HD" : item.model}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {formatDuration(item.durationSec)}
          </span>
        </div>

        {/* スクリプト冒頭 */}
        <p className="text-sm whitespace-pre-line leading-relaxed">{truncateScript(item.script)}</p>

        {/* 話者バッジ */}
        <div className="flex flex-wrap gap-1.5">
          {item.speakers.map((speaker) => (
            <Badge key={speaker} variant="outline">
              {speaker}
            </Badge>
          ))}
        </div>

        <Separator />

        {/* アクションボタン */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePlayToggle}>
            <PlayIcon />
            {isPlaying ? "停止" : "再生"}
          </Button>
          <a
            href="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGFOYQAAAAA="
            download={`radio_${item.id}.wav`}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 h-7 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-all"
          >
            <DownloadIcon className="size-3.5" />
            DL
          </a>
          <Link
            to="/program"
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 h-7 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-all"
          >
            <CopyIcon className="size-3.5" />
            再利用
          </Link>
          <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
            <Trash2Icon />
            削除
          </Button>
        </div>

        {/* 音声要素（非表示） */}
        <audio
          ref={setAudioRef}
          src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGFOYQAAAAA="
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

        {/* 設定情報（折りたたみ） */}
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showSettings ? <ChevronUpIcon className="size-3" /> : <ChevronDownIcon className="size-3" />}
          設定情報
        </button>
        {showSettings && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
            <span>話速: {item.settings.speed?.toFixed(1) ?? "-"}</span>
            <span>声の高さ: {item.settings.pitch?.toFixed(1) ?? "-"}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// --- メインページ ---

export function HistoryPage() {
  const { items, hasMore, loading, error, fetchHistory, loadMore, deleteItem } = useHistory()
  const [search, setSearch] = useState("")
  const [modelFilter, setModelFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [initialLoaded, setInitialLoaded] = useState(false)

  const doFetch = useCallback(
    (overrides?: { search?: string; model?: string; sort?: "newest" | "oldest" }) => {
      const s = overrides?.search ?? search
      const m = overrides?.model ?? modelFilter
      const so = overrides?.sort ?? sortOrder
      fetchHistory({
        page: 1,
        search: s.trim() || undefined,
        model: m === "all" ? undefined : "chirp3-hd",
        sort: so,
      })
    },
    [search, modelFilter, sortOrder, fetchHistory],
  )

  useEffect(() => {
    if (!initialLoaded) {
      doFetch()
      setInitialLoaded(true)
    }
  }, [initialLoaded, doFetch])

  function handleSearchChange(value: string) {
    setSearch(value)
    doFetch({ search: value })
  }

  function handleModelChange(value: string) {
    setModelFilter(value)
    doFetch({ model: value })
  }

  function handleSortChange(value: "newest" | "oldest") {
    setSortOrder(value)
    doFetch({ sort: value })
  }

  function handleDelete(id: string) {
    deleteItem(id)
  }

  // ローディング状態（初回）
  if (loading && items.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">生成履歴</h2>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Loader2Icon className="mx-auto size-10 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">履歴を読み込んでいます...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // エラー状態
  if (error && items.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">生成履歴</h2>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <AlertCircleIcon className="mx-auto size-10 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={() => doFetch()}>
              再試行
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 空状態（フィルタなし）
  if (items.length === 0 && !search.trim() && modelFilter === "all") {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">生成履歴</h2>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <RadioIcon className="mx-auto size-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              まだ生成履歴がありません。番組を生成すると、ここに表示されます。
            </p>
            <Link
              to="/program"
              className="inline-flex shrink-0 items-center justify-center rounded-lg h-8 gap-1.5 px-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-all"
            >
              番組を作成する
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">生成履歴</h2>

      {/* 検索・フィルタバー */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="スクリプト内容で検索..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={modelFilter}
            onValueChange={(val) => handleModelChange(val as string)}
          >
            <SelectTrigger>
              <SelectValue placeholder="モデル" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全て</SelectItem>
              <SelectItem value="hd">HD</SelectItem>
              <SelectItem value="turbo">Turbo</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortOrder}
            onValueChange={(val) => handleSortChange(val as "newest" | "oldest")}
          >
            <SelectTrigger>
              <SelectValue placeholder="並び替え" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">新しい順</SelectItem>
              <SelectItem value="oldest">古い順</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* エラー表示（データありの場合） */}
      {error && (
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* フィルタ結果が0件 */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              条件に一致する履歴がありません。
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 履歴一覧 */}
          <div className="space-y-4">
            {items.map((item) => (
              <HistoryCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>

          {/* もっと見る */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    読み込み中...
                  </>
                ) : (
                  "もっと見る"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
