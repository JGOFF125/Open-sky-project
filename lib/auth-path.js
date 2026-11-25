export function safeNextPath(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  )
    return "/saved";
  try {
    const url = new URL(value, "https://opensky.invalid");
    return url.origin === "https://opensky.invalid" &&
      !["/login", "/register"].includes(url.pathname)
      ? `${url.pathname}${url.search}${url.hash}`
      : "/saved";
  } catch {
    return "/saved";
  }
}
