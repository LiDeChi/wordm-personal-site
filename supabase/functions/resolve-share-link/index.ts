import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handlePreflight, parseAllowedOrigins, withCors } from "../_shared/cors.ts";

const env = (key: string, fallback = "") => Deno.env.get(key) ?? fallback;

async function sha256Hex(raw: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest))
    .map((chunk) => chunk.toString(16).padStart(2, "0"))
    .join("");
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

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return respond(JSON.stringify({ error: "SHARE_TOKEN_REQUIRED" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tokenHash = await sha256Hex(token);
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const lookupRes = await admin
    .from("share_links")
    .select("id, label, status, created_at, expires_at, allow_portfolio, allow_blog, allow_deploy, allow_resume, allow_all_projects, allowed_project_slugs")
    .eq("token_hash", tokenHash)
    .limit(1)
    .maybeSingle();

  if (lookupRes.error) {
    return respond(JSON.stringify({ error: "SHARE_LINK_LOOKUP_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const row = lookupRes.data;
  if (!row) {
    return respond(JSON.stringify({ error: "SHARE_LINK_INVALID" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const expiresAt = new Date(row.expires_at);
  if (Number.isNaN(expiresAt.valueOf()) || expiresAt.getTime() <= Date.now()) {
    await admin.from("share_links").update({ status: "expired" }).eq("id", row.id).eq("status", "active");
    return respond(JSON.stringify({ error: "SHARE_LINK_EXPIRED" }), {
      status: 410,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (row.status === "revoked") {
    return respond(JSON.stringify({ error: "SHARE_LINK_REVOKED" }), {
      status: 410,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (row.status !== "active") {
    return respond(JSON.stringify({ error: "SHARE_LINK_INVALID" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  return respond(
    JSON.stringify({
      id: row.id,
      label: row.label,
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      allowPortfolio: row.allow_portfolio,
      allowBlog: row.allow_blog,
      allowDeploy: row.allow_deploy,
      allowResume: row.allow_resume,
      allowAllProjects: row.allow_all_projects,
      allowedProjectSlugs: row.allowed_project_slugs,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};

if (import.meta.main) {
  Deno.serve(handler);
}
