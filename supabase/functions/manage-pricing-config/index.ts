import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handlePreflight, parseAllowedOrigins, withCors } from "../_shared/cors.ts";
import { isPrivilegedUser } from "../_shared/privileged-user.ts";
import { normalizeSitePricingConfig } from "../_shared/pricing-config.ts";

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

  if (!isPrivilegedUser(user)) {
    return respond(JSON.stringify({ error: "PRICING_CONFIG_FORBIDDEN" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const nextConfig = normalizeSitePricingConfig(body.config ?? {});
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const upsertRes = await admin
    .from("site_pricing_configs")
    .upsert({
      id: 1,
      config: {
        ...nextConfig,
        updatedAt: null,
      },
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select("config, updated_at")
    .single();

  if (upsertRes.error) {
    return respond(JSON.stringify({ error: "PRICING_CONFIG_SAVE_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const config = normalizeSitePricingConfig(upsertRes.data.config ?? {});

  return respond(
    JSON.stringify({
      config,
      updatedAt: upsertRes.data.updated_at ?? null,
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
