/* build.js — copies the canonical app files (the same ones GitHub Pages
   serves) into www/, the clean bundle folder Capacitor wraps into the
   native iOS/Android apps. Run this any time you change cornerman.html,
   css/, or js/, before running `npx cap sync`.

   No npm packages required — just Node's built-in fs module. */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const WWW = path.join(ROOT, "www");

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Start clean so deleted/renamed files don't linger in www/.
fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

// cornerman.html becomes index.html inside www/ — Capacitor's native
// shell always loads index.html, but the GitHub Pages copy stays as
// cornerman.html so existing links/bookmarks/manifest keep working.
fs.copyFileSync(path.join(ROOT, "cornerman.html"), path.join(WWW, "index.html"));

copyRecursive(path.join(ROOT, "css"), path.join(WWW, "css"));
copyRecursive(path.join(ROOT, "js"), path.join(WWW, "js"));
fs.copyFileSync(path.join(ROOT, "manifest.json"), path.join(WWW, "manifest.json"));
fs.copyFileSync(path.join(ROOT, "sw.js"), path.join(WWW, "sw.js"));
fs.copyFileSync(path.join(ROOT, "icon-192.png"), path.join(WWW, "icon-192.png"));
fs.copyFileSync(path.join(ROOT, "icon-512.png"), path.join(WWW, "icon-512.png"));
fs.copyFileSync(path.join(ROOT, "apple-touch-icon.png"), path.join(WWW, "apple-touch-icon.png"));

console.log("Built www/ from cornerman.html, css/, js/, manifest.json, sw.js, and icons.");
