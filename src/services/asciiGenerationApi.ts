import type {
  AsciiGenerationRequest,
  AsciiGenerationResponse,
} from "../types/ascii";

/** 生成 API 呼び出しで発生したエラー。UI 側で表示可能なメッセージを持つ。 */
export class GenerationError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "GenerationError";
    this.code = code;
  }
}

/** API 接続先（Cloudflare Worker）の URL を環境変数から取得する（末尾スラッシュ除去）。 */
function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
}

/** AI 生成機能が利用可能（接続先が設定済み）かどうか。 */
export function isGenerationConfigured(): boolean {
  return getApiBaseUrl().length > 0;
}

/**
 * Markdown コードフェンスや前後の空行を除去する防御的な後処理。
 * 抽出は Worker 側でも行うが、念のためクライアントでも整える。
 */
export function stripCodeFences(text: string): string {
  const normalized = text.replace(/\r\n?/g, "\n");
  const unwrapped = normalized
    .replace(/^\s*```[^\n]*\n?/, "")
    .replace(/\n?```\s*$/, "");
  const lines = unwrapped.split("\n");
  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
  return lines.join("\n");
}

/**
 * 自然言語プロンプトから ASCIIアートを生成する。
 * Cloudflare Worker 経由で Gemini を呼び出す。
 *
 * @throws {GenerationError} 未設定・通信失敗・生成失敗時
 */
export async function generateAscii(
  request: AsciiGenerationRequest,
  signal?: AbortSignal,
): Promise<string> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new GenerationError(
      "NOT_CONFIGURED",
      "AI生成の接続先が未設定です（VITE_API_URL）。",
    );
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/generate-ascii`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw cause;
    }
    throw new GenerationError(
      "NETWORK_ERROR",
      "サーバーに接続できませんでした。",
    );
  }

  if (!response.ok) {
    let message = "ASCIIアートを生成できませんでした。";
    let code = "GENERATION_FAILED";
    try {
      const body = (await response.json()) as {
        error?: { code?: string; message?: string };
      };
      if (body.error?.message) message = body.error.message;
      if (body.error?.code) code = body.error.code;
    } catch {
      // JSON でない場合は既定メッセージのまま。
    }
    throw new GenerationError(code, message);
  }

  let data: AsciiGenerationResponse;
  try {
    data = (await response.json()) as AsciiGenerationResponse;
  } catch {
    throw new GenerationError(
      "INVALID_RESPONSE",
      "サーバーの応答を解釈できませんでした。",
    );
  }
  const ascii = stripCodeFences(data.ascii ?? "");
  if (!ascii.trim()) {
    throw new GenerationError(
      "EMPTY_RESULT",
      "生成結果が空でした。プロンプトを変えて再試行してください。",
    );
  }
  return ascii;
}
