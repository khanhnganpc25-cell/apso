const fs = require("fs");
const path = require("path");

const root = __dirname;
const output = path.join(root, "hosting-public");

if (path.dirname(output) !== root || path.basename(output) !== "hosting-public") {
  throw new Error(`Unsafe hosting output path: ${output}`);
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const directory of ["_next", "icons", "vendor", "download"]) {
  const dirPath = path.join(root, directory);
  if (fs.existsSync(dirPath)) {
    fs.cpSync(dirPath, path.join(output, directory), { recursive: true });
  }
}

for (const file of ["cong-dan-so-logo.svg", "favicon.ico", "manifest.webmanifest"]) {
  const filePath = path.join(root, file);
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, path.join(output, file));
  }
}

fs.copyFileSync(path.join(root, "site-snapshot.html"), path.join(output, "index.html"));

const assetLinksSource = path.join(root, "android-app", "assetlinks.json");
if (fs.existsSync(assetLinksSource)) {
  const wellKnown = path.join(output, ".well-known");
  fs.mkdirSync(wellKnown, { recursive: true });
  fs.copyFileSync(assetLinksSource, path.join(wellKnown, "assetlinks.json"));
}

console.log(`Prepared Firebase Hosting assets in ${output}`);
