import { getLaunchFeed } from "@/lib/launches/service";
import { LaunchExplorer } from "@/components/launch-explorer";
import { FeedNotice } from "@/components/feed-notice";
export const metadata = { title: "Launch explorer" };
export const dynamic = "force-dynamic";
export default async function Launches() {
  const feed = await getLaunchFeed();
  return (
    <section className="shell page-section">
      <span className="eyebrow">Launch explorer / 01</span>
      <h1>
        Next stop.
        <br />
        <em>Beyond.</em>
      </h1>
      <p className="lead">
        The missions taking us a little further. Find one to follow.
      </p>
      <FeedNotice feed={feed} />
      <LaunchExplorer launches={feed.launches} demo={feed.mode === "demo"} />
    </section>
  );
}
