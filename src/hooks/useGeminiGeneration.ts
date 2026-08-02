import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateAscii,
  GenerationError,
  isGenerationConfigured,
} from "../services/asciiGenerationApi";

const DEFAULT_MAX_WIDTH = 60;
const DEFAULT_MAX_HEIGHT = 30;

export interface UseGeminiGeneration {
  /** AI 生成が利用可能（接続先が設定済み）か。 */
  configured: boolean;
  /** 生成中かどうか。 */
  isLoading: boolean;
  /** 直近のエラーメッセージ（無ければ null）。 */
  error: string | null;
  /** プロンプトから生成する。成功時は ASCII 文字列、失敗時は null を返す。 */
  generate: (prompt: string) => Promise<string | null>;
  /** エラー表示をクリアする。 */
  clearError: () => void;
}

/**
 * 自然言語プロンプトから ASCIIアートを生成するフック。
 * ローディング・エラー状態を管理し、連続実行時は前回リクエストを中断する。
 */
export function useGeminiGeneration(): UseGeminiGeneration {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (prompt: string): Promise<string | null> => {
      const trimmed = prompt.trim();
      if (!trimmed) {
        setError("プロンプトを入力してください。");
        return null;
      }

      // 進行中のリクエストがあれば中断する。
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      try {
        const ascii = await generateAscii(
          {
            prompt: trimmed,
            maxWidth: DEFAULT_MAX_WIDTH,
            maxHeight: DEFAULT_MAX_HEIGHT,
          },
          controller.signal,
        );
        return ascii;
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          // 新しいリクエストに置き換えられただけなので無視する。
          return null;
        }
        setError(
          cause instanceof GenerationError
            ? cause.message
            : "予期しないエラーが発生しました。",
        );
        return null;
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  // アンマウント時に進行中リクエストを中断する。
  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    configured: isGenerationConfigured(),
    isLoading,
    error,
    generate,
    clearError,
  };
}
