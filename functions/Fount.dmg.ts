type PagesFunction = () => Response;

export const onRequest: PagesFunction = () =>
  new Response(null, {
    status: 302,
    headers: {
      Location: "/fields",
      "Cache-Control": "no-store",
    },
  });
