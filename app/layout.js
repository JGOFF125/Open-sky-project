import { SiteHeader } from "@/components/site-header";
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: {
    default: "OpenSky — A little closer to the extraordinary",
    template: "%s | OpenSky",
  },
  description:
    "Explore rocket launches, discover public astronomy resources, and build your own observing story.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <footer className="shell footer">
          <Link className="footer-brand" href="/">
            opensky.
          </Link>
          <p>A little curiosity. An infinite universe.</p>
          <div>
            <Link href="/journal">Journal</Link>
            <a
              href="https://thespacedevs.com/llapi"
              target="_blank"
              rel="noreferrer"
            >
              Launch data by The Space Devs ↗
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
