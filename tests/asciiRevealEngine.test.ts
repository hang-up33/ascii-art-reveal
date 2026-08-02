import { describe, expect, it } from "vitest";
import { AsciiRevealEngine } from "../src/core/AsciiRevealEngine";
import { randomReveal } from "../src/effects/randomReveal";
import { parseAscii } from "../src/utils/asciiParser";

const target = "AB\nCD";

describe("AsciiRevealEngine", () => {
  it("進捗 1 で完成形の文字列を厳密に返す", () => {
    const grid = parseAscii(target);
    const engine = new AsciiRevealEngine(grid, randomReveal, "@#", () => 0.5);
    expect(engine.render(1)).toBe("AB\nCD");
  });

  it("進捗 0 では完成形と一致しない（ノイズが出る）", () => {
    // すべての閾値を 0.9 にし、進捗 0 で必ずノイズになるようにする。
    const grid = parseAscii(target);
    const effect = {
      id: "random" as const,
      computeThresholds: () => [
        [0.9, 0.9],
        [0.9, 0.9],
      ],
    };
    // ノイズ文字は "X" 固定。
    const engine = new AsciiRevealEngine(grid, effect, "X", () => 0);
    expect(engine.render(0)).toBe("XX\nXX");
  });

  it("出力の形状（行数・各行の長さ）は進捗に依らず一定", () => {
    const grid = parseAscii(target);
    const engine = new AsciiRevealEngine(
      grid,
      randomReveal,
      "@#*",
      Math.random,
    );
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      const lines = engine.render(p).split("\n");
      expect(lines).toHaveLength(2);
      lines.forEach((line) => expect(line).toHaveLength(2));
    }
  });

  it("進捗が閾値以上のセルだけ確定する", () => {
    const grid = parseAscii("AB");
    const effect = {
      id: "random" as const,
      computeThresholds: () => [[0.3, 0.7]],
    };
    // ノイズは "." 固定。進捗 0.5 では 1 文字目のみ確定。
    const engine = new AsciiRevealEngine(grid, effect, ".", () => 0);
    expect(engine.render(0.5)).toBe("A.");
  });

  it("範囲外の進捗値は 0〜1 に丸められる", () => {
    const grid = parseAscii("AB");
    const engine = new AsciiRevealEngine(grid, randomReveal, "@", Math.random);
    expect(engine.render(5)).toBe("AB");
    expect(engine.render(-5)).toBe("@@");
  });

  it("ノイズ文字が空なら既定セットを使う", () => {
    const grid = parseAscii("A");
    const engine = new AsciiRevealEngine(grid, randomReveal, "", () => 0);
    // 既定ノイズ "@%#*+=-:. " の先頭は "@"。閾値 0 のとき進捗 0 で確定してしまうため、
    // 閾値を固定するエフェクトで検証する。
    const forced = new AsciiRevealEngine(
      grid,
      { id: "random", computeThresholds: () => [[0.5]] },
      "",
      () => 0,
    );
    expect(forced.render(0)).toBe("@");
    expect(engine.render(1)).toBe("A");
  });
});
