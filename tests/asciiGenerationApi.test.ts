import { describe, expect, it } from "vitest";
import { stripCodeFences } from "../src/services/asciiGenerationApi";

describe("stripCodeFences", () => {
  it("言語指定つきコードフェンスを除去する", () => {
    const input = "```txt\n /\\_/\\\n( o.o )\n```";
    expect(stripCodeFences(input)).toBe(" /\\_/\\\n( o.o )");
  });

  it("言語指定なしのコードフェンスを除去する", () => {
    const input = "```\nHELLO\n```";
    expect(stripCodeFences(input)).toBe("HELLO");
  });

  it("前後の空行を除去する（内部の空行は保持）", () => {
    const input = "\n\nA\n\nB\n\n";
    expect(stripCodeFences(input)).toBe("A\n\nB");
  });

  it("CRLF を LF に正規化する", () => {
    expect(stripCodeFences("a\r\nb")).toBe("a\nb");
  });

  it("フェンスが無いテキストはそのまま返す", () => {
    expect(stripCodeFences("  x  \n y")).toBe("  x  \n y");
  });
});
