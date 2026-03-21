import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function Header() {
  // TODO: Phase 8で実際の認証状態と連携
  const userName = "テストユーザー"
  const userEmail = "test@example.com"

  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between px-6 py-3">
        <div />
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="ghost" size="sm">
            🚪 ログアウト
          </Button>
        </div>
      </div>
    </header>
  )
}
