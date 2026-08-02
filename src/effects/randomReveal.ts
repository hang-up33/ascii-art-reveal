import type { RevealEffectImpl } from "./types";

/**
 * Random エフェクト。
 * 各セルへ一様乱数の閾値を割り当て、未確定セルをランダムな順で確定させる。
 */
export const randomReveal: RevealEffectImpl = {
  id: "random",
  computeThresholds({ grid, random }) {
    // random() が 0 を返すと閾値 0 になり、進捗 0 の初期フレームで
    // 完成形の文字が露出してしまう。正の最小値で下限を設ける。
    return grid.cells.map((row) =>
      row.map(() => Math.max(Number.MIN_VALUE, random())),
    );
  },
};
