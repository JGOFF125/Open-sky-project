export function formatLaunchTime(launch, timeZone = "UTC") {
  if (!launch.net || !Number.isFinite(Date.parse(launch.net)))
    return "Date to be confirmed";
  if (!launch.precise) {
    const precision = (launch.datePrecision ?? "").toLowerCase();
    const options = { timeZone: "UTC", year: "numeric", month: "short" };
    if (precision.includes("year") || precision.includes("quarter"))
      return `${launch.net.slice(0, 4)} · ${launch.datePrecision}, tentative`;
    if (!precision.includes("month")) options.day = "numeric";
    return `${new Intl.DateTimeFormat("en-CA", options).format(new Date(launch.net))} · tentative`;
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(launch.net));
}
