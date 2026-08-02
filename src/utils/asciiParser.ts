import type { AsciiGrid } from "../types/ascii";
import { normalizeAscii } from "./normalizeAscii";

/**
 * ASCIIアート文字列を行×列の二次元グリッドへ変換する。
 *
 * - 各行はグリッド全体の最大幅まで半角スペースで右詰めされる
 * - 末尾の空行は取り除く（先頭・途中の空行は保持する）
 * - サロゲートペアや結合文字を避けるため `Array.from` でコードポイント単位に分割する
 */
export function parseAscii(input: string): AsciiGrid {
  const normalized = normalizeAscii(input);
  const lines = normalized.split("\n");

  // 末尾の空行を除去（少なくとも 1 行は残す）。
  while (lines.length > 1 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  const rowChars = lines.map((line) => Array.from(line));
  const cols = Math.max(
    1,
    rowChars.reduce((max, chars) => Math.max(max, chars.length), 0),
  );

  const cells = rowChars.map((chars) => {
    const padded = chars.slice();
    while (padded.length < cols) {
      padded.push(" ");
    }
    return padded;
  });

  return { rows: cells.length, cols, cells };
}
