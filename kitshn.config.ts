import { defineApp } from "kitshn";

// kitshn 2 (https://kit.yarden-zamir.com): the catalog page, public like before. The build job of site.yml builds
// site/dist with the full git history; kitshn deploys that artifact, so the recipe names no build.
export default defineApp({
  static: { output: "site/dist" },
  deploy: [
    { on: "push", branch: "main", name: "prod", address: "brew.yarden-zamir.com", startsIn: "Everyone" },
    { on: "pull_request", name: "pr-{pr}", ephemeral: true },
  ],
});
