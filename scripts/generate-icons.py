"""PWA icons + the tiny probe image used by the link-quality measurement."""
import math, os, json
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON_DIR = os.path.join(ROOT, "public", "icons")
ASSETS = os.path.join(ROOT, "public", "assets")
os.makedirs(ICON_DIR, exist_ok=True)
os.makedirs(ASSETS, exist_ok=True)

INK = (15, 23, 42)        # slate-900
MIST = (148, 163, 184)
EMERALD = (16, 185, 129)

def rounded_bg(size, radius_ratio=0.22, fill=INK):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(size * radius_ratio)
    d.rounded_rectangle([0, 0, size - 1, size - 1], r, fill=fill)
    return img, d

def draw_glyph(d, s):
    """Signal-adaptive glyph: three arcs + a dot, plus a delivery arrow."""
    cx, cy = s * 0.5, s * 0.60
    for i, frac in enumerate((0.22, 0.42, 0.62)):
        r = s * frac
        w = max(4, int(s * 0.055))
        alpha = EMERALD if i < 2 else MIST
        box = [cx - r, cy - r, cx + r, cy + r]
        d.arc(box, start=-125, end=-55, fill=alpha, width=w)
    dr = max(6, int(s * 0.075))
    d.ellipse([cx - dr, cy - dr, cx + dr, cy + dr], fill=EMERALD)
    # small arrow: "optimized payload"
    ax, ay, aw = s * 0.78, s * 0.26, max(3, int(s * 0.03))
    d.line([(ax - s * 0.10, ay + s * 0.10), (ax, ay)], fill=EMERALD, width=aw * 2)
    d.polygon([(ax + aw * 2.4, ay - aw * 2.6), (ax - aw * 0.4, ay - aw * 1.2), (ax - aw * 0.6, ay + aw * 1.6)], fill=EMERALD)

for size, maskable in ((192, False), (512, False), (512, True)):
    if maskable:
        img = Image.new("RGBA", (size, size), INK)
        d = ImageDraw.Draw(img)
        glyph = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw_glyph(ImageDraw.Draw(glyph), size * 0.78)
        off = int(size * 0.11)
        layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        layer.paste(glyph, (off, off), glyph)
        img = Image.alpha_composite(img, layer)
    else:
        img, d = rounded_bg(size)
        draw_glyph(d, size)
    img.save(os.path.join(ICON_DIR, f"icon-{'maskable-' if maskable else ''}{size}.png"))

# Probe image: incompressible noise so proxies/CDNs can't shrink it and the
# measured transfer reflects the real link.
p = 96
rng = 12345
img = Image.new("RGB", (p, p))
px = img.load()
for y in range(p):
    for x in range(p):
        rng = (rng * 1103515245 + 12345) % (2**31)
        v = rng & 0xFF
        px[x, y] = (v, (v * 7) % 256, (v * 13) % 256)
probe_path = os.path.join(ASSETS, "probe.png")
img.save(probe_path, "PNG", optimize=False)
probe_bytes = os.path.getsize(probe_path)

# Product variant manifest: authoritative file sizes for the "data saved" math.
prod_dir = os.path.join(ASSETS, "products")
sizes = {}
for f in sorted(os.listdir(prod_dir)):
    if f.endswith(".jpg"):
        slug, tier = f.rsplit("-", 1)
        sizes.setdefault(slug.replace(".jpg", ""), {})[tier.replace(".jpg", "")] = os.path.getsize(os.path.join(prod_dir, f))
manifest = {"probeBytes": probe_bytes, "products": sizes}
with open(os.path.join(prod_dir, "manifest.json"), "w") as fh:
    json.dump(manifest, fh, indent=1)
print("probe:", probe_bytes, "bytes")
print(json.dumps(sizes, indent=1)[:400])
print("icons + manifest done")
