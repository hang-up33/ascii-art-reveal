/**
 * ASCII Art Reveal — API 中継 Worker
 *
 * フロントエンド（GitHub Pages）から自然言語プロンプトを受け取り、
 * Gemini API へ問い合わせて ASCIIアート文字列を返す。
 *
 * - Gemini API キーは Worker Secret (GEMINI_API_KEY) に保持し、
 *   ブラウザ・リポジトリへは一切露出しない。
 * - CORS で許可オリジンを制限する。
 * - 入力長・生成結果のサイズを検証し、Markdown コードフェンス等を除去する。
 * - 簡易レート制限を備える（本番運用では KV / Durable Objects を推奨）。
 */

export interface Env {
  /** Gemini API キー（`wrangler secret put GEMINI_API_KEY` で登録）。 */
  GEMINI_API_KEY: string;
  /** 許可するオリジン（カンマ区切り、`*` で全許可）。 */
  ALLOWED_ORIGIN?: string;
  /** 使用する Gemini モデル名。未設定時は既定値。 */
  GEMINI_MODEL?: string;
}

interface GenerateRequestBody {
  prompt?: unknown;
  maxWidth?: unknown;
  maxHeight?: unknown;
}

const DEFAULT_MODEL = "gemini-1.5-flash";
const MAX_PROMPT_LENGTH = 500;
const DEFAULT_MAX_WIDTH = 60;
const DEFAULT_MAX_HEIGHT = 30;
const WIDTH_LIMIT = 100;
const HEIGHT_LIMIT = 50;

// 簡易レート制限（同一オリジン内の isolate 単位・ベストエフォート）。
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const rateLimitStore = new Map<string, number[]>();

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function corsHeaders(env: Env, origin: string | null): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGIN ?? "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowAll = allowed.includes("*");
  const allowOrigin =
    allowAll || (origin && allowed.includes(origin)) ? (origin ?? "*") : "";

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (allowAll && !origin) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
  }
  return headers;
}

function json(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  headers: Record<string, string>,
): Response {
  return json({ error: { code, message } }, status, headers);
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const history = (rateLimitStore.get(key) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (history.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(key, history);
    return true;
  }
  history.push(now);
  rateLimitStore.set(key, history);
  return false;
}

/**
 * Gemini の生テキストから ASCIIアート部分を抽出する。
 * Markdown コードフェンス・前後の空行を除去し、横幅・行数の上限を適用する。
 */
export function extractAscii(
  raw: string,
  maxWidth: number,
  maxHeight: number,
): string {
  let text = raw.replace(/\r\n?/g, "\n");
  // 先頭の ```lang と末尾の ``` を除去する。
  text = text.replace(/^\s*```[^\n]*\n?/, "").replace(/\n?```\s*$/, "");

  const lines = text.split("\n");
  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();

  return lines
    .slice(0, maxHeight)
    .map((line) => Array.from(line).slice(0, maxWidth).join(""))
    .join("\n");
}

function buildSystemInstruction(maxWidth: number, maxHeight: number): string {
  return [
    "あなたはASCIIアート生成器です。",
    "以下のルールを厳守してください。",
    "- ASCIIアートのみを出力する。",
    "- 説明・前置き・後書き・Markdownのコードフェンスは一切付けない。",
    "- 等幅フォントで崩れないように、半角ASCII文字を優先して使う。",
    `- 横幅は${maxWidth}文字以内、高さは${maxHeight}行以内にする。`,
  ].join("\n");
}

async function callGemini(
  env: Env,
  prompt: string,
  maxWidth: number,
  maxHeight: number,
): Promise<string> {
  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemInstruction(maxWidth, maxHeight) }],
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    // 詳細（APIキー等を含み得る）はログのみに留め、呼び出し元へは返さない。
    console.error(`Gemini API error: ${res.status} ${await res.text()}`);
    throw new Error("UPSTREAM_ERROR");
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
    "";
  return text;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(env, origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/api/generate-ascii") {
      return errorResponse(
        "NOT_FOUND",
        "エンドポイントが存在しません。",
        404,
        cors,
      );
    }

    if (!env.GEMINI_API_KEY) {
      return errorResponse(
        "NOT_CONFIGURED",
        "サーバー側でAPIキーが設定されていません。",
        503,
        cors,
      );
    }

    const rateKey =
      request.headers.get("CF-Connecting-IP") ?? origin ?? "anonymous";
    if (isRateLimited(rateKey)) {
      return errorResponse(
        "RATE_LIMITED",
        "リクエストが多すぎます。しばらくしてから再試行してください。",
        429,
        cors,
      );
    }

    let body: GenerateRequestBody;
    try {
      body = (await request.json()) as GenerateRequestBody;
    } catch {
      return errorResponse(
        "INVALID_JSON",
        "リクエストの形式が不正です。",
        400,
        cors,
      );
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return errorResponse("EMPTY_PROMPT", "プロンプトが空です。", 400, cors);
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return errorResponse(
        "PROMPT_TOO_LONG",
        `プロンプトは${MAX_PROMPT_LENGTH}文字以内にしてください。`,
        400,
        cors,
      );
    }

    const maxWidth = clampInt(body.maxWidth, DEFAULT_MAX_WIDTH, 1, WIDTH_LIMIT);
    const maxHeight = clampInt(
      body.maxHeight,
      DEFAULT_MAX_HEIGHT,
      1,
      HEIGHT_LIMIT,
    );

    try {
      const raw = await callGemini(env, prompt, maxWidth, maxHeight);
      const ascii = extractAscii(raw, maxWidth, maxHeight);
      if (!ascii.trim()) {
        return errorResponse(
          "GENERATION_FAILED",
          "ASCIIアートを生成できませんでした。プロンプトを変えて再試行してください。",
          502,
          cors,
        );
      }
      return json({ ascii }, 200, cors);
    } catch {
      return errorResponse(
        "GENERATION_FAILED",
        "ASCIIアートを生成できませんでした。しばらくしてから再試行してください。",
        502,
        cors,
      );
    }
  },
};
