# Anime Tracker

アニメの視聴進捗（話数・視聴時間・ステータス）を月別に管理するPWA（Progressive Web App）。
オフラインファーストで動作し、Googleアカウントによるクラウド同期にも対応。

## 主な機能

| 機能 | 説明 |
|------|------|
| 月別管理 | 放送年月ごとにアニメを一覧表示・フィルタリング |
| エピソード追跡 | 話数ごとの視聴状態管理、スワイプで+1/-1操作 |
| コレクション | 登録アニメをグリッド表示、ポスター画像つき |
| 統計ダッシュボード | 総視聴時間・話数・本数の集計、月別グラフ（時間/話数/本数切替） |
| AI メタデータ取得 | Gemini APIでタグ・キャラクター情報を自動取得 |
| クラウド同期 | Firebase Auth（Google OAuth）+ Firestoreでデバイス間同期 |
| PWA | ホーム画面追加、オフライン動作、スタンドアロン表示 |

## 技術スタック

### フレームワーク・言語

| 技術 | バージョン | 用途 |
|------|-----------|------|
| [Next.js](https://nextjs.org/) | 16.2.3 | App Router ベースのReactフレームワーク。ルーティング・SSR・API Routesを担当 |
| [React](https://react.dev/) | 19.2.4 | UIコンポーネントの構築 |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | 型安全なコード。strict モード有効 |

### データベース・ストレージ

| 技術 | 用途 |
|------|------|
| [Dexie.js](https://dexie.org/) | IndexedDB のラッパー。ブラウザ内にアニメ・エピソードデータをローカル保存。オフラインファーストの中核 |
| [dexie-react-hooks](https://dexie.org/docs/dexie-react-hooks/useLiveQuery()) | `useLiveQuery` でDBの変更をリアクティブにUIへ反映 |
| [Firebase Firestore](https://firebase.google.com/docs/firestore) | クラウド側のデータストア。ユーザーごとに `users/{uid}/anime/{id}` の構造でアニメデータを保存 |

### 認証

| 技術 | 用途 |
|------|------|
| [Firebase Auth](https://firebase.google.com/docs/auth) | Googleアカウントによるログイン。クラウド同期の認証基盤 |

### UI・スタイリング

| 技術 | 用途 |
|------|------|
| [Tailwind CSS](https://tailwindcss.com/) v4 | ユーティリティファーストのCSS。CSS変数によるカスタムテーマ（オレンジ系アクセントカラー） |
| [Recharts](https://recharts.org/) | 統計ページの月別バーチャート描画 |
| [Geist Sans](https://vercel.com/font) | メインフォント（日本語フォールバック: Hiragino Kaku Gothic ProN） |

### PWA

| 技術 | 用途 |
|------|------|
| [@ducanh2912/next-pwa](https://github.com/nicolesung/next-pwa) | Next.js用PWAプラグイン。Service Worker生成、キャッシュ戦略、オフライン対応 |
| Web App Manifest | アプリ名・アイコン・表示モード（standalone）・テーマカラーの定義 |

### AI

| 技術 | 用途 |
|------|------|
| [Gemini 2.5 Flash API](https://ai.google.dev/) | アニメタイトルからタグ・キャラクター情報を自動抽出。`/api/anime-info` エンドポイント経由で呼び出し |

### デプロイ・ホスティング

| 技術 | 用途 |
|------|------|
| [Vercel](https://vercel.com/) | 自動デプロイ。PR ごとにプレビュー環境が生成される |

### 開発ツール

| 技術 | 用途 |
|------|------|
| [ESLint](https://eslint.org/) 9.x | コード品質チェック（flat config） |
| [PostCSS](https://postcss.org/) | Tailwind CSS のビルドパイプライン |
| [Sharp](https://sharp.pixelplumbing.com/) | 画像最適化（Next.js Image コンポーネント用） |
| [Turbopack](https://turbo.build/pack) | 開発サーバーの高速バンドラー |

## アーキテクチャ

### データフロー

```
ブラウザ (IndexedDB / Dexie)
    ↕ useLiveQuery でリアクティブ同期
React コンポーネント
    ↕ ログイン時
Firebase Firestore (クラウドバックアップ)
```

### 同期戦略

- **初回ログイン時**: クラウドにデータがあればクラウド優先（ローカルを上書き）。クラウドが空でローカルにデータがあればアップロード
- **以降**: アニメの追加・編集・削除時に個別にクラウドへ同期
- **画像**: Blob → Base64文字列に変換してFirestoreに保存

### オフラインファースト

Dexie（IndexedDB）がプライマリストレージ。ネットワークなしでも全機能が動作し、オンライン復帰時にクラウドと同期。

## データベーススキーマ

### anime テーブル

| カラム | 型 | 説明 |
|--------|------|------|
| id | number (auto) | 主キー |
| title | string (unique) | アニメタイトル |
| totalEpisodes | number | 全話数 |
| watchedEpisodes | number | 視聴済み話数（episodes テーブルから自動計算） |
| episodeDuration | number | 1話あたりの分数 |
| year | number \| null | 放送年 |
| month | number \| null | 放送月（1-12） |
| status | string | `watching` / `completed` / `dropped` / `planned` |
| memo | string | メモ |
| tags | string[] | タグ（複数エントリインデックス） |
| characters | object[] | キャラクター情報 `{ name, description }` |
| imageBlob | Blob \| null | ポスター画像 |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

### episodes テーブル

| カラム | 型 | 説明 |
|--------|------|------|
| id | number (auto) | 主キー |
| animeId | number | anime.id への外部キー |
| number | number | 話数（1始まり） |
| watchedAt | Date \| null | 視聴日時（null = 未視聴） |
| memo | string | 話ごとのメモ |

## ページ構成

| パス | ページ | 説明 |
|------|--------|------|
| `/` | ホーム | 月別アニメ一覧。検索・ステータス/タグフィルタ・月セレクタ・スワイプ操作 |
| `/collection` | コレクション | 2カラムグリッド表示。ポスター画像・進捗オーバーレイ |
| `/stats` | 統計 | 総視聴時間/話数/本数のサマリー、月別バーチャート |
| `/add` | 追加 | アニメ登録フォーム。AI メタデータ取得・重複チェック |
| `/anime/[id]` | 詳細 | アニメ詳細（読み取り専用）。画像・エピソード一覧・タグ・キャラ |
| `/anime/[id]/edit` | 編集 | 編集フォーム・削除 |

## コンポーネント構成

```
src/
├── app/
│   ├── layout.tsx              # ルートレイアウト（メタデータ・ボトムナビ）
│   ├── page.tsx                # ホーム（月別ビュー）
│   ├── globals.css             # グローバルCSS・テーマ変数
│   ├── add/page.tsx            # アニメ追加
│   ├── collection/page.tsx     # コレクション
│   ├── stats/page.tsx          # 統計ダッシュボード
│   ├── api/anime-info/route.ts # Gemini APIエンドポイント
│   └── anime/[id]/
│       ├── page.tsx            # 詳細（読み取り専用）
│       └── edit/page.tsx       # 編集
├── components/
│   ├── AnimeCard.tsx           # スワイプ対応アニメカード（+1/-1話数操作）
│   ├── AnimeForm.tsx           # 登録・編集共通フォーム（AI取得ボタン付き）
│   ├── AuthProvider.tsx        # Firebase認証コンテキスト・初回同期ロジック
│   ├── BottomNav.tsx           # 下部固定ナビゲーション（4タブ）
│   ├── EpisodeList.tsx         # エピソード一覧（チェックボックス・メモ）
│   ├── MonthSelector.tsx       # 年月ピッカー（スクロールパネル）
│   ├── MonthlyChart.tsx        # Rechartsバーチャート（3モード切替）
│   └── UserMenu.tsx            # ログイン/ログアウト・同期ステータス表示
└── lib/
    ├── db.ts                   # Dexieスキーマ定義・ヘルパー関数
    ├── firebase.ts             # Firebase初期化
    └── sync.ts                 # クラウド同期関数群
```

## CI/CD

### Gemini PRレビュー & 自動マージ

PRを作成すると、GitHub Actionsが自動で以下を実行する:

1. **コードレビュー**: `scripts/gemini-review.mjs` がPRのdiffをGemini 2.5 Flash APIに送信し、レビューコメントをPRに投稿
2. **自動マージ**: レビュー完了後、squash mergeで自動マージ

```
PR作成 → GitHub Actions起動 → Gemini APIレビュー → コメント投稿 → squash自動マージ
```

- **ワークフロー**: `.github/workflows/gemini-pr-review.yml`
- **レビュースクリプト**: `scripts/gemini-review.mjs`
- **リトライ**: 503/429エラー時は指数バックオフ（最大5回）
- **必要なSecret**: `GEMINI_API_KEY`

## 環境変数

| 変数名 | スコープ | 用途 |
|--------|---------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | クライアント | Firebase API キー |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | クライアント | Firebase Auth ドメイン |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | クライアント | Firebase プロジェクトID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | クライアント | Firebase Storage バケット |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | クライアント | Firebase Messaging 送信者ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | クライアント | Firebase アプリID |
| `GEMINI_API_KEY` | サーバー | Gemini API キー（`/api/anime-info` で使用） |

## 開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動（Turbopack）
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# Lint
npm run lint
```

## 開発ワークフロー

```
Claude Codeでコード作成
  → featureブランチにpush
    → PR作成
      → GitHub Actions（Gemini 2.5 Flash）がレビューコメント投稿
        → squash自動マージ
          → Vercelが自動デプロイ
```
