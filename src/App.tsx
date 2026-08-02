import { useEffect, useState } from "react";
import { AsciiInput } from "./components/AsciiInput";
import { AsciiViewer } from "./components/AsciiViewer";
import { ControlPanel } from "./components/ControlPanel";
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
