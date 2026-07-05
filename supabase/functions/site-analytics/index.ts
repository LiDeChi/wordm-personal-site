import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { handlePreflight, parseAllowedOrigins, withCors } from "../_shared/cors.ts";
import { isPrivilegedUser } from "../_shared/privileged-user.ts";

type AnalyticsEventType =
  | "page_view"
  | "click"
  | "download"
  | "engagement"
  | "signup"
  | "login"
  | "logout";

type AnalyticsRow = {
  id: string;
  created_at: string;
  event_type: AnalyticsEventType;
  session_id: string;
  user_id: string | null;
  user_role: string | null;
  path: string;
  search: string | null;
  page_title: string | null;
  referrer: string | null;
  language: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  duration_ms: number | null;
  element_tag: string | null;
  element_label: string | null;
  element_href: string | null;
  download_url: string | null;
  download_name: string | null;
  metadata: Record<string, unknown>;
  user_agent: string | null;
  ip_hash: string | null;
};

const EVENT_TYPES = new Set<AnalyticsEventType>([
  "page_view",
  "click",
  "download",
  "engagement",
  "signup",
  "login",
  "logout",
]);
const ROLE_TYPES = new Set(["admin", "tester", "user", "guest"]);
const SENSITIVE_QUERY_KEYS = new Set([
  "access_token",
  "auth_token",
  "code",
  "error",
  "error_code",
  "error_description",
  "provider_refresh_token",
  "provider_token",
  "refresh_token",
  "share",
  "token",
]);

const env = (key: string, fallback = "") => Deno.env.get(key) ?? fallback;
let analyticsSchemaReady: Promise<void> | null = null;
let databasePool: Pool | null | undefined;

function clampString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizeEventType(value: unknown): AnalyticsEventType | null {
  const normalized = clampString(value, 32) as AnalyticsEventType | null;
  return normalized && EVENT_TYPES.has(normalized) ? normalized : null;
}

function getDatabasePool() {
  if (databasePool !== undefined) {
    return databasePool;
  }

  const databaseUrl = env("SUPABASE_DB_URL");
  databasePool = databaseUrl ? new Pool(databaseUrl, 1, true) : null;
  return databasePool;
}

async function ensureAnalyticsSchema() {
  if (analyticsSchemaReady) {
    return analyticsSchemaReady;
  }

  analyticsSchemaReady = (async () => {
    const pool = getDatabasePool();
    if (!pool) {
      return;
    }

    const connection = await pool.connect();
    try {
      await connection.queryArray("create extension if not exists pgcrypto");
      await connection.queryArray(`
        create table if not exists public.site_analytics_events (
          id uuid primary key default gen_random_uuid(),
          created_at timestamptz not null default now(),
          event_type text not null check (
            event_type in (
              'page_view',
              'click',
              'download',
              'engagement',
              'signup',
              'login',
              'logout'
            )
          ),
          session_id text not null check (char_length(session_id) between 8 and 96),
          user_id uuid null references auth.users(id) on delete set null,
          user_role text null check (user_role in ('admin', 'tester', 'user', 'guest')),
          path text not null default '/',
          search text null,
          page_title text null,
          referrer text null,
          language text null,
          viewport_width integer null check (viewport_width between 0 and 20000),
          viewport_height integer null check (viewport_height between 0 and 20000),
          duration_ms integer null check (duration_ms between 0 and 86400000),
          element_tag text null,
          element_label text null,
          element_href text null,
          download_url text null,
          download_name text null,
          metadata jsonb not null default '{}'::jsonb,
          user_agent text null,
          ip_hash text null
        )
      `);
      await connection.queryArray(`
        create index if not exists idx_site_analytics_events_created_at
          on public.site_analytics_events(created_at desc)
      `);
      await connection.queryArray(`
        create index if not exists idx_site_analytics_events_event_type_created_at
          on public.site_analytics_events(event_type, created_at desc)
      `);
      await connection.queryArray(`
        create index if not exists idx_site_analytics_events_session_id_created_at
          on public.site_analytics_events(session_id, created_at desc)
      `);
      await connection.queryArray(`
        create index if not exists idx_site_analytics_events_user_id_created_at
          on public.site_analytics_events(user_id, created_at desc)
          where user_id is not null
      `);
      await connection.queryArray("alter table public.site_analytics_events enable row level security");
      await connection.queryArray("revoke all on table public.site_analytics_events from anon, authenticated");
      await connection.queryArray("grant insert, select, delete on table public.site_analytics_events to service_role");
    } finally {
      connection.release();
    }
  })().catch((error) => {
    analyticsSchemaReady = null;
    throw error;
  });

  return analyticsSchemaReady;
}

