import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { LaunchTime } from "./launch-time";

export function LaunchCard({ launch, index = 0, demo = false }) {
  return (
    <Link href={`/launches/${launch.id}`} className="launch-card">
      <div className={`mission-art art-${index % 3}`} aria-hidden="true">
        <div className="mission-orbit" />
        <div className="mission-planet" />
        <span className="art-label">{launch.rocket}</span>
        <ArrowUpRight className="art-arrow" size={22} />
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span>{launch.provider}</span>
          <span className="small-status">
            {demo ? "Sample mission" : launch.status}
          </span>
        </div>
        <h3>{launch.name.split(" | ")[1] ?? launch.name}</h3>
        <p className="location">
          <MapPin size={13} />
          {launch.location}
        </p>
        <div className="card-bottom">
          <LaunchTime launch={launch} />
          <ArrowUpRight size={17} />
        </div>
      </div>
    </Link>
  );
}
