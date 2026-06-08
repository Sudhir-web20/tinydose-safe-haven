import { createFileRoute } from "@tanstack/react-router";

// Returns a real product photo URL from DuckDuckGo image search.
// No AI generation — uses the medicine name as the query, just like Google Images.
export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { query } = (await request.json()) as { query: string };
        const q = (query ?? "").trim();
        if (!q) return Response.json({ error: "Missing query" }, { status: 400 });

        try {
          // Step 1: get the vqd token DuckDuckGo requires for image search.
          const tokenRes = await fetch(
            `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`,
            { headers: { "User-Agent": "Mozilla/5.0" } },
          );
          const html = await tokenRes.text();
          const vqdMatch =
            html.match(/vqd=\"([\d-]+)\"/) ||
            html.match(/vqd=([\d-]+)&/) ||
            html.match(/vqd='([\d-]+)'/);
          if (!vqdMatch) return Response.json({ error: "No token" }, { status: 502 });
          const vqd = vqdMatch[1];

          // Step 2: query the image endpoint.
          const imgRes = await fetch(
            `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(q)}&vqd=${vqd}&f=,,,,,&p=1`,
            {
              headers: {
                "User-Agent": "Mozilla/5.0",
                Referer: "https://duckduckgo.com/",
              },
            },
          );
          if (!imgRes.ok) {
            return Response.json({ error: "Search failed" }, { status: 502 });
          }
          const data = (await imgRes.json()) as { results?: Array<{ image: string; thumbnail: string }> };
          const first = data.results?.[0];
          if (!first) return Response.json({ error: "No results" }, { status: 404 });

          return Response.json({ image: first.image, thumbnail: first.thumbnail });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "Search error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
