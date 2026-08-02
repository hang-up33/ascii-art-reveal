interface ProgressBarProps {
  /** 0〜1 の進捗率。 */
  progress: number;
}

/**
 * アニメーションの進捗率をバーとパーセント表示で示すコンポーネント。
 */
export function ProgressBar({ progress }: ProgressBarProps) {
  const percent = Math.round(progress * 100);
  return (
    <div className="progress">
      <div
        className="progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="アニメーション進捗"
      >
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="progress__label">{percent}%</span>
    </div>
  );
}
