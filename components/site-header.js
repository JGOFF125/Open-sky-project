"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, LogOut, Orbit } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  async function handleLogout() {
    setError("");
    setSigningOut(true);
    try {
      await logout();
      router.push("/");
    } catch {
      setError("Sign out failed. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }
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
          ["/journal", "Journal"],
        ].map(([href, label]) => (
          <Link
            href={href}
            key={href}
            aria-current={
              (href === "/" ? pathname === "/" : pathname.startsWith(href))
                ? "page"
                : undefined
            }
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
      {/* I show sign in or sign out depending on who is logged in */}
      <div className="header-account">
        {loading ? null : user ? (
          <>
            <Link href="/saved" className="header-personal">
              My sky <ArrowUpRight size={15} />
            </Link>
            <button
              type="button"
              className="header-logout"
              onClick={handleLogout}
              disabled={signingOut}
              aria-label="Sign out"
              title={`Signed in as ${user.email}`}
            >
              <LogOut size={15} />
            </button>
          </>
        ) : (
          <Link href="/login" className="header-personal">
            Sign in <ArrowUpRight size={15} />
          </Link>
        )}
        {error && (
          <p className="header-error" role="alert">{error}</p>
        )}
      </div>
    </header>
  );
}