import { FeedNotice } from "@/components/feed-notice";
import { TelescopeExplorer } from "@/components/telescope-explorer";
import { getLaunchFeed } from "@/lib/launches/service";
import { getTelescopeCatalog } from "@/lib/telescopes/catalog";
import "leaflet/dist/leaflet.css";

export const metadata = { title: "Telescope explorer" };
export const dynamic = "force-dynamic";

export default async function Explore() {
  const [{ telescopes }, feed] = await Promise.all([
    getTelescopeCatalog(),
    getLaunchFeed(),
  ]);
  return (
    <section className="shell page-section">
      <h1>
        Telescope <em>explorer.</em>
      </h1>
      <p className="lead">
        Find public observing opportunities, from scheduled broadcasts to images
        you can request.
      </p>
      <FeedNotice feed={feed} />
      <TelescopeExplorer
        telescopes={telescopes}
        launches={feed.launches}
        launchLabel={
          feed.mode === "demo" ? "Preview launch sites" : "Launch sites"
        }
      />
    </section>
  );
}
