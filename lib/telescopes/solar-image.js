export const SOLAR_FEED_URL =
  "https://gong2.nso.edu/products/scaleView/mostRecentImages/mostRecentDataImages/hAlpha_C.dat";
export const HELIOVIEWER_API = "https://api.helioviewer.org/v2/";

function validCaptureTime(value) {
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) && date.toISOString() === value;
}

export function parseSolarImage(feed) {
  const match =
    /^(\/HA\/hav\/(\d{6})\/(\d{8})\/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Ch\.jpg):\d+$/.exec(
      feed.trim(),
    );
  if (!match) return null;

  const [
    ,
    path,
    monthDirectory,
    dayDirectory,
    year,
    month,
    day,
    hour,
    minute,
    second,
  ] = match;
  if (monthDirectory !== year + month || dayDirectory !== year + month + day)
    return null;

  const capturedAt =
    [year, month, day].join("-") +
    "T" +
    [hour, minute, second].join(":") +
    ".000Z";
  if (!validCaptureTime(capturedAt)) return null;

  return {
    capturedAt,
    imageUrl: "https://gong2.nso.edu/ftp" + path,
    source: "cerro-tololo",
  };
}

export function parseNetworkImage(data) {
  const id = String(data?.id ?? "");
  if (
    !/^[1-9]\d{0,15}$/.test(id) ||
    !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(data?.date ?? "")
  ) {
    return null;
  }
  const capturedAt = data.date.replace(" ", "T") + ".000Z";
  if (!validCaptureTime(capturedAt)) return null;

  const imageUrl = new URL("downloadImage/", HELIOVIEWER_API);
  imageUrl.search = new URLSearchParams({ id, width: "512", type: "jpg" });
  return { capturedAt, imageUrl: imageUrl.href, source: "gong-network" };
}
