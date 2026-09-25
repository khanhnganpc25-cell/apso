const fs = require("fs");
const path = require("path");
const vm = require("vm");

const bundlePath = path.join(
  __dirname,
  "_next",
  "static",
  "chunks",
  "app",
  "page-ef1198d6a6018514.js"
);

const code = fs.readFileSync(bundlePath, "utf8");
console.log("Checking syntax of bundle (" + code.length + " bytes)...");

try {
  new vm.Script(code);
  console.log("[PASS] JavaScript syntax is 100% valid!");
} catch (err) {
  console.error("[FAIL] Syntax error:", err.message);
  process.exit(1);
}
