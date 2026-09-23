"""Derive the delivery tiers and formats from each product master.

`<id>-high.jpg` is the master. For each of the three delivery tiers this script
writes three formats:

    avif  - best compression, and the browser picks it first
    webp  - the fallback for browsers without AVIF
    jpg   - the universal fallback

`<picture>` in the app lets the browser choose, so no JavaScript decides the
format and nothing downloads twice. `manifest.json` records the measured byte
size of every file - those numbers are what the dashboard's "image data saved"
metric compares against, so they must never be estimates.

Quality mapping: JPEG keeps its historical 85/62/38. WebP reaches roughly the
same visual quality about 5 points lower, and AVIF about 25 points lower, so the
formats are compared at equivalent quality rather than at equal quality numbers.

Replacing a master: drop a new 4:3 photograph in as `<id>-high.jpg` (any size),
then run this script. It normalises the master to 1280x960, derives the tiers and
formats, and rewrites the manifest. Running it twice is a no-op.
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "assets", "products")

MASTER_W, MASTER_H = 1280, 960       # 4:3

# (tier, scale, jpeg quality, webp quality, avif quality)
TIERS = [
    ("high", 1.0, 85, 80, 60),
    ("mid", 0.5, 62, 58, 42),
    ("low", 0.25, 38, 34, 26),
]
FORMATS = ["avif", "webp", "jpg"]
ENCODER = {"jpg": "JPEG", "webp": "WEBP", "avif": "AVIF"}


def to_43(im, w, h):
    """Centre-crop to the target aspect, then resize."""
    target = w / h
    W, H = im.size
    if W / H > target:
        nw = int(round(H * target))
        im = im.crop(((W - nw) // 2, 0, (W - nw) // 2 + nw, H))
    elif W / H < target:
        nh = int(round(W / target))
        im = im.crop((0, (H - nh) // 2, W, (H - nh) // 2 + nh))
    return im.resize((w, h), Image.LANCZOS)


def encode(img, path, fmt, quality):
    kwargs = {"quality": quality}
    if fmt == "jpg":
        kwargs["optimize"] = True
    elif fmt == "webp":
        kwargs["method"] = 6
    elif fmt == "avif":
        kwargs["speed"] = 4
    img.save(path, ENCODER[fmt], **kwargs)
    return os.path.getsize(path)


def build(pid):
    high_path = os.path.join(OUT, "%s-high.jpg" % pid)
    master = Image.open(high_path).convert("RGB")
    sizes = {fmt: {} for fmt in FORMATS}

    for tier, scale, qj, qw, qa in TIERS:
        w, h = int(MASTER_W * scale), int(MASTER_H * scale)
        frame = master if master.size == (w, h) else to_43(master, w, h)
        for fmt, quality in zip(FORMATS, (qa, qw, qj)):
            path = os.path.join(OUT, "%s-%s.%s" % (pid, tier, fmt))
            # Never re-encode the master JPEG: it is the source of truth.
            if fmt == "jpg" and tier == "high" and master.size == (w, h) and os.path.exists(path):
                sizes[fmt][tier] = os.path.getsize(path)
                continue
            sizes[fmt][tier] = encode(frame, path, fmt, quality)
    return sizes


def main():
    ids = sorted(
        f[: -len("-high.jpg")]
        for f in os.listdir(OUT)
        if f.endswith("-high.jpg")
    )
    if not ids:
        print("no masters found in %s" % OUT)
        return 1

    manifest_path = os.path.join(OUT, "manifest.json")
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}

    probe = os.path.join(OUT, "probe.png")
    if os.path.exists(probe):
        manifest["probeBytes"] = os.path.getsize(probe)

    manifest["formats"] = FORMATS
    manifest["products"] = {pid: build(pid) for pid in ids}
    json.dump(manifest, open(manifest_path, "w"), indent=1, sort_keys=True)

    for pid in ids:
        s = manifest["products"][pid]
        print(
            "%-16s high jpg %6d  webp %6d  avif %6d"
            % (pid, s["jpg"]["high"], s["webp"]["high"], s["avif"]["high"])
        )
    print("manifest written for %d products x %d tiers x %d formats" % (len(ids), len(TIERS), len(FORMATS)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
