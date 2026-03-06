import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handlePreflight, parseAllowedOrigins, withCors } from "../_shared/cors.ts";

type DeployTarget = "local" | "remote";

type ShareRow = {
  id: string;
  user_id: string;
  status: string;
  expires_at: string;
  allow_deploy: boolean;
};

const env = (key: string, fallback = "") => Deno.env.get(key) ?? fallback;

function clampExpiresIn(rawValue: unknown) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return 600;
  }
  return Math.max(60, Math.min(3600, Math.floor(parsed)));
}

function normalizeTarget(value: unknown): DeployTarget {
  if (typeof value !== "string") {
    return "local";
  }
  return value.trim() === "remote" ? "remote" : "local";
}

async function sha256Hex(raw: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest))
    .map((chunk) => chunk.toString(16).padStart(2, "0"))
    .join("");
}

function makeToken() {
  return `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
}

async function resolveShareAccess(admin: ReturnType<typeof createClient>, token: string): Promise<ShareRow | null> {
  const normalized = token.trim();
  if (!normalized) {
    return null;
  }

  const tokenHash = await sha256Hex(normalized);
  const lookupRes = await admin
    .from("share_links")
    .select("id, user_id, status, expires_at, allow_deploy")
    .eq("token_hash", tokenHash)
    .limit(1)
    .maybeSingle();

  if (lookupRes.error) {
    throw new Error("DEPLOY_SHARE_LOOKUP_FAILED");
  }

  const row = lookupRes.data as ShareRow | null;
  if (!row) {
    throw new Error("DEPLOY_SHARE_INVALID");
  }

  const expiresAt = new Date(row.expires_at);
  if (Number.isNaN(expiresAt.valueOf()) || expiresAt.getTime() <= Date.now()) {
    await admin.from("share_links").update({ status: "expired" }).eq("id", row.id).eq("status", "active");
    throw new Error("DEPLOY_SHARE_EXPIRED");
  }

  if (row.status !== "active") {
    throw new Error(row.status === "revoked" ? "DEPLOY_SHARE_REVOKED" : "DEPLOY_SHARE_INVALID");
  }

  if (!row.allow_deploy) {
    throw new Error("DEPLOY_SHARE_RESTRICTED");
  }

  return row;
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
  const anonKey = env("SUPABASE_ANON_KEY");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
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

  const target = normalizeTarget(body.target);
  const expiresInSec = clampExpiresIn(body.expiresInSec);
  const expiresAtIso = new Date(Date.now() + expiresInSec * 1000).toISOString();
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const authHeader = req.headers.get("Authorization") ?? "";
  let ticketOwnerUserId = "";
  let metadata: Record<string, unknown> = { issued_by: "create-deploy-ticket" };

  if (authHeader.startsWith("Bearer ")) {
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

    const entitlementRes = await admin.rpc("wordm_unlock_plan_tier", { p_user_id: user.id });
    if (entitlementRes.error) {
      return respond(JSON.stringify({ error: "DEPLOY_ENTITLEMENT_CHECK_FAILED" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const entitlementTier = Number(entitlementRes.data ?? 0);
    if (!Number.isFinite(entitlementTier) || entitlementTier < 1) {
      return respond(JSON.stringify({ error: "DEPLOY_ENTITLEMENT_REQUIRED" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    ticketOwnerUserId = user.id;
  } else {
    const shareToken = typeof body.shareToken === "string" ? body.shareToken : "";
    if (!shareToken.trim()) {
      return respond(JSON.stringify({ error: "UNAUTHENTICATED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const shareRow = await resolveShareAccess(admin, shareToken);
      if (!shareRow) {
        return respond(JSON.stringify({ error: "DEPLOY_SHARE_INVALID" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      ticketOwnerUserId = shareRow.user_id;
      metadata = {
        ...metadata,
        share_link_id: shareRow.id,
        issued_via_share: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "DEPLOY_SHARE_INVALID";
      const status = message === "DEPLOY_SHARE_EXPIRED" || message === "DEPLOY_SHARE_REVOKED" ? 410 : 403;
      return respond(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const ticket = makeToken();
  const tokenHash = await sha256Hex(ticket);

  const insertRes = await admin
    .from("deploy_tickets")
    .insert({
      user_id: ticketOwnerUserId,
      scope: "center_control_personal",
      target,
      token_hash: tokenHash,
      status: "issued",
      expires_at: expiresAtIso,
      metadata,
    })
    .select("id, expires_at")
    .single();

  if (insertRes.error) {
    return respond(JSON.stringify({ error: "DEPLOY_TICKET_CREATE_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resolveEndpoint = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/resolve-deploy-ticket`;
  const installScriptUrl =
    env("CENTER_CONTROL_INSTALL_SCRIPT_URL") ||
    "https://raw.githubusercontent.com/LiDeChi/center-control/main/scripts/install-center-control.sh";

  return respond(
    JSON.stringify({
      ticket,
      ticketId: insertRes.data.id,
      expiresAt: insertRes.data.expires_at,
      resolveEndpoint,
      installScriptUrl,
      target,
      scope: "center_control_personal",
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
