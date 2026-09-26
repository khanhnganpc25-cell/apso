const assert=require('node:assert/strict');
const fs=require('node:fs');
const ExcelJS=require('exceljs');
const vm=require('node:vm');
const x=require('../list-export');
const asOf='2026-09-26';
const rows=[
  {id:'01',name:'Nguyễn Thị A',dateOfBirth:'1956-09-26',idNumber:'001234567890',phone:'0900123456',isWomenUnionMember:true},
  {id:'02',name:'Trần Văn B',dateOfBirth:'1951-09-26',idNumber:'000000000002',phone:'0900000002'},
  {id:'03',name:'Lê C',dateOfBirth:'1956-09-27',idNumber:'000000000003'},
  {id:'04',name:'Không ngày sinh',dateOfBirth:''},
  {id:'05',name:'=HYPERLINK("bad")',dateOfBirth:'1931-09-26'},
  {id:'06',name:'Trẻ em',dateOfBirth:'2023-01-01'}
];
const columns=[{label:'Họ tên',width:28,get:r=>r.name},{label:'CCCD',get:r=>r.idNumber},{label:'Điện thoại',get:r=>r.phone},{label:'Ngày sinh',type:'date',get:r=>r.dateOfBirth},{label:'Tuổi',type:'number',get:(r,d)=>x.age(r.dateOfBirth,d)}];
async function main(){
  assert.equal(x.age('1956-09-26',asOf),70);assert.equal(x.age('1956-09-27',asOf),69);assert.equal(x.age('29/02/2024','2025-02-28'),0);assert.equal(x.age('2023-02-29',asOf),null);assert.equal(x.age('',asOf),null);assert.equal(x.age('2030-01-01',asOf),null);
  const groups=[x.ageGroup(70,74,'70–74 tuổi'),x.ageGroup(75,79,'75–79 tuổi'),{id:'women',label:'Hội viên phụ nữ',test:r=>r.isWomenUnionMember}];
  const separate=x.plan({records:rows,selectedGroups:groups,asOf});assert.equal(separate.sheets.length,3);assert.equal(separate.records.length,2);
  assert.deepEqual(separate.sheets.map(s=>s.records.length),[1,1,1]);
  const merged=x.plan({records:rows,selectedGroups:groups,asOf,mode:'merged'});assert.equal(merged.sheets.length,1);assert.equal(merged.records.length,2);assert.equal(merged.memberships.get('01'),'70–74 tuổi; Hội viên phụ nữ');
  assert.equal(x.plan({records:rows,asOf,limit:'2'}).records.length,2);
  assert.equal(x.plan({records:rows,asOf,selectedIds:new Set(['03'])}).records[0].id,'03');
  assert.throws(()=>x.plan({records:rows,limit:'0'}));assert.throws(()=>x.plan({records:rows,limit:'1.5'}));
  const exact=x.plan({records:rows,asOf,selectedGroups:[x.ageGroup(70,70,'Đúng 70 tuổi')]});assert.deepEqual(exact.records.map(r=>r.id),['01']);
  const book=await x.workbook(ExcelJS,separate,columns);const buffer=await book.xlsx.writeBuffer();const reopened=new ExcelJS.Workbook();await reopened.xlsx.load(buffer);
  assert.equal(reopened.worksheets.length,3);assert.equal(reopened.worksheets[0].getCell('C2').value,'001234567890');assert.equal(reopened.worksheets[0].getCell('D2').value,'0900123456');assert(reopened.worksheets[0].getCell('E2').value instanceof Date);assert.equal(reopened.worksheets[0].getCell('F2').value,70);assert.equal(reopened.worksheets[0].views[0].ySplit,1);assert(reopened.worksheets[0].autoFilter);
  const mergedBook=await x.workbook(ExcelJS,merged,columns);assert.equal(mergedBook.worksheets.length,1);assert.equal(mergedBook.worksheets[0].rowCount,3);
  const allBook=await x.workbook(ExcelJS,x.plan({records:rows,asOf}),columns);assert.equal(allBook.worksheets[0].getCell('B6').value,rows[4].name);assert.equal(allBook.worksheets[0].getCell('B6').type,ExcelJS.ValueType.String);
  const used=new Set();for(let i=0;i<3;i++){const name=x.sheetName('Tên dài / không hợp lệ [test] rất dài rất dài',used);assert(name.length<=31);assert(!/[\\/*?:\[\]]/.test(name));}assert.equal(used.size,3);
  await assert.rejects(x.workbook(ExcelJS,x.plan({records:[],asOf}),columns));
  const many=Array.from({length:20000},(_,i)=>({id:String(i),name:'Kiểm tra '+i,dateOfBirth:'1950-01-01'}));assert.equal(x.plan({records:many,asOf}).records.length,20000);
  const source=fs.readFileSync('_next/static/chunks/app/page-ef1198d6a6018514.js','utf8');
  const original=fs.readFileSync('_next/static/chunks/app/page-ef1198d6a6018514.js.unified-master','utf8');
  const headers=original.match(/eJ=(\[.*?\]),e\$=(\[.*?\]);/);assert(headers);
  const context=vm.createContext({sF:true,apsoCloudReady:true,sV:()=>true,tD:rows,s1:[rows[0]],tA:[{id:'H1',headName:'Chủ hộ 1'},{id:'H2',headName:'Chủ hộ 2'}],s5:[{id:'H2',headName:'Chủ hộ 2'}],sC:{uid:'test'},eh:()=>({auth:{currentUser:{uid:'test'}}}),tr:r=>r.idCardExpiry||'',e2:r=>r.managementCategory||'',ApsoListExport:{...x,open:o=>{context.opened=o}},alert:m=>{throw Error(m)}});
  vm.runInContext('var eJ='+headers[1]+';var e$='+headers[2]+';'+source.slice(source.indexOf('function aq('),source.indexOf('function aF('))+'\n'+fs.readFileSync('list-export-integration.js','utf8'),context);
  context.apsoOpenListExport('residents');assert.equal(context.opened.filtered.length,1);assert.equal(context.opened.all.length,rows.length);assert.equal(context.opened.columns('full')[6].get(rows[0]),'1956-09-26');assert.equal(context.opened.columns('full')[30].type,'text');assert.equal(context.opened.columns('full')[31].type,'date');
  context.apsoOpenListExport('households');assert.equal(context.opened.filtered[0].id,'H2');assert.equal(context.opened.all.length,2);
  context.sF=false;assert.throws(()=>context.apsoOpenListExport('residents'),/quyền/);
  fs.mkdirSync('tmp/export-tests',{recursive:true});await book.xlsx.writeFile('tmp/export-tests/multi-sheet.xlsx');await mergedBook.xlsx.writeFile('tmp/export-tests/merged.xlsx');
  console.log('PASS: age boundaries, invalid dates, exact/range groups, multi-sheet, merged deduplication, manual selection, global row limit, typed dates, text IDs, formula-like text, sheet names, empty results, and 20,000-row selection.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
