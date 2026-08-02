# ASCII Art Reveal

ASCIIアートがランダムな文字ノイズから徐々に完成形へ収束し、像が「じわーっと浮かび上がる」Webアプリです。

手入力した ASCIIアートに加え、**自然言語から AI（Gemini）で ASCIIアートを生成**し、ノイズから完成形へ収束させるアニメーションとして表示できます。生成・入力したアートは**ワンクリックでコピー**できます。

## 実装済み機能

- Vite + React + TypeScript 構成
- **自然言語 → ASCIIアート生成**（Gemini、Cloudflare Worker 経由）
- **生成・入力したアートのコピー**（クリップボード）
- サンプル ASCIIアートの表示・切り替え
- ASCIIアートの手入力・クリア（手入力したアートはそのまま表示）
- **Random** エフェクト（ランダムな順でセルが確定）
- 再生 / 一時停止 / 再開 / リセット
- 進捗表示
- 黒背景・等幅フォント・中央表示・横スクロール
- スマートフォン向けのレスポンシブ表示

AI 生成は接続先（`VITE_API_URL`）が未設定でも自動的に無効化され、手入力を含むその他の機能はそのまま利用できます。

> Center / Scanline / Wave / Outline / Glitch などのエフェクト、速度・文字サイズの変更 UI、
> GitHub Pages への自動デプロイは後続フェーズで追加予定です。

## 起動方法

```bash
npm install
npm run dev
```

表示された URL（既定では http://localhost:5173）をブラウザで開きます。

## スクリプト

| コマンド               | 内容                                   |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | 開発サーバーを起動                     |
| `npm run build`        | 型チェック + 本番ビルド（`dist` 生成） |
| `npm run preview`      | ビルド成果物をローカルでプレビュー     |
| `npm test`             | Vitest でテストを実行                  |
| `npm run lint`         | ESLint を実行                          |
| `npm run format`       | Prettier で整形                        |
| `npm run format:check` | 整形チェックのみ                       |

## アーキテクチャ

アニメーションのロジックと UI を分離し、エフェクトを後から追加しやすい構造にしています。

```
src/
├─ core/
│  └─ AsciiRevealEngine.ts   # UI 非依存の収束計算エンジン
├─ effects/
│  ├─ types.ts               # エフェクトの共通インターフェース
│  ├─ randomReveal.ts        # Random エフェクト
│  └─ index.ts               # エフェクトのレジストリ / フォールバック
├─ hooks/
│  ├─ useAsciiAnimation.ts   # requestAnimationFrame でエンジンを駆動
│  └─ useGeminiGeneration.ts # AI 生成のローディング/エラー状態管理
├─ services/
│  └─ asciiGenerationApi.ts  # Worker への生成リクエスト
├─ components/
│  ├─ AsciiInput.tsx
│  ├─ AsciiViewer.tsx        # 購読経由で <pre> を直接更新（再レンダリング回避）
│  ├─ ControlPanel.tsx
│  ├─ CopyButton.tsx         # クリップボードへコピー
│  ├─ GeminiPrompt.tsx       # 自然言語プロンプト入力
│  └─ ProgressBar.tsx
├─ samples/sampleAscii.ts
├─ utils/                    # 正規化・パース
├─ types/ascii.ts
├─ App.tsx
├─ main.tsx
└─ styles.css

worker/                       # Gemini API 中継 Cloudflare Worker
├─ src/index.ts               #   POST /api/generate-ascii
└─ wrangler.toml
```

### エフェクトの追加方法

新しいエフェクトは、セルごとの「確定閾値（0〜1）」を返す実装を追加するだけです。

1. `src/effects/` に `RevealEffectImpl` を実装したファイルを作成する
2. `src/effects/index.ts` の `effectRegistry` へ登録する

エンジン・フック・UI 側の変更なしにエフェクトを切り替えられます。

### 設計上のポイント

- 進捗は **時刻ベース**（`performance.now()` と `durationMs`）で算出するため、端末性能によって所要時間が変わりません。
- 大きな ASCII 文字列は購読経由で `<pre>` の `textContent` を直接更新するため、セル単位の React 再レンダリングは発生しません。

## AI 生成のセットアップ（Cloudflare Worker）

自然言語 → ASCIIアート生成は、**Gemini API キーを安全に保持するために Cloudflare Worker 経由**で呼び出します。キーはブラウザ・リポジトリには一切置きません。

### 1. Worker をデプロイする

```bash
cd worker
npm install

# Gemini API キーを Secret として登録（リポジトリには保存されない）
npx wrangler secret put GEMINI_API_KEY

# 公開元オリジンを制限（wrangler.toml の ALLOWED_ORIGIN を編集）
#   例: "https://<ユーザー名>.github.io"

npx wrangler deploy
```

- `GEMINI_MODEL`（既定 `gemini-2.5-flash`）は `wrangler.toml` の `[vars]` で変更できます。利用可能なモデルは変わるため、必要に応じて[サポート対象モデル](https://ai.google.dev/gemini-api/docs/models)の最新値に更新してください（`gemini-1.5` 系は廃止済み）。
- `ALLOWED_ORIGIN` の既定はローカル開発用（`http://localhost:5173`）です。デプロイ前に自分の GitHub Pages のオリジンへ変更してください（`*` はクォータ悪用を招くため非推奨）。
- Worker は入力長・生成サイズの検証、コードフェンス除去、簡易レート制限、CORS 制限、許可オリジン以外のサーバー側拒否を行います。

> **クォータ保護について**: `ALLOWED_ORIGIN` によるオリジン判定は、ブラウザからの他サイト経由の悪用を防ぐ _ベストエフォートの CORS ポリシー_ であり、認証ではありません。Origin ヘッダは非ブラウザ（curl 等）からは偽装できるため、これだけでクォータ悪用を完全には防げません。個人・少量利用なら CORS 制限＋レート制限で実用上十分ですが、広く公開して大量アクセスが想定される場合は、Cloudflare 側の[レート制限](https://developers.cloudflare.com/waf/rate-limiting-rules/)/WAF や [Turnstile](https://developers.cloudflare.com/turnstile/) 等の追加を検討してください。

### 2. フロントエンドに接続先を設定する

`.env`（`.env.example` をコピー）に、デプロイした Worker の URL を設定します。

```bash
cp .env.example .env
# .env を編集
#   VITE_API_URL=https://ascii-art-reveal-api.<あなた>.workers.dev
```

未設定の場合、AI 生成 UI は自動的に無効化され、手入力など他の機能はそのまま使えます。

### ローカルで試す

```bash
# 1) Worker をローカル起動（別ターミナル）
cd worker && npx wrangler dev        # http://localhost:8787

# 2) フロントの .env に接続先を設定
#   VITE_API_URL=http://localhost:8787

# 3) フロントを起動
npm run dev
```

## GitHub Pages 対応について

`vite.config.ts` の `base` をリポジトリ名（`/ascii-art-reveal/`）に合わせています。
リポジトリ名を変更する場合は同ファイルの `REPOSITORY_NAME` を書き換えてください。
GitHub Actions による自動デプロイは Phase 3 で追加します。
