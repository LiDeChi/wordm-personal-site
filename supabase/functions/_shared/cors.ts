export function parseAllowedOrigins(raw: string | undefined) {
  return new Set(
    String(raw ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function resolveAllowOrigin(origin: string | null, allowlist: Set<string>) {
  if (!origin) {
    return "*";
  }

  if (allowlist.size === 0) {
    return origin;
  }

  return allowlist.has(origin) ? origin : null;
}

export function withCors(response: Response, origin: string | null, allowlist: Set<string>) {
  const allowOrigin = resolveAllowOrigin(origin, allowlist);
  if (!allowOrigin) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", allowOrigin);
  response.headers.set("Access-Control-Allow-Headers", "authorization, content-type, x-client-info, apikey");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Vary", "Origin");
  return response;
}

export function handlePreflight(req: Request, allowlist: Set<string>) {
  if (req.method !== "OPTIONS") {
    return null;
  }

  const response = new Response(null, { status: 204 });
  return withCors(response, req.headers.get("Origin"), allowlist);
}
