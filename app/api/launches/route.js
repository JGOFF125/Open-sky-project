import { getLaunchFeed } from "@/lib/launches/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const result = await getLaunchFeed();
  return Response.json(result, {
    status: result.unavailable ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
