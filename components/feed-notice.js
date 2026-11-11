export function FeedNotice({ feed }) {
  if (feed.mode === "demo")
    return (
      <div className="feed-notice">
        <span className="notice-dot" />
        <span>
          Preview mode · Illustrative missions and dates. This is not a live
          launch schedule.
        </span>
      </div>
    );
  if (feed.unavailable)
    return (
      <div className="feed-notice warning" role="status">
        Launch data is temporarily unavailable. Please try again shortly.
      </div>
    );
  return (
    <div className={`feed-notice ${feed.stale ? "warning" : ""}`}>
      <span className="notice-dot" />
      <span>
        {feed.stale
          ? "Showing the last available schedule · "
          : "Launch schedule · "}
        {feed.updatedAt
          ? `Updated ${new Date(feed.updatedAt).toISOString().replace("T", " ").slice(0, 16)} UTC`
          : "Awaiting update"}
        . Launch times may change.
      </span>
    </div>
  );
}
