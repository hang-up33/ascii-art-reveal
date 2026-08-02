import { memo } from "react";
import type { AnimationStatus } from "../types/ascii";

interface ControlPanelProps {
  status: AnimationStatus;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

/**
 * Phase 1 の再生コントロール。
 * 再生 / 一時停止 / 再開 / リセット を状態に応じて有効・無効化する。
 *
 * コールバックは安定参照のため、status が変わったときだけ再描画すれば
 * よい。進捗更新による毎フレーム再レンダリングを避けるため memo でラップする。
 */
export const ControlPanel = memo(function ControlPanel({
  status,
  onPlay,
  onPause,
  onResume,
  onReset,
}: ControlPanelProps) {
  const isPlaying = status === "playing";
  const isPaused = status === "paused";
  const isFinished = status === "finished";
  const isIdle = status === "idle";

  return (
    <div className="controls">
      <button
        type="button"
        className="controls__button controls__button--primary"
        onClick={onPlay}
        disabled={isPlaying || isPaused}
      >
        {isFinished ? "もう一度" : "再生"}
      </button>

      <button
        type="button"
        className="controls__button"
        onClick={onPause}
        disabled={!isPlaying}
      >
        一時停止
      </button>

      <button
        type="button"
        className="controls__button"
        onClick={onResume}
        disabled={!isPaused}
      >
        再開
      </button>

      <button
        type="button"
        className="controls__button"
        onClick={onReset}
        disabled={isIdle}
      >
        リセット
      </button>
    </div>
  );
});
