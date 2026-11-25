const patterns = [
  ["Google API key", new RegExp("AI" + "za[0-9A-Za-z_-]{35}", "g")],
  [
    "Private key",
    new RegExp("-----BEGIN " + "(?:[A-Z]+ )?PRIVATE KEY-----", "g"),
  ],
  ["GitHub token", new RegExp("gh[pousr]_" + "[A-Za-z0-9_]{36,}", "g")],
  [
    "GitHub fine-grained token",
    new RegExp("github_pat_" + "[A-Za-z0-9_]{22,}", "g"),
  ],
  ["AWS access key", new RegExp("(?:AKIA|ASIA)" + "[A-Z0-9]{16}", "g")],
  ["Slack token", new RegExp("xox[baprs]-" + "[A-Za-z0-9-]{20,}", "g")],
  ["Stripe live secret", new RegExp("sk_live_" + "[A-Za-z0-9]{16,}", "g")],
];

export function secretFindings(source) {
  const findings = [];
  for (const [type, pattern] of patterns) {
    for (const match of source.matchAll(pattern)) {
      findings.push({
        type,
        line: source.slice(0, match.index).split("\n").length,
      });
    }
  }
  return findings;
}
