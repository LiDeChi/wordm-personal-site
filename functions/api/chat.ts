type Env = {
  KIMI_API_KEY?: string;
  MOONSHOT_API_KEY?: string;
  KIMI_API_BASE_URL?: string;
  KIMI_MODEL?: string;
};

type PagesContext = {
  request: Request;
  env: Env;
};

type PagesFunction = (context: PagesContext) => Promise<Response> | Response;

type ClientChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const DEFAULT_KIMI_BASE_URL = "https://api.moonshot.ai/v1";
const DEFAULT_KIMI_MODEL = "kimi-k2.7-code";
const MAX_CONTEXT_LENGTH = 36_000;
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_MESSAGES = 8;

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });
}

function normalizeBaseUrl(raw: string | undefined) {
  return (raw || DEFAULT_KIMI_BASE_URL).replace(/\/+$/, "");
}

function normalizeClientMessages(value: unknown): ClientChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is ClientChatMessage => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as ClientChatMessage;
      return (
        (candidate.role === "assistant" || candidate.role === "user") &&
        typeof candidate.content === "string" &&
        candidate.content.trim().length > 0
      );
    })
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }));
}

function normalizeLang(value: unknown) {
  return value === "en" ? "en" : "zh";
}

export const onRequestOptions: PagesFunction = () =>
  new Response(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const apiKey = env.KIMI_API_KEY || env.MOONSHOT_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "KIMI_API_KEY_MISSING" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "INVALID_JSON" }, { status: 400 });
  }

  const lang = normalizeLang(body.lang);
  const context =
    typeof body.context === "string"
      ? body.context.trim().slice(0, MAX_CONTEXT_LENGTH)
      : "";
  const clientMessages = normalizeClientMessages(body.messages);

  if (!context || !clientMessages.some((message) => message.role === "user")) {
    return jsonResponse({ error: "MESSAGE_OR_CONTEXT_MISSING" }, { status: 400 });
  }

  const model = env.KIMI_MODEL || DEFAULT_KIMI_MODEL;
  const systemPrompt =
    lang === "zh"
      ? [
          "你是 wordm.us 网站里的 AI 导览助手。",
          "只根据提供的站点上下文回答；如果上下文没有相关信息，就明确说站点上下文里没有找到。",
          "回答要简洁、准确、可操作。优先使用中文；用户用英文提问时可用英文回答。",
          "不要编造链接、价格、权限或项目状态。",
        ].join("\n")
      : [
          "You are the AI guide inside wordm.us.",
          "Answer only from the provided site context. If the context does not contain the answer, say that it was not found in the site context.",
          "Keep answers concise, accurate, and useful. Use English unless the user asks in Chinese.",
          "Do not invent links, pricing, access rules, or project status.",
        ].join("\n");

  const kimiResponse = await fetch(`${normalizeBaseUrl(env.KIMI_API_BASE_URL)}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: `SITE_CONTEXT\n${context}` },
        ...clientMessages,
      ],
      max_tokens: 900,
    }),
  });
  const payload = (await kimiResponse.json().catch(() => ({}))) as ChatCompletionResponse;

  if (!kimiResponse.ok) {
    return jsonResponse(
      {
        error: "KIMI_REQUEST_FAILED",
        detail: payload.error?.message || `HTTP ${kimiResponse.status}`,
      },
      { status: 502 },
    );
  }

  return jsonResponse({
    answer: payload.choices?.[0]?.message?.content || "",
    model,
  });
};
