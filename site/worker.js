// Catalog page for the Yarden-zamir Homebrew tap, served on brew.yarden-zamir.com.
// It reads the tap from GitHub on request, so a new formula shows up without a build.
// The formula list comes from the README table that update-readme.yml regenerates.

const REPO = "Yarden-zamir/homebrew-tap";
const TAP = "yarden-zamir/tap";
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const CACHE_SECONDS = 60 * 60;

export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname !== "/") return new Response("Not found", { status: 404 });
    const cacheKey = new Request(new URL("/", request.url));
    const cached = await caches.default.match(cacheKey);
    if (cached) return cached;

    const response = new Response(renderPage(await loadFormulae()), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": `public, max-age=${CACHE_SECONDS}` },
    });
    ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
    return response;
  },
};

async function raw(path) {
  const response = await fetch(`${RAW}/${path}`);
  if (!response.ok) throw new Error(`GitHub raw ${path} returned ${response.status}`);
  return response.text();
}

// Formula names are the link texts in the first column of the README table.
async function formulaNames() {
  const readme = await raw("README.md");
  const start = readme.indexOf("<!-- project_table_start -->");
  const end = readme.indexOf("<!-- project_table_end -->");
  if (start < 0 || end < 0) throw new Error("README has no project table markers");
  const names = [];
  for (const line of readme.slice(start, end).split("\n")) {
    if (!line.startsWith("| [")) continue;
    const install = line.split("|")[3]?.trim() ?? "";
    const name = install.replaceAll("`", "").replace("brew install", "").trim();
    if (!name) throw new Error(`README row without an install name: ${line}`);
    names.push(name);
  }
  if (!names.length) throw new Error("README project table is empty");
  return names;
}

// Reads the few fields the page shows. Formulae here are simple and keep one field per line.
function parseFormula(name, source) {
  const lines = source.split("\n").map((l) => l.trim());
  const quoted = (key) => {
    const line = lines.find((l) => l.startsWith(`${key} "`));
    return line ? line.slice(key.length + 2, line.indexOf('"', key.length + 2)) : undefined;
  };
  const url = quoted("url") ?? "";
  const tag = url.split("/tags/")[1]?.replace(".tar.gz", "");
  const deps = lines.filter((l) => l.startsWith('depends_on "')).map((l) => ({
    name: l.split('"')[1],
    build: l.includes(":build"),
  }));

  // Caveats are the steps to take after install. Swap Homebrew path helpers for shell.
  let caveats = "";
  if (lines.includes("def caveats")) {
    const body = source.split("def caveats")[1];
    const heredoc = body.slice(body.indexOf("<<~EOS") + 6, body.indexOf("\n    EOS"));
    caveats = heredoc.split("\n").map((l) => l.slice(6)).join("\n").trim()
      .replaceAll("#{opt_pkgshare}", `$(brew --prefix ${name})/share/${name}`)
      .replaceAll("#{opt_prefix}", `$(brew --prefix ${name})`)
      .replaceAll("#{HOMEBREW_PREFIX}", "$(brew --prefix)");
  }

  return {
    name,
    desc: quoted("desc") ?? "",
    homepage: quoted("homepage") ?? `https://github.com/${REPO}`,
    version: tag ?? quoted("version") ?? "",
    license: quoted("license") ?? "",
    head: lines.some((l) => l.startsWith("head ")),
    deps,
    caveats,
  };
}

async function loadFormulae() {
  const names = await formulaNames();
  const sources = await Promise.all(names.map((n) => raw(`Formula/${n}.rb`)));
  return names.map((n, i) => parseFormula(n, sources[i]));
}

const escapeHtml = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function copyLine(command, label = "copy") {
  return `<div class="cmd"><code>${escapeHtml(command)}</code><button type="button" data-copy="${escapeHtml(command)}">${label}</button></div>`;
}

function renderItem(f, i) {
  const runtime = f.deps.filter((d) => !d.build).map((d) => d.name);
  const build = f.deps.filter((d) => d.build).map((d) => d.name);
  const needs = [
    runtime.length ? `needs ${runtime.join(", ")}` : "",
    build.length ? `builds with ${build.join(", ")}` : "",
  ].filter(Boolean).join(" · ");
  return `<article class="item" data-search="${escapeHtml(`${f.name} ${f.desc}`.toLowerCase())}">
  <div class="line"><span class="qty">${String(i + 1).padStart(2, "0")}</span><h2>${escapeHtml(f.name)}</h2><span class="leader"></span><span class="ver">${escapeHtml(f.version)}</span></div>
  <p class="desc">${escapeHtml(f.desc)}</p>
  ${copyLine(`brew install ${TAP}/${f.name}`)}
  ${f.caveats ? `<details><summary>after install</summary><pre>${escapeHtml(f.caveats)}</pre></details>` : ""}
  <p class="meta">${[needs, f.license, f.head ? `<span title="brew install --HEAD ${TAP}/${escapeHtml(f.name)}">--HEAD ok</span>` : ""].filter(Boolean).join(" · ")}</p>
  <p class="links"><a href="${escapeHtml(f.homepage)}">repo</a><a href="${escapeHtml(f.homepage)}/releases">releases</a><a href="https://github.com/${REPO}/blob/main/Formula/${escapeHtml(f.name)}.rb">formula</a></p>
</article>`;
}

