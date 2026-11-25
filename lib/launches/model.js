function coordinate(value, maximum) {
  const number =
    typeof value === "string" && value.trim() ? Number(value) : value;
  return Number.isFinite(number) && Math.abs(number) <= maximum ? number : null;
}

export function normalizeLaunch(raw) {
  if (!raw?.id || typeof raw.name !== "string") return null;
  const pad = raw.pad ?? {};
  const precision = raw.net_precision?.id;
  const videos = [raw.vid_urls, raw.mission?.vid_urls].flatMap((items) =>
    Array.isArray(items) ? items : [],
  );
  return {
    id: String(raw.id),
    name: raw.name,
    provider: raw.launch_service_provider?.name ?? "Provider to be announced",
    rocket: raw.rocket?.configuration?.full_name ?? "Rocket to be announced",
    description: (typeof raw.mission?.description === "string" &&
    raw.mission.description.trim()
      ? raw.mission.description
      : "Mission details have not been published yet."
    ).slice(0, 2500),
    status: raw.status?.name ?? "To be confirmed",
    statusId: raw.status?.id ?? null,
    net: raw.net && Number.isFinite(Date.parse(raw.net)) ? raw.net : null,
    precise: precision === 0 || precision === 1,
    datePrecision: raw.net_precision?.name ?? "Unconfirmed",
    location: pad.location?.name ?? pad.name ?? "Location to be announced",
    pad: pad.name ?? "To be announced",
    latitude: coordinate(pad.latitude, 90),
    longitude: coordinate(pad.longitude, 180),
    orbit: raw.mission?.orbit?.name ?? "To be announced",
    broadcast: videos.map((v) => v?.url).find(isHttpsUrl) ?? null,
  };
}

export function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function countdownState(launch, now) {
  if (launch.statusId !== 1) return { label: launch.status, seconds: null };
  if (
    !launch.net ||
    !launch.precise ||
    !Number.isFinite(Date.parse(launch.net))
  )
    return { label: "Launch date is tentative", seconds: null };
  const seconds = Math.floor((Date.parse(launch.net) - now) / 1000);
  return seconds > 0
    ? { label: "Until scheduled launch", seconds }
    : { label: "Awaiting a schedule update", seconds: null };
}

export function featuredLaunch(launches, now = Date.now()) {
  return (
    launches.find((launch) => countdownState(launch, now).seconds !== null) ??
    launches.find(({ net }) => Date.parse(net) > now) ??
    launches[0]
  );
}
