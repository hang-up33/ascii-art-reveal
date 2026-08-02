import { describe, expect, it } from "vitest";
import { randomReveal } from "../src/effects/randomReveal";
import { getEffect, availableEffects } from "../src/effects";
import { parseAscii } from "../src/utils/asciiParser";

describe("randomReveal", () => {
  it("グリッドと同じ形状の閾値を返す", () => {
    const grid = parseAscii("ab\ncd\nef");
    const thresholds = randomReveal.computeThresholds({
      grid,
      random: Math.random,
    });
    expect(thresholds).toHaveLength(3);
    thresholds.forEach((row) => expect(row).toHaveLength(2));
  });

  it("閾値はすべて [0, 1) の範囲に収まる", () => {
    const grid = parseAscii("xxxx\nyyyy");
    const thresholds = randomReveal.computeThresholds({
      grid,
      random: Math.random,
    });
    thresholds.flat().forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    });
  });

  it("注入した乱数生成器を使う（決定的）", () => {
    const grid = parseAscii("ab");
    const thresholds = randomReveal.computeThresholds({
      grid,
      random: () => 0.5,
    });
    expect(thresholds).toEqual([[0.5, 0.5]]);
  });
});

describe("effect registry", () => {
  it("random エフェクトが利用可能", () => {
    expect(availableEffects).toContain("random");
  });

  it("未実装エフェクトは random にフォールバックする", () => {
    expect(getEffect("wave")).toBe(randomReveal);
    expect(getEffect("random")).toBe(randomReveal);
  });
});
