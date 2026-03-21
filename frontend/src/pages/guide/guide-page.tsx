import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function GuidePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">使い方ガイド</h2>

      {/* クイックスタートガイド */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">クイックスタートガイド</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            5つのステップで番組を作成できます。
          </p>
          <ol className="list-none space-y-3 pl-0">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </span>
              <div>
                <p className="font-semibold">テンプレートを選ぶかスクリプトを入力</p>
                <p className="text-sm text-muted-foreground">
                  テンプレートから選択するか、自分でスクリプトを書いて入力します。
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </span>
              <div>
                <p className="font-semibold">話者にボイスを割り当て</p>
                <p className="text-sm text-muted-foreground">
                  スクリプト内の各話者にプリセットボイスまたはクローンボイスを割り当てます。
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                3
              </span>
              <div>
                <p className="font-semibold">設定を調整（任意）</p>
                <p className="text-sm text-muted-foreground">
                  BGMやTurboモードなど、必要に応じて設定を変更します。
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                4
              </span>
              <div>
                <p className="font-semibold">「番組を生成する」ボタンをクリック</p>
                <p className="text-sm text-muted-foreground">
                  音声合成が実行され、番組が生成されます。
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                5
              </span>
              <div>
                <p className="font-semibold">プレビュー再生 → ダウンロード</p>
                <p className="text-sm text-muted-foreground">
                  生成された音声をプレビューで確認し、問題なければダウンロードします。
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* スクリプトの書き方 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">スクリプトの書き方</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>以下のいずれかの形式で話者とセリフを記述してください：</p>
          <pre className="rounded-md bg-muted p-4 text-sm">
{`[話者名] セリフテキスト
【話者名】 セリフテキスト
話者名: セリフテキスト
話者名： セリフテキスト`}
          </pre>

          <Separator />

          <h3 className="font-semibold">例：2人の掛け合い</h3>
          <pre className="rounded-md bg-muted p-4 text-sm">
{`[ホスト] こんにちは！本日の「テックニュース」のお時間です。
[ゲスト] 今日は最新のAI事情についてお伝えします。
[ホスト] まずはこちらのニュースから。`}
          </pre>

          <Separator />

          <h3 className="font-semibold">例：1人のナレーション</h3>
          <pre className="rounded-md bg-muted p-4 text-sm">
{`[ナレーター] 皆さんこんにちは。今日のテーマは「朝の習慣」です。
[ナレーター] 朝起きて最初にすることは何ですか？`}
          </pre>
        </CardContent>
      </Card>

      {/* 話者について */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">話者について</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5">
            <li>最大4名まで対応</li>
            <li>各話者に異なるボイスを割り当てられます</li>
            <li>プリセットボイスまたはクローンボイスが使用可能</li>
          </ul>
        </CardContent>
      </Card>

      {/* ボイスクローン機能の使い方 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ボイスクローン機能の使い方</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">音声サンプルの準備</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>録音時間は5秒以上を推奨</li>
              <li>背景ノイズが少ないクリアな音声を用意してください</li>
              <li>対応形式: MP3 / WAV / OGG</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold">利用までの流れ</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>サイドバーの「ボイスクローン」セクションを開く</li>
              <li>音声サンプルファイルをアップロード</li>
              <li>クローンボイスの名前を入力して作成</li>
              <li>話者のボイス選択でクローンボイスを割り当て</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* BGM設定の使い方 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">BGM設定の使い方</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">挿入モード</h3>
            <div className="mt-2 space-y-2 text-sm">
              <div className="rounded-md bg-muted p-3">
                <p><span className="font-medium">background</span> - 番組全体にBGMを流す</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p><span className="font-medium">intro</span> - 冒頭のみBGMを挿入</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p><span className="font-medium">outro</span> - 終了部分のみBGMを挿入</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p><span className="font-medium">intro_outro</span> - 冒頭と終了部分にBGMを挿入</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p><span className="font-medium">full</span> - 全区間にBGMを配置（ループ再生）</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold">対応フォーマット</h3>
            <p className="mt-1 text-sm">MP3 / WAV / OGG 形式のファイルをアップロードできます。</p>
          </div>
        </CardContent>
      </Card>

      {/* Turboプレビューモード */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Turboプレビューモード</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5">
            <li>サイドバーで有効にすると、プレビュー時はTurbo（高速・低コスト）で生成</li>
            <li>「HD本番生成」ボタンで高品質版を一発で再生成できます</li>
          </ul>
        </CardContent>
      </Card>

      {/* よくある質問 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">よくある質問（FAQ）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold">Q: 最大何名まで話者を設定できますか？</p>
            <p className="mt-1 text-sm text-muted-foreground">A: 最大4名まで設定できます。</p>
          </div>
          <Separator />
          <div>
            <p className="font-semibold">Q: 対応している音声フォーマットは？</p>
            <p className="mt-1 text-sm text-muted-foreground">A: MP3形式で出力されます。</p>
          </div>
          <Separator />
          <div>
            <p className="font-semibold">Q: キャッシュとは？</p>
            <p className="mt-1 text-sm text-muted-foreground">
              A: 同じ設定の音声を再生成しないための仕組みです。同一のスクリプト・ボイス設定で生成済みの音声がある場合、APIを呼び出さずにキャッシュから即座に返します。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
