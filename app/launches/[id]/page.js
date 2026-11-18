import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getLaunchFeed } from "@/lib/launches/service";
import { Countdown } from "@/components/countdown";
import { FeedNotice } from "@/components/feed-notice";
export const dynamic = "force-dynamic";
export default async function Mission({ params }) {
  const { id } = await params;
  const feed = await getLaunchFeed();
  if (feed.unavailable)
    return (
      <section className="shell page-section">
        <FeedNotice feed={feed} />
        <Link className="button secondary" href="/launches">
          Return to launch explorer
        </Link>
      </section>
    );
  const launch = feed.launches.find((item) => item.id === id);
  if (!launch) notFound();
  return (
    <section className="shell page-section mission-page">
      <Link className="quiet-link" href="/launches">
        <ArrowLeft size={16} /> All missions
      </Link>
      <FeedNotice feed={feed} />
      <div className="mission-heading">
        <div>
          <span className="eyebrow">{launch.provider} / Mission overview</span>
          <h1>{launch.name.split(" | ")[1] ?? launch.name}</h1>
          <span className="pill">{launch.status}</span>
        </div>
        <div className="mission-emblem" aria-hidden="true">
          <span>OS</span>
          <small>{launch.rocket}</small>
        </div>
      </div>
      <div className="mission-columns">
        <div>
          <h2>Every mission starts with a question.</h2>
          <p className="lead">{launch.description}</p>
          <dl className="mission-facts">
            {[
              ["Launch vehicle", launch.rocket],
              ["Launch provider", launch.provider],
              ["Launch site", launch.location],
              ["Launchpad", launch.pad],
              ["Destination orbit", launch.orbit],
              [
                "Scheduled date",
                launch.net
                  ? `${launch.net.slice(0, 10)}${launch.precise ? ` · ${launch.net.slice(11, 16)} UTC` : " · Time to be confirmed"}`
                  : "To be confirmed",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <aside className="mission-aside">
          <span className="eyebrow">
            {feed.mode === "demo" ? "Sample schedule" : "The countdown"}
          </span>
          <Countdown launch={launch} compact />
          <p>
            Launch schedules can change. Check the provider’s latest coverage
            before watching.
          </p>
          {launch.broadcast ? (
            <a
              className="button primary"
              href={launch.broadcast}
              target="_blank"
              rel="noreferrer"
            >
              Open broadcast <ArrowUpRight size={17} />
            </a>
          ) : (
            <span className="broadcast-unavailable">
              {feed.mode === "demo"
                ? "No broadcast for sample missions"
                : "Broadcast not announced"}
            </span>
          )}
          <span className="save-preview">
            Saving missions is coming in the next release.
          </span>
        </aside>
      </div>
    </section>
  );
}
