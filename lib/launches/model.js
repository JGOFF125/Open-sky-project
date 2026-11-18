export function normalizeLaunch(raw) {
  if (!raw?.id || !raw?.name) return null;
  const pad = raw.pad ?? {};
  const precision = raw.net_precision?.id;
  const videos = raw.vid_urls ?? raw.mission?.vid_urls ?? [];
  return {
    id: String(raw.id),
    name: raw.name,
    provider: raw.launch_service_provider?.name ?? "Provider to be announced",
    rocket: raw.rocket?.configuration?.full_name ?? "Rocket to be announced",
    description: (
      raw.mission?.description ?? "Mission details have not been published yet."
    ).slice(0, 2500),
    status: raw.status?.name ?? "To be confirmed",
    statusId: raw.status?.id ?? null,
    net: raw.net && Number.isFinite(Date.parse(raw.net)) ? raw.net : null,
    precise: precision === 0 || precision === 1,
    location: pad.location?.name ?? pad.name ?? "Location to be announced",
    pad: pad.name ?? "To be announced",
    latitude: typeof pad.latitude === "number" ? pad.latitude : null,
    longitude: typeof pad.longitude === "number" ? pad.longitude : null,
    orbit: raw.mission?.orbit?.name ?? "To be announced",
    broadcast: videos.map((v) => v.url).find(isHttpsUrl) ?? null,
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
  if ([3, 4, 7].includes(launch.statusId))
    return { label: launch.status, seconds: null };
  if ([2, 5].includes(launch.statusId))
    return { label: launch.status, seconds: null };
  if (!launch.net || !launch.precise)
    return { label: "Launch date is tentative", seconds: null };
  const seconds = Math.floor((Date.parse(launch.net) - now) / 1000);
  return seconds > 0
    ? { label: "Until scheduled launch", seconds }
    : { label: "Awaiting a schedule update", seconds: null };
}
