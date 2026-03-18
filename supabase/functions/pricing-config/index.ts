import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handlePreflight, parseAllowedOrigins, withCors } from "../_shared/cors.ts";
import { DEFAULT_SITE_PRICING_CONFIG, normalizeSitePricingConfig } from "../_shared/pricing-config.ts";

const env = (key: string, fallback = "") => Deno.env.get(key) ?? fallback;

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
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return respond(JSON.stringify({ error: "SUPABASE_NOT_CONFIGURED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const selectRes = await admin
    .from("site_pricing_configs")
    .select("config, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (selectRes.error) {
    return respond(JSON.stringify({ error: "PRICING_CONFIG_FETCH_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const config = normalizeSitePricingConfig(selectRes.data?.config ?? DEFAULT_SITE_PRICING_CONFIG);

  return respond(
    JSON.stringify({
      config,
      updatedAt: selectRes.data?.updated_at ?? config.updatedAt ?? null,
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
