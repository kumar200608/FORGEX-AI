// Generates placeholder assets with zero dependencies and no network access.
// - public/images/small/<id>.jpg + public/images/large/<id>.jpg: valid minimal
//   1x1 JPEGs (square aspect so CLS-safe when swapping variants).
// - public/probe/probe-50kb.bin: exactly 50*1024 random bytes.
import { mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Tiny 1x1 baseline JPEG (SOI ... EOI). Square aspect ratio.
const JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAT//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAn//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AX//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AX//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/An//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/An//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/An//9k=";
const jpegBytes = Buffer.from(JPEG_BASE64, "base64");

const ids = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];

for (const id of ids) {
  for (const size of ["small", "large"]) {
    const out = join(root, "public", "images", size, `${id}.jpg`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, jpegBytes);
  }
}

const probePath = join(root, "public", "probe", "probe-50kb.bin");
mkdirSync(dirname(probePath), { recursive: true });
writeFileSync(probePath, randomBytes(50 * 1024));

console.log(`Wrote ${ids.length * 2} image placeholders + probe file (${50 * 1024} bytes).`);
