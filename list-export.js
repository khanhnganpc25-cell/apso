// APSO_LIST_EXPORT_V1. Shared by the browser application and regression tests.
const ApsoListExport = (() => {
  const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  function dateParts(value) {
    let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
    if (!match) {
      const local = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(String(value || '').trim());
      if (local) match = [local[0], local[3], local[2], local[1]];
    }
    if (!match) return null;
    const [year, month, day] = match.slice(1).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return year >= 1800 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? [year, month, day] : null;
  }
  function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function age(value, asOf) {
    const birth = dateParts(value), end = dateParts(asOf);
    if (!birth || !end) return null;
    const years = end[0] - birth[0] - (end[1] < birth[1] || end[1] === birth[1] && end[2] < birth[2] ? 1 : 0);
    return years < 0 ? null : years;
  }
  function ageGroup(min, max, label) {
    return {id:`age-${min}-${max ?? 'plus'}`,label,test:(row,asOf)=>{const a=age(row.dateOfBirth,asOf);return a!==null && a>=min && (max==null || a<=max);}};
  }
  function groups(kind, records) {
    const result = kind === 'residents' ? [
      ageGroup(0,5,'Dưới 6 tuổi'),ageGroup(6,13,'Từ 6 đến 13 tuổi'),ageGroup(14,15,'Từ 14 đến 15 tuổi'),
      ageGroup(16,17,'Từ 16 đến 17 tuổi'),ageGroup(18,59,'Từ 18 đến 59 tuổi'),ageGroup(60,null,'Từ 60 tuổi trở lên'),
      ageGroup(70,null,'Từ 70 tuổi trở lên'),...Array.from({length:6},(_,i)=>ageGroup(70+i*5,74+i*5,`${70+i*5}–${74+i*5} tuổi`)),ageGroup(100,null,'Từ 100 tuổi trở lên'),
      ...[70,75,80,85,90,95,100].map(a=>ageGroup(a,a,`Đúng ${a} tuổi`)),
      ...[['isVeteran','Cựu chiến binh'],['isWomenUnionMember','Hội viên phụ nữ'],['isFarmerMember','Hội viên nông dân'],['isYouthUnionMember','Đoàn viên'],['isMilitiaMember','Dân quân']].map(([key,label])=>({id:key,label,test:r=>r[key]===true})),
      {id:'missing-birth',label:'Thiếu / sai ngày sinh',test:r=>!dateParts(r.dateOfBirth)}
    ] : [
      {id:'has-photo',label:'Hộ có ảnh',test:r=>!!r.photoUrl}, {id:'no-photo',label:'Hộ chưa có ảnh',test:r=>!r.photoUrl},
      {id:'has-location',label:'Hộ có tọa độ',test:r=>r.latitude!==''&&r.longitude!==''&&r.latitude!=null&&r.longitude!=null},
      {id:'no-location',label:'Hộ chưa có tọa độ',test:r=>r.latitude===''||r.longitude===''||r.latitude==null||r.longitude==null}
    ];
    for (const [field,prefix] of (kind==='residents' ? [['policy','Chính sách'],['status','Cư trú']] : [['type','Loại hộ']])) {
      for (const value of [...new Set(records.map(r=>r[field]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'))) result.push({id:`${field}:${value}`,label:`${prefix}: ${value}`,test:r=>r[field]===value});
    }
    return result;
  }
  function plan({records, selectedGroups=[], selectedIds=null, limit='', asOf=today(), mode='separate', label='Danh sách'}) {
    if (!dateParts(asOf)) throw Error('Hãy chọn ngày tính tuổi hợp lệ.');
    if (limit !== '' && (!Number.isSafeInteger(Number(limit)) || Number(limit)<1)) throw Error('Số lượng cần tải phải là số nguyên từ 1 trở lên, hoặc để trống để tải hết.');
    const seen = new Set();
    let candidates = records.filter(r=>{if(seen.has(r.id))return false;seen.add(r.id);return !selectedGroups.length || selectedGroups.some(g=>g.test(r,asOf));});
    if (selectedIds) candidates = candidates.filter(r=>selectedIds.has(r.id));
    if (limit!=='') candidates = candidates.slice(0,Number(limit));
    const memberships = new Map(candidates.map(r=>[r.id,selectedGroups.filter(g=>g.test(r,asOf)).map(g=>g.label).join('; ')]));
    const sheets = mode==='separate' && selectedGroups.length ? selectedGroups.map(g=>({name:g.label,records:candidates.filter(r=>g.test(r,asOf))})) : [{name:label,records:candidates}];
    return {sheets,records:candidates,memberships,asOf};
  }
  function sheetName(label, used) {
    let base=String(label).replace(/[\\/*?:\[\]]/g,' ').replace(/^'+|'+$/g,'').trim().slice(0,31)||'Danh sách';
    let name=base,index=1;
    while(used.has(name.toLowerCase())){const suffix=` (${++index})`;name=base.slice(0,31-suffix.length)+suffix;}
    used.add(name.toLowerCase());return name;
  }
  function cell(value, type) {
    if(type==='date'){const parts=dateParts(value);return parts?new Date(Date.UTC(parts[0],parts[1]-1,parts[2])):String(value||'');}
    if(type==='number')return typeof value==='number'&&Number.isFinite(value)?value:null;
    const text=String(value??'');
    return text.startsWith('data:image/')?'Có ảnh trong APSO':text.slice(0,32767);
  }
  async function workbook(ExcelJS, data, columns) {
    if(!data.records.length)throw Error('Không có dòng nào để xuất. Hãy kiểm tra bộ lọc hoặc phần tích chọn.');
    const book=new ExcelJS.Workbook(), used=new Set();book.creator='APSO';book.created=new Date();
    for(const part of data.sheets){
      const sheet=book.addWorksheet(sheetName(part.name,used));
      sheet.columns=[{header:'STT',width:7},...columns.map(c=>({header:c.label,width:c.width||20})),{header:'Nhóm đã chọn',width:32}];
      for(const [index,record] of part.records.entries()) sheet.addRow([index+1,...columns.map(c=>cell(c.get(record,data.asOf),c.type)),data.memberships.get(record.id)||'']);
      sheet.views=[{state:'frozen',ySplit:1}];sheet.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,sheet.rowCount),column:columns.length+2}};
      sheet.getRow(1).height=32;
      sheet.getRow(1).eachCell(c=>{c.font={name:'Arial',size:11,bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF154D70'}};c.alignment={vertical:'middle',wrapText:true};});
      sheet.eachRow((row,number)=>{if(number===1)return;row.height=32;row.eachCell({includeEmpty:true},c=>{c.font={name:'Arial',size:11};c.alignment={vertical:'middle',wrapText:true};if(number%2===0)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF0F5F9'}};});});
      columns.forEach((c,i)=>{sheet.getColumn(i+2).numFmt=c.type==='date'?'dd/mm/yyyy':c.type==='number'?'0':'@';});
      sheet.pageSetup={paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'1:1'};
      sheet.headerFooter={oddHeader:`APSO - ${part.name.replace(/&/g,'&&')}`,oddFooter:`Ngày tính tuổi: ${data.asOf} | ${part.records.length} dòng | Trang &P / &N`};
    }
    return book;
  }
  async function save(buffer, filename) {
    const cap=window.Capacitor;
    if(cap?.isNativePlatform?.()){
      if(!cap.isPluginAvailable('Filesystem')||!cap.isPluginAvailable('Share'))throw Error('Bản app này chưa hỗ trợ lưu Excel. Hãy cập nhật app tại apso-vn.web.app/download hoặc mở APSO bằng Chrome để tải.');
      // Remote-hosted pages receive the native bridge's Plugins objects even
      // when the optional @capacitor/core JS runtime is not bundled on the web.
      const fileSystem=cap.Plugins?.Filesystem||cap.registerPlugin?.('Filesystem'),share=cap.Plugins?.Share||cap.registerPlugin?.('Share');
      if(!fileSystem?.writeFile||!share?.share)throw Error('Không tìm thấy bộ lưu file của app. Hãy cập nhật APSO rồi thử lại.');
      const blob=new Blob([buffer],{type:mime});
      const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});
      const result=await fileSystem.writeFile({path:`exports/${filename}`,data:base64,directory:'CACHE',recursive:true});
      // Android recipients may read the URI after the share dialog closes.
      // Keep the file in app cache; never delete it while the recipient is opening it.
      await share.share({title:'Danh sách APSO',files:[result.uri],dialogTitle:'Lưu hoặc gửi file Excel'});
      return;
    }
    const url=URL.createObjectURL(new Blob([buffer],{type:mime})),anchor=document.createElement('a');
    anchor.href=url;anchor.download=filename;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  function open(options) {
    if(document.getElementById('apso-export-dialog'))return;
    const previous=document.activeElement,dialog=document.createElement('dialog');dialog.id='apso-export-dialog';
    dialog.style.cssText='font:14px/1.5 Arial,sans-serif;width:min(820px,96vw);max-height:92vh;padding:0;border:0;border-radius:16px;color:#19334a;background:white;box-shadow:0 16px 70px #0006';
    const style=document.createElement('style');style.textContent='#apso-export-dialog::backdrop{background:#10253899}#apso-export-dialog *{box-sizing:border-box}#apso-export-dialog button,#apso-export-dialog input,#apso-export-dialog select{font:inherit}#apso-export-dialog button{cursor:pointer;padding:9px 13px;border:1px solid #bfd0dc;border-radius:8px;background:#f5f9fc}#apso-export-dialog input:not([type=checkbox]),#apso-export-dialog select{padding:8px;border:1px solid #bfd0dc;border-radius:7px;max-width:100%}#apso-export-dialog input[type=checkbox]{width:18px;height:18px;flex-shrink:0}#apso-export-dialog label{display:flex;align-items:center;gap:8px}#apso-export-dialog fieldset{border:1px solid #dce5ec;border-radius:10px;margin:14px 0;padding:12px}#apso-export-dialog legend{font-weight:700;padding:0 5px}#apso-export-dialog button:focus-visible,#apso-export-dialog input:focus-visible,#apso-export-dialog select:focus-visible{outline:3px solid #38a2e5}';dialog.append(style);
    const el=(tag,text,parent=dialog)=>{const node=document.createElement(tag);if(text)node.textContent=text;parent.append(node);return node;};
    const body=el('div');body.style.cssText='padding:20px;overflow:auto;max-height:74vh';
    el('h2',`Xuất Excel ${options.kind==='residents'?'nhân khẩu':'hộ khẩu'}`,body).style.cssText='font-size:21px;font-weight:700;margin:0 0 8px';
    el('p','Tải 1 file .xlsx. Có thể gộp chung hoặc chia mỗi nhóm thành một trang tính.',body);
    const field=(title)=>{const f=el('fieldset','',body);el('legend',title,f);return f;};
    const select=(parent,choices)=>{const node=el('select','',parent);for(const [value,label] of choices){const option=el('option',label,node);option.value=value;}return node;};
    const sourceField=field('1. Chọn danh sách');
    const source=select(sourceField,[['filtered',`Danh sách sau lọc (${options.filtered.length} dòng)`],['all',`Tất cả trong quyền truy cập (${options.all.length} dòng)`]]);source.setAttribute('aria-label','Danh sách cần xuất');
    const groupField=field('2. Chọn nhóm (không tích nhóm nào = lấy cả danh sách)');
    const dateLabel=el('label','Ngày tính tuổi: ',groupField),date=el('input','',dateLabel);date.type='date';date.value=today();dateLabel.hidden=options.kind!=='residents';
    const groupBox=el('div','',groupField);groupBox.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:8px;max-height:230px;overflow:auto;margin-top:10px';
    const groupDefinitions=groups(options.kind,options.all),groupChecks=[];
    for(const group of groupDefinitions){const label=el('label','',groupBox),check=el('input','',label);check.type='checkbox';el('span',group.label,label);groupChecks.push({group,check});}
    const customLabel=el('label','',groupField),custom=el('input','',customLabel);custom.type='checkbox';el('span','Khoảng tuổi tự chọn (tính cả hai đầu):',customLabel);
    const from=el('input','',customLabel),to=el('input','',customLabel);for(const [input,label] of [[from,'Từ tuổi'],[to,'Đến tuổi']]){input.type='number';input.min='0';input.max='150';input.placeholder=label;input.setAttribute('aria-label',label);input.style.width='95px';}customLabel.style.cssText='margin-top:12px;flex-wrap:wrap';customLabel.hidden=options.kind!=='residents';
    const selection=field('3. Chọn dòng và số lượng');
    el('p','Mặc định lấy tất cả kết quả. Có thể bỏ chọn từng dòng hoặc nhập số lượng tối đa cho cả file.',selection);
    const search=el('input','',selection);search.placeholder='Tìm tên hoặc mã để tích chọn';search.setAttribute('aria-label','Tìm dòng xuất');search.style.width='100%';
    const controls=el('div','',selection);controls.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:8px 0';
    const choose=el('button','Chọn các dòng đang tìm',controls),unchoose=el('button','Bỏ chọn các dòng đang tìm',controls);
    const list=el('div','',selection);list.style.cssText='max-height:200px;overflow:auto';
    const more=el('button','Hiện thêm 100 dòng',selection);
    const limitLabel=el('label','Tối đa số dòng (để trống = tất cả): ',selection),limit=el('input','',limitLabel);limit.type='number';limit.min='1';limit.step='1';limit.style.width='100px';limitLabel.style.marginTop='10px';
    const layout=field('4. Cách chia trang tính');
    const mode=select(layout,[['separate','Mỗi nhóm một trang tính (sheet)'],['merged','Gộp tất cả vào một trang tính']]);mode.setAttribute('aria-label','Cách chia trang tính');
    el('p','Gộp chung: mỗi người/hộ chỉ một dòng. Chia trang: một người/hộ có thể nằm trong nhiều nhóm.',layout);
    const detail=select(layout,[['compact','Các cột chính (dễ đọc, dễ in)'],['full','Đầy đủ các cột dữ liệu']]);detail.setAttribute('aria-label','Cột dữ liệu');
    const preview=el('p','',body);preview.setAttribute('aria-live','polite');preview.style.fontWeight='700';
    const error=el('p','',body);error.setAttribute('role','alert');error.style.color='#b42318';
    const footer=el('div');footer.style.cssText='display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;border-top:1px solid #dce5ec;background:#f7fafc';
    const cancel=el('button','Đóng',footer),download=el('button','Tải 1 file Excel',footer);download.style.cssText='background:#076aa5;color:white;font-weight:700';
    let omitted=new Set(),visibleCount=100,busy=false,current=null;
    const selectedGroups=()=>{const picked=groupChecks.filter(x=>x.check.checked).map(x=>x.group);if(custom.checked){const min=Number(from.value),max=Number(to.value);if(from.value===''||to.value===''||!Number.isInteger(min)||!Number.isInteger(max)||min<0||max>150||min>max)throw Error('Nhập khoảng tuổi từ 0 đến 150, tuổi bắt đầu không lớn hơn tuổi kết thúc.');picked.push(ageGroup(min,max,`Từ ${min} đến ${max} tuổi`));}return picked;};
    const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
    const candidates=()=>plan({records:source.value==='all'?options.all:options.filtered,selectedGroups:selectedGroups(),asOf:date.value}).records;
    const matching=()=>candidates().filter(r=>normalize([r.name||r.headName,r.id,r.idNumber].join(' ')).includes(normalize(search.value)));
    function refresh(){
      try{
        error.textContent='';const records=candidates();current=plan({records,selectedGroups:selectedGroups(),selectedIds:new Set(records.filter(r=>!omitted.has(r.id)).map(r=>r.id)),limit:limit.value,asOf:date.value,mode:mode.value,label:options.kind==='residents'?'Nhân khẩu':'Hộ khẩu'});
        const matches=matching();list.replaceChildren();for(const record of matches.slice(0,visibleCount)){const label=el('label','',list),check=el('input','',label);label.style.cssText='padding:6px 0;border-bottom:1px solid #edf2f6';check.type='checkbox';check.checked=!omitted.has(record.id);check.onchange=()=>{check.checked?omitted.delete(record.id):omitted.add(record.id);refresh();};el('span',`${record.name||record.headName||'(Chưa có tên)'} — ${record.id}`,label);}
        more.hidden=matches.length<=visibleCount;preview.textContent=`${current.records.length} dòng riêng biệt → 1 file, ${current.sheets.length} trang tính. `+current.sheets.map(s=>`${s.name}: ${s.records.length}`).join(' · ');download.disabled=busy||current.records.length===0;
      }catch(e){current=null;error.textContent=e.message;download.disabled=true;}
    }
    for(const node of [source,date,from,to,custom,limit,mode,detail,...groupChecks.map(x=>x.check)])node.addEventListener('change',()=>{visibleCount=100;refresh();});
    search.oninput=()=>{visibleCount=100;refresh();};more.onclick=()=>{visibleCount+=100;refresh();};
    choose.onclick=()=>{try{matching().forEach(r=>omitted.delete(r.id));refresh();}catch(e){error.textContent=e.message;}};unchoose.onclick=()=>{try{matching().forEach(r=>omitted.add(r.id));refresh();}catch(e){error.textContent=e.message;}};
    cancel.onclick=()=>{if(!busy)dialog.close();};dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});dialog.addEventListener('close',()=>{dialog.remove();previous?.focus();});
    download.onclick=async()=>{refresh();if(!current||!current.records.length)return;busy=true;download.disabled=true;cancel.disabled=true;download.textContent='Đang tạo Excel…';
      try{if(!options.canExport())throw Error('Phiên đăng nhập hoặc quyền xuất dữ liệu đã thay đổi. Hãy mở lại trang.');const snapshot=current,columns=options.columns(detail.value);const ExcelJS=await options.loadExcel();const book=await workbook(ExcelJS,snapshot,columns);await save(await book.xlsx.writeBuffer(),`APSO-${options.kind==='residents'?'Nhan-khau':'Ho-khau'}-${snapshot.asOf}-${Date.now()}.xlsx`);error.textContent='';preview.textContent='Đã tạo 1 file Excel. Kiểm tra mục Tải xuống hoặc hộp lưu/chia sẻ trên điện thoại.';}catch(e){error.textContent=`Chưa tải được: ${e.message||e}`;}finally{busy=false;cancel.disabled=false;download.textContent='Tải 1 file Excel';download.disabled=false;}};
    document.body.append(dialog);dialog.showModal();refresh();
  }
  return {dateParts,today,age,ageGroup,groups,plan,sheetName,workbook,save,open};
})();
if(typeof module!=='undefined' && module.exports) module.exports=ApsoListExport;
