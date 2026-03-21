import { NavLink } from "react-router-dom"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { path: "/program", icon: "📝", label: "番組作成" },
  { path: "/voice-clone", icon: "🎤", label: "ボイスクローン" },
  { path: "/history", icon: "📂", label: "生成履歴" },
  { path: "/guide", icon: "📖", label: "使い方" },
]

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-sidebar text-sidebar-foreground flex flex-col h-full">
      <div className="p-4">
        <h1 className="text-lg font-bold">🎙️ ラジオ番組メーカー</h1>
      </div>
      <Separator />
      <nav className="flex-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
