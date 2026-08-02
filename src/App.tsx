import { useCallback, useEffect, useRef, useState } from "react";
import { AsciiInput } from "./components/AsciiInput";
import { AsciiViewer } from "./components/AsciiViewer";
import { ControlPanel } from "./components/ControlPanel";
import { GeminiPrompt } from "./components/GeminiPrompt";
import { ProgressBar } from "./components/ProgressBar";
import { useAsciiAnimation } from "./hooks/useAsciiAnimation";
import { defaultSample } from "./samples/sampleAscii";
import type { AnimationSettings } from "./types/ascii";

const DEFAULT_SETTINGS: AnimationSettings = {
  durationMs: 3500,
  fontSizePx: 16,
  lineHeight: 1.2,
  noiseCharacters: "@%#*+=-:. ",
  effect: "random",
};

/**
 * アプリのルートコンポーネント。
 * 入力・ビューワー・コントロール・進捗をまとめ、アニメーションフックを介して
 * 状態を配線する。マウント時に一度だけ自動再生する。
 */
export default function App() {
  const [ascii, setAscii] = useState(defaultSample.art);
  // Phase 1 では設定は既定値固定。Phase 2 で UI から変更できるようにする。
  const [settings] = useState<AnimationSettings>(DEFAULT_SETTINGS);

  const controller = useAsciiAnimation(ascii, settings);
  const { status, progress, play, pause, resume, reset } = controller;

  // マウント時に自動再生する（play は安定参照なので実質 1 回だけ実行される）。
  useEffect(() => {
    play();
  }, [play]);

  // AI 生成直後は収束アニメーションを自動再生する。
  // エンジンは ascii 変更時の effect で作り直されるため、その後に play する
  // 必要がある。フラグ方式でエンジン再構築後の再生を保証する。
  const pendingPlayRef = useRef(false);
  useEffect(() => {
    if (pendingPlayRef.current) {
      pendingPlayRef.current = false;
      play();
    }
  }, [ascii, play]);

  const handleGenerated = useCallback((generated: string) => {
    pendingPlayRef.current = true;
    setAscii(generated);
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">ASCII Art Reveal</h1>
        <p className="app__subtitle">
          ランダムなノイズから ASCIIアートがじわーっと浮かび上がります。
        </p>
      </header>

      <main className="app__main">
        <section className="app__panel app__panel--input">
          <GeminiPrompt onGenerated={handleGenerated} />
          <div className="app__panel-divider" />
          <AsciiInput value={ascii} onChange={setAscii} />
        </section>
        <section className="app__panel app__panel--viewer">
          <AsciiViewer controller={controller} settings={settings} />
        </section>
      </main>

      <footer className="app__footer">
        <ControlPanel
          status={status}
          onPlay={play}
          onPause={pause}
          onResume={resume}
          onReset={reset}
        />
        <ProgressBar progress={progress} />
      </footer>
    </div>
  );
}
