"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import {
  deepSpaceImages,
  skyAtlasUrl,
  skyTargets,
} from "@/lib/telescopes/deep-space";

export function DeepSpaceArchive() {
  const [selection, setSelection] = useState(0);
  const entry = deepSpaceImages[selection];
  return (
    <section
      id="archive"
      className="deep-space-section"
      aria-labelledby="archive-title"
    >
      <h2 id="archive-title">Telescope image archive</h2>
      <div className="archive-layout">
        <ArchiveImage key={entry.id} entry={entry} />
        <div className="archive-controls">
          <div
            className="archive-options"
            role="group"
            aria-label="Choose an image"
          >
            {deepSpaceImages.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-pressed={selection === index}
                onClick={() => setSelection(index)}
              >
                <span>{image.name}</span>
                <small>{image.telescope}</small>
              </button>
            ))}
          </div>
          <p>{entry.description}</p>
          <a
            className="feature-link"
            href={entry.source}
            target="_blank"
            rel="noopener noreferrer"
          >
            Original image and downloads{" "}
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

function ArchiveImage({ entry }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="archive-image">
      {failed ? (
        <p role="status">
          Image unavailable. Open the original image using the link alongside
          this viewer.
        </p>
      ) : (
        <Image
          src={entry.image}
          alt={entry.alt}
          width={entry.width}
          height={entry.height}
          unoptimized
          onError={() => setFailed(true)}
        />
      )}
      <figcaption>
        <strong>{entry.name}</strong>
        <a href={entry.source} target="_blank" rel="noopener noreferrer">
          {entry.credit}
        </a>
      </figcaption>
    </figure>
  );
}

export function DeepSkyAtlas() {
  const [selection, setSelection] = useState(0);
  return (
    <section
      id="atlas"
      className="deep-space-section"
      aria-labelledby="atlas-title"
    >
      <h2 id="atlas-title">Interactive sky atlas</h2>
      <p>
        Pan across the sky and zoom into real survey images. Choose a starting
        target below.
      </p>
      <label className="deep-space-select">
        Starting target
        <select
          value={selection}
          onChange={(event) => setSelection(Number(event.target.value))}
        >
          {skyTargets.map(({ name }, index) => (
            <option key={name} value={index}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <EmbeddedView
        title="Aladin Lite sky atlas"
        src={skyAtlasUrl(selection)}
        openLabel="Load sky atlas"
        closeLabel="Close sky atlas"
        className="sky-atlas-frame"
      />
      <a
        className="feature-link"
        href={skyAtlasUrl(selection)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open in Aladin Lite <ArrowUpRight size={14} aria-hidden="true" />
      </a>
    </section>
  );
}

export function EmbeddedView({
  title,
  src,
  openLabel,
  closeLabel,
  className = "deep-space-player",
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <>
      <button
        type="button"
        className="button primary"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        {open ? closeLabel : openLabel}
      </button>
      <div id={panelId} hidden={!open}>
        {open && (
          <iframe
            className={className}
            title={title}
            src={src}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </>
  );
}
