"use client";
import { useSyncExternalStore } from "react";
import { formatLaunchTime } from "@/lib/launches/time";

const subscribe = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverZone = () => "UTC";

export function LaunchTime({ launch }) {
  const zone = useSyncExternalStore(subscribe, browserZone, serverZone);
  return (
    <time
      dateTime={launch.net ?? undefined}
      title={
        launch.precise
          ? `Your time zone: ${zone}`
          : "The provider has not confirmed an exact time"
      }
    >
      {formatLaunchTime(launch, zone)}
    </time>
  );
}