function normalizeRole(value: unknown) {
  const normalized = clampString(value, 24);
  return normalized && ROLE_TYPES.has(normalized) ? normalized : null;
}

function normalizeInt(value: unknown, maxValue: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, Math.min(maxValue, Math.round(parsed)));
}

function normalizeSessionId(value: unknown) {
  const normalized = clampString(value, 96);
  if (!normalized || normalized.length < 8) {
    return null;
  }

  return normalized;
}

function normalizePath(value: unknown) {
  const normalized = clampString(value, 400);
  if (!normalized) {
    return "/";
  }

  if (normalized.startsWith("/")) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    return parsed.pathname || "/";
  } catch {
    return "/";
  }
}

function sanitizeSearch(value: unknown) {
  const normalized = clampString(value, 800);
  if (!normalized) {
    return null;
  }

  const rawSearch = normalized.startsWith("?") ? normalized.slice(1) : normalized;
  const params = new URLSearchParams(rawSearch);
  const next = new URLSearchParams();

  for (const [key, rawValue] of params.entries()) {
    const normalizedKey = key.trim();
    if (!normalizedKey) {
      continue;
    }

    if (SENSITIVE_QUERY_KEYS.has(normalizedKey.toLowerCase())) {
      next.set(normalizedKey, "[redacted]");
    } else {
      next.set(normalizedKey, rawValue.slice(0, 160));
    }
  }

  const result = next.toString();
  return result ? `?${result}` : null;
}

function normalizeJsonValue(value: unknown, depth = 0): unknown {
  if (value === null || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.replace(/\s+/g, " ").trim().slice(0, 500);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    if (depth >= 2) {
      return [];
    }
    return value.slice(0, 20).map((item) => normalizeJsonValue(item, depth + 1));
  }

  if (typeof value === "object" && value) {
    if (depth >= 2) {
      return {};
    }

    const output: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value).slice(0, 30)) {
      const normalizedKey = key.trim().slice(0, 80);
      if (!normalizedKey) {
        continue;
      }
      output[normalizedKey] = normalizeJsonValue(nestedValue, depth + 1);
    }
    return output;
  }

  return null;
}

function normalizeMetadata(value: unknown) {
  const normalized = normalizeJsonValue(value);
  return typeof normalized === "object" && normalized && !Array.isArray(normalized)
    ? (normalized as Record<string, unknown>)
    : {};
}

async function sha256Hex(raw: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest))
    .map((chunk) => chunk.toString(16).padStart(2, "0"))
    .join("");
}

async function resolveIpHash(req: Request) {
  const salt = env("WORDM_ANALYTICS_IP_SALT");
  if (!salt) {
    return null;
  }

  const rawIp =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "";
  if (!rawIp) {
    return null;
  }

  return sha256Hex(`${salt}:${rawIp}`);
}

function toPayload(row: AnalyticsRow) {
  return {
    id: row.id,
    createdAt: row.created_at,
    eventType: row.event_type,
    sessionId: row.session_id,
    userId: row.user_id,
    userRole: row.user_role,
    path: row.path,
    search: row.search,
    pageTitle: row.page_title,
    referrer: row.referrer,
    language: row.language,
    viewportWidth: row.viewport_width,
    viewportHeight: row.viewport_height,
    durationMs: row.duration_ms,
    elementTag: row.element_tag,
    elementLabel: row.element_label,
    elementHref: row.element_href,
    downloadUrl: row.download_url,
    downloadName: row.download_name,
    metadata: row.metadata,
    userAgent: row.user_agent,
    ipHash: row.ip_hash,
  };
}

