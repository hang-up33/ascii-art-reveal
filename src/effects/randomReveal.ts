import type { RevealEffectImpl } from "./types";

/**
 * Random エフェクト。
 * 各セルへ一様乱数の閾値を割り当て、未確定セルをランダムな順で確定させる。
 */
export const randomReveal: RevealEffectImpl = {
  id: "random",
  computeThresholds({ grid, random }) {
    return grid.cells.map((row) => row.map(() => random()));
  },
};
