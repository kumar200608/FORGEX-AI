"""Fetch real CC-licensed product photos (Openverse API) + build small/large JPEGs.

Offline-safe provenance: src/data/credits.json records title/creator/license per image.
Usage: python scripts/fetch-images.py
Exit non-zero if any product ends with zero usable results (see failure policy).
Stdlib urllib + PIL only.
"""
import json
import os
import time
import urllib.parse
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SMALL_DIR = os.path.join(ROOT, "public", "images", "small")
LARGE_DIR = os.path.join(ROOT, "public", "images", "large")
CREDITS_PATH = os.path.join(ROOT, "src", "data", "credits.json")

API = "https://api.openverse.org/v1/images/"
LICENSES = "by,by-sa,cc0,pdm"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AdaptiveWebDelivery/1.0"}

PRODUCTS = [
    ("p9", "wireless earbuds", "earphones charging case"),
    ("p10", "bluetooth speaker", "portable speaker"),
    ("p11", "wired headphones", "headphones"),
    ("p12", "soundbar", "home theater speaker"),
    ("p13", "neckband earphones", "bluetooth earphones"),
    ("p14", "vintage radio", "retro radio"),
    ("p15", "earbuds charging case", "wireless earbuds white"),
    ("p16", "fitness tracker band", "smart band"),
    ("p17", "smartwatch", "digital watch wrist"),
    ("p18", "sports watch gps", "outdoor watch"),
    ("p19", "sports earbuds running", "earphones sport"),
    ("p20", "kids watch product", "colorful smartwatch"),
    ("p21", "smart ring wearable", "ring macro product"),
    ("p22", "mechanical keyboard", "computer keyboard closeup"),
    ("p23", "ergonomic mouse", "computer mouse desk"),
    ("p24", "phone charger usb", "usb charger plug"),
    ("p25", "computer monitor desk setup", "monitor stand desk"),
    ("p26", "numeric keypad", "keyboard number pad"),
    ("p27", "desk mat workspace", "mousepad desk setup"),
    ("p28", "power bank", "phone charging cable"),
    ("p29", "laptop desk table", "laptop bed tray table"),
    ("p30", "retro typewriter keyboard", "vintage typewriter"),
    ("p31", "star projector night light", "galaxy night light"),
    ("p32", "led strip lights home", "wardrobe led light"),
    ("p33", "electric kettle", "kettle kitchen"),
    ("p34", "food storage containers", "kitchen containers pantry"),
    ("p35", "aroma diffuser", "essential oil diffuser"),
    ("p36", "handheld vacuum cleaner", "vacuum cleaner home"),
]


def api_search(query, page=1, tries=4):
    params = urllib.parse.urlencode(
        {"q": query, "license": LICENSES, "mature": "false",
         "page_size": 20, "page": page}
    )
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(API + "?" + params, headers=UA)
            with urllib.request.urlopen(req, timeout=45) as r:
                if r.status != 200:
                    raise RuntimeError("API status %s" % r.status)
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            last = e
            print("API retry %d q=%r page=%d: %s" % (attempt + 1, query, page, e))
            time.sleep(5 * (attempt + 1))
    raise RuntimeError("API failed after %d tries: %s" % (tries, last))


def download(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        if r.status != 200:
            raise RuntimeError("download status %s" % r.status)
        return r.read()


def process_and_save(data, pid):
    tmp = os.path.join(SMALL_DIR, pid + ".orig")
    with open(tmp, "wb") as f:
        f.write(data)
    try:
        with Image.open(tmp) as im:
            im.load()
            img = im.convert("RGB")
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    square = img.crop((left, top, left + side, top + side))
    large = square.resize((1000, 1000), Image.LANCZOS)
    large.save(os.path.join(LARGE_DIR, pid + ".jpg"), "JPEG", quality=82)
    small = square.resize((400, 400), Image.LANCZOS)
    small.save(os.path.join(SMALL_DIR, pid + ".jpg"), "JPEG", quality=60)
    return True


def main():
    os.makedirs(SMALL_DIR, exist_ok=True)
    os.makedirs(LARGE_DIR, exist_ok=True)
    credits = {}
    if os.path.exists(CREDITS_PATH):
        with open(CREDITS_PATH, encoding="utf-8") as f:
            credits = json.load(f)
    used_urls = set()
    for pid, info in credits.items():
        u = info.get("sourceUrl")
        if u:
            used_urls.add(u)
    failures = []
    for pid, primary, fallback in PRODUCTS:
        if os.path.exists(os.path.join(SMALL_DIR, pid + ".jpg")) and os.path.exists(
            os.path.join(LARGE_DIR, pid + ".jpg")
        ):
            print("%s SKIP already done" % pid)
            continue
        got = None
        tried_queries = []
        for qi, query in enumerate([primary, fallback]):
            tried_queries.append(query)
            for page in (1, 2):
                try:
                    payload = api_search(query, page)
                except Exception as e:  # noqa: BLE001
                    print("%s q=%r page=%d API error: %s" % (pid, query, page, e))
                    break
                results = payload.get("results", []) or []
                print("%s q=%r page=%d results=%d" % (pid, query, page, len(results)))
                for item in results:
                    url = item.get("url", "") or ""
                    low = url.lower()
                    if not (low.endswith(".jpg") or low.endswith(".jpeg")):
                        continue
                    try:
                        width = int(item.get("width") or 0)
                    except (TypeError, ValueError):
                        width = 0
                    if width and width < 800:
                        continue
                    if url in used_urls:
                        continue
                    try:
                        data = download(url)
                        process_and_save(data, pid)
                    except Exception as e:  # noqa: BLE001
                        print("%s skip %s: %s" % (pid, url[:80], e))
                        continue
                    used_urls.add(url)
                    got = {
                        "title": item.get("title"),
                        "creator": item.get("creator"),
                        "license": item.get("license"),
                        "licenseUrl": item.get("license_url"),
                        "sourceUrl": url,
                        "pageUrl": item.get("foreign_landing_url"),
                        "query": query,
                    }
                    break
                if got:
                    break
                time.sleep(1.5)
            if got:
                break
        if got:
            credits[pid] = got
            print("%s OK via %r <- %s" % (pid, got["query"], got["sourceUrl"][:90]))
        else:
            failures.append(pid)
            print("%s FAILED queries=%r" % (pid, tried_queries))
        with open(CREDITS_PATH, "w", encoding="utf-8") as f:
            json.dump(credits, f, indent=2, ensure_ascii=False)
        time.sleep(1.5)
    print("done: %d ok, %d failed %s" % (len(PRODUCTS) - len(failures), len(failures), failures))
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
