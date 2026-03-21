import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, Mic } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

function validateEmail(email: string): boolean {
  return email.includes("@")
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 0) return { score: 0, label: "弱", color: "bg-destructive" }
  if (score === 1) return { score: 33, label: "弱", color: "bg-destructive" }
  if (score === 2) return { score: 66, label: "中", color: "bg-yellow-500" }
  return { score: 100, label: "強", color: "bg-green-500" }
}

export function LoginPage() {
  const navigate = useNavigate()
  const { error: authError, handleLogin: apiLogin, handleRegister: apiRegister } = useAuth()

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginShowPassword, setLoginShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginTouched, setLoginTouched] = useState({ email: false, password: false })

  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regShowPassword, setRegShowPassword] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regTouched, setRegTouched] = useState({ email: false, password: false })

  const loginEmailError = loginTouched.email && loginEmail.length > 0 && !validateEmail(loginEmail)
  const loginPasswordError = loginTouched.password && loginPassword.length > 0 && loginPassword.length < 8

  const regEmailError = regTouched.email && regEmail.length > 0 && !validateEmail(regEmail)
  const regPasswordError = regTouched.password && regPassword.length > 0 && regPassword.length < 8

  const passwordStrength = getPasswordStrength(regPassword)

  const handleLogin = async () => {
    setLoginLoading(true)
    try {
      await apiLogin({ email: loginEmail, password: loginPassword })
      navigate("/program")
    } catch {
      // error is set via useAuth
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async () => {
    setRegLoading(true)
    try {
      await apiRegister({ email: regEmail, password: regPassword, displayName: regName })
      navigate("/program")
    } catch {
      // error is set via useAuth
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.12),transparent)]" />

      <Card className="relative z-10 w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Mic className="size-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">ラジオ番組メーカー</CardTitle>
          <CardDescription>ログインまたは新規登録してください</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">ログイン</TabsTrigger>
              <TabsTrigger value="register">新規登録</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">メールアドレス</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onBlur={() => setLoginTouched((p) => ({ ...p, email: true }))}
                />
                {loginEmailError && (
                  <p className="text-sm text-destructive">有効なメールアドレスを入力してください</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">パスワード</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={loginShowPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onBlur={() => setLoginTouched((p) => ({ ...p, password: true }))}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setLoginShowPassword(!loginShowPassword)}
                    type="button"
                  >
                    {loginShowPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
                {loginPasswordError && (
                  <p className="text-sm text-destructive">パスワードは8文字以上で入力してください</p>
                )}
              </div>
              {authError && (
                <p className="text-sm text-destructive">{authError}</p>
              )}
              <Button
                className="w-full"
                onClick={handleLogin}
                disabled={loginLoading || loginEmailError || loginPasswordError}
              >
                {loginLoading ? "ログイン中..." : "ログイン"}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">表示名</Label>
                <Input
                  id="reg-name"
                  placeholder="例: 田中太郎"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">メールアドレス</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  onBlur={() => setRegTouched((p) => ({ ...p, email: true }))}
                />
                {regEmailError && (
                  <p className="text-sm text-destructive">有効なメールアドレスを入力してください</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">パスワード（8文字以上）</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={regShowPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    onBlur={() => setRegTouched((p) => ({ ...p, password: true }))}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    type="button"
                  >
                    {regShowPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
                {regPasswordError && (
                  <p className="text-sm text-destructive">パスワードは8文字以上で入力してください</p>
                )}
                {regPassword.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">パスワード強度</span>
                      <span className={
                        passwordStrength.score <= 33
                          ? "text-destructive"
                          : passwordStrength.score <= 66
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-green-600 dark:text-green-400"
                      }>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className={
                      passwordStrength.score <= 33
                        ? "[&_[data-slot=progress-indicator]]:bg-destructive"
                        : passwordStrength.score <= 66
                          ? "[&_[data-slot=progress-indicator]]:bg-yellow-500"
                          : "[&_[data-slot=progress-indicator]]:bg-green-500"
                    }>
                      <Progress value={passwordStrength.score} />
                    </div>
                  </div>
                )}
              </div>
              {authError && (
                <p className="text-sm text-destructive">{authError}</p>
              )}
              <Button
                className="w-full"
                onClick={handleRegister}
                disabled={regLoading || regEmailError || regPasswordError}
              >
                {regLoading ? "登録中..." : "登録"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <a href="#" className="hover:underline">利用規約</a>
            <span className="mx-2">|</span>
            <a href="#" className="hover:underline">プライバシーポリシー</a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
