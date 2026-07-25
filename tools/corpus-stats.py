#!/usr/bin/env python3
"""corpus-stats.py — count what's in a waldo-index checkout.

Walks the tree the way the format intends — starting at the root
index.json and following entries (dir -> <name>/index.json,
manifest -> <name>) — and aggregates manifests, shards, documents,
tokens, bytes, and effective per-shard licenses (a shard's own
license overrides its manifest's default).

Usage:
    python3 tools/corpus-stats.py ../waldo-index -o kl24bg/assets/stats.json

Stdlib only. The output JSON feeds the stats strip on the site's
front page; re-run it whenever the index grows.
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


def walk(dir_path: Path, stats: dict) -> None:
    index_file = dir_path / "index.json"
    index = json.loads(index_file.read_text())
    if index.get("kind") != "index":
        raise ValueError(f"{index_file}: kind is not 'index'")
    for entry in index.get("entries", []):
        name, etype = entry["name"], entry["type"]
        if etype == "dir":
            walk(dir_path / name, stats)
        elif etype == "manifest":
            count_manifest(dir_path / name, stats)
        else:
            print(f"warning: {index_file}: unknown entry type "
                  f"{etype!r} for {name!r}, skipping", file=sys.stderr)


def count_manifest(manifest_path: Path, stats: dict) -> None:
    manifest = json.loads(manifest_path.read_text())
    if manifest.get("kind") != "manifest":
        raise ValueError(f"{manifest_path}: kind is not 'manifest'")
    default_license = manifest.get("license")
    stats["manifests"] += 1
    for shard in manifest.get("shards", []):
        license_ = shard.get("license", default_license) or "unknown"
        per = stats["licenses"].setdefault(
            license_, {"shards": 0, "docs": 0, "tokens": 0, "bytes": 0})
        for key in ("docs", "tokens", "bytes"):
            value = int(shard.get(key, 0))
            stats[key] += value
            per[key] += value
        stats["shards"] += 1
        per["shards"] += 1


def git_commit(checkout: Path):
    try:
        out = subprocess.run(
            ["git", "-C", str(checkout), "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, check=True)
        return out.stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Aggregate corpus statistics from a waldo-index checkout.")
    parser.add_argument("index", type=Path,
                        help="path to the index checkout (its root index.json)")
    parser.add_argument("-o", "--output", type=Path,
                        help="write JSON here (default: stdout)")
    args = parser.parse_args()

    stats = {"manifests": 0, "shards": 0, "docs": 0, "tokens": 0,
             "bytes": 0, "licenses": {}}
    walk(args.index, stats)

    result = {
        "generated": datetime.now(timezone.utc)
                             .isoformat(timespec="seconds")
                             .replace("+00:00", "Z"),
        "index_commit": git_commit(args.index),
        **{k: stats[k] for k in ("manifests", "shards", "docs",
                                 "tokens", "bytes")},
        "licenses": dict(sorted(stats["licenses"].items())),
    }

    text = json.dumps(result, indent=2) + "\n"
    if args.output:
        args.output.write_text(text)
        print(f"wrote {args.output}: {stats['tokens']:,} tokens, "
              f"{stats['docs']:,} docs, {len(stats['licenses'])} licenses "
              f"across {stats['manifests']} manifest(s)")
    else:
        sys.stdout.write(text)


if __name__ == "__main__":
    main()
