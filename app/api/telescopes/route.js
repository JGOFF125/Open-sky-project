import { getTelescopeCatalog } from "@/lib/telescopes/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getTelescopeCatalog(), {
    headers: { "Cache-Control": "no-store" },
  });
}
