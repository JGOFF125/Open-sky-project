import { SavedItems } from "@/components/saved-items";
import { getLaunchFeed } from "@/lib/launches/service";
import { getTelescopeCatalog } from "@/lib/telescopes/catalog";

export const metadata = { title: "My sky" };
export const dynamic = "force-dynamic";

export default async function Saved() {
  const [feed, catalog] = await Promise.all([
    getLaunchFeed(),
    getTelescopeCatalog(),
  ]);
  const available = {
    launch: feed.launches.map(({ id }) => id),
    telescope: catalog.telescopes.map(({ id }) => id),
  };
  return (
    <section className="shell page-section">
      <h1>My sky</h1>
      <p className="lead">
        Your saved launches, telescope resources, and personal notes.
      </p>
      <SavedItems
        available={available}
        launchAvailability={!feed.unavailable}
      />
    </section>
  );
}
