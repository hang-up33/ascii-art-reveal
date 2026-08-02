import type { AsciiGrid } from "../types/ascii";
import { normalizeAscii } from "./normalizeAscii";

/**
 * ASCIIアート文字列を行×列の二次元グリッドへ変換する。
 *
 * - 各行はグリッド全体の最大幅まで半角スペースで右詰めされる
 * - 末尾の空行は取り除く（先頭・途中の空行は保持する）
 * - サロゲートペアや結合文字を避けるため `Array.from` でコードポイント単位に分割する
 * - 内容が無い（空文字列や空行のみ）場合は空グリッド（rows/cols=0）を返す。
 *   これにより入力クリア時にノイズ文字が残らず、ビューワーが空になる。
 */
export function parseAscii(input: string): AsciiGrid {
  const normalized = normalizeAscii(input);
  const lines = normalized.split("\n");

  // 末尾の空行を除去（少なくとも 1 行は残す）。
  while (lines.length > 1 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  const rowChars = lines.map((line) => Array.from(line));
  const cols = rowChars.reduce((max, chars) => Math.max(max, chars.length), 0);

  // 全行が空（幅 0）なら描画すべき内容が無いため空グリッドを返す。
  if (cols === 0) {
    return { rows: 0, cols: 0, cells: [] };
  }

  const cells = rowChars.map((chars) => {
    const padded = chars.slice();
    while (padded.length < cols) {
      padded.push(" ");
    }
    return padded;
  });

  return { rows: cells.length, cols, cells };
}
