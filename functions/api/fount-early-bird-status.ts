type Env = {
  CREEM_API_KEY?: string;
  CREEM_PRODUCTION_API_KEY?: string;
  CREEM_PRODUCT_FOUNT_BUILDER_EARLY_BIRD?: string;
  CREEM_PRODUCT_FOUNT_MASTER_EARLY_BIRD?: string;
  FOUNT_EARLY_BIRD_LIMIT?: string;
  FOUNT_EARLY_BIRD_CLAIMED_OVERRIDE?: string;
};

type PagesContext = {
  env: Env;
};

type PagesFunction = (context: PagesContext) => Promise<Response> | Response;

const CREEM_API_BASE = "https://api.creem.io/v1";
const DEFAULT_LIMIT = 20;
const PAGE_SIZE = 100;

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

function parseCount(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isExcludedTransaction(item: unknown) {
  if (!item || typeof item !== "object") {
    return false;
  }

  const record = item as Record<string, unknown>;
  const status = String(
    record.status ??
      record.payment_status ??
      record.transaction_status ??
      (record.order && typeof record.order === "object"
        ? (record.order as Record<string, unknown>).status
        : ""),
  ).toLowerCase();

  return [
    "refunded",
    "refund",
    "chargeback",
    "charged_back",
    "failed",
    "canceled",
    "cancelled",
    "void",
    "disputed",
  ].some((blocked) => status.includes(blocked));
}

async function countProductTransactions(apiKey: string, productId: string) {
  const url = new URL(`${CREEM_API_BASE}/transactions/search`);
  url.searchParams.set("page_size", String(PAGE_SIZE));
  url.searchParams.set("product_id", productId);

  const response = await fetch(url.toString(), {
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`CREEM_TRANSACTIONS_FAILED_${response.status}`);
  }

  const payload = (await response.json()) as { items?: unknown[] };
  const items = Array.isArray(payload.items) ? payload.items : [];
  return items.filter((item) => !isExcludedTransaction(item)).length;
}

export const onRequestGet: PagesFunction = async ({ env }) => {
  const limit = Math.max(1, parseCount(env.FOUNT_EARLY_BIRD_LIMIT, DEFAULT_LIMIT));
  const override = env.FOUNT_EARLY_BIRD_CLAIMED_OVERRIDE;

  if (override) {
    const claimed = Math.min(limit, Math.max(0, parseCount(override, 0)));
    return jsonResponse({
      claimed,
      limit,
      remaining: Math.max(0, limit - claimed),
      active: claimed < limit,
      source: "override",
    });
  }

  const apiKey = env.CREEM_API_KEY || env.CREEM_PRODUCTION_API_KEY;
  const productIds = [
    env.CREEM_PRODUCT_FOUNT_BUILDER_EARLY_BIRD,
    env.CREEM_PRODUCT_FOUNT_MASTER_EARLY_BIRD,
  ].filter((value): value is string => Boolean(value));

  if (!apiKey || productIds.length === 0) {
    return jsonResponse({ error: "EARLY_BIRD_COUNTER_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const counts = await Promise.all(
      productIds.map((productId) => countProductTransactions(apiKey, productId)),
    );
    const claimed = Math.min(
      limit,
      Math.max(
        0,
        counts.reduce((sum, value) => sum + value, 0),
      ),
    );

    return jsonResponse({
      claimed,
      limit,
      remaining: Math.max(0, limit - claimed),
      active: claimed < limit,
      source: "creem",
    });
  } catch {
    return jsonResponse({ error: "EARLY_BIRD_COUNTER_FAILED" }, { status: 503 });
  }
};
