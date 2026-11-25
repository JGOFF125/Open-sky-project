export const SOLAR_FEED_URL =
  "https://gong2.nso.edu/products/scaleView/mostRecentImages/mostRecentDataImages/hAlpha_C.dat";

export function parseSolarImage(feed) {
  const match =
    /^\/HA\/hav\/(\d{6})\/(\d{8})\/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Ch\.jpg:\d+$/.exec(
      feed.trim(),
    );
  if (!match) return null;

  const [
    ,
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
    year +
    "-" +
    month +
    "-" +
    day +
    "T" +
    hour +
    ":" +
    minute +
    ":" +
    second +
    ".000Z";
  const date = new Date(capturedAt);
  if (!Number.isFinite(date.valueOf()) || date.toISOString() !== capturedAt)
    return null;

  const [path] = feed.trim().split(":");
  return { capturedAt, imageUrl: "https://gong2.nso.edu/ftp" + path };
}
