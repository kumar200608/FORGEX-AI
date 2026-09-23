import { describe, it, expect } from "vitest";
import products from "./products.json";
import categories from "./categories.json";
import recommendations from "./recommendations.json";

interface Product {
  id: string;
  name: string;
  price: number;
  imageSmall: string;
  imageLarge: string;
  category: string;
}

interface Category {
  slug: string;
  label: string;
  count: number;
}

interface Recommendation {
  productId: string;
  relatedIds: string[];
}

const IMG_RE = /^\/images\/(small|large)\/p(\d{1,2})\.(jpg|png)$/;

const ORIGINAL_PRICES: Record<string, number> = {
  p1: 2999,
  p2: 4999,
  p3: 2499,
  p4: 3999,
  p5: 1499,
  p6: 1999,
  p7: 1799,
  p8: 1299,
};

const ORIGINAL_IMAGES: Record<string, { imageSmall: string; imageLarge: string }> = {
  p1: { imageSmall: "/images/small/p1.jpg", imageLarge: "/images/large/p1.jpg" },
  p2: { imageSmall: "/images/small/p2.jpg", imageLarge: "/images/large/p2.jpg" },
  p3: { imageSmall: "/images/small/p3.jpg", imageLarge: "/images/large/p3.jpg" },
  p4: { imageSmall: "/images/small/p4.jpg", imageLarge: "/images/large/p4.jpg" },
  p5: { imageSmall: "/images/small/p5.jpg", imageLarge: "/images/large/p5.jpg" },
  p6: { imageSmall: "/images/small/p6.jpg", imageLarge: "/images/large/p6.jpg" },
  p7: { imageSmall: "/images/small/p7.jpg", imageLarge: "/images/large/p7.jpg" },
  p8: { imageSmall: "/images/small/p8.jpg", imageLarge: "/images/large/p8.jpg" },
};

describe("catalog integrity", () => {
  const list = products as Product[];
  const cats = categories as Category[];
  const recs = recommendations as Recommendation[];

  it("ids are unique", () => {
    const ids = list.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("p1–p8 present with ORIGINAL prices and ORIGINAL image paths", () => {
    for (const id of Object.keys(ORIGINAL_PRICES)) {
      const found = list.find((p) => p.id === id);
      expect(found, `product ${id} exists`).toBeDefined();
      expect(found!.price).toBe(ORIGINAL_PRICES[id]);
      expect(found!.imageSmall).toBe(ORIGINAL_IMAGES[id].imageSmall);
      expect(found!.imageLarge).toBe(ORIGINAL_IMAGES[id].imageLarge);
    }
  });

  it("every product image matches the image-set contract", () => {
    for (const p of list) {
      expect(p.imageSmall, `${p.id} imageSmall`).toMatch(IMG_RE);
      expect(p.imageLarge, `${p.id} imageLarge`).toMatch(IMG_RE);
    }
  });

  it("p1–p8 images stay .jpg", () => {
    for (const id of Object.keys(ORIGINAL_IMAGES)) {
      const found = list.find((p) => p.id === id);
      expect(found, `product ${id} exists`).toBeDefined();
      expect(found!.imageSmall.endsWith(".jpg"), `${id} imageSmall stays .jpg`).toBe(true);
      expect(found!.imageLarge.endsWith(".jpg"), `${id} imageLarge stays .jpg`).toBe(true);
    }
  });

  it("p9–p36 use .jpg with matching N in small+large", () => {
    for (let n = 9; n <= 36; n++) {
      const id = `p${n}`;
      const found = list.find((p) => p.id === id);
      expect(found, `product ${id} exists`).toBeDefined();
      expect(found!.imageSmall, `${id} imageSmall`).toBe(`/images/small/${id}.jpg`);
      expect(found!.imageLarge, `${id} imageLarge`).toBe(`/images/large/${id}.jpg`);
    }
  });

  it("imageSmall unique across all products", () => {
    const smalls = list.map((p) => p.imageSmall);
    expect(new Set(smalls).size).toBe(smalls.length);
  });

  it("imageLarge unique across all products", () => {
    const larges = list.map((p) => p.imageLarge);
    expect(new Set(larges).size).toBe(larges.length);
  });

  it("names unique across all products", () => {
    const names = list.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("total count is 30–50", () => {
    expect(list.length).toBeGreaterThanOrEqual(30);
    expect(list.length).toBeLessThanOrEqual(50);
  });

  it("recommendations.json refs all resolve to product ids", () => {
    const ids = new Set(list.map((p) => p.id));
    for (const r of recs) {
      expect(ids.has(r.productId), `productId ${r.productId} resolves`).toBe(true);
      for (const rel of r.relatedIds) {
        expect(ids.has(rel), `relatedId ${rel} (of ${r.productId}) resolves`).toBe(true);
      }
    }
  });

  it("categories.json counts match catalog", () => {
    const all = cats.find((c) => c.slug === "all");
    expect(all).toBeDefined();
    expect(all!.count).toBe(list.length);
    for (const c of cats) {
      if (c.slug === "all") continue;
      const n = list.filter(
        (p) => p.category.toLowerCase() === c.slug || p.category === c.label
      ).length;
      expect(n, `category ${c.slug} count`).toBe(c.count);
    }
  });
});
