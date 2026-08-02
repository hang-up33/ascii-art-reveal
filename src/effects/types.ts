import type { AsciiGrid, RevealEffect } from "../types/ascii";

/**
 * エフェクトが閾値を計算する際に受け取るコンテキスト。
 * 乱数生成器を注入できるようにしておくことで、テスト時に決定的な
 * 挙動を再現できる。
 */
export interface RevealContext {
  grid: AsciiGrid;
  /** [0, 1) の乱数を返す関数。既定では Math.random。 */
  random: () => number;
}

/**
 * 収束エフェクトの実装インターフェース。
 *
 * 各エフェクトは「セルごとの確定閾値（0〜1）」を返すだけでよい。
 * アニメーション進捗 `progress` が閾値以上になったセルが完成形へ確定する。
 * この抽象により、Center / Scanline / Wave / Outline などは
 * 閾値の割り当てロジックを差し替えるだけで追加できる。
 */
export interface RevealEffectImpl {
  readonly id: RevealEffect;
  /**
   * thresholds[row][col] を [0, 1] の範囲で返す。
   * グリッドと同じ形状でなければならない。
   */
  computeThresholds(context: RevealContext): number[][];
}
