/**
 * ASCIIアート文字列を表示・解析しやすい形へ正規化する。
 *
 * - 改行コードを LF (\n) に統一する
 * - タブを半角スペース 4 個へ展開する（等幅表示で崩れないように）
 */
export function normalizeAscii(input: string): string {
  return input.replace(/\r\n?/g, "\n").replace(/\t/g, "    ");
}
