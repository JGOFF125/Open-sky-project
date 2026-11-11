import { spawn } from "node:child_process";
import assert from "node:assert/strict";

async function check(mode, port) {
  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      env: { ...process.env, OPENSKY_DATA_MODE: mode, FIREBASE_PROJECT_ID: "" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let logs = "";
  child.stdout.on("data", (data) => {
    logs += data;
  });
  child.stderr.on("data", (data) => {
    logs += data;
  });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(logs || "Server startup timeout")),
        15000,
      );
      child.stdout.on("data", () => {
        if (logs.includes("Ready")) {
          clearTimeout(timeout);
          resolve();
        }
      });
      child.on("exit", (code) => {
        clearTimeout(timeout);
        reject(new Error(`Server exited with ${code}: ${logs}`));
      });
    });
    const root = `http://127.0.0.1:${port}`;
    const response = await fetch(`${root}/api/launches`);
    const feed = await response.json();
    if (mode === "live") {
      assert.equal(response.status, 503);
      assert.equal(feed.mode, "live");
      assert.deepEqual(feed.launches, []);
      console.log("PASS live mode fails closed without credentials");
      return;
    }
    assert.equal(response.status, 200);
    assert.equal(feed.mode, "demo");
    assert.equal(feed.launches.length, 3);
    for (const path of [
      "/",
      "/launches",
      "/launches/demo-orbital",
      "/explore",
      "/journal",
      "/saved",
    ]) {
      const result = await fetch(root + path);
      assert.equal(result.status, 200, path);
      console.log(`PASS ${path}`);
    }
    const detail = await fetch(`${root}/api/launches/demo-orbital`);
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).launch.id, "demo-orbital");
    assert.equal((await fetch(`${root}/api/launches/missing`)).status, 404);
    const missingPage = await fetch(`${root}/launches/missing`);
    const html = await missingPage.text();
    assert.ok(html.includes("This mission isn"));
    assert.ok(html.includes('content="noindex"'));
    assert.equal(
      (await (await fetch(`${root}/api/health`)).json()).status,
      "ok",
    );
    console.log(
      "PASS API details, missing resources, noindex page, and health",
    );
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) =>
      child.exitCode !== null ? resolve() : child.once("exit", resolve),
    );
  }
}

await check("demo", 3100);
await check("live", 3101);
