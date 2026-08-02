import { useEffect, useRef, useState } from "react";

interface CopyButtonProps {
  /** コピー対象のテキスト。 */
  text: string;
  className?: string;
}

/**
 * テキストをクリップボードへコピーするボタン。
 * コピー後は一定時間ラベルを「コピーしました」に切り替えてフィードバックする。
 */
export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボード API が使えない環境では何もしない。
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={() => void handleCopy()}
      disabled={text.length === 0}
      aria-label="ASCIIアートをコピー"
    >
      {copied ? "コピーしました" : "コピー"}
    </button>
  );
}
