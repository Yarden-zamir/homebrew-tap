# Release Notes Centralization

Status: Deferred

## Goal

Centralize release-note generation for the personal and qlik publisher
collections while keeping each publisher's existing build, versioning, release,
and Homebrew sync behavior.

## Recommended Scope

Centralize only changelog generation. Do not centralize complete release
workflows because the publishers use different release strategies:

- `aism`, `gh-source`, `wrap`, `zsh-act-completion`, and `cli-utils` create
  semantic version tags with `github-tag-action`.
- `issuegator`, `navgator`, and `sessiongator` build release artifacts and use
  the version in `Cargo.toml`.

Each tap should provide a small composite action:

```text
.github/actions/release-notes/action.yml
```

The action should accept a release tag and optional output path, find the
previous tag, and write release notes containing each commit subject and its
non-empty body lines. Personal publishers should call the action in
`Yarden-zamir/homebrew-tap`; qlik publishers should call the action in
`qlik-trial/homebrew-tap`.

Publisher workflows should retain release creation and pass the generated file
to either `bodyFile` or `gh release create --notes-file`.

## Expected Format

```markdown
## Changelog

Changes since <previous-tag>.

- <short-sha> <commit subject>
  <commit body lines>
```

## Drawbacks

- Publisher releases become dependent on the tap repository and action path.
- A breaking change on the tap's `main` branch can affect every publisher at
  once.
- Debugging requires following execution from the publisher into another
  repository.
- Private qlik publishers require cross-repository Actions access and token
  validation.
- Composite actions can return a notes path but cannot remove all publisher
  release wiring.
- Executing tap-owned code expands the tap's security responsibility beyond
  formula synchronization.
- The action must preserve the different tag timing used by tag-action and
  `Cargo.toml`-versioned publishers.

## Versioning

Use `@main` initially while this is private project infrastructure. If the
action becomes stable or externally consumed, publish immutable action tags and
pin publishers to those tags.
