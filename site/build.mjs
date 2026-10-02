// Builds the tap catalog for brew.yarden-zamir.com into site/dist.
// CI runs it on every push that changes a formula, the README or this folder
// (.github/workflows/site.yml), then deploys site/dist as static assets.
//
// Inputs: Formula/*.rb, git history for "last updated", and each project's public
// release feed.
// Run locally from the repo root: node site/build.mjs

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const REPO = "Yarden-zamir/homebrew-tap";
const TAP = "yarden-zamir/tap";
const OUT = "site/dist";

// Every Formula/*.rb is on the menu. The README table lags one bot commit behind a new
// formula, so the folder is the source of truth here.
function formulaNames() {
  const names = readdirSync("Formula").filter((f) => f.endsWith(".rb")).map((f) => f.slice(0, -3)).sort();
  if (!names.length) throw new Error("Formula/ has no formulae");
  return names;
}

// Reads the fields the page shows. The formulae here are simple and keep one field per line.
function parseFormula(name, source) {
  const lines = source.split("\n").map((l) => l.trim());
  const quoted = (key) => {
    const line = lines.find((l) => l.startsWith(`${key} "`));
    return line ? line.slice(key.length + 2, line.indexOf('"', key.length + 2)) : undefined;
  };
  const url = quoted("url") ?? "";
  const deps = lines.filter((l) => l.startsWith('depends_on "')).map((l) => ({ name: l.split('"')[1], build: l.includes(":build") }));

  // Caveats are the steps to take after install. Swap Homebrew path helpers for shell.
  let caveats = "";
  if (lines.includes("def caveats")) {
    const body = source.split("def caveats")[1];
    caveats = body.slice(body.indexOf("<<~EOS") + 6, body.indexOf("\n    EOS")).split("\n").map((l) => l.slice(6)).join("\n").trim()
      .replaceAll("#{opt_pkgshare}", `$(brew --prefix ${name})/share/${name}`)
      .replaceAll("#{opt_prefix}", `$(brew --prefix ${name})`)
      .replaceAll("#{HOMEBREW_PREFIX}", "$(brew --prefix)");
  }

  const depNames = deps.map((d) => d.name);
  const tags = [
    depNames.includes("rust") && "rust",
    (depNames.includes("uv") || depNames.some((d) => d.startsWith("python"))) && "python",
    (caveats.includes(".zshrc") || name.startsWith("zsh")) && "zsh",
    depNames.includes("gh") && "gh",
  ].filter(Boolean);

  return {
    name,
    desc: quoted("desc") ?? "",
    homepage: quoted("homepage") ?? `https://github.com/${REPO}`,
    version: url.split("/tags/")[1]?.replace(".tar.gz", "") ?? quoted("version") ?? "",
    license: quoted("license") ?? "",
    head: lines.some((l) => l.startsWith("head ")),
    deps,
    tags,
    caveats,
  };
}

// The newest <updated> value in an Atom feed, and the title of its first entry.
function atom(feed) {
  const updated = feed.split("<updated>").slice(1).map((part) => part.slice(0, part.indexOf("</updated>")));
  const entry = feed.indexOf("<entry>");
  const title = entry < 0 ? null : feed.slice(feed.indexOf("<title>", entry) + 7, feed.indexOf("</title>", entry));
  return { updated: updated.sort().at(-1) ?? null, title: title?.startsWith("Release ") ? title.slice(8) : title };
}

async function latestRelease(homepage) {
  const response = await fetch(`${homepage}/releases.atom`, { headers: { "User-Agent": "brew.yarden-zamir.com build" } });
  if (!response.ok) throw new Error(`${homepage}/releases.atom returned ${response.status}`);
  return atom(await response.text());
}

// CI checks out the full history (fetch-depth: 0), so this is the last commit that changed the formula.
const lastChanged = (path) => execFileSync("git", ["log", "-1", "--format=%cI", "--", path], { encoding: "utf8" }).trim() || null;

const formulae = await Promise.all(formulaNames().map(async (name) => {
  const path = `Formula/${name}.rb`;
  const formula = parseFormula(name, readFileSync(path, "utf8"));
  const release = await latestRelease(formula.homepage);
  return { ...formula, updatedAt: lastChanged(path), releasedAt: release.updated, release: release.title };
}));

const builtAt = new Date().toISOString();
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/formulae.json`, JSON.stringify({ tap: TAP, builtAt, formulae }, null, 2));
const template = readFileSync("site/page.html", "utf8");
const data = JSON.stringify({ tap: TAP, repo: REPO, builtAt, formulae }).replaceAll("<", "\\u003c");
if (!template.includes("/*DATA*/null")) throw new Error("site/page.html has no /*DATA*/null placeholder");
writeFileSync(`${OUT}/index.html`, template.replace("/*DATA*/null", data));
console.log(`Built ${formulae.length} formulae into ${OUT}`);
