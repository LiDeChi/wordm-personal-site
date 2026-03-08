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

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const nowIso = new Date().toISOString();
  const selectRes = await admin
    .from("share_links")
    .select("id, status, expires_at")
    .eq("user_id", user.id);

  if (selectRes.error) {
    return respond(JSON.stringify({ error: "SHARE_LINK_PURGE_LOOKUP_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const removableIds = (selectRes.data ?? [])
    .filter((row) => {
      const expired = typeof row.expires_at === "string" && Date.parse(row.expires_at) <= Date.now();
      return row.status === "revoked" || row.status === "expired" || expired;
    })
    .map((row) => row.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  if (removableIds.length === 0) {
    return respond(JSON.stringify({ ok: true, deletedCount: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const deleteRes = await admin.from("share_links").delete().in("id", removableIds).eq("user_id", user.id);
  if (deleteRes.error) {
    return respond(JSON.stringify({ error: "SHARE_LINK_PURGE_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return respond(JSON.stringify({ ok: true, deletedCount: removableIds.length, deletedAt: nowIso }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

if (import.meta.main) {
  Deno.serve(handler);
}
