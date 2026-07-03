---
name: homebrew-formula-sync
description: Use when creating or changing Homebrew formula templates, formula-sync.json, sync-formula.yml, or publisher release workflows for Yarden-zamir/homebrew-tap.
---

# Homebrew Formula Sync

Use this skill when a user asks to add a new Homebrew formula, change formula
dependencies/install/caveats/tests, fix formula drift, or wire a publisher repo
into `Yarden-zamir/homebrew-tap`.

## Architecture

- Publisher repos own formula behavior in `.homebrew/<formula>.rb`.
- The tap owns syncing, validation, README generation, PR creation, and automerge.
- Tap formulae under `Formula/*.rb` are rendered artifacts.
- Do not hand-edit tap formula behavior unless it is emergency recovery.
- If tap behavior changes, move that change back into the publisher template.

## Publisher Template Contract

Every publisher template must contain exactly one `{{URL}}` and one `{{SHA256}}`:

```ruby
url "{{URL}}"
sha256 "{{SHA256}}"
```

The template should also include the stable formula behavior:

- `desc`
- `homepage`
- `license`
- `head` if relevant
- dependencies
- `install`
- `caveats`
- `test`

Optional placeholders are available:

- `{{TAG}}`
- `{{VERSION}}`
- `{{FORMULA}}`
- `{{REPOSITORY}}`

## Adding A New Formula

1. Add `.homebrew/<formula>.rb` to the publisher repo.
2. Add the formula mapping to `formula-sync.json` in `homebrew-tap`.
3. Add a release job in the publisher repo that calls:

```yaml
homebrew:
  needs: release
  uses: Yarden-zamir/homebrew-tap/.github/workflows/sync-formula.yml@main
  with:
    formula: <formula>
    tag: ${{ needs.release.outputs.tag }}
    repository: Yarden-zamir/<repo>
  secrets:
    token: ${{ secrets.TOKEN }}
```

4. Locally render the formula with `uv run --no-project scripts/sync_formula.py`.
5. Ensure tap CI passes drift validation before relying on test-bot results.

## Fixing Drift

If tap CI reports formula drift:

1. Read the diff from `scripts/sync_formula.py check-drift`.
2. Apply the intended behavior change to the publisher template.
3. Re-render or rerun the publisher release sync.
4. Do not patch only `Formula/<formula>.rb`; CI should keep failing until the
   publisher template is the source of truth.

## References

- `docs/formula-sync.md`
- `formula-sync.json`
- `scripts/sync_formula.py`
- `.github/workflows/sync-formula.yml`
