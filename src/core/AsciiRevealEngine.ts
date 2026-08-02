import type { RevealEffectImpl } from "../effects/types";
import type { AsciiGrid } from "../types/ascii";

/** ノイズ文字が空の場合に使う既定のノイズ文字セット（末尾に空白を含む）。 */
export const DEFAULT_NOISE_CHARACTERS = "@%#*+=-:. ";

/** 数値を 0〜1 の範囲へ丸める。 */
function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * ASCIIアートの収束アニメーションを計算する純粋なエンジン。
 *
 * React などの UI フレームワークには一切依存しない。
 * `render(progress)` に 0〜1 の進捗率を渡すと、その時点の表示文字列を返す。
 * 進捗が各セルの閾値以上になったセルは完成形の文字へ「確定」し、
 * 未確定セルは毎フレーム別のノイズ文字を表示してちらつく。
 */
export class AsciiRevealEngine {
  private readonly grid: AsciiGrid;
  private readonly thresholds: number[][];
  private readonly noise: string[];
  private readonly random: () => number;

  constructor(
    grid: AsciiGrid,
    effect: RevealEffectImpl,
    noiseCharacters: string,
    random: () => number = Math.random,
  ) {
    this.grid = grid;
    this.random = random;
    const source = noiseCharacters.length
      ? noiseCharacters
      : DEFAULT_NOISE_CHARACTERS;
    this.noise = Array.from(source);
    this.thresholds = effect.computeThresholds({ grid, random });
  }

  /** グリッドの行数。 */
  get rows(): number {
    return this.grid.rows;
  }

  /** グリッドの列数。 */
  get cols(): number {
    return this.grid.cols;
  }

  /**
   * 指定した進捗率における表示文字列を生成する。
   * @param progress 0（開始・全ノイズ）〜1（完成形）。範囲外は丸められる。
   */
  render(progress: number): string {
    const p = clamp01(progress);
    const lines: string[] = new Array(this.grid.rows);

    for (let r = 0; r < this.grid.rows; r++) {
      const targetRow = this.grid.cells[r];
      const thresholdRow = this.thresholds[r];
      let line = "";
      for (let c = 0; c < this.grid.cols; c++) {
        line += p >= thresholdRow[c] ? targetRow[c] : this.randomNoiseChar();
      }
      lines[r] = line;
    }

    return lines.join("\n");
  }

  /** ノイズ文字セットから 1 文字をランダムに選んで返す。 */
  private randomNoiseChar(): string {
    const index = Math.floor(this.random() * this.noise.length);
    return this.noise[index] ?? " ";
  }
}
