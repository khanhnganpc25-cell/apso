const fs = require("fs");

const bundle = "_next/static/chunks/app/page-ef1198d6a6018514.js";
const html = "site-snapshot.html";

let bundleSource = fs.readFileSync(bundle, "utf8");
const encodedBrand = "C\\xf4ng D\\xe2n Số";
const bundleCount = bundleSource.split(encodedBrand).length - 1;
if (bundleCount < 1) throw new Error("Không tìm thấy tên Công Dân Số trong bundle.");
bundleSource = bundleSource.split(encodedBrand).join("APSO");
fs.writeFileSync(bundle, bundleSource, "utf8");

let htmlSource = fs.readFileSync(html, "utf8");
const htmlCount = htmlSource.split("Công Dân Số").length - 1;
if (htmlCount < 1) throw new Error("Không tìm thấy tên Công Dân Số trong HTML.");
htmlSource = htmlSource.split("Công Dân Số").join("APSO");
fs.writeFileSync(html, htmlSource, "utf8");

console.log(`Đã đổi ${bundleCount + htmlCount} vị trí hiển thị sang APSO.`);
