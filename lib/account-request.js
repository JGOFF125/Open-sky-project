export async function accountRequest(
  user,
  path,
  { method = "GET", body, signal } = {},
) {
  if (!/^\/api\/(journal|saved)(?:\/[a-zA-Z0-9_-]{1,160})?$/.test(path))
    throw new Error("Choose a valid account endpoint.");
  const token = await user.getIdToken();
  const response = await fetch(path, {
    method,
    signal,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => null);
  if (!response.ok || !result)
    throw new Error(result?.error ?? "The request failed. Please try again.");
  return result;
}
