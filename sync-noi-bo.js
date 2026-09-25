const fs = require("fs");
const path = require("path");

const noiBoMaster = path.join(
  "D:\\Lập trình\\apso-vn-noi-bo",
  "_next",
  "static",
  "chunks",
  "app",
  "page-ef1198d6a6018514.js.unified-master"
);
const noiBoBundle = path.join(
  "D:\\Lập trình\\apso-vn-noi-bo",
  "_next",
  "static",
  "chunks",
  "app",
  "page-ef1198d6a6018514.js"
);
const noiBoHosting = path.join(
  "D:\\Lập trình\\apso-vn-noi-bo",
  "hosting-public",
  "_next",
  "static",
  "chunks",
  "app",
  "page-ef1198d6a6018514.js"
);

const currentMaster = path.join(
  __dirname,
  "_next",
  "static",
  "chunks",
  "app",
  "page-ef1198d6a6018514.js.unified-master"
);

if (fs.existsSync("D:\\Lập trình\\apso-vn-noi-bo")) {
  const code = fs.readFileSync(currentMaster, "utf8");
  [noiBoMaster, noiBoBundle, noiBoHosting].forEach(f => {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, code, "utf8");
    console.log("[SYNC] Synced to:", f);
  });
} else {
  console.log("No apso-vn-noi-bo folder found, skipping.");
}
