// Inserted inside the existing React component; use its authorized in-memory lists.
function apsoOpenListExport(kind) {
  if(!sF || !apsoCloudReady) return alert('Chưa có quyền xuất hoặc dữ liệu chưa tải xong. Hãy tải lại trang rồi thử lại.');
  const resident=kind==='residents';
  if(!sV(resident?'VIEW_RESIDENTS':'VIEW_HOUSEHOLDS'))return alert('Bạn chưa có quyền xem danh sách này.');
  const all=resident?tD:tA,filtered=resident?s1:s5;
  const residentRows=new Map(tD.map(row=>[row.id,aq([row])[0]]));
  const householdRow=row=>[row.id,row.headName,row.type,row.province,row.commune,row.hamlet,row.group,row.detailAddress,row.address,row.latitude,row.longitude,row.photoUrl,row.memberCount,row.createdAt];
  const text=(label,key,width=20)=>({label,width,get:r=>r[key]||''});
  const residentCompact=[text('Mã nhân khẩu','id'),text('Họ và tên','name',28),text('CCCD / Số định danh','idNumber',22),{label:'Ngày sinh',type:'date',width:15,get:r=>r.dateOfBirth},{label:'Tuổi',type:'number',width:8,get:(r,d)=>ApsoListExport.age(r.dateOfBirth,d)},text('Giới tính','gender',12),text('Điện thoại','phone',18),text('Mã hộ','householdId'),text('Địa chỉ','permanentAddress',38),text('Ấp','hamlet',24),text('Tổ','group',12),text('Chính sách','policy',24)];
  const householdCompact=[text('Mã hộ','id'),text('Chủ hộ','headName',28),text('Loại hộ','type'),text('Địa chỉ','address',38),text('Ấp','hamlet',24),text('Tổ','group',12),{label:'Số thành viên',type:'number',width:16,get:r=>Number.isFinite(Number(r.memberCount))?Number(r.memberCount):null},text('Vĩ độ','latitude'),text('Kinh độ','longitude')];
  ApsoListExport.open({kind,all,filtered,
    canExport:()=>sF&&apsoCloudReady&&eh().auth?.currentUser?.uid===sC?.uid,
    loadExcel:()=>n.e(343).then(n.t.bind(n,9280,23)),
    columns:detail=>detail==='compact'?(resident?residentCompact:householdCompact):(resident?eJ:e$).map((label,index)=>({label,width:index===1?28:22,
      type:(resident?[3,4,6,24,31,37,38]:[13]).includes(index)?'date':!resident&&index===12?'number':'text',
      get:r=>{const value=(resident?residentRows.get(r.id):householdRow(r))[index];return !resident&&index===12?Number(value):value;}
    }))
  });
}
