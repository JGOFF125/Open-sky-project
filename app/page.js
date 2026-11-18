import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Radio,
  Telescope,
  NotebookPen,
  MapPin,
} from "lucide-react";
import { getLaunchFeed } from "@/lib/launches/service";
import { Countdown } from "@/components/countdown";
import { LaunchCard } from "@/components/launch-card";
import { FeedNotice } from "@/components/feed-notice";
export const dynamic = "force-dynamic";

export default async function Home() {
  const feed = await getLaunchFeed();
  const featured = feed.launches[0];
  return (
    <>
      <section className="hero shell">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="signal-dot" /> For the endlessly curious
          </span>
          <h1>
            The universe
            <br />
            is calling.
            <br />
            <em>Look up.</em>
          </h1>
          <p>
            Follow the next launch. Find a new perspective.
            <br className="desktop-break" /> Get a little closer to the
            extraordinary.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/launches">
              Explore launches <ArrowUpRight size={18} />
            </Link>
            <Link className="quiet-link" href="/explore">
              Find your window <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-footnote">
            <span className="tiny-orbit" /> One planet. Endless possibilities.
          </div>
        </div>
        <div
          className="earth-scene"
          role="img"
          aria-label="Illustration of Earth at night with orbital paths"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="earth">
            <div className="earth-grid" />
            <div className="earth-land land-one" />
            <div className="earth-land land-two" />
            <div className="earth-cloud" />
          </div>
          <span className="satellite-point" />
          <div className="coordinate coord-top">
            EARTH / OUR STARTING POINT
            <br />
            <span>28.56° N &nbsp; 80.58° W</span>
          </div>
          <div className="coordinate coord-bottom">
            A WORLD OF DISCOVERY <span>↗</span>
          </div>
        </div>
      </section>
      <section className="shell featured-section">
        <FeedNotice feed={feed} />
        {featured ? (
          <div className="featured-panel">
            <div className="featured-intro">
              <span className="eyebrow">
                <Radio size={14} />
                {feed.mode === "demo"
                  ? "Featured preview mission"
                  : "Next on the horizon"}
              </span>
              <h2>{featured.name.split(" | ")[1] ?? featured.name}</h2>
              <p>
                {featured.rocket} <span>·</span> {featured.provider}
              </p>
              <span className="location">
                <MapPin size={13} />
                {featured.location}
              </span>
            </div>
            <div className="featured-clock">
              <span className="eyebrow">
                {feed.mode === "demo"
                  ? "Illustrative countdown"
                  : "Scheduled launch"}
              </span>
              <Countdown launch={featured} />
            </div>
            <Link
              href={`/launches/${featured.id}`}
              className="round-link"
              aria-label={`Explore ${featured.name}`}
            >
              <ArrowUpRight size={26} />
            </Link>
          </div>
        ) : (
          <div className="empty-state">
            <h2>The next chapter is on its way.</h2>
            <p>Check back for upcoming missions.</p>
          </div>
        )}
      </section>
      <section className="shell section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">The next chapter</span>
            <h2>Beyond the launchpad.</h2>
          </div>
          <Link className="quiet-link" href="/launches">
            All missions <ArrowRight size={17} />
          </Link>
        </div>
        <div className="launch-grid">
          {feed.launches.slice(0, 3).map((launch, index) => (
            <LaunchCard
              key={launch.id}
              launch={launch}
              index={index}
              demo={feed.mode === "demo"}
            />
          ))}
        </div>
      </section>
      <section className="shell section-block discovery-section">
        <div className="discovery-title">
          <span className="eyebrow">Your own way to explore</span>
          <h2>
            Space is closer
            <br />
            than you think.
          </h2>
          <p>
            You don’t need a spacesuit.
            <br />
            Just a place to start.
          </p>
        </div>
        <Link className="discovery-card" href="/explore">
          <Telescope size={30} strokeWidth={1} />
          <span className="pill">Coming soon</span>
          <h3>A window to the night sky.</h3>
          <p>
            Discover observing opportunities and public telescope resources
            around the world.
          </p>
          <span className="quiet-link">
            Telescope explorer <ArrowUpRight size={17} />
          </span>
        </Link>
        <Link className="discovery-card" href="/journal">
          <NotebookPen size={30} strokeWidth={1} />
          <span className="pill">Coming soon</span>
          <h3>Make the moment yours.</h3>
          <p>Turn a little curiosity into a personal record of discovery.</p>
          <span className="quiet-link">
            Observing journal <ArrowUpRight size={17} />
          </span>
        </Link>
      </section>
      <section className="closing shell">
        <span className="eyebrow">Stay curious</span>
        <h2>
          There’s a whole universe
          <br />
          waiting outside your everyday.
        </h2>
        <Link className="button secondary" href="/launches">
          Find your next mission <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
