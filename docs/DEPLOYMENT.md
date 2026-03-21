# デプロイメント情報

## インフラ構成

| コンポーネント | サービス | 用途 |
|--------------|---------|------|
| フロントエンド | Vercel | React SPA配信 (CDN) |
| バックエンド | Railway | Express API サーバー |
| データベース | Neon | PostgreSQL (サーバーレス) |

## セットアップ手順

### 1. Neon PostgreSQL

1. [neon.tech](https://neon.tech) でプロジェクト作成
2. リージョン: `ap-northeast-1` (東京)
3. 接続文字列を2つ取得:
   - **Pooled** (アプリ用): `postgresql://...@ep-xxx-pooler.../neondb?sslmode=require`
   - **Direct** (マイグレーション用): `postgresql://...@ep-xxx.../neondb?sslmode=require`

### 2. Railway (バックエンド)

1. [railway.app](https://railway.app) でプロジェクト作成
2. GitHubリポジトリ連携
3. Root Directory: `backend`
4. Volume作成: マウントパス `/app/output` (音声ファイル永続化)
5. 環境変数を設定（下記参照）
6. デプロイ後、公開URLを取得

### 3. Vercel (フロントエンド)

1. [vercel.com](https://vercel.com) でプロジェクト作成
2. GitHubリポジトリ連携
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. `frontend/vercel.json` の `RAILWAY_DOMAIN` をRailwayの公開URLに置換
7. デプロイ後、RailwayのCORS_ORIGINをVercelのURLに更新

## 環境変数

### Railway に設定

| 変数名 | 値 | 備考 |
|--------|-----|------|
| `DATABASE_URL` | Neon Pooled接続文字列 | アプリケーション用 |
| `DIRECT_URL` | Neon Direct接続文字列 | マイグレーション用 |
| `JWT_SECRET` | `openssl rand -base64 32` で生成 | 32文字以上 |
| `MINIMAX_API_KEY` | MiniMax APIキー | 音声生成に必須 |
| `CORS_ORIGIN` | `https://<your-app>.vercel.app` | Vercelデプロイ後に設定 |
| `PORT` | (設定不要) | Railwayが自動注入 |

### Vercel に設定

アプリケーション用の環境変数は不要（Rewritesでバックエンドに転送）。

## デプロイ順序

```
1. Neon DB作成 → 接続文字列取得
2. ローカルで prisma migrate dev --name init 実行
3. Railway デプロイ → 公開URL取得
4. vercel.json の RAILWAY_DOMAIN を更新
5. Vercel デプロイ → 公開URL取得
6. Railway の CORS_ORIGIN を Vercel URL に更新
7. 動作確認
```

## 動作確認チェックリスト

- [ ] `GET https://<railway>/health` → `{"status":"ok"}`
- [ ] ユーザー登録・ログイン
- [ ] 音声生成・再生
- [ ] 履歴表示・削除

## カスタムドメイン (オプション)

Vercel・Railway共にカスタムドメイン設定可能:
- フロントエンド: `app.your-domain.com` (Vercel)
- vercel.json のRewrite先とRailwayのCORS_ORIGINを更新すること
