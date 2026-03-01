import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handlePreflight, parseAllowedOrigins, withCors } from "../_shared/cors.ts";

const env = (key: string, fallback = "") => Deno.env.get(key) ?? fallback;

async function sha256Hex(raw: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest))
    .map((chunk) => chunk.toString(16).padStart(2, "0"))
    .join("");
}

function toInt(raw: string, fallback: number) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

const handler = async (req: Request): Promise<Response> => {
  const allowlist = parseAllowedOrigins(env("CORS_ALLOW_ORIGINS"));
  const preflight = handlePreflight(req, allowlist);
  if (preflight) {
    return preflight;
  }

  const respond = (body: BodyInit | null, init?: ResponseInit) =>
    withCors(new Response(body, init), req.headers.get("Origin"), allowlist);

  if (req.method !== "POST") {
    return respond(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = env("SUPABASE_URL");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return respond(JSON.stringify({ error: "SUPABASE_NOT_CONFIGURED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const ticket = typeof body.ticket === "string" ? body.ticket.trim() : "";
  if (!ticket) {
    return respond(JSON.stringify({ error: "DEPLOY_TICKET_REQUIRED" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tokenHash = await sha256Hex(ticket);
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const lookupRes = await admin
    .from("deploy_tickets")
    .select("id, scope, target, status, expires_at")
    .eq("token_hash", tokenHash)
    .limit(1)
    .maybeSingle();

  if (lookupRes.error) {
    return respond(JSON.stringify({ error: "DEPLOY_TICKET_LOOKUP_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const row = lookupRes.data;
  if (!row) {
    return respond(JSON.stringify({ error: "DEPLOY_TICKET_INVALID" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const expiresAt = new Date(row.expires_at);
  if (Number.isNaN(expiresAt.valueOf()) || expiresAt.getTime() <= Date.now()) {
    await admin
      .from("deploy_tickets")
      .update({ status: "expired" })
      .eq("id", row.id)
      .eq("status", "issued");

    return respond(JSON.stringify({ error: "DEPLOY_TICKET_EXPIRED" }), {
      status: 410,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (row.status !== "issued") {
    return respond(JSON.stringify({ error: "DEPLOY_TICKET_ALREADY_USED" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  const consumeRes = await admin
    .from("deploy_tickets")
    .update({
      status: "consumed",
      consumed_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("status", "issued")
    .select("id")
    .maybeSingle();

  if (consumeRes.error || !consumeRes.data) {
    return respond(JSON.stringify({ error: "DEPLOY_TICKET_ALREADY_USED" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  return respond(
    JSON.stringify({
      ok: true,
      scope: row.scope,
      target: row.target,
      install: {
        repoUrl: env("CENTER_CONTROL_REPO_URL", "https://github.com/LiDeChi/center-control.git"),
        gitRef: env("CENTER_CONTROL_GIT_REF", "main"),
        defaultGithubRoot: env("CENTER_CONTROL_DEFAULT_GITHUB_ROOT", "~/Documents/Github"),
        defaultOwnerLogin: env("CENTER_CONTROL_DEFAULT_OWNER_LOGIN", "LiDeChi"),
        defaultReportTime: env("CENTER_CONTROL_DEFAULT_REPORT_TIME", "09:00"),
        defaultTimezone: env("CENTER_CONTROL_DEFAULT_TIMEZONE", "America/New_York"),
        defaultPort: toInt(env("CENTER_CONTROL_DEFAULT_WEB_PORT", "3000"), 3000),
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

if (import.meta.main) {
  Deno.serve(handler);
}
