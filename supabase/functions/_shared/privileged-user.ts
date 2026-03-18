const env = (key: string, fallback = "") => Deno.env.get(key) ?? fallback;

function parseEmailSet(raw: string) {
  return new Set(
    raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

function roleFromUser(
  user: { email?: string | null; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> },
) {
  const rawRole = user.app_metadata?.role ?? user.user_metadata?.role;
  return typeof rawRole === "string" ? rawRole.trim().toLowerCase() : "";
}

export function isPrivilegedUser(
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
