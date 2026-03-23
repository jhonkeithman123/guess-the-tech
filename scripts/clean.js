#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const targets = [
  ".next",
  "node_modules",
  "dist",
  "public/audio",
  ".turbo",
  ".cache",
];

function removeTarget(p) {
  const full = path.resolve(process.cwd(), p);
  try {
    if (fs.existsSync(full)) {
      fs.rmSync(full, { recursive: true, force: true });
      console.log("Removed", p);
    } else {
      // silent when not present
    }
  } catch (err) {
    console.error("Failed to remove", p, err.message);
  }
}

for (const t of targets) removeTarget(t);

console.log("Clean complete.");
