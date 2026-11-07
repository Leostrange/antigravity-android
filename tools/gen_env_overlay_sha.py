#!/usr/bin/env python3
"""gen_env_overlay_sha.py — recompute overlaySha256 for app/assets/env/manifest.json.

The Java EnvInstaller treats manifest.overlaySha256 as a VERSION TOKEN:
if it differs from `overlay_sha256` in $PREFIX/.installed, the whole
assets/env/overlay tree is re-copied into $PREFIX (merge, no wipe) and the
marker is refreshed. The value is never recomputed from content on device,
so ANY stable unique value works — this tool derives one from the actual
tree so the hash stays meaningful and reproducible:

    overlaySha256 = sha256( concat( "<sha256> <relpath>\n" ) for every file
                      under app/assets/env/overlay, sorted by relpath )

Usage:
    python3 tools/gen_env_overlay_sha.py           # print new hash
    python3 tools/gen_env_overlay_sha.py --write   # update manifest.json
"""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OVERLAY = ROOT / "app/assets/env/overlay"
MANIFEST = ROOT / "app/assets/env/manifest.json"


def overlay_sha256() -> str:
    h = hashlib.sha256()
    files = sorted(p for p in OVERLAY.rglob("*") if p.is_file())
    for p in files:
        digest = hashlib.sha256(p.read_bytes()).hexdigest()
        rel = p.relative_to(OVERLAY).as_posix()
        h.update(f"{digest} {rel}\n".encode())
    return h.hexdigest()


def main() -> int:
    new = overlay_sha256()
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    old = data.get("overlaySha256", "")
    if "--write" in sys.argv:
        if old == new:
            print(f"manifest unchanged: {new}")
        else:
            data["overlaySha256"] = new
            MANIFEST.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            print(f"manifest.json: overlaySha256 {old[:12]}... -> {new}")
    else:
        print(new)
        if old != new:
            print(f"(manifest currently has {old} — run with --write to update)",
                  file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
