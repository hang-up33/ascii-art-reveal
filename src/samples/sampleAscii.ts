export interface AsciiSample {
  id: string;
  label: string;
  art: string;
}

/**
 * 表示・アニメーション確認用のサンプルASCIIアート。
 * 等幅フォントで崩れないよう ASCII 文字のみで構成している。
 */
export const asciiSamples: AsciiSample[] = [
  {
    id: "cat",
    label: "ネコ",
    art: [" /\\_/\\", "( o.o )", " > ^ <"].join("\n"),
  },
  {
    id: "hello",
    label: "HELLO",
    art: [
      " _   _   ____   _      _      ___   ",
      "| | | | | ___| | |    | |    / _ \\  ",
      "| |_| | | |__  | |    | |   | | | | ",
      "|  _  | |  __| | |    | |   | | | | ",
      "| | | | | |___ | |__  | |__ | |_| | ",
      "|_| |_| |_____||____| |____| \\___/  ",
    ].join("\n"),
  },
  {
    id: "space-invader",
    label: "インベーダー",
    art: [
      "  #     #  ",
      "   #   #   ",
      "  #######  ",
      " ## ### ## ",
      "###########",
      "# ####### #",
      "# #     # #",
      "   ## ##   ",
    ].join("\n"),
  },
];

export const defaultSample = asciiSamples[0];
