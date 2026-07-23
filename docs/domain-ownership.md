# wordm.us Domain Ownership

Last checked: 2026-06-29.

This file is the source-aware ownership map for `wordm.us`. It records what
currently manages each public entry point, and the target rule for keeping the
domain surface simple.

The machine-readable registry lives in `config/domain-ownership.json`. After
changing a domain binding in Cloudflare or in a product project, update that
registry and run:

```bash
npm run audit:domains
```

## Target model

- `my-blog` owns the root domain `wordm.us` and central, non-product entry
  points.
- A product project owns its own primary product subdomain.
- Shared infrastructure subdomains should be owned by one central project, not
  by an arbitrary product repository.
- Portfolio alias domains such as `p-*.wordm.us` may be listed by `my-blog`,
  but they should not replace a product project's own production subdomain.
- Do not bind every project snapshot subdomain automatically. The project
  snapshot is a catalog, not a Cloudflare domain inventory.

## Current Cloudflare Pages bindings

These bindings were observed with `npx wrangler pages project list`:

| Domain | Cloudflare Pages project | Target ownership |
| --- | --- | --- |
| `wordm.us` | `my-blog` | Keep in `my-blog`. |
| `gridnote.wordm.us` | `gridnote` | Keep in the Gridnote/product project. |
| `latti.wordm.us` | `latti` | Keep in the Latti/product project. |
| `inote.wordm.us` | `inote` | Keep in the iNote/product project. |
| `agent.wordm.us` | `orchard-agent` | Keep in the Agent/product project; verify whether old `agent` Pages project is still needed. |
| `bookplain.wordm.us` | `bookplain` | Keep in the Bookplain product project. |
| `foundry.wordm.us` | `foundry-agent-studio` | Keep in the Foundry Agent Studio product project. |
| `ringbook.wordm.us` | `ringbook` | Keep in the RingBook product project. |
| `wifenglish.wordm.us` | `wifenglish` | Keep in the Wifenglish/product project. |
| `supportdualpart.wordm.us` | `supportdualpart` | Keep with that product/project if still active. |
| none | `wordm-personal-home` | Deleted from Cloudflare Pages after root-domain duties moved here. |

## Current Worker bindings and routes

These bindings were observed from the Cloudflare Workers API and
`npm run audit:subdomains`:

| Domain or route | Worker | Target ownership |
| --- | --- | --- |
| `admin.wordm.us` | `wordm-project-subdomains` | Keep in `my-blog` as central infra. |
| `resume.wordm.us` | `wordm-project-subdomains` | Keep in `my-blog` as central infra. |
| `cv.wordm.us` | `wordm-project-subdomains` | Keep in `my-blog` as central infra. |
| `p-ai-stroke-writer.wordm.us` | `wordm-project-subdomains` | Keep only as portfolio alias unless that product has no better owner. |
| `p-apple-notes-webclipper.wordm.us` | `wordm-project-subdomains` | Keep only as portfolio alias; primary product domain is `inote.wordm.us`. |
| `p-eye-translation.wordm.us` | `wordm-project-subdomains` | Keep only as portfolio alias; review with the eye translation product project. |
| `support.wordm.us` via `*.wordm.us/*` | `wordm-project-subdomains` | Keep in `my-blog` as the shared support entry for all app listings. |
| `*.wordm.us/*` | `wordm-project-subdomains` | Keep only if TLS coverage is proven safe for the hostnames it should catch. |
| `auth.wordm.us` and `auth.wordm.us/*` | `wordm-auth` | Keep in `my-blog` as central shared auth. |
| `arc3.wordm.us` and `arc3.wordm.us/*` | `arc3-platform-agent` | Keep in the Arc3/product project. |
| `flipook.wordm.us/updates/*` | `flipook-updates` | Keep in the Flipook/product project. |
| `flipook-updates.wordm.us/*` | `flipook-updates` | Legacy compatibility; retire when old clients no longer need it. |

## Current local-code evidence

- `workers/subdomain-proxy.ts` in this project explicitly passes through known
  standalone Pages/Workers subdomains because the `*.wordm.us/*` wildcard route
  exists and should not intercept product-owned or separately routed hosts.
- `/Users/lidechi/Documents/Github/bookplain` owns the standalone
  `bookplain.wordm.us` Pages experience. The root Fields page catalogs and links
  to it; Bookplain reuses the root site's Supabase project and cross-subdomain
  `wordm-auth-v1` session storage.
- `/Users/lidechi/Documents/Github/MuseumBook` owns the standalone
  `museum.wordm.us` experience. The root Fields page catalogs and links to it,
  while the wildcard Worker passes the hostname through to that product origin.
- `/Users/lidechi/Documents/Github/foundry-agent-studio` owns the standalone
  `foundry.wordm.us` Pages experience. The root Fields page catalogs and embeds
  it, while the wildcard Worker passes requests through to that Pages origin.
- `/Users/lidechi/Documents/Github/RingBook` owns the standalone
  `ringbook.wordm.us` Pages experience. The root Fields page catalogs and embeds
  it; RingBook reads the shared `auth.wordm.us` session without copying account
  tokens into its own storage.
- `workers/wordm-auth.ts` in this project owns the shared `auth.wordm.us`
  Worker source. It is deployed with `npm run deploy:auth`, preserving
  Cloudflare-side variables with `--keep-vars`.
- `/Users/lidechi/Documents/Github/latti/wrangler.toml` declares the Pages
  project `latti-wordm`, while Cloudflare currently lists the active Pages
  project for `latti.wordm.us` as `latti`.
- `/Users/lidechi/Documents/Github/inote/homepage` is the current local product
  homepage source for `inote.wordm.us`, but its README still contains older
  wording that says the root domain is managed by `wordm-personal-home`.
- `support.wordm.us` used to be listed on the `vsdeal` Pages project. It is now
  served by `wordm-project-subdomains` through the wildcard route as the shared
  support URL for app-store listings and product support.
- `oneagent.wordm.us` is retired as a standalone domain. The root path
  `https://wordm.us/oneagent/` may remain as an ordinary page if the content is
  still useful.
- `wordm-personal-home` was deleted from Cloudflare Pages after confirming it
  had no listed custom domain and its root-domain redirect duties were already
  represented in `public/_redirects`.

## Migration checklist

1. Keep `wordm.us` bound only to `my-blog`.
2. Keep product primary domains bound to their product projects:
   `inote`, `gridnote`, `latti`, `agent`, `foundry`, `ringbook`, `wifenglish`, `arc3`, and similar.
3. Keep shared infrastructure domains in one central owner:
   `auth.wordm.us`, `support.wordm.us`, and any future account/admin/billing
   entry points.
4. Remove stale docs that still name `wordm-personal-home` as root owner after
   verifying no deployment process uses it.
5. Before deleting any `p-*.wordm.us` Worker custom domain, run
   `npm run audit:subdomains`. The last audit showed wildcard DNS exists but
   wildcard TLS is not ready, so route coverage alone is not enough.
6. Do not move a product's primary subdomain into `my-blog` unless that product
   has no deployable project of its own.

## Open checks

- DNS records could not be listed with the current Wrangler OAuth token during
  this check, so this file relies on Pages bindings, Worker custom domains, and
  Worker routes.
- Confirm whether the old `agent` Pages project can be retired, since
  `agent.wordm.us` is currently bound to `orchard-agent`.
- Remove or ignore the local
  `/Users/lidechi/Documents/Github/wordm-personal-home-uncommitted-changes.patch`
  file. It only contains archive notes and redirects that are already covered
  here; it lives outside this project directory, so it was not deleted from this
  workspace task.
