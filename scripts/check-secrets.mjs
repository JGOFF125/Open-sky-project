import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { secretFindings } from "../lib/security/secret-patterns.mjs";

const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
let count = 0;
for (const file of new Set(files)) {
  let source;
  try {
    if (!statSync(file).isFile()) continue;
    source = readFileSync(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  if (source.includes("\0")) continue;
  for (const finding of secretFindings(source)) {
    console.error(`${file}:${finding.line}: ${finding.type} detected`);
    count++;
  }
}
if (count) {
  console.error(
    "Remove credentials from these files. Rotate exposed private secrets with their provider.",
  );
  process.exitCode = 1;
} else {
  console.log("PASS no supported credential patterns in current project files");
}
