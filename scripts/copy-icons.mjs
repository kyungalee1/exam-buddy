import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = path.join(root, "assets");

const files = [
  ["icon-180.png", "icon-180.png"],
  ["icon-192.png", "icon-192.png"],
  ["icon-512.png", "icon-512.png"],
  ["icon.svg", "icon.svg"],
];

for (const [from, to] of files) {
  const src = path.join(assetsDir, from);
  const dest = path.join(root, to);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`[icons] ${to}`);
  } else {
    console.warn(`[icons] missing: ${src}`);
  }
}
