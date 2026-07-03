#!/usr/bin/env python
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path


PLACEHOLDERS = {
    "{{URL}}",
    "{{SHA256}}",
    "{{TAG}}",
    "{{VERSION}}",
    "{{FORMULA}}",
    "{{REPOSITORY}}",
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Render and check synced Homebrew formula templates.")
    parser.add_argument("--manifest", default="formula-sync.json", help="Path to formula sync manifest")
    subparsers = parser.add_subparsers(dest="command", required=True)

    render = subparsers.add_parser("render", help="Render one publisher template into the tap")
    render.add_argument("--formula", required=True)
    render.add_argument("--publisher-dir", required=True)
    render.add_argument("--tap-dir", default=".")
    render.add_argument("--tag", required=True)
    render.add_argument("--repository", default="")
    render.add_argument("--template-path", default="")
    render.add_argument("--url", default="")
    render.add_argument("--sha256", default="")
    render.add_argument("--check", action="store_true", help="Fail if rendered output differs; do not write")

    drift = subparsers.add_parser("check-drift", help="Fail if tap formulae differ from publisher templates")
    drift.add_argument("--tap-dir", default=".")
    drift.add_argument("--formula", action="append", default=[])
    drift.add_argument("--publisher-dir", action="append", default=[], help="Local publisher checkout as formula=path")
    drift.add_argument("--clone-publishers", action="store_true")
    drift.add_argument("--publishers-root", default="")

    args = parser.parse_args()
    manifest = load_manifest(Path(args.manifest))

    if args.command == "render":
        render_command(args, manifest)
    elif args.command == "check-drift":
        check_drift_command(args, manifest)
    else:
        raise SystemExit(f"unknown command: {args.command}")

    return 0


def load_manifest(path: Path) -> dict[str, dict[str, str]]:
    data = json.loads(path.read_text())
    formulae = data.get("formulae")
    if not isinstance(formulae, dict) or not formulae:
        raise SystemExit(f"{path} must contain a non-empty formulae object")

    normalized: dict[str, dict[str, str]] = {}
    for formula, meta in formulae.items():
        validate_formula_name(formula)
        if not isinstance(meta, dict):
            raise SystemExit(f"formula {formula} metadata must be an object")
        repository = require_string(meta, "repository", formula)
        template_path = require_string(meta, "template_path", formula)
        template_ref = str(meta.get("template_ref") or "main")
        normalized[formula] = {
            "repository": repository,
            "template_path": template_path,
            "template_ref": template_ref,
        }
    return normalized


def require_string(meta: dict[str, object], key: str, formula: str) -> str:
    value = meta.get(key)
    if not isinstance(value, str) or not value.strip():
        raise SystemExit(f"formula {formula} must set {key}")
    return value


def validate_formula_name(formula: str) -> None:
    allowed = set("abcdefghijklmnopqrstuvwxyz0123456789-")
    if not formula or any(char not in allowed for char in formula):
        raise SystemExit(f"invalid formula name: {formula}")


def render_command(args: argparse.Namespace, manifest: dict[str, dict[str, str]]) -> None:
    formula = args.formula
    validate_formula_name(formula)
    meta = manifest_entry(manifest, formula)
    repository = args.repository or meta["repository"]
    template_path = args.template_path or meta["template_path"]
    url = args.url or f"https://github.com/{repository}/archive/refs/tags/{args.tag}.tar.gz"
    sha256 = args.sha256 or sha256_url(url)

    publisher_dir = Path(args.publisher_dir)
    tap_dir = Path(args.tap_dir)
    rendered = render_formula(
        template_path=publisher_dir / template_path,
        url=url,
        sha256=sha256,
        tag=args.tag,
        formula=formula,
        repository=repository,
    )
    target = formula_file(tap_dir, formula)

    if args.check:
        assert_matches(target, rendered, formula)
        return

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(rendered)
    print(f"Rendered {formula} from {repository}:{template_path}")


def manifest_entry(manifest: dict[str, dict[str, str]], formula: str) -> dict[str, str]:
    try:
        return manifest[formula]
    except KeyError as error:
        raise SystemExit(f"formula {formula} is not present in formula-sync.json") from error


def sha256_url(url: str) -> str:
    digest = hashlib.sha256()
    request = urllib.request.Request(url, headers={"User-Agent": "homebrew-formula-sync"})
    with urllib.request.urlopen(request) as response:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def render_formula(
    *,
    template_path: Path,
    url: str,
    sha256: str,
    tag: str,
    formula: str,
    repository: str,
) -> str:
    if not template_path.exists():
        raise SystemExit(f"formula template does not exist: {template_path}")

    template = template_path.read_text()
    if template.count("{{URL}}") != 1:
        raise SystemExit(f"{template_path} must contain exactly one {{URL}} placeholder")
    if template.count("{{SHA256}}") != 1:
        raise SystemExit(f"{template_path} must contain exactly one {{SHA256}} placeholder")

    rendered = template
    replacements = {
        "{{URL}}": url,
        "{{SHA256}}": sha256,
        "{{TAG}}": tag,
        "{{VERSION}}": tag.removeprefix("v"),
        "{{FORMULA}}": formula,
        "{{REPOSITORY}}": repository,
    }
    for placeholder, value in replacements.items():
        rendered = rendered.replace(placeholder, value)

    remaining = [placeholder for placeholder in PLACEHOLDERS if placeholder in rendered]
    if remaining:
        raise SystemExit(f"{template_path} still contains unreplaced placeholders: {', '.join(remaining)}")
    if "{{" in rendered or "}}" in rendered:
        raise SystemExit(f"{template_path} contains unknown placeholder syntax")
    if "< Formula" not in rendered:
        raise SystemExit(f"{template_path} does not look like a Homebrew formula")

    return rendered if rendered.endswith("\n") else f"{rendered}\n"


def formula_file(tap_dir: Path, formula: str) -> Path:
    validate_formula_name(formula)
    return tap_dir / "Formula" / f"{formula}.rb"


def check_drift_command(args: argparse.Namespace, manifest: dict[str, dict[str, str]]) -> None:
    tap_dir = Path(args.tap_dir)
    formulae = args.formula or sorted(manifest)
    failures: list[str] = []
    publisher_dirs = parse_publisher_dirs(args.publisher_dir)

    with tempfile.TemporaryDirectory(prefix="formula-sync-") as temp_dir:
        temp_root = Path(temp_dir)
        for formula in formulae:
            validate_formula_name(formula)
            meta = manifest_entry(manifest, formula)
            current_path = formula_file(tap_dir, formula)
            current = current_path.read_text()
            url = extract_formula_value(current, "url", current_path)
            sha256 = extract_formula_value(current, "sha256", current_path)
            tag = tag_from_url(url)
            publisher_dir = resolve_publisher_dir(args, temp_root, formula, meta, publisher_dirs)
            rendered = render_formula(
                template_path=publisher_dir / meta["template_path"],
                url=url,
                sha256=sha256,
                tag=tag,
                formula=formula,
                repository=meta["repository"],
            )
            try:
                assert_matches(current_path, rendered, formula)
            except SystemExit as error:
                failures.append(str(error))

    if failures:
        for failure in failures:
            print(failure, file=sys.stderr)
        raise SystemExit("formula drift detected; update the publisher template or sync the formula from it")

    print(f"Formula drift check passed for {len(formulae)} formulae")


def parse_publisher_dirs(values: list[str]) -> dict[str, Path]:
    paths: dict[str, Path] = {}
    for value in values:
        if "=" not in value:
            raise SystemExit(f"--publisher-dir must be formula=path, got: {value}")
        formula, path = value.split("=", 1)
        validate_formula_name(formula)
        publisher_path = Path(path)
        if not publisher_path.exists():
            raise SystemExit(f"publisher dir for {formula} does not exist: {publisher_path}")
        paths[formula] = publisher_path
    return paths


def extract_formula_value(contents: str, key: str, path: Path) -> str:
    prefix = f'{key} "'
    for line in contents.splitlines():
        stripped = line.strip()
        if stripped.startswith(prefix) and stripped.endswith('"'):
            return stripped[len(prefix) : -1]
    raise SystemExit(f"{path} does not contain a simple {key} value")


def tag_from_url(url: str) -> str:
    if "/refs/tags/" in url:
        tag = url.split("/refs/tags/", 1)[1]
    elif "/archive/" in url:
        tag = url.split("/archive/", 1)[1]
    else:
        raise SystemExit(f"cannot infer tag from formula URL: {url}")
    return tag.removesuffix(".tar.gz").removesuffix(".zip")


def resolve_publisher_dir(
    args: argparse.Namespace,
    temp_root: Path,
    formula: str,
    meta: dict[str, str],
    publisher_dirs: dict[str, Path],
) -> Path:
    if formula in publisher_dirs:
        return publisher_dirs[formula]

    if args.publishers_root:
        candidate = Path(args.publishers_root) / formula
        if candidate.exists():
            return candidate

    if not args.clone_publishers:
        raise SystemExit(f"publisher checkout for {formula} was not found; pass --clone-publishers")

    destination = temp_root / formula
    clone_publisher(meta["repository"], meta["template_ref"], destination)
    return destination


def clone_publisher(repository: str, ref: str, destination: Path) -> None:
    token = os.environ.get("FORMULA_SYNC_TOKEN", "")
    url = f"https://github.com/{repository}.git"
    if token:
        url = f"https://x-access-token:{token}@github.com/{repository}.git"

    command = ["git", "clone", "--depth", "1", "--branch", ref, url, str(destination)]
    try:
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    except subprocess.CalledProcessError as error:
        message = error.stderr.replace(token, "***") if token else error.stderr
        raise SystemExit(f"failed to clone {repository}@{ref}: {message.strip()}") from error


def assert_matches(path: Path, rendered: str, formula: str) -> None:
    existing = path.read_text()
    if existing == rendered:
        return

    diff = "".join(
        difflib.unified_diff(
            existing.splitlines(keepends=True),
            rendered.splitlines(keepends=True),
            fromfile=str(path),
            tofile=f"publisher-template/{formula}.rb",
        )
    )
    raise SystemExit(f"{formula} formula has drifted from its publisher template:\n{diff}")


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
