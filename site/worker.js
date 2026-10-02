// Catalog page for the Yarden-zamir Homebrew tap, served on brew.yarden-zamir.com.
// It reads the tap from GitHub on request, so a new formula shows up without a build.
// The formula list comes from the README table that update-readme.yml regenerates.
// Dates come from GitHub's public Atom feeds, which need no token or API quota.
//
// Limit: each formula costs 3 subrequests (formula, commit feed, release feed) and the
// free Workers plan allows 50, so the page fits about 15 formulae. Revisit at that size.

const REPO = "Yarden-zamir/homebrew-tap";
const TAP = "yarden-zamir/tap";
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const CACHE_SECONDS = 60 * 60;

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname !== "/" && pathname !== "/formulae.json") return new Response("Not found", { status: 404 });
    const cacheKey = new Request(new URL(pathname, request.url));
    const cached = await caches.default.match(cacheKey);
    if (cached) return cached;

    const formulae = await loadFormulae();
    const response = pathname === "/formulae.json"
      ? Response.json({ tap: TAP, updatedAt: new Date().toISOString(), formulae })
      : new Response(renderPage(formulae), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    response.headers.set("Cache-Control", `public, max-age=${CACHE_SECONDS}`);
    ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
    return response;
  },
};

async function text(url) {
  const response = await fetch(url, { headers: { "User-Agent": "brew.yarden-zamir.com" } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

// Formula names are the install commands in the third column of the README table.
async function formulaNames() {
  const readme = await text(`${RAW}/README.md`);
  const start = readme.indexOf("<!-- project_table_start -->");
  const end = readme.indexOf("<!-- project_table_end -->");
  if (start < 0 || end < 0) throw new Error("README has no project table markers");
  const names = [];
  for (const line of readme.slice(start, end).split("\n")) {
    if (!line.startsWith("| [")) continue;
    const name = (line.split("|")[3] ?? "").replaceAll("`", "").replace("brew install", "").trim();
    if (!name) throw new Error(`README row without an install name: ${line}`);
    names.push(name);
  }
  if (!names.length) throw new Error("README project table is empty");
  return names;
}

// The newest <updated> value in an Atom feed, and the title of its first entry.
function atom(feed) {
  const updated = feed.split("<updated>").slice(1).map((part) => part.slice(0, part.indexOf("</updated>")));
  const entry = feed.indexOf("<entry>");
  const title = entry < 0 ? null : feed.slice(feed.indexOf("<title>", entry) + 7, feed.indexOf("</title>", entry));
  return { updated: updated.sort().at(-1) ?? null, title };
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

async function loadFormulae() {
  const names = await formulaNames();
  return Promise.all(names.map(async (name) => {
    const formula = parseFormula(name, await text(`${RAW}/Formula/${name}.rb`));
    const [commits, releases] = await Promise.all([
      text(`https://github.com/${REPO}/commits/main/Formula/${name}.rb.atom`).then(atom),
      text(`${formula.homepage}/releases.atom`).then(atom),
    ]);
    const release = releases.title?.startsWith("Release ") ? releases.title.slice(8) : releases.title;
    return { ...formula, updatedAt: commits.updated, releasedAt: releases.updated, release };
  }));
}

const escapeHtml = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function copyLine(command, { label = "copy", id = "" } = {}) {
  return `<div class="cmd"><code${id ? ` id="${id}"` : ""}>${escapeHtml(command)}</code><button type="button"${id ? ` data-copy-from="${id}"` : ""} data-copy="${escapeHtml(command)}">${label}</button></div>`;
}

const TAG_LABELS = { rust: "Rust", python: "Python", zsh: "zsh", gh: "needs gh" };

function renderItem(f) {
  const runtime = f.deps.filter((d) => !d.build).map((d) => d.name);
  const build = f.deps.filter((d) => d.build).map((d) => d.name);
  const facts = [
    runtime.length && `needs ${runtime.join(", ")}`,
    build.length && `builds with ${build.join(", ")}`,
    f.license,
    f.head && "--HEAD ok",
  ].filter(Boolean).join(" · ");
  const full = `${TAP}/${f.name}`;
  return `<article class="item" data-name="${escapeHtml(f.name)}" data-updated="${escapeHtml(f.updatedAt ?? "")}" data-released="${escapeHtml(f.releasedAt ?? "")}"
    data-tags="${f.tags.join(" ")}" data-search="${escapeHtml(`${f.name} ${f.desc} ${f.tags.join(" ")}`.toLowerCase())}">
  <div class="line"><h2><a href="${escapeHtml(f.homepage)}">${escapeHtml(f.name)}</a></h2><span class="leader"></span><span class="ver">${escapeHtml(f.version)}</span></div>
  <p class="desc">${escapeHtml(f.desc)}</p>
  <p class="when"><span data-time="${escapeHtml(f.updatedAt ?? "")}">updated</span>${f.release ? ` · latest <a href="${escapeHtml(f.homepage)}/releases/latest">${escapeHtml(f.release)}</a>` : ""}${f.tags.map((t) => ` <span class="tag">${TAG_LABELS[t]}</span>`).join("")}</p>
  ${copyLine(`brew install ${full}`)}
  ${f.caveats ? `<details open><summary>after install</summary><pre>${escapeHtml(f.caveats)}</pre></details>` : ""}
  <details><summary>more commands</summary>${copyLine(`brew upgrade ${full}`)}${f.head ? copyLine(`brew install --HEAD ${full}`) : ""}${copyLine(`brew uninstall ${f.name}`)}</details>
  <p class="meta">${escapeHtml(facts)}</p>
  <p class="links"><a href="${escapeHtml(f.homepage)}">repo</a><a href="${escapeHtml(f.homepage)}/releases">releases</a><a href="${escapeHtml(f.homepage)}/issues">issues</a><a href="https://github.com/${REPO}/blob/main/Formula/${escapeHtml(f.name)}.rb">formula</a></p>
</article>`;
}

// Torn paper: polygon points for a zigzag along the top and bottom edges.
function zigzag() {
  const teeth = 64;
  const depth = 7;
  const top = Array.from({ length: teeth + 1 }, (_, i) => `${(i * 100) / teeth}% ${i % 2 ? 0 : depth}px`);
  const bottom = Array.from({ length: teeth + 1 }, (_, i) => `${100 - (i * 100) / teeth}% calc(100% - ${i % 2 ? 0 : depth}px)`);
  return [...top, ...bottom].join(", ");
}

function renderPage(formulae) {
  const tags = [...new Set(formulae.flatMap((f) => f.tags))];
  const printed = new Date().toISOString().slice(0, 16).replace("T", " ");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Yarden's Homebrew tap</title>
<meta name="description" content="${formulae.length} command line tools by Yarden Zamir, installable with Homebrew.">
<link rel="alternate" type="application/json" href="/formulae.json">
<style>
  :root { --paper: #fbf8f1; --edge: #e2dacb; --ink: #26221e; --faded: #7d766b; --stamp: #c23d28; --bg: #e9e3d8; }
  @media (prefers-color-scheme: dark) { :root { --paper: #23221f; --edge: #3d3b35; --ink: #eee6d8; --faded: #a29b8f; --stamp: #f0694f; --bg: #141412; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.55 ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
  a { color: inherit; }
  .receipt { position: relative; max-width: 780px; margin: 40px auto; padding: 48px 48px 56px; background: var(--paper); clip-path: polygon(${zigzag()}); }
  header { text-align: center; }
  h1 { margin: 0; font-size: 28px; letter-spacing: 4px; }
  .sub { margin: 6px 0 0; color: var(--faded); font-size: 14px; }
  .step { margin: 18px 0 6px; color: var(--faded); }
  hr { border: 0; border-top: 2px dashed var(--edge); margin: 28px 0; }
  .cmd { display: flex; align-items: center; gap: 10px; margin: 10px 0; padding: 9px 10px 9px 14px; border: 1px dashed var(--faded); border-radius: 8px; }
  .cmd code { flex: 1; min-width: 0; overflow-x: auto; white-space: nowrap; font-size: 15px; }
  .cmd code::before { content: "$ "; color: var(--faded); }
  button, select { font: inherit; font-size: 14px; color: var(--ink); background: var(--paper); border: 1.5px solid var(--ink); border-radius: 6px; padding: 4px 12px; cursor: pointer; }
  button.done { color: var(--stamp); border-color: var(--stamp); }
  .controls { display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; }
  input { flex: 1 1 260px; min-width: 0; font: inherit; color: var(--ink); background: none; border: 0; border-bottom: 2px solid var(--faded); padding: 6px 0; outline: none; }
  input:focus { border-color: var(--ink); }
  input::placeholder { color: var(--faded); }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .chip { border-style: dashed; }
  .chip[aria-pressed="true"] { background: var(--ink); color: var(--paper); border-style: solid; }
  .count { color: var(--faded); font-size: 14px; margin: 14px 0 0; }
  .item { padding: 24px 0; border-bottom: 2px dashed var(--edge); }
  .item[hidden] { display: none; }
  .line { display: flex; align-items: baseline; gap: 12px; }
  .line h2 { margin: 0; font-size: 21px; overflow-wrap: anywhere; }
  .line h2 a { text-decoration: none; }
  .line h2 a:hover { text-decoration: underline; }
  .leader { flex: 1; border-bottom: 2px dotted var(--faded); transform: translateY(-5px); opacity: .7; }
  .ver { color: var(--faded); font-size: 15px; }
  .desc { margin: 6px 0 0; font-size: 16.5px; }
  .when { margin: 4px 0 0; color: var(--faded); font-size: 14px; }
  .tag { display: inline-block; margin-left: 6px; padding: 0 8px; border: 1px solid var(--faded); border-radius: 99px; font-size: 12.5px; }
  .meta, .links { margin: 8px 0 0; font-size: 14px; color: var(--faded); }
  .links a { margin-right: 18px; color: var(--ink); }
  details { margin-top: 10px; font-size: 15px; }
  summary { cursor: pointer; color: var(--stamp); }
  pre { margin: 8px 0 0; padding: 12px 14px; background: color-mix(in srgb, var(--edge) 50%, transparent); border-radius: 8px; white-space: pre-wrap; font-size: 14.5px; }
  .stamp { position: absolute; top: 36px; right: 36px; width: 110px; height: 110px; border: 4px double var(--stamp); border-radius: 50%;
    color: var(--stamp); display: grid; place-content: center; text-align: center; transform: rotate(-12deg); opacity: .85; font-weight: 800; line-height: 1.1; }
  .stamp b { font-size: 32px; display: block; }
  .stamp small { font-size: 10.5px; letter-spacing: 2px; }
  footer { text-align: center; color: var(--faded); font-size: 13px; letter-spacing: 1.5px; margin-top: 30px; }
  @media (max-width: 640px) { body { font-size: 15px; } .receipt { margin: 0; padding: 40px 18px 48px; } .stamp { display: none; } }
</style>
</head>
<body>
<main class="receipt">
  <div class="stamp" aria-hidden="true"><small>IN STOCK</small><b>${formulae.length}</b><small>FORMULAE</small></div>
  <header>
    <h1>YARDEN'S TAP</h1>
    <p class="sub"><a href="https://github.com/${REPO}">github.com/${REPO}</a></p>
    <p class="sub">PRINTED ${printed} UTC</p>
  </header>
  <hr>
  <p class="step">1. add the tap once</p>
  ${copyLine(`brew tap ${TAP}`)}
  <p class="step">2. take everything shown below</p>
  ${copyLine("", { label: "copy all", id: "all" })}
  <hr>
  <div class="controls">
    <input type="search" placeholder="filter (press /)" aria-label="Filter formulae" autocomplete="off">
    <label>sort <select aria-label="Sort formulae">
      <option value="updated">recently updated</option>
      <option value="released">newest release</option>
      <option value="name">name A–Z</option>
      <option value="oldest">least recently updated</option>
    </select></label>
  </div>
  <div class="chips">${tags.map((t) => `<button type="button" class="chip" data-tag="${t}" aria-pressed="false">${TAG_LABELS[t]}</button>`).join("")}</div>
  <p class="count"></p>
  <section id="items">
  ${formulae.map(renderItem).join("\n  ")}
  </section>
  <footer>
    <p>ITEMS: ${formulae.length} · PRICE: $0.00 · LICENSE: MIT</p>
    <p>REFRESHED FROM GITHUB EVERY HOUR · <a href="/formulae.json">FORMULAE.JSON</a></p>
    <p>NO REFUNDS ON ABANDONED PROJECTS</p>
  </footer>
</main>
<script>
  const TAP = ${JSON.stringify(TAP)};
  const items = [...document.querySelectorAll(".item")];
  const list = document.getElementById("items");
  const filter = document.querySelector("input[type=search]");
  const sort = document.querySelector("select");
  const chips = [...document.querySelectorAll(".chip")];
  const all = document.getElementById("all");
  const allButton = document.querySelector('[data-copy-from="all"]');
  const count = document.querySelector(".count");

  const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const el of document.querySelectorAll("[data-time]")) {
    if (!el.dataset.time) continue;
    const days = Math.round((Date.parse(el.dataset.time) - Date.now()) / 864e5);
    el.textContent = "updated " + (days === 0 ? "today" : Math.abs(days) < 60 ? relative.format(days, "day") : relative.format(Math.round(days / 30), "month"));
    el.title = el.dataset.time;
  }

  const comparators = {
    updated: (a, b) => b.dataset.updated.localeCompare(a.dataset.updated),
    released: (a, b) => b.dataset.released.localeCompare(a.dataset.released),
    name: (a, b) => a.dataset.name.localeCompare(b.dataset.name),
    oldest: (a, b) => a.dataset.updated.localeCompare(b.dataset.updated),
  };

  // Filter, sort and tags live in the URL, so a filtered view can be shared.
  function apply() {
    const q = filter.value.trim().toLowerCase();
    const active = chips.filter((c) => c.getAttribute("aria-pressed") === "true").map((c) => c.dataset.tag);
    const shown = [];
    for (const item of [...items].sort(comparators[sort.value])) {
      const tags = item.dataset.tags.split(" ");
      item.hidden = !(item.dataset.search.includes(q) && active.every((t) => tags.includes(t)));
      list.append(item);
      if (!item.hidden) shown.push(item.dataset.name);
    }
    const command = shown.length ? "brew install " + shown.map((n) => TAP + "/" + n).join(" ") : "# nothing matches the filter";
    all.textContent = command;
    allButton.dataset.copy = command;
    count.textContent = shown.length + " of " + items.length + " shown";
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sort.value !== "updated") params.set("sort", sort.value);
    if (active.length) params.set("tags", active.join(","));
    history.replaceState(null, "", params.size ? "?" + params : location.pathname);
  }

  const start = new URLSearchParams(location.search);
  filter.value = start.get("q") ?? "";
  if (comparators[start.get("sort")]) sort.value = start.get("sort");
  const startTags = (start.get("tags") ?? "").split(",");
  for (const chip of chips) chip.setAttribute("aria-pressed", String(startTags.includes(chip.dataset.tag)));

  filter.addEventListener("input", apply);
  sort.addEventListener("change", apply);
  for (const chip of chips) chip.addEventListener("click", () => { chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true")); apply(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== filter) { event.preventDefault(); filter.focus(); }
  });
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-copy]");
    if (!button) return;
    await navigator.clipboard.writeText(button.dataset.copy);
    const label = button.textContent;
    button.textContent = "copied";
    button.classList.add("done");
    setTimeout(() => { button.textContent = label; button.classList.remove("done"); }, 1400);
  });
  apply();
</script>
</body>
</html>
`;
}
