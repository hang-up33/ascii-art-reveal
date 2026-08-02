import { describe, expect, it } from "vitest";
import { parseAscii } from "../src/utils/asciiParser";
import { normalizeAscii } from "../src/utils/normalizeAscii";

describe("normalizeAscii", () => {
  it("改行コードを LF に統一する", () => {
    expect(normalizeAscii("a\r\nb\rc")).toBe("a\nb\nc");
  });

  it("タブを半角スペース4個へ展開する", () => {
    expect(normalizeAscii("a\tb")).toBe("a    b");
  });
});

describe("parseAscii", () => {
  it("各行を最大幅まで空白で右詰めする", () => {
    const grid = parseAscii("ab\nabcd\na");
    expect(grid.rows).toBe(3);
    expect(grid.cols).toBe(4);
    expect(grid.cells[0]).toEqual(["a", "b", " ", " "]);
    expect(grid.cells[1]).toEqual(["a", "b", "c", "d"]);
    expect(grid.cells[2]).toEqual(["a", " ", " ", " "]);
  });

  it("末尾の空行を取り除く", () => {
    const grid = parseAscii("x\n\n\n");
    expect(grid.rows).toBe(1);
    expect(grid.cells[0]).toEqual(["x"]);
  });

  it("空文字列でも 1x1 のグリッドを返す", () => {
    const grid = parseAscii("");
    expect(grid.rows).toBe(1);
    expect(grid.cols).toBe(1);
    expect(grid.cells).toEqual([[" "]]);
  });

  it("途中の空行は保持する", () => {
    const grid = parseAscii("a\n\nb");
    expect(grid.rows).toBe(3);
    expect(grid.cells[1]).toEqual([" "]);
  });
});
