import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import {
  DeepSkyAtlas,
  DeepSpaceArchive,
  EmbeddedView,
} from "@/components/deep-space";

export const metadata = { title: "Deep space" };

function ProviderLink({ href, children }) {
  return (
    <a
      className="feature-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children} <ArrowUpRight size={14} aria-hidden="true" />
    </a>
  );
}

export default function DeepSpacePage() {
  return (
    <section className="shell page-section deep-space-page">
      <Link className="quiet-link" href="/explore">
        <ArrowLeft size={16} aria-hidden="true" /> Telescope explorer
      </Link>
      <h1>
        Deep <em>space.</em>
      </h1>
      <p className="lead">
        Explore real Hubble and Webb images, watch a ground telescope, or
        request an observation of your own.
      </p>
      <nav className="deep-space-nav" aria-label="Deep space sections">
        <a className="button secondary" href="#archive">
          Image archive
        </a>
        <a className="button secondary" href="#atlas">
          Sky atlas
        </a>
        <a className="button secondary" href="#watch">
          Telescope broadcasts
        </a>
        <a className="button secondary" href="#request">
          Request an image
        </a>
      </nav>

      <DeepSpaceArchive />
      <DeepSkyAtlas />

      <section
        id="watch"
        className="deep-space-section"
        aria-labelledby="watch-title"
      >
        <h2 id="watch-title">Watch telescope observations</h2>
        <div className="deep-space-grid">
          <article className="feature-card">
            <h3>SkiesLIVE Observatory</h3>
            <p>
              Missouri telescope views on clear nights. The provider shows a
              replay between broadcasts.
            </p>
            <EmbeddedView
              title="SkiesLIVE telescope broadcast"
              src="https://live.skieslive.com/"
              openLabel="Open broadcast player"
              closeLabel="Close broadcast player"
            />
            <ProviderLink href="https://live.skieslive.com/">
              Open at SkiesLIVE
            </ProviderLink>
          </article>
          <article className="feature-card">
            <h3>Galaxy night in Chile</h3>
            <p>
              Watch astronomers point the MAS500 telescope and capture the
              Sombrero, M83, and Antennae galaxies. This Spanish-language
              session is a replay.
            </p>
            <EmbeddedView
              title="AstroUDP galaxy observation replay"
              src="https://www.youtube-nocookie.com/embed/eMKwbZbDYiA"
              openLabel="Open galaxy replay"
              closeLabel="Close galaxy replay"
            />
            <ProviderLink href="https://www.youtube.com/watch?v=eMKwbZbDYiA">
              Watch on YouTube
            </ProviderLink>
          </article>
        </div>
        <div className="feature-card deep-space-status">
          <h3>What are Webb and Hubble observing?</h3>
          <p>
            NASA’s Space Telescope Live shows current and upcoming targets,
            instruments, and observation schedules.
          </p>
          <ProviderLink href="https://spacetelescopelive.org/">
            See NASA’s observing targets
          </ProviderLink>
        </div>
      </section>

      <section
        id="request"
        className="deep-space-section"
        aria-labelledby="request-title"
      >
        <h2 id="request-title">Request a real telescope image</h2>
        <div className="deep-space-grid">
          <article className="feature-card">
            <h3>MicroObservatory</h3>
            <p>
              Choose a target and exposure settings. The robot takes the image
              when conditions allow and emails a link to the result.
            </p>
            <ProviderLink href="https://mo-www.cfa.harvard.edu/OWN/">
              Request an image
            </ProviderLink>
          </article>
          <article className="feature-card">
            <h3>OpenScience Observatories</h3>
            <p>
              Use the free OpenLearn course to prepare an observation on the
              COAST telescope. Telescope account instructions are in week four.
            </p>
            <ProviderLink href="https://telescope.org/">
              Get course and telescope access
            </ProviderLink>
          </article>
        </div>
      </section>
    </section>
  );
}
