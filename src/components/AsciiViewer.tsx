import { useEffect, useRef } from "react";
import type { AsciiAnimationController } from "../hooks/useAsciiAnimation";
import type { AnimationSettings } from "../types/ascii";

interface AsciiViewerProps {
  controller: AsciiAnimationController;
  settings: AnimationSettings;
}

/**
 * ノイズから収束する ASCIIアートの表示領域。
 *
 * フレーム更新は controller.subscribe 経由で受け取り、
 * `<pre>` の textContent を直接書き換える。これにより
 * 大きな文字列が React の差分計算・再レンダリング対象にならない。
 */
export function AsciiViewer({ controller, settings }: AsciiViewerProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const { subscribe } = controller;

  useEffect(() => {
    return subscribe((frame) => {
      const el = preRef.current;
      if (el) {
        el.textContent = frame;
      }
    });
  }, [subscribe]);

  return (
    <div className="viewer" role="img" aria-label="ASCIIアート表示領域">
      <pre
        ref={preRef}
        className="viewer__pre"
        style={{
          fontSize: `${settings.fontSizePx}px`,
          lineHeight: settings.lineHeight,
        }}
      />
    </div>
  );
}
