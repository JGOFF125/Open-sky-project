import {
  HELIOVIEWER_API,
  SOLAR_FEED_URL,
  parseNetworkImage,
  parseSolarImage,
} from "@/lib/telescopes/solar-image";

export const maxDuration = 20;

async function getFrame(url, read, parse) {
  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) return parse(await response[read]());
    console.warn(
      "Solar image source returned",
      response.status,
      new URL(url).hostname,
    );
  } catch (error) {
    console.warn(
      "Solar image source unavailable",
      new URL(url).hostname,
      error.name,
      error.cause?.code,
    );
  }
  return null;
}

async function getNetworkFrame() {
  const url = new URL("getClosestImage/", HELIOVIEWER_API);
  const date = new Date(Math.floor(Date.now() / 60000) * 60000).toISOString();
  url.search = new URLSearchParams({ date, sourceId: "94" });
  return getFrame(url, "json", parseNetworkImage);
}

export async function GET() {
  const frame =
    (await getFrame(SOLAR_FEED_URL, "text", parseSolarImage)) ??
    (await getNetworkFrame());
  if (frame) {
    return Response.json(frame, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60" },
    });
  }
  return Response.json(
    { error: "The solar image feeds are temporarily unavailable." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
