const path = require("node:path");
const fs = require("node:fs");
const QRCode = require("./.tools/qrcode/node_modules/qrcode");
const { PNG } = require("./.tools/qrcode/node_modules/pngjs");
const jsQR = require("./.tools/qrcode/node_modules/jsqr");

const downloadUrl = process.argv[2];
const outputPath = process.argv[3];

if (!downloadUrl || !outputPath) {
  throw new Error("Usage: node generate-download-qr.js <url> <output.png>");
}

async function main() {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await QRCode.toFile(outputPath, downloadUrl, {
    errorCorrectionLevel: "H",
    type: "png",
    width: 1600,
    margin: 5,
    color: { dark: "#000000", light: "#FFFFFF" },
  });

  const png = PNG.sync.read(fs.readFileSync(outputPath));
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height, {
    inversionAttempts: "dontInvert",
  });

  if (!decoded || decoded.data !== downloadUrl) {
    throw new Error(`QR verification failed. Decoded: ${decoded?.data || "none"}`);
  }

  console.log(JSON.stringify({ outputPath, width: png.width, height: png.height, decoded: decoded.data }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
