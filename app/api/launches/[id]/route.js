import { getLaunchFeed } from "@/lib/launches/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request, { params }) {
  const { id } = await params;
  const result = await getLaunchFeed();
  if (result.unavailable)
    return Response.json(
      { error: "Launch data is temporarily unavailable." },
      { status: 503 },
    );
  const launch = result.launches.find((item) => item.id === id);
  if (!launch)
    return Response.json(
      { error: "This launch is not in the current upcoming feed." },
      { status: 404 },
    );
  return Response.json(
    {
      launch,
      mode: result.mode,
      stale: result.stale,
      updatedAt: result.updatedAt,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
