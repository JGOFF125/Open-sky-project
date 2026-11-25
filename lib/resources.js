export function resourceHref({ resourceType, resourceId }) {
  if (resourceType === "launch")
    return `/launches/${encodeURIComponent(resourceId)}`;
  return `/explore#${encodeURIComponent(resourceId)}`;
}

export function resourceTypeLabel(type) {
  return type === "launch" ? "Launch" : "Telescope";
}