async function getUserFromAuthHeader(supabaseUrl: string, anonKey: string, authHeader: string) {
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const userRes = await userClient.auth.getUser();
  return userRes.data.user ?? null;
}

const handler = async (req: Request): Promise<Response> => {
  const allowlist = parseAllowedOrigins(env("CORS_ALLOW_ORIGINS"));
  const preflight = handlePreflight(req, allowlist);
  if (preflight) {
    return preflight;
  }

  const respond = (body: BodyInit | null, init?: ResponseInit) =>
    withCors(new Response(body, init), req.headers.get("Origin"), allowlist);

  if (req.method !== "POST" && req.method !== "GET") {
    return respond(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return respond(JSON.stringify({ error: "SUPABASE_NOT_CONFIGURED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const authHeader = req.headers.get("Authorization") ?? "";
  try {
    await ensureAnalyticsSchema();
  } catch (error) {
    console.error("ANALYTICS_SCHEMA_INIT_FAILED", error);
    return respond(JSON.stringify({ error: "ANALYTICS_SCHEMA_INIT_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET") {
    const user = await getUserFromAuthHeader(supabaseUrl, anonKey, authHeader);
    if (!user) {
      return respond(JSON.stringify({ error: "UNAUTHENTICATED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isPrivilegedUser(user)) {
      return respond(JSON.stringify({ error: "ANALYTICS_FORBIDDEN" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") ?? 100) || 100));
    const eventType = normalizeEventType(url.searchParams.get("eventType"));
    const sessionId = normalizeSessionId(url.searchParams.get("sessionId"));

    let query = admin
      .from("site_analytics_events")
      .select(
        "id, created_at, event_type, session_id, user_id, user_role, path, search, page_title, referrer, language, viewport_width, viewport_height, duration_ms, element_tag, element_label, element_href, download_url, download_name, metadata, user_agent, ip_hash",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq("event_type", eventType);
    }
    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    const selectRes = await query;
    if (selectRes.error) {
      return respond(JSON.stringify({ error: "ANALYTICS_LIST_FAILED" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return respond(JSON.stringify({ events: ((selectRes.data ?? []) as AnalyticsRow[]).map(toPayload) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return respond(JSON.stringify({ error: "INVALID_JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const eventType = normalizeEventType(body.eventType);
  const sessionId = normalizeSessionId(body.sessionId);
  if (!eventType || !sessionId) {
    return respond(JSON.stringify({ error: "ANALYTICS_EVENT_INVALID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = await getUserFromAuthHeader(supabaseUrl, anonKey, authHeader).catch(() => null);
  const insertRes = await admin.from("site_analytics_events").insert({
    event_type: eventType,
    session_id: sessionId,
    user_id: user?.id ?? null,
    user_role: normalizeRole(body.userRole) ?? (user ? "user" : "guest"),
    path: normalizePath(body.path),
    search: sanitizeSearch(body.search),
    page_title: clampString(body.pageTitle, 180),
    referrer: clampString(body.referrer, 500),
    language: clampString(body.language, 80),
    viewport_width: normalizeInt(body.viewportWidth, 20000),
    viewport_height: normalizeInt(body.viewportHeight, 20000),
    duration_ms: normalizeInt(body.durationMs, 86400000),
    element_tag: clampString(body.elementTag, 48),
    element_label: clampString(body.elementLabel, 240),
    element_href: clampString(body.elementHref, 500),
    download_url: clampString(body.downloadUrl, 500),
    download_name: clampString(body.downloadName, 180),
    metadata: normalizeMetadata(body.metadata),
    user_agent: clampString(req.headers.get("user-agent"), 500),
    ip_hash: await resolveIpHash(req),
  });

  if (insertRes.error) {
    return respond(JSON.stringify({ error: "ANALYTICS_INSERT_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return respond(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

if (import.meta.main) {
  Deno.serve(handler);
}
