/**
 * ASCIIアート表示・アニメーションに関する共通型定義。
 *
 * Phase 1 では `random` エフェクトのみを実装するが、後続フェーズで
 * エフェクトを追加しやすいよう、型としては全種類を定義しておく。
 */

export type RevealEffect =
  "random" | "center" | "scanline" | "wave" | "outline" | "glitch";

export type AnimationStatus = "idle" | "playing" | "paused" | "finished";

export interface AnimationSettings {
  /** アニメーション全体の長さ（ミリ秒）。 */
  durationMs: number;
  /** 表示フォントサイズ（px）。 */
  fontSizePx: number;
  /** 行の高さ（倍率）。 */
  lineHeight: number;
  /** 未確定セルに表示するノイズ文字の候補。 */
  noiseCharacters: string;
  /** 収束エフェクトの種類。 */
  effect: RevealEffect;
}

/**
 * 完成形ASCIIアートを行×列の二次元データへ正規化したもの。
 * すべての行は `cols` 文字ぶんに空白で埋められている。
 */
export interface AsciiGrid {
  rows: number;
  cols: number;
  /** cells[row][col] の順でアクセスする。各要素は 1 文字。 */
  cells: string[][];
}
