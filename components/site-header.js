"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Orbit } from "lucide-react";

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header shell">
      <Link className="brand" href="/" aria-label="OpenSky home">
        <Orbit size={30} strokeWidth={1.5} />
        <span>
          open<span className="brand-light">sky</span>
          <span className="brand-dot">.</span>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        {[
          ["/", "Discover"],
          ["/launches", "Launches"],
          ["/explore", "Observatories"],
        ].map(([href, label]) => (
          <Link
            href={href}
            key={href}
            className={
              (href === "/" ? pathname === "/" : pathname.startsWith(href))
                ? "active"
                : ""
            }
          >
            {label}
          </Link>
        ))}
      </nav>
      <Link href="/saved" className="header-personal">
        My sky <ArrowUpRight size={15} />
      </Link>
    </header>
  );
}
