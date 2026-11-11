import Link from "next/link";
export default function NotFound() {
  return (
    <section className="shell preview-page">
      <span className="eyebrow">Outside our orbit / 404</span>
      <h1>
        This mission isn’t
        <br />
        in our current sky.
      </h1>
      <p className="lead">
        It may have left the upcoming feed, or the address may be incorrect.
      </p>
      <Link className="button primary" href="/launches">
        Explore current missions
      </Link>
    </section>
  );
}
