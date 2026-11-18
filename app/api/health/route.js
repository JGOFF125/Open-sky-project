export function GET() {
  return Response.json({ service: "opensky", status: "ok", version: "0.1.0" });
}
