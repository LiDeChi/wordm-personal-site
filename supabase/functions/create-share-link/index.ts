import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handlePreflight, parseAllowedOrigins, withCors } from "../_shared/cors.ts";

type ShareScope = {
  allowPortfolio: boolean;
  allowBlog: boolean;
  allowDeploy: boolean;
  allowResume: boolean;
  allowAllProjects: boolean;
  allowedProjectSlugs: string[];
};

const env = (key: string, fallback = "") => Deno.env.get(key) ?? fallback;

function clampDays(rawValue: unknown) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return 3;
  }
  return Math.max(1, Math.min(30, Math.floor(parsed)));
}

function normalizeLabel(rawValue: unknown) {
  if (typeof rawValue !== "string") {
    return null;
  }
  const value = rawValue.trim();
  return value ? value.slice(0, 120) : null;
}

function normalizeScope(rawValue: unknown): ShareScope {
  const input = typeof rawValue === "object" && rawValue ? (rawValue as Record<string, unknown>) : {};
  const allowedProjectSlugs = Array.isArray(input.allowedProjectSlugs)
    ? input.allowedProjectSlugs
        .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
        .filter(Boolean)
    : [];

  return {
    allowPortfolio: Boolean(input.allowPortfolio),
    allowBlog: Boolean(input.allowBlog),
    allowDeploy: Boolean(input.allowDeploy),
    allowResume: Boolean(input.allowResume),
    allowAllProjects: Boolean(input.allowAllProjects),
    allowedProjectSlugs: [...new Set(allowedProjectSlugs)],
  };
}

function hasAnyAccess(scope: ShareScope) {
  return (
    scope.allowPortfolio ||
    scope.allowBlog ||
    scope.allowDeploy ||
    scope.allowResume ||
    scope.allowAllProjects ||
    scope.allowedProjectSlugs.length > 0
  );
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

function parseEmailSet(raw: string) {
  return new Set(
    raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

function roleFromUser(user: { email?: string | null; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) {
  const rawRole = user.app_metadata?.role ?? user.user_metadata?.role;
  return typeof rawRole === "string" ? rawRole.trim().toLowerCase() : "";
}

function isPrivilegedUser(
  user: { email?: string | null; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> },
) {
  const role = roleFromUser(user);
  if (role === "admin" || role === "administrator" || role === "owner" || role === "tester" || role === "test") {
    return true;
  }

  const email = String(user.email ?? "").trim().toLowerCase();
  if (!email) {
    return false;
  }

  const adminEmails = parseEmailSet(env("WORDM_SHARE_ADMIN_EMAILS", env("VITE_AUTH_ADMIN_EMAILS")));
  const testerEmails = parseEmailSet(env("WORDM_SHARE_TESTER_EMAILS", env("VITE_AUTH_TEST_EMAILS")));
  return adminEmails.has(email) || testerEmails.has(email);
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

  const label = normalizeLabel(body.label);
  const expiresInDays = clampDays(body.expiresInDays);
  const scope = normalizeScope(body.scope);

  if (!hasAnyAccess(scope)) {
    return respond(JSON.stringify({ error: "SHARE_SCOPE_EMPTY" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const privileged = isPrivilegedUser(user);
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const entitlementRes = await admin.rpc("wordm_unlock_plan_tier", { p_user_id: user.id });
  if (entitlementRes.error) {
    return respond(JSON.stringify({ error: "SHARE_ENTITLEMENT_CHECK_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const entitlementTier = Number(entitlementRes.data ?? 0);
  if (!privileged && (!Number.isFinite(entitlementTier) || entitlementTier < 1)) {
    return respond(JSON.stringify({ error: "SHARE_ENTITLEMENT_REQUIRED" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (scope.allowResume && !privileged) {
    return respond(JSON.stringify({ error: "SHARE_RESUME_RESTRICTED" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = makeToken();
  const tokenHash = await sha256Hex(token);
  const expiresAtIso = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const insertRes = await admin
    .from("share_links")
    .insert({
      user_id: user.id,
      label,
      token_hash: tokenHash,
      status: "active",
      allow_portfolio: scope.allowPortfolio,
      allow_blog: scope.allowBlog,
      allow_deploy: scope.allowDeploy,
      allow_resume: scope.allowResume,
      allow_all_projects: scope.allowAllProjects,
      allowed_project_slugs: scope.allowedProjectSlugs,
      expires_at: expiresAtIso,
    })
    .select("id, label, status, created_at, expires_at, allow_portfolio, allow_blog, allow_deploy, allow_resume, allow_all_projects, allowed_project_slugs")
    .single();

  if (insertRes.error) {
    return respond(JSON.stringify({ error: "SHARE_LINK_CREATE_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return respond(
    JSON.stringify({
      token,
      id: insertRes.data.id,
      label: insertRes.data.label,
      status: insertRes.data.status,
      createdAt: insertRes.data.created_at,
      expiresAt: insertRes.data.expires_at,
      allowPortfolio: insertRes.data.allow_portfolio,
      allowBlog: insertRes.data.allow_blog,
      allowDeploy: insertRes.data.allow_deploy,
      allowResume: insertRes.data.allow_resume,
      allowAllProjects: insertRes.data.allow_all_projects,
      allowedProjectSlugs: insertRes.data.allowed_project_slugs,
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
