"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, LogOut, Orbit } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/");
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
      </div>
    </header>
  );
}