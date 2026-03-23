const fs = require("fs");
const path = require("path");

// Copies audio assets from project-root /assets into /public/audio and
// writes a manifest.json at /public/audio/manifest.json usable by the client.

const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(ROOT, "assets");
const PUBLIC_AUDIO = path.join(ROOT, "public", "audio");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function walkDir(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(full, cb);
    else cb(full);
  }
}

function copyAssets() {
  if (!fs.existsSync(ASSETS)) {
    console.error("No assets directory found at", ASSETS);
    process.exit(1);
  }
  ensureDir(PUBLIC_AUDIO);
  const manifest = { music: [], sfx: {} };

  walkDir(ASSETS, (file) => {
    const ext = path.extname(file).toLowerCase();
    if (ext !== ".mp3" && ext !== ".wav" && ext !== ".ogg") return;
    // Determine relative path under assets
    const rel = path.relative(ASSETS, file);
    const dest = path.join(PUBLIC_AUDIO, rel);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(file, dest);
    const webPath = "/audio/" + rel.split(path.sep).join("/");
    // categorize: if top-level folder is 'music', push to music list
    const parts = rel.split(path.sep);
    const top = parts[0].toLowerCase();
    // treat common SFX categories as sfx
    const sfxCategories = [
      "correct",
      "wrong",
      "gameover",
      "death",
      "hit",
      "miss",
    ];
    if (
      top === "music" ||
      top === "bg_music" ||
      top === "background" ||
      top === "bg"
    ) {
      manifest.music.push(webPath);
    } else if (top === "sfx") {
      const category = parts[1] || "default";
      manifest.sfx[category] = manifest.sfx[category] || [];
      manifest.sfx[category].push(webPath);
    } else if (sfxCategories.includes(top)) {
      const category = top;
      manifest.sfx[category] = manifest.sfx[category] || [];
      manifest.sfx[category].push(webPath);
    } else if (top === "bg_music" || top === "bg") {
      manifest.music.push(webPath);
    } else {
      // unknown placement — treat top-level files as music
      manifest.music.push(webPath);
    }
  });

  // ensure deterministic order
  manifest.music.sort();
  for (const k of Object.keys(manifest.sfx)) manifest.sfx[k].sort();

  const manifestPath = path.join(PUBLIC_AUDIO, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(
    "Assets copied to public/audio and manifest written:",
    manifestPath,
  );
}

copyAssets();
