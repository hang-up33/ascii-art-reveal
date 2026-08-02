import { afterEach, describe, expect, it, vi } from "vitest";
import {
  generateAscii,
  GenerationError,
  isGenerationConfigured,
  stripCodeFences,
} from "../src/services/asciiGenerationApi";

const API = "https://api.test";
const REQUEST = { prompt: "cat", maxWidth: 60, maxHeight: 30 };

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** generateAscii を呼び、投げられたエラーを返す（成功時は失敗させる）。 */
async function catchError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("エラーが投げられませんでした");
}

describe("stripCodeFences", () => {
  it("言語指定つきコードフェンスを除去する", () => {
    const input = "```txt\n /\\_/\\\n( o.o )\n```";
    expect(stripCodeFences(input)).toBe(" /\\_/\\\n( o.o )");
  });

  it("言語指定なしのコードフェンスを除去する", () => {
    const input = "```\nHELLO\n```";
    expect(stripCodeFences(input)).toBe("HELLO");
  });

  it("前後の空行を除去する（内部の空行は保持）", () => {
    const input = "\n\nA\n\nB\n\n";
    expect(stripCodeFences(input)).toBe("A\n\nB");
  });

  it("CRLF を LF に正規化する", () => {
    expect(stripCodeFences("a\r\nb")).toBe("a\nb");
  });

  it("フェンスが無いテキストはそのまま返す", () => {
    expect(stripCodeFences("  x  \n y")).toBe("  x  \n y");
  });
});

describe("isGenerationConfigured", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("VITE_API_URL 未設定なら false", () => {
    vi.stubEnv("VITE_API_URL", "");
    expect(isGenerationConfigured()).toBe(false);
  });

  it("VITE_API_URL 設定済みなら true", () => {
    vi.stubEnv("VITE_API_URL", API);
    expect(isGenerationConfigured()).toBe(true);
  });
});

describe("generateAscii", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("接続先未設定なら NOT_CONFIGURED を投げる（fetch は呼ばない）", async () => {
    vi.stubEnv("VITE_API_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const error = await catchError(generateAscii(REQUEST));
    expect(error).toBeInstanceOf(GenerationError);
    expect((error as GenerationError).code).toBe("NOT_CONFIGURED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("成功時はコードフェンスを除去した ascii を返す", async () => {
    vi.stubEnv("VITE_API_URL", API);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, { ascii: "```\nAB\n```" })),
    );
    await expect(generateAscii(REQUEST)).resolves.toBe("AB");
  });

  it("エラー応答の code と message を取り出す", async () => {
    vi.stubEnv("VITE_API_URL", API);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(429, {
          error: { code: "RATE_LIMITED", message: "多すぎます" },
        }),
      ),
    );
    const error = await catchError(generateAscii(REQUEST));
    expect(error).toBeInstanceOf(GenerationError);
    expect((error as GenerationError).code).toBe("RATE_LIMITED");
    expect((error as GenerationError).message).toBe("多すぎます");
  });

  it("通信失敗は NETWORK_ERROR", async () => {
    vi.stubEnv("VITE_API_URL", API);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("failed to fetch");
      }),
    );
    const error = await catchError(generateAscii(REQUEST));
    expect((error as GenerationError).code).toBe("NETWORK_ERROR");
  });

  it("AbortError はそのまま伝播する（GenerationError に包まない）", async () => {
    vi.stubEnv("VITE_API_URL", API);
    const abort = new DOMException("aborted", "AbortError");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw abort;
      }),
    );
    const error = await catchError(generateAscii(REQUEST));
    expect(error).toBe(abort);
  });

  it("空の生成結果は EMPTY_RESULT", async () => {
    vi.stubEnv("VITE_API_URL", API);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, { ascii: "   " })),
    );
    const error = await catchError(generateAscii(REQUEST));
    expect((error as GenerationError).code).toBe("EMPTY_RESULT");
  });

  it("成功応答が非JSONなら INVALID_RESPONSE", async () => {
    vi.stubEnv("VITE_API_URL", API);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>not json</html>", { status: 200 })),
    );
    const error = await catchError(generateAscii(REQUEST));
    expect((error as GenerationError).code).toBe("INVALID_RESPONSE");
  });

  it("成功応答が JSON null なら INVALID_RESPONSE（TypeError にしない）", async () => {
    vi.stubEnv("VITE_API_URL", API);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, null)),
    );
    const error = await catchError(generateAscii(REQUEST));
    expect(error).toBeInstanceOf(GenerationError);
    expect((error as GenerationError).code).toBe("INVALID_RESPONSE");
  });

  it("ascii が文字列でない応答は INVALID_RESPONSE", async () => {
    vi.stubEnv("VITE_API_URL", API);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, { ascii: 123 })),
    );
    const error = await catchError(generateAscii(REQUEST));
    expect((error as GenerationError).code).toBe("INVALID_RESPONSE");
  });
});
