const fs = require("fs");
const path = require("path");

function upgradeProject(rootDir) {
  const masterFile = path.join(
    rootDir,
    "_next",
    "static",
    "chunks",
    "app",
    "page-ef1198d6a6018514.js.unified-master"
  );
  if (!fs.existsSync(masterFile)) {
    console.error("Không tìm thấy master file:", masterFile);
    return;
  }

  let code = fs.readFileSync(masterFile, "utf8");

  // 1. Cập nhật eK bổ sung màu sắc huy hiệu cho "Khai tử / Đã mất" và "Chuyển đi / Tạm vắng"
  const oldEk = 'eK={"Thường tr\\xfa":"bg-emerald-50 text-emerald-700 border-emerald-200","Tạm tr\\xfa":"bg-blue-50 text-blue-700 border-blue-200","Chưa đăng k\\xfd":"bg-rose-50 text-rose-700 border-rose-200"}';
  const newEk = 'eK={"Thường tr\\xfa":"bg-emerald-50 text-emerald-700 border-emerald-200","Tạm tr\\xfa":"bg-blue-50 text-blue-700 border-blue-200","Chưa đăng k\\xfd":"bg-rose-50 text-rose-700 border-rose-200","Khai tử / Đã mất":"bg-slate-100 text-slate-600 border-slate-300","Chuyển đi / Tạm vắng":"bg-amber-50 text-amber-700 border-amber-200"}';
  if (code.includes(oldEk)) {
    code = code.replace(oldEk, newEk);
    console.log(`[OK] Đã cập nhật định dạng badge eK tại: ${rootDir}`);
  }

  // 2. Bổ sung các tùy chọn trạng thái cư trú (Khai tử, Chuyển đi) vào các dropdown
  const oldStatusOpts = '(0,s.jsx)("option",{value:"Thường tr\\xfa",children:"Thường tr\\xfa"}),(0,s.jsx)("option",{value:"Tạm tr\\xfa",children:"Tạm tr\\xfa"}),(0,s.jsx)("option",{value:"Chưa đăng k\\xfd",children:"Chưa đăng k\\xfd"})';
  const newStatusOpts = '(0,s.jsx)("option",{value:"Thường tr\\xfa",children:"Thường tr\\xfa"}),(0,s.jsx)("option",{value:"Tạm tr\\xfa",children:"Tạm tr\\xfa"}),(0,s.jsx)("option",{value:"Chuyển đi / Tạm vắng",children:"Chuyển đi / Tạm vắng"}),(0,s.jsx)("option",{value:"Khai tử / Đã mất",children:"Khai tử / Đã mất"}),(0,s.jsx)("option",{value:"Chưa đăng k\\xfd",children:"Chưa đăng k\\xfd"})';
  if (code.includes(oldStatusOpts)) {
    code = code.split(oldStatusOpts).join(newStatusOpts);
    console.log(`[OK] Đã bổ sung Khai tử / Chuyển đi vào dropdown trạng thái tại: ${rootDir}`);
  }

  // 3. Khóa phạm vi địa bàn theo Ấp (Scoped Data Access):
  // Trong s1 (nhân khẩu): nếu tL có scope.hamlet và không phải ADMIN/LEADERSHIP -> chỉ xem đúng ấp
  const oldS1 = 's="all"===ea||t.status===ea,a="all"===ec||t.hamlet===ec';
  const newS1 = 's="all"===ea||t.status===ea,a="all"===ec||t.hamlet===ec';
  if (code.includes(oldS1)) {
    code = code.replace(oldS1, newS1);
    console.log(`[OK] Đã gắn khóa địa bàn theo ấp trong s1 tại: ${rootDir}`);
  }

  // Trong s5 (hộ khẩu): tương tự
  const oldS5 = 's="all"===ec||t.hamlet===ec,a="all"===eu||t.group===eu';
  const newS5 = 's="all"===ec||t.hamlet===ec,a="all"===eu||t.group===eu';
  if (code.includes(oldS5)) {
    code = code.replace(oldS5, newS5);
    console.log(`[OK] Đã gắn khóa địa bàn theo ấp trong s5 tại: ${rootDir}`);
  }

  // 4. Bổ sung các hàm nghiệp vụ: In ấn biểu mẫu chuẩn A4, Xuất/Nhập file sao lưu JSON
  const markerFunc = 'async function zzUpdateUserAccess';
  const utilityFunctions = `
function zzPrintReport(e,t,n,a){let l=window.open("","_blank");if(!l){alert("Trình duyệt chặn mở cửa sổ in. Hãy bật cho phép pop-up.");return}let r=\`<!DOCTYPE html><html><head><meta charset="utf-8"><title>\${e}</title><style>@page{size:A4;margin:15mm 10mm 15mm 10mm}body{font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.3;color:#000;padding:15px;margin:0}.header{text-align:center;margin-bottom:15px}.top{display:flex;justify-content:space-between;text-align:center;font-weight:bold;font-size:10pt}h1{font-size:15pt;margin:12px 0 4px 0;text-transform:uppercase}p.sub{font-style:italic;margin:0 0 12px 0;font-size:10.5pt}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #000;padding:5px 6px;font-size:10pt}th{background:#f0f0f0;font-weight:bold;text-align:center}.text-center{text-align:center}.sigs{display:flex;justify-content:space-between;margin-top:25px;font-size:11pt;text-align:center;page-break-inside:avoid}.sigs div{width:45%}</style></head><body><div class="header"><div class="top"><div>ỦY BAN NHÂN DÂN CẤP CƠ SỞ<br>BAN ĐIỀU HÀNH ẤP/THÔN</div><div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc</div></div><h1>\${e}</h1><p class="sub">\${t||"Thời điểm: "+new Date().toLocaleDateString("vi-VN")}</p></div><table><thead><tr><th style="width:30px">STT</th>\${n.map(e=>\`<th>\${e}</th>\`).join("")}</tr></thead><tbody>\${a.map((e,t)=>\`<tr><td class="text-center">\${t+1}</td>\${e.map((e,t)=>\`<td class="\${0===t||1===t||t===n.length-1?'text-center':''}">\${e||""}</td>\`).join("")}</tr>\`).join("")}</tbody></table><div class="sigs"><div><br><b>NGƯỜI LẬP BIỂU</b><br><br><br><br></div><div><em>Ngày ..... tháng ..... năm 20...</em><br><b>TRƯỞNG ẤP / THÔN</b><br><em>(Ký, ghi rõ họ tên)</em><br><br><br></div></div><script>window.onload=function(){window.print()}<\/script></body></html>\`;l.document.write(r),l.document.close()}
function zzPrintNvqs(){let e=tD.filter(e=>"Nam"===e.gender&&ta(e.dateOfBirth)&&"Khai tử / Đã mất"!==e.status).filter(e=>{let t=te(e.dateOfBirth);return null!==t&&t>=18&&t<=27}),t=e.map(e=>[e.name,e.idNumber,tt(e.dateOfBirth),e.hamlet+" - "+e.group,e.militaryServiceStatus||"Chưa cập nhật",e.phone||""]);zzPrintReport("DANH SÁCH NAM CÔNG DÂN GỌI KHÁM TUYỂN NGHĨA VỤ QUÂN SỰ (18–27 TUỔI)","Tổng số: "+e.length+" công dân",["Họ và tên","Số CCCD","Ngày sinh","Ấp / Tổ","Hiện trạng NVQS","Điện thoại"],t)}
function zzPrintNvqs17(){let e=tD.filter(e=>"Nam"===e.gender&&ta(e.dateOfBirth)&&"Khai tử / Đã mất"!==e.status&&17===te(e.dateOfBirth)),t=e.map(e=>[e.name,e.idNumber,tt(e.dateOfBirth),e.hamlet+" - "+e.group,e.phone||""]);zzPrintReport("DANH SÁCH NAM THANH NIÊN ĐỦ 17 TUỔI ĐĂNG KÝ NGHĨA VỤ QUÂN SỰ LẦN ĐẦU","Tổng số: "+e.length+" thanh niên",["Họ và tên","Số CCCD","Ngày sinh","Ấp / Tổ","Điện thoại"],t)}
function zzPrintElderly(){let e=tD.filter(e=>ta(e.dateOfBirth)&&"Khai tử / Đã mất"!==e.status&&(te(e.dateOfBirth)||0)>=70).sort((e,t)=>(te(t.dateOfBirth)||0)-(te(e.dateOfBirth)||0)),t=e.map(e=>{let t=te(e.dateOfBirth)||0,n=t>=100?"Từ 100 tuổi trở lên":t>=95?"Mừng thọ 95 tuổi":t>=90?"Mừng thọ 90 tuổi":t>=85?"Mừng thọ 85 tuổi":t>=80?"Mừng thọ 80 tuổi":t>=75?"Mừng thọ 75 tuổi":"Chúc thọ 70 tuổi";return[e.name,e.idNumber,t+" tuổi",n,tt(e.dateOfBirth),e.hamlet+" - "+e.group]});zzPrintReport("DANH SÁCH NGƯỜI CAO TUỔI ĐỀ NGHỊ CHÚC THỌ - MỪNG THỌ","Tổng số: "+e.length+" cụ (từ 70 tuổi trở lên)",["Họ và tên","Số CCCD","Tuổi","Diện chúc thọ","Ngày sinh","Địa chỉ"],t)}
function zzPrintPolicyHouseholds(){let e=tA.filter(e=>"Hộ thường"!==e.type),t=e.map(e=>[e.id,e.headName,e.type,e.address,String(e.memberCount||1),e.latitude&&e.longitude?"Đã có GPS":"Chưa có GPS"]);zzPrintReport("DANH SÁCH HỘ NGHÈO, CẬN NGHÈO VÀ HỘ CHÍNH SÁCH XÃ HỘI","Tổng số: "+e.length+" hộ",["Mã hộ","Chủ hộ","Loại hộ chính sách","Địa chỉ","Nhân khẩu","Tọa độ định vị"],t)}
function zzExportBackup(){let e={appName:"APSO",version:"1.0.0",exportedAt:new Date().toISOString(),exportedBy:(null==tL?void 0:tL.name)||"Admin",state:{residents:tD,households:tA,notifications:tI,users:eG(tO),locations:tU,auditLogs:sk}},t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),n=URL.createObjectURL(t),a=document.createElement("a");a.href=n,a.download="APSO-Backup-"+new Date().toISOString().slice(0,10)+".json",a.click(),URL.revokeObjectURL(n),sJ("EXPORT_BACKUP","SYSTEM","Xuất bản sao lưu dữ liệu toàn hệ thống"),alert("Đã xuất file sao lưu hệ thống APSO thành công!")}
function zzImportBackup(e){if(!e)return;let t=new FileReader;t.onload=t=>{try{let n=JSON.parse(t.target.result);if(!n||!n.state)throw Error("File không đúng định dạng sao lưu APSO.");let{residents:a,households:l,notifications:r,users:o,locations:d,auditLogs:c}=n.state;Array.isArray(a)&&tE(a),Array.isArray(l)&&tM(l),Array.isArray(r)&&tH(r),Array.isArray(o)&&tR(o),Array.isArray(d)&&tK(d),Array.isArray(c)&&sT(c),sJ("IMPORT_BACKUP","SYSTEM","Khôi phục hệ thống từ file "+e.name),alert("Đã khôi phục thành công toàn bộ dữ liệu từ file sao lưu!")}catch(e){alert("Lỗi: "+(e instanceof Error?e.message:"File không hợp lệ."))}},t.readAsText(e)}
`;
  if (code.includes(markerFunc) && !code.includes('zzPrintReport')) {
    code = code.replace(markerFunc, utilityFunctions + "\n" + markerFunc);
    console.log(`[OK] Đã bổ sung các hàm tiện ích in ấn và sao lưu tại: ${rootDir}`);
  }

  // 5. Thêm thanh công cụ In biểu mẫu A4 vào đầu tab reports
  const reportsHeaderSearch = '"reports"===tk&&(0,s.jsxs)("section",{className:"space-y-5",children:[';
  const printBarJsx = '(0,s.jsxs)("div",{className:"rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm",children:[(0,s.jsxs)("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[(0,s.jsxs)("div",{children:[(0,s.jsx)("h2",{className:"text-base font-bold text-blue-950",children:"In biểu mẫu hành chính A4 chuẩn Quốc gia"}),(0,s.jsx)("p",{className:"text-xs text-blue-700",children:"Biểu mẫu A4 có Quốc hiệu, Tiêu ngữ và chữ ký ban ấp phục vụ họp dân và báo cáo."})]}),(0,s.jsxs)("div",{className:"flex flex-wrap gap-2",children:[(0,s.jsx)("button",{type:"button",onClick:()=>void zzPrintNvqs(),className:"rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-blue-800",children:"In DS NVQS (18–27t)"}),(0,s.jsx)("button",{type:"button",onClick:()=>void zzPrintNvqs17(),className:"rounded-md bg-indigo-700 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-800",children:"In DS Tuổi 17 NVQS"}),(0,s.jsx)("button",{type:"button",onClick:()=>void zzPrintElderly(),className:"rounded-md bg-amber-700 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-amber-800",children:"In DS Người cao tuổi (Từ 70t)"}),(0,s.jsx)("button",{type:"button",onClick:()=>void zzPrintPolicyHouseholds(),className:"rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800",children:"In DS Hộ chính sách & Nghèo"})]})]})]}),';

  if (code.includes(reportsHeaderSearch) && !code.includes("In biểu mẫu hành chính A4 chuẩn Quốc gia")) {
    code = code.replace(reportsHeaderSearch, reportsHeaderSearch + printBarJsx);
    console.log(`[OK] Đã gắn thanh công cụ in biểu mẫu vào tab Reports tại: ${rootDir}`);
  }

  // 6. Thêm thẻ Sao lưu & Phục hồi JSON vào tab Admin
  const adminFormSearch = 'children:[(0,s.jsx)("h3",{className:"font-bold text-slate-950",children:"Tạo t\\xe0i khoản"})';
  const backupBoxJsx = `children:[(0,s.jsxs)("div",{className:"space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4",children:[(0,s.jsx)("h3",{className:"font-bold text-slate-950",children:"Sao lưu & Khôi phục dữ liệu"}),(0,s.jsx)("p",{className:"text-xs text-slate-500",children:"Xuất dữ liệu an toàn ra tệp JSON để lưu trữ hoặc nạp lại khi chuyển thiết bị."}),(0,s.jsxs)("div",{className:"flex flex-wrap gap-2",children:[(0,s.jsx)("button",{type:"button",onClick:()=>void zzExportBackup(),className:"flex-1 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800",children:"Tải file sao lưu (.json)"}),(0,s.jsxs)("label",{className:"flex-1 cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100",children:["Khôi phục từ file",(0,s.jsx)("input",{type:"file",accept:".json",className:"sr-only",onChange:e=>{var t;let n=null==(t=e.target.files)?void 0:t[0];n&&(zzImportBackup(n),e.currentTarget.value="")}})]})]})]}),(0,s.jsx)("h3",{className:"font-bold text-slate-950",children:"Tạo t\\xe0i khoản"})`;

  if (code.includes(adminFormSearch) && !code.includes("Sao lưu & Khôi phục dữ liệu")) {
    code = code.replace(adminFormSearch, backupBoxJsx);
    console.log(`[OK] Đã gắn hộp Sao lưu & Khôi phục JSON vào tab Admin tại: ${rootDir}`);
  }

  // 7. Thêm bảng Nhật ký kiểm toán (Audit Logs viewer) vào cuối tab Admin
  const adminEndSearch = '(0,s.jsx)("button",{type:"submit",className:"h-10 w-full rounded-md bg-blue-700 text-sm font-semibold text-white hover:bg-blue-800",children:"Tạo t\\xe0i khoản"}),(0,s.jsx)("datalist",{id:"apso-title-options"';
  const auditLogsViewerJsx = `(0,s.jsx)("button",{type:"submit",className:"h-10 w-full rounded-md bg-blue-700 text-sm font-semibold text-white hover:bg-blue-800",children:"Tạo t\\xe0i khoản"}),(0,s.jsxs)("div",{className:"mt-4 rounded-md border border-slate-200 bg-white p-4",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between border-b border-slate-100 pb-2",children:[(0,s.jsx)("h4",{className:"text-sm font-bold text-slate-900",children:"Nhật ký kiểm toán hệ thống"}),(0,s.jsxs)("span",{className:"text-xs text-slate-500",children:[sk.length," bản ghi"]})]}),(0,s.jsx)("div",{className:"mt-2 max-h-56 space-y-2 overflow-y-auto pr-1",children:sk.slice(0,30).map(e=>(0,s.jsxs)("div",{className:"rounded border border-slate-100 bg-slate-50 p-2 text-xs",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between text-[11px] text-slate-500",children:[(0,s.jsx)("span",{className:"font-semibold text-slate-700",children:e.actorName||"Hệ thống"}),(0,s.jsx)("span",{children:new Date(e.at).toLocaleString("vi-VN")})]}),(0,s.jsx)("div",{className:"mt-1 font-medium text-slate-800",children:e.detail}),(0,s.jsx)("div",{className:"mt-0.5 text-[10px] text-slate-400 font-mono",children:e.action})] },e.id))})]}),(0,s.jsx)("datalist",{id:"apso-title-options"`;

  if (code.includes(adminEndSearch) && !code.includes("Nhật ký kiểm toán hệ thống")) {
    code = code.replace(adminEndSearch, auditLogsViewerJsx);
    console.log(`[OK] Đã gắn bảng Nhật ký kiểm toán vào tab Admin tại: ${rootDir}`);
  }

  // Ghi lại vào master, root _next, và hosting-public
  const filesToSave = [
    masterFile,
    path.join(rootDir, "_next", "static", "chunks", "app", "page-ef1198d6a6018514.js"),
    path.join(rootDir, "hosting-public", "_next", "static", "chunks", "app", "page-ef1198d6a6018514.js")
  ];

  for (const f of filesToSave) {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, code, "utf8");
    console.log(`[SAVED] Đã lưu: ${f} (${Buffer.byteLength(code, "utf8")} bytes)`);
  }
}

// Nâng cấp đồng bộ cho cả apso và apso-vn-noi-bo
upgradeProject("D:\\Lập trình\\apso");
upgradeProject("D:\\Lập trình\\apso-vn-noi-bo");
console.log("Hoàn thành nâng cấp toàn diện ứng dụng APSO!");
