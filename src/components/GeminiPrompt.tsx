import { useState } from "react";
import { useGeminiGeneration } from "../hooks/useGeminiGeneration";

interface GeminiPromptProps {
  /** 生成に成功したとき、ASCIIアート文字列を受け取る。 */
  onGenerated: (ascii: string) => void;
}

/**
 * 自然言語プロンプトから ASCIIアートを AI 生成する入力欄。
 * 生成結果は上位の入力（ASCIIテキスト欄）へ流し込まれ、そのまま
 * 編集・コピー・アニメーション表示できる。
 *
 * 接続先（VITE_API_URL）が未設定の場合は生成を無効化し、その旨を表示する。
 * 手入力によるASCII表示など通常機能はこの状態でも利用できる。
 */
export function GeminiPrompt({ onGenerated }: GeminiPromptProps) {
  const { configured, isLoading, error, generate, clearError } =
    useGeminiGeneration();
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async () => {
    const ascii = await generate(prompt);
    if (ascii !== null) {
      onGenerated(ascii);
    }
  };

  return (
    <div className="gen">
      <label className="gen__label" htmlFor="gen-prompt">
        つくりたいものを言葉で入力
      </label>
      <div className="gen__row">
        <input
          id="gen-prompt"
          className="gen__input"
          type="text"
          value={prompt}
          disabled={!configured || isLoading}
          placeholder="例: 月を見上げる猫"
          onChange={(event) => {
            setPrompt(event.target.value);
            if (error) clearError();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
        />
        <button
          type="button"
          className="gen__button"
          onClick={() => void handleSubmit()}
          disabled={!configured || isLoading || prompt.trim().length === 0}
        >
          {isLoading ? "生成中…" : "AIで生成"}
        </button>
      </div>

      {!configured && (
        <p className="gen__hint">
          AI生成は未設定です。手入力のASCIIアートはそのまま利用できます。
        </p>
      )}
      {error && (
        <p className="gen__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
