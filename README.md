# ASCII Art Reveal

ASCIIアートがランダムな文字ノイズから徐々に完成形へ収束し、像が「じわーっと浮かび上がる」Webアプリです。

これは **Phase 1（MVP の中核）** の実装です。手入力した ASCIIアートを、ノイズから完成形へ収束させるアニメーションとして表示できます。

## 実装済み機能（Phase 1）

- Vite + React + TypeScript 構成
- サンプル ASCIIアートの表示・切り替え
- ASCIIアートの手入力・クリア
- **Random** エフェクト（ランダムな順でセルが確定）
- 再生 / 一時停止 / 再開 / リセット
- 進捗表示
- 黒背景・等幅フォント・中央表示・横スクロール
- スマートフォン向けのレスポンシブ表示

> Center / Scanline / Wave / Outline / Glitch などのエフェクト、速度・文字サイズの変更 UI、
> Gemini API 連携、GitHub Pages への自動デプロイは後続フェーズ（Phase 2 以降）で追加予定です。

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
│  └─ useAsciiAnimation.ts   # requestAnimationFrame でエンジンを駆動
├─ components/
│  ├─ AsciiInput.tsx
│  ├─ AsciiViewer.tsx        # 購読経由で <pre> を直接更新（再レンダリング回避）
│  ├─ ControlPanel.tsx
│  └─ ProgressBar.tsx
├─ samples/sampleAscii.ts
├─ utils/                    # 正規化・パース
├─ types/ascii.ts
├─ App.tsx
├─ main.tsx
└─ styles.css
```

### エフェクトの追加方法

新しいエフェクトは、セルごとの「確定閾値（0〜1）」を返す実装を追加するだけです。

1. `src/effects/` に `RevealEffectImpl` を実装したファイルを作成する
2. `src/effects/index.ts` の `effectRegistry` へ登録する

エンジン・フック・UI 側の変更なしにエフェクトを切り替えられます。

### 設計上のポイント

- 進捗は **時刻ベース**（`performance.now()` と `durationMs`）で算出するため、端末性能によって所要時間が変わりません。
- 大きな ASCII 文字列は購読経由で `<pre>` の `textContent` を直接更新するため、セル単位の React 再レンダリングは発生しません。

## GitHub Pages 対応について

`vite.config.ts` の `base` をリポジトリ名（`/ascii-art-reveal/`）に合わせています。
リポジトリ名を変更する場合は同ファイルの `REPOSITORY_NAME` を書き換えてください。
GitHub Actions による自動デプロイは Phase 3 で追加します。
