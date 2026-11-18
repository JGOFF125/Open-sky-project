import Link from "next/link";
import { ArrowLeft, Bookmark, Telescope, NotebookPen } from "lucide-react";

const content = {
  explore: {
    icon: Telescope,
    number: "02",
    title: "A different window into the universe.",
    description:
      "Discover public observing broadcasts, robotic image requests, and observatory resources from around the world.",
    tags: [
      "Five curated resources",
      "Interactive world map",
      "Clear access instructions",
    ],
  },
  saved: {
    icon: Bookmark,
    number: "03",
    title: "Your universe. Curated by you.",
    description:
      "A personal collection of the launches and observing resources you want to return to.",
    tags: ["Personal watchlist", "Private notes", "Account access"],
  },
  journal: {
    icon: NotebookPen,
    number: "04",
    title: "Every observation has a story.",
    description:
      "Keep a private record of what you watched, what you noticed, and what you want to explore next.",
    tags: ["Private entries", "Mission references", "Your observing history"],
  },
};
export function FeaturePreview({ feature }) {
  const item = content[feature];
  const Icon = item.icon;
  return (
    <section className="shell preview-page">
      <span className="eyebrow">OpenSky / {feature}</span>
      <div className="preview-icon">
        <Icon size={40} strokeWidth={1} />
      </div>
      <span className="pill">In development</span>
      <h1>{item.title}</h1>
      <p className="lead">{item.description}</p>
      <div className="preview-tags">
        {item.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <p className="preview-disclosure">
        This feature is not available in the current preview.
      </p>
      <Link className="button secondary" href="/launches">
        <ArrowLeft size={16} /> Explore launch preview
      </Link>
    </section>
  );
}
