type PagesFunction = () => Response;

export const onRequest: PagesFunction = () =>
  new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
