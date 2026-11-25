"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";

export function TelescopeView({ sourceId }) {
  const [open, setOpen] = useState(false);
  const viewerId = useId();
  const isSolar = sourceId === "cerro-tololo-solar";
  return (
    <>
      <button
        className="button primary"
        type="button"
        aria-expanded={open}
        aria-controls={viewerId}
        onClick={() => setOpen(!open)}
      >
        {open
          ? "Close viewer"
          : isSolar
            ? "View latest solar image"
            : "Play eclipse replay"}
      </button>
      <div className="telescope-view" id={viewerId} hidden={!open}>
        {open &&
          (isSolar ? (
            <SolarImage />
          ) : (
            <iframe
              title="UNAM Morelia total lunar eclipse replay"
              src="https://www.youtube-nocookie.com/embed/wg0mo3FAYuY"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ))}
      </div>
    </>
  );
}

function SolarImage() {
  const [observation, setObservation] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/telescopes/solar", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const frame = await response.json();
        if (controller.signal.aborted) return;
        const age = Date.now() - Date.parse(frame.capturedAt);
        setObservation({ ...frame, recent: age >= 0 && age < 10 * 60 * 1000 });
        setUnavailable(false);
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      }
    }
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  if (!observation) {
    return (
      <p role="status">
        {unavailable
          ? "Solar image unavailable. Try opening the observatory feed."
          : "Loading the latest solar image…"}
      </p>
    );
  }
  const { capturedAt, imageUrl, recent } = observation;
  return (
    <figure>
      <SolarFrame key={imageUrl} imageUrl={imageUrl} />
      <figcaption>
        <p>
          {recent && !unavailable ? "Near-live image" : "Last available image"}{" "}
          · Captured{" "}
          <time dateTime={capturedAt}>
            {capturedAt.slice(0, 19).replace("T", " ")} UTC
          </time>
        </p>
        {unavailable && (
          <p role="status">
            The feed is temporarily unavailable. The previous image is shown.
          </p>
        )}
        <a
          className="feature-link"
          href="https://nso.edu/data/#gong"
          target="_blank"
          rel="noopener noreferrer"
        >
          GONG data acquired by NISP/NSO/AURA/NSF with contribution from NOAA
        </a>
      </figcaption>
    </figure>
  );
}

function SolarFrame({ imageUrl }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <p role="status">
      This image could not load. Try opening the observatory feed.
    </p>
  ) : (
    <Image
      src={imageUrl}
      alt="Full-disk hydrogen-alpha telescope image of the Sun from Cerro Tololo"
      width={512}
      height={512}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
