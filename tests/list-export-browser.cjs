const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ExcelJS=require('exceljs');
async function main(){
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1100,height:900},acceptDownloads:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setContent('<html lang="vi"><body><button id="open">Xuất XLSX</button></body></html>');
    await page.addStyleTag({path:'_next/static/css/bcea38e92e478cbf.css'});
    await page.addScriptTag({path:'node_modules/exceljs/dist/exceljs.min.js'});
    await page.addScriptTag({path:'list-export.js'});
    await page.evaluate(()=>{
      window.testRows=[{id:'A',name:'Nguyễn Thị A',idNumber:'001234567890',dateOfBirth:'1956-09-26',phone:'0900123456'},{id:'B',name:'Trần Văn B',idNumber:'000000000002',dateOfBirth:'1951-09-26'}];
      window.testOptions={kind:'residents',all:testRows,filtered:[testRows[0]],canExport:()=>true,loadExcel:async()=>ExcelJS,columns:()=>[{label:'Họ tên',get:r=>r.name},{label:'CCCD',get:r=>r.idNumber},{label:'Ngày sinh',type:'date',get:r=>r.dateOfBirth}]};
      document.getElementById('open').onclick=()=>ApsoListExport.open(testOptions);
    });
    await page.getByRole('button',{name:'Xuất XLSX',exact:true}).click();
    await page.getByLabel('Danh sách cần xuất').selectOption('all');
    await page.locator('input[type=date]').fill('2026-09-26');
    await page.getByLabel('70–74 tuổi',{exact:true}).check();
    await page.getByLabel('75–79 tuổi',{exact:true}).check();
    await page.screenshot({path:'tmp/export-tests/export-desktop.png',fullPage:true});
    const first=page.waitForEvent('download');await page.getByRole('button',{name:'Tải 1 file Excel',exact:true}).click();const file=await first;await file.saveAs('tmp/export-tests/browser-multi.xlsx');
    let book=new ExcelJS.Workbook();await book.xlsx.readFile('tmp/export-tests/browser-multi.xlsx');assert.equal(book.worksheets.length,2);assert.equal(book.worksheets[0].getCell('C2').value,'001234567890');
    await page.getByLabel('Cách chia trang tính').selectOption('merged');
    const second=page.waitForEvent('download');await page.getByRole('button',{name:'Tải 1 file Excel',exact:true}).click();await(await second).saveAs('tmp/export-tests/browser-merged.xlsx');
    book=new ExcelJS.Workbook();await book.xlsx.readFile('tmp/export-tests/browser-merged.xlsx');assert.equal(book.worksheets.length,1);assert.equal(book.worksheets[0].rowCount,3);
    await page.getByLabel('Danh sách cần xuất').selectOption('filtered');
    await page.getByLabel('Tối đa số dòng (để trống = tất cả):').fill('0');await page.getByLabel('Cách chia trang tính').focus();assert(await page.getByRole('button',{name:'Tải 1 file Excel',exact:true}).isDisabled());
    await page.getByLabel('Tối đa số dòng (để trống = tất cả):').fill('');await page.getByLabel('Cách chia trang tính').focus();
    await page.getByRole('button',{name:'Bỏ chọn các dòng đang tìm',exact:true}).click();assert(await page.getByRole('button',{name:'Tải 1 file Excel',exact:true}).isDisabled());
    await page.getByRole('button',{name:'Chọn các dòng đang tìm',exact:true}).click();
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:'tmp/export-tests/export-mobile.png',fullPage:true});
    assert(await page.locator('#apso-export-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
    await page.getByRole('button',{name:'Đóng',exact:true}).click();
    await page.evaluate(()=>{window.Capacitor={isNativePlatform:()=>true,isPluginAvailable:()=>true,registerPlugin:name=>name==='Filesystem'?{writeFile:async o=>{window.savedNative=o;return {uri:'file:///cache/test.xlsx'}}}:{share:async o=>{window.sharedNative=o}}};});
    await page.evaluate(()=>ApsoListExport.save(new Uint8Array([80,75,3,4]),'test.xlsx'));
    const native=await page.evaluate(()=>({saved:savedNative,shared:sharedNative}));assert.equal(native.saved.data,'UEsDBA==');assert.equal(native.saved.directory,'CACHE');assert.deepEqual(native.shared.files,['file:///cache/test.xlsx']);
    await page.evaluate(()=>{const cap=window.Capacitor;cap.Plugins={Filesystem:cap.registerPlugin('Filesystem'),Share:cap.registerPlugin('Share')};delete cap.registerPlugin;});
    await page.evaluate(()=>ApsoListExport.save(new Uint8Array([80,75,3,4]),'native-bridge.xlsx'));
    assert.equal(await page.evaluate(()=>savedNative.path),'exports/native-bridge.xlsx');
    await page.evaluate(()=>{window.Capacitor.isPluginAvailable=()=>false;});
    assert.match(await page.evaluate(async()=>{try{await ApsoListExport.save(new Uint8Array([1]),'test.xlsx')}catch(e){return e.message}}),/cập nhật app/);
    assert.deepEqual(errors,[]);
    console.log('PASS: desktop/mobile dialog, actual browser downloads (one XLSX per click), multi/merged worksheets, filtered source, selection/validation, native bridge contract and old-app warning.');
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
