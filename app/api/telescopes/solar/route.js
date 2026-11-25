import { SOLAR_FEED_URL, parseSolarImage } from "@/lib/telescopes/solar-image";

export async function GET() {
  try {
    const response = await fetch(SOLAR_FEED_URL, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const frame = parseSolarImage(await response.text());
      if (frame) {
        return Response.json(frame, {
          headers: { "Cache-Control": "public, max-age=0, s-maxage=60" },
        });
      }
    }
  } catch {
    // I keep the observatory link available when the feed is down
  }
  return Response.json(
    { error: "Cerro Tololo’s image feed is temporarily unavailable." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
