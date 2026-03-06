import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handlePreflight, parseAllowedOrigins, withCors } from "../_shared/cors.ts";

const env = (key: string, fallback = "") => Deno.env.get(key) ?? fallback;

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

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return respond(JSON.stringify({ error: "UNAUTHENTICATED" }), {
      status: 401,
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

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const userRes = await userClient.auth.getUser();
  const user = userRes.data.user;
  if (!user) {
    return respond(JSON.stringify({ error: "UNAUTHENTICATED" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return respond(JSON.stringify({ error: "SHARE_LINK_ID_REQUIRED" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const lookupRes = await admin
    .from("share_links")
    .select("id, user_id, status")
    .eq("id", id)
    .limit(1)
    .maybeSingle();

  if (lookupRes.error) {
    return respond(JSON.stringify({ error: "SHARE_LINK_LOOKUP_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const row = lookupRes.data;
  if (!row || row.user_id !== user.id) {
    return respond(JSON.stringify({ error: "SHARE_LINK_NOT_FOUND" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (row.status === "revoked") {
    return respond(JSON.stringify({ ok: true, status: "revoked" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const updateRes = await admin
    .from("share_links")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, status")
    .maybeSingle();

  if (updateRes.error || !updateRes.data) {
    return respond(JSON.stringify({ error: "SHARE_LINK_REVOKE_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return respond(JSON.stringify({ ok: true, status: updateRes.data.status }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

if (import.meta.main) {
  Deno.serve(handler);
}
