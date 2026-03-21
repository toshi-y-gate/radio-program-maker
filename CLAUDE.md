# ラジオ番組メーカー（AI Voice Radio Creator）

## 基本原則
> 「シンプルさは究極の洗練である」

- **最小性**: 不要なコードは一文字も残さない。必要最小限を超えない
- **単一性**: 真実の源は常に一つ（要件: docs/requirements.md、進捗: docs/SCOPE_PROGRESS.md）
- **刹那性**: 役目を終えたコード・ドキュメントは即座に削除する
- **実証性**: 推測しない。ログ・DB・APIレスポンスで事実を確認する
- **潔癖性**: エラーは隠さない。フォールバックで問題を隠蔽しない

## プロジェクト設定

技術スタック:
  言語: Python 3.12
  Web UI: Streamlit >= 1.30.0
  音声合成: MiniMax TTS API (Speech 2.8)
  音声処理: pydub >= 0.25.1
  設定管理: python-dotenv

ポート設定:
  streamlit: 8501

## 環境変数

- `.env`（プロジェクトルート）に `MINIMAX_API_KEY` を設定
- 設定モジュール: core/config.py（環境変数集約）
- ハードコード禁止: 環境変数はconfig.py経由のみ
- **絶対禁止**: .env.test, .env.development, .env.example は作成しない

## 命名規則

- ファイル: snake_case.py
- 変数・関数: snake_case
- 定数: UPPER_SNAKE_CASE
- クラス: PascalCase

## コード品質

- 関数: 100行以下 / ファイル: 700行以下 / 複雑度: 10以下 / 行長: 120文字

## 開発ルール

### サーバー起動
- `streamlit run app.py --server.port 8501`
- サーバーは1つのみ維持。別ポートでの重複起動禁止
- 起動前に既存プロセスを確認

### エラー対応
- 環境変数エラー → 全タスク停止、即報告（試行錯誤禁止）
- API接続エラー → 1回だけ再試行
- 同じエラー3回 → Web検索で最新情報を収集

### デプロイ
- デプロイはユーザーの明示的な承認を得てから実行する

### ドキュメント管理
許可されたドキュメントのみ作成可能:
- docs/SCOPE_PROGRESS.md（実装計画・進捗）
- docs/requirements.md（要件定義）
- docs/DEPLOYMENT.md（デプロイ情報）
上記以外のドキュメント作成はユーザー許諾が必要。

## MiniMax TTS API 注意点

- エンドポイント: `https://api.minimax.io/v1/t2a_v2`
- 認証: Bearer Token
- テキスト上限: 10,000文字/リクエスト
- キャッシュを活用してAPI呼び出しを最小化すること
- HDモデルは高品質だがコスト高、Turboは高速だが品質は若干劣る
