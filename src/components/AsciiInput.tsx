import { asciiSamples } from "../samples/sampleAscii";

interface AsciiInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * ASCIIアートの入力エリア。
 * サンプル読込・クリアを備える。入力値の変更はアニメーションの
 * 再構築（エンジン再生成）につながる。
 */
export function AsciiInput({ value, onChange }: AsciiInputProps) {
  return (
    <div className="input">
      <div className="input__toolbar">
        <span className="input__toolbar-label">サンプル:</span>
        {asciiSamples.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className="input__chip"
            onClick={() => onChange(sample.art)}
          >
            {sample.label}
          </button>
        ))}
        <button
          type="button"
          className="input__chip input__chip--clear"
          onClick={() => onChange("")}
        >
          クリア
        </button>
      </div>
      <textarea
        className="input__textarea"
        value={value}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        placeholder="ここにASCIIアートを入力してください"
        aria-label="ASCIIアート入力"
      />
    </div>
  );
}
