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
const ADMIN_AUTH_CHECK_URL = env(
  "ADMIN_AUTH_CHECK_URL",
  "https://admin.wordm.us/__admin_api/auth-check",
);

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
  return scope.allowPortfolio || scope.allowBlog || scope.allowDeploy || scope.allowResume || scope.allowAllProjects || scope.allowedProjectSlugs.length > 0;
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

function parseBasicAuth(value: string | null): { username: string; password: string } | null {
  if (!value || !value.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = atob(value.slice(6));
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) {
      return null;
    }
    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

async function isAuthorized(headerValue: string | null) {
  const parsed = parseBasicAuth(headerValue);
  if (!parsed) {
    return false;
  }

  try {
    const response = await fetch(ADMIN_AUTH_CHECK_URL, {
      method: "GET",
      headers: { Authorization: headerValue! },
      redirect: "error",
    });
    return response.status === 204;
  } catch {
    return false;
  }
}

function toLinkPayload(row: Record<string, unknown>) {
  return {
    id: row.id,
    label: row.label,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastAccessedAt: row.last_accessed_at,
    visitCount: row.visit_count,
    issuedBy: row.issued_by,
    issuedByLabel: row.issued_by_label,
    allowPortfolio: row.allow_portfolio,
    allowBlog: row.allow_blog,
    allowDeploy: row.allow_deploy,
    allowResume: row.allow_resume,
    allowAllProjects: row.allow_all_projects,
    allowedProjectSlugs: row.allowed_project_slugs,
  };
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

  const adminAuthorization = req.headers.get("x-admin-basic-auth");
  if (!(await isAuthorized(adminAuthorization))) {
    return respond(JSON.stringify({ error: "ADMIN_AUTH_REQUIRED" }), {
      status: 401,
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

  const action = typeof body.action === "string" ? body.action.trim().toLowerCase() : "";
  const admin = createClient(supabaseUrl, serviceRoleKey);

  if (action === "list") {
    const selectRes = await admin
      .from("share_links")
      .select("id, label, status, created_at, expires_at, last_accessed_at, visit_count, issued_by, issued_by_label, allow_portfolio, allow_blog, allow_deploy, allow_resume, allow_all_projects, allowed_project_slugs")
      .order("created_at", { ascending: false });

    if (selectRes.error) {
      return respond(JSON.stringify({ error: "ADMIN_SHARE_LIST_FAILED" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return respond(JSON.stringify({ links: (selectRes.data ?? []).map((row) => toLinkPayload(row as Record<string, unknown>)) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "create") {
    const label = normalizeLabel(body.label);
    const expiresInDays = clampDays(body.expiresInDays);
    const scope = normalizeScope(body.scope);

    if (!hasAnyAccess(scope)) {
      return respond(JSON.stringify({ error: "SHARE_SCOPE_EMPTY" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = makeToken();
    const tokenHash = await sha256Hex(token);
    const expiresAtIso = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const insertRes = await admin
      .from("share_links")
      .insert({
        user_id: null,
        label,
        token_hash: tokenHash,
        status: "active",
        visit_count: 0,
        last_accessed_at: null,
        issued_by: "admin",
        issued_by_label: parseBasicAuth(adminAuthorization)?.username || "admin",
        allow_portfolio: scope.allowPortfolio,
        allow_blog: scope.allowBlog,
        allow_deploy: scope.allowDeploy,
        allow_resume: scope.allowResume,
        allow_all_projects: scope.allowAllProjects,
        allowed_project_slugs: scope.allowedProjectSlugs,
        expires_at: expiresAtIso,
      })
      .select("id, label, status, created_at, expires_at, last_accessed_at, visit_count, issued_by, issued_by_label, allow_portfolio, allow_blog, allow_deploy, allow_resume, allow_all_projects, allowed_project_slugs")
      .single();

    if (insertRes.error) {
      return respond(JSON.stringify({ error: "ADMIN_SHARE_CREATE_FAILED" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return respond(JSON.stringify({ token, ...toLinkPayload(insertRes.data as Record<string, unknown>) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "revoke") {
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return respond(JSON.stringify({ error: "SHARE_LINK_ID_REQUIRED" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateRes = await admin
      .from("share_links")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (updateRes.error || !updateRes.data) {
      return respond(JSON.stringify({ error: "SHARE_LINK_REVOKE_FAILED" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return respond(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "purge") {
    const selectRes = await admin
      .from("share_links")
      .select("id, status, expires_at");

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

    const deleteRes = await admin.from("share_links").delete().in("id", removableIds);
    if (deleteRes.error) {
      return respond(JSON.stringify({ error: "SHARE_LINK_PURGE_FAILED" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return respond(JSON.stringify({ ok: true, deletedCount: removableIds.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return respond(JSON.stringify({ error: "UNKNOWN_ACTION" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
};

if (import.meta.main) {
  Deno.serve(handler);
}