function renderPage(formulae) {
  const all = `brew install ${formulae.map((f) => `${TAP}/${f.name}`).join(" ")}`;
  const printed = new Date().toISOString().slice(0, 16).replace("T", " ");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Yarden's Homebrew tap</title>
<meta name="description" content="${formulae.length} command line tools by Yarden Zamir, installable with Homebrew.">
<style>
  :root { --paper: #fbf8f1; --edge: #e6dfd2; --ink: #2a2622; --faded: #8c857a; --stamp: #c8402b; --bg: #ebe6dc; }
  @media (prefers-color-scheme: dark) { :root { --paper: #23221f; --edge: #3a3833; --ink: #ece4d6; --faded: #8f897e; --stamp: #f0694f; --bg: #141412; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 14px/1.5 ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
  .receipt { position: relative; max-width: 640px; margin: 32px auto; padding: 36px 32px 44px; background: var(--paper);
    --tooth: 12px; -webkit-mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / var(--tooth) 100%,
    conic-gradient(from 135deg at top, #0000, #000 1deg 89deg, #0000 90deg) 50% / var(--tooth) 100%;
    -webkit-mask-composite: source-in; mask-composite: intersect; }
  header { text-align: center; }
  h1 { margin: 0; font-size: 20px; letter-spacing: 3px; }
  .faded, .sub, .meta, .desc, .qty, .ver, footer { color: var(--faded); }
  .sub { margin: 4px 0 0; font-size: 12px; }
  hr { border: 0; border-top: 1px dashed var(--faded); margin: 22px 0; }
  .cmd { display: flex; align-items: center; gap: 8px; margin: 8px 0; padding: 7px 8px 7px 12px; border: 1px dashed var(--edge); border-radius: 6px; }
  .cmd code { flex: 1; min-width: 0; overflow-x: auto; white-space: nowrap; font-size: 13px; }
  .cmd code::before { content: "$ "; color: var(--faded); }
  button { font: inherit; font-size: 12px; color: var(--ink); background: none; border: 1px solid var(--ink); border-radius: 4px; padding: 2px 10px; cursor: pointer; }
  button.done { color: var(--stamp); border-color: var(--stamp); }
  input { width: 100%; font: inherit; color: var(--ink); background: none; border: 0; border-bottom: 1px solid var(--faded); padding: 6px 0; outline: none; }
  input::placeholder { color: var(--faded); }
  .item { padding: 18px 0; border-bottom: 1px dashed var(--edge); }
  .item[hidden] { display: none; }
  .line { display: flex; align-items: baseline; gap: 10px; }
  .line h2 { margin: 0; font-size: 16px; overflow-wrap: anywhere; }
  .receipt, .item { min-width: 0; }
  .leader { flex: 1; border-bottom: 2px dotted var(--faded); transform: translateY(-4px); opacity: .6; }
  .desc { margin: 4px 0 0 30px; }
  .item .cmd, .item details, .meta, .links { margin-left: 30px; }
  .meta { margin-top: 6px; margin-bottom: 0; font-size: 12px; }
  .links { margin: 6px 0 0 30px; font-size: 12px; }
  .links a { color: var(--ink); margin-right: 14px; }
  details { margin-top: 6px; font-size: 13px; }
  summary { cursor: pointer; color: var(--stamp); }
  pre { margin: 6px 0 0; padding: 10px 12px; background: color-mix(in srgb, var(--edge) 45%, transparent); border-radius: 6px; white-space: pre-wrap; }
  .stamp { position: absolute; top: 30px; right: 26px; width: 92px; height: 92px; border: 3px double var(--stamp); border-radius: 50%;
    color: var(--stamp); display: grid; place-content: center; text-align: center; transform: rotate(-12deg); opacity: .85; font-weight: 800; line-height: 1.1; }
  .stamp b { font-size: 26px; display: block; }
  .stamp small { font-size: 9px; letter-spacing: 1.5px; }
  footer { text-align: center; font-size: 11px; letter-spacing: 1.5px; margin-top: 26px; }
  footer a { color: inherit; }
  @media (max-width: 560px) { .receipt { margin: 0; padding: 32px 16px 40px; } .stamp { display: none; } .desc, .item .cmd, .item details, .meta, .links { margin-left: 0; } }
</style>
</head>
<body>
<main class="receipt">
  <div class="stamp" aria-hidden="true"><small>IN STOCK</small><b>${formulae.length}</b><small>FORMULAE</small></div>
  <header>
    <h1>YARDEN'S TAP</h1>
    <p class="sub">github.com/${REPO}</p>
    <p class="sub">PRINTED ${printed} UTC</p>
  </header>
  <hr>
  <p class="faded">1. add the tap once</p>
  ${copyLine(`brew tap ${TAP}`)}
  <p class="faded">2. or take the whole order</p>
  ${copyLine(all, "copy all")}
  <hr>
  <input type="search" placeholder="filter: rust, sessions, zsh…" aria-label="Filter formulae" autocomplete="off">
  ${formulae.map(renderItem).join("\n  ")}
  <footer>
    <p>ITEMS: ${formulae.length} · PRICE: $0.00 · LICENSE: MIT</p>
    <p>UPDATED FROM <a href="https://github.com/${REPO}">${REPO}</a> EVERY HOUR</p>
    <p>NO REFUNDS ON ABANDONED PROJECTS</p>
  </footer>
</main>
<script>
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-copy]");
    if (!button) return;
    await navigator.clipboard.writeText(button.dataset.copy);
    const label = button.textContent;
    button.textContent = "copied";
    button.classList.add("done");
    setTimeout(() => { button.textContent = label; button.classList.remove("done"); }, 1400);
  });
  const filter = document.querySelector("input[type=search]");
  filter.addEventListener("input", () => {
    const q = filter.value.trim().toLowerCase();
    for (const item of document.querySelectorAll(".item")) item.hidden = q !== "" && !item.dataset.search.includes(q);
  });
</script>
</body>
</html>
`;
}
