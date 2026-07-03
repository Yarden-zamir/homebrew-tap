# Formula Sync Architecture

Formula behavior is owned by each publisher repository. The tap owns rendering,
validation, pull request creation, README generation, and automerge.

## Source Of Truth

Each publisher repo stores its Homebrew formula template at:

```text
.homebrew/<formula>.rb
```

The template owns all stable formula behavior:

- `desc`
- `homepage`
- `license`
- `head`
- dependencies
- `install`
- `caveats`
- `test`

Release-specific fields must use placeholders:

```ruby
url "{{URL}}"
sha256 "{{SHA256}}"
```

Optional placeholders are available when needed:

- `{{TAG}}`
- `{{VERSION}}`
- `{{FORMULA}}`
- `{{REPOSITORY}}`

## Tap Manifest

The tap maps formula names to publisher repositories in `formula-sync.json`.

```json
{
  "formulae": {
    "navgator": {
      "repository": "Yarden-zamir/navgator",
      "template_path": ".homebrew/navgator.rb",
      "template_ref": "main"
    }
  }
}
```

`template_ref` is the branch used by drift checks. Release sync checks out the
publisher repo at the release tag so formula changes are tied to the released
source.

## Release Sync

Publisher repos call the reusable workflow after creating a release:

```yaml
homebrew:
  needs: release
  uses: Yarden-zamir/homebrew-tap/.github/workflows/sync-formula.yml@main
  with:
    formula: navgator
    tag: ${{ needs.release.outputs.tag }}
    repository: Yarden-zamir/navgator
  secrets:
    token: ${{ secrets.TOKEN }}
```

The reusable workflow:

1. Checks out the publisher repo at the release tag.
2. Checks out `Yarden-zamir/homebrew-tap`.
3. Renders `.homebrew/<formula>.rb` into `Formula/<formula>.rb`.
4. Calculates the release tarball SHA256.
5. Regenerates `README.md`.
6. Runs formula drift validation and `brew style`.
7. Pushes a tap branch and opens a pull request with `/auto-merge`.

## Drift Enforcement

Tap CI runs `scripts/sync_formula.py check-drift` before Homebrew test-bot.
If a tap formula differs from the publisher template, CI fails and no later tap
validation should be trusted until the drift is fixed.

To fix drift, change the publisher template first, then rerun the publisher
release workflow or sync the formula from that template.

Manual formula edits in the tap are only acceptable for emergency recovery. The
follow-up fix must move the same behavior back into the publisher template.

## Adding A Formula

1. Add `.homebrew/<formula>.rb` to the publisher repo.
2. Use `{{URL}}` and `{{SHA256}}` placeholders.
3. Add the formula to `formula-sync.json` in this tap.
4. Add a publisher release job that calls `sync-formula.yml`.
5. Run the sync locally or through GitHub Actions.
6. Let tap CI validate and automerge the generated PR.

## Local Validation

Render one formula from a local publisher checkout:

```sh
uv run --no-project scripts/sync_formula.py \
  --manifest formula-sync.json \
  render \
  --formula navgator \
  --publisher-dir ../navgator/main \
  --tap-dir . \
  --tag v0.1.1 \
  --repository Yarden-zamir/navgator \
  --sha256 existing-or-test-sha
```

Check the tap against publisher templates:

```sh
uv run --no-project scripts/sync_formula.py \
  --manifest formula-sync.json \
  check-drift \
  --tap-dir . \
  --clone-publishers
```
