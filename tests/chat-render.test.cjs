const fs=require('fs'),assert=require('assert/strict'),esbuild=require('esbuild');
const {chromium}=require('@playwright/test');
(async()=>{
const code=fs.readFileSync('_next/static/chunks/app/page-ef1198d6a6018514.js','utf8');
const slice=(start,end)=>code.slice(code.indexOf(start),code.indexOf(end,code.indexOf(start)));
const view=slice('"chat"===tk &&','"overview"===tk').trim().replace(/,$/,'');
const controller=slice('  const chatReferenceContext=','  // Chat Sync & Action Handlers');
const select=slice('  function selectChatReference(','  function openResidentFromChat');
const rich=slice('  function renderChatRichText(','  function showApsoNotification');
const source=`const a=require('react'),s=require('react/jsx-runtime');const {createRoot}=require('react-dom/client');${fs.readFileSync('chat-enhancements.js','utf8')}
function App(){const tk='chat',S={},tO=[{id:'u1',name:'Đặng Thị Hồng',active:true}],tD=[{id:'r1',name:'Nguyễn Văn An',householdId:'H01'}],tL={id:'u1'},eG=x=>x,sV=()=>true;
const [chatInputText,setChatInputText]=a.useState(''),[chatCaret,setChatCaret]=a.useState(0),[chatSelected,setChatSelected]=a.useState(0),[chatDismissed,setChatDismissed]=a.useState(false),[chatRanges,setChatRanges]=a.useState([]),[chatMessages,setChatMessages]=a.useState([]),[chatFilter,setChatFilter]=a.useState('all'),[chatAttachment,setChatAttachment]=a.useState(null);
const chatCloudStatus='Đã kết nối',chatDirectory=tO,[chatSending,setChatSending]=a.useState(false);const chatNotificationsEnabled=false,chatLocationBusy=false,sW=true,sQ=true,sY=true;const syncApsoChatMessages=()=>{},toggleChatNotifications=()=>{},setTaskAssignModalOpen=()=>{},openDriveHelper=()=>{},handleSendChatLocation=()=>{},handleChatFileInput=()=>{},setChatMentionRefs=()=>{},setChatResidentRefs=()=>{},downloadLocalFile=()=>{},setPreviewImageModal=()=>{},handleUpdateChatTaskStatus=()=>{},tT=()=>{},openResidentFromChat=id=>window.openedResident=id;
function sendApsoChatMessage(p){if(window.failSend)return false;window.sent=p;setChatMessages(v=>[...v,{...p,id:'m'+v.length,senderId:'u1',senderName:'Hồng',createdAt:Date.now(),expiresAt:Date.now()+999999}]);return true}
useApsoChatLayout(a,true);${controller}${select}${rich}return ${view};}createRoot(document.getElementById('root')).render(a.createElement(App));`;
const result=await esbuild.build({stdin:{contents:source,resolveDir:process.cwd()},bundle:true,write:false,platform:'browser'});
const browser=await chromium.launch({channel:'msedge',headless:true});try{const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setContent('<header class="fixed" style="position:fixed;top:0;height:56px">APSO</header><nav class="fixed" style="position:fixed;bottom:0;height:64px">Điều hướng</nav><div id="root"></div>');
for(const file of fs.readdirSync('_next/static/css').filter(f=>f.endsWith('.css')))await page.addStyleTag({path:'_next/static/css/'+file});
await page.addScriptTag({content:result.outputFiles[0].text});await page.waitForTimeout(250);assert.deepEqual(errors,[]);
const input=page.getByRole('textbox',{name:'Nội dung tin nhắn'});await input.fill('@dang thi');await page.getByRole('option').waitFor();await input.press('Enter');assert.equal(await input.inputValue(),'@Đặng Thị Hồng ');assert.equal(await page.evaluate(()=>window.sent),undefined);
await input.press('End');await input.press('Space');await input.press('#');await input.press('n');await input.press('g');await page.getByRole('option').click();await page.getByRole('button',{name:'Gửi ✈'}).click();assert.equal((await page.evaluate(()=>window.sent)).residentRefs[0].id,'r1');await page.getByRole('button',{name:'#Nguyễn Văn An',exact:true}).click();assert.equal(await page.evaluate(()=>window.openedResident),'r1');
await page.evaluate(()=>window.failSend=true);await input.fill('Giữ lại khi gửi lỗi');await page.getByRole('button',{name:'Gửi ✈'}).click();assert.equal(await input.inputValue(),'Giữ lại khi gửi lỗi');assert.equal(await input.isEnabled(),true);
await page.screenshot({path:'tmp/chat-real-mobile.png'});assert.deepEqual(errors,[]);console.log('PASS actual chat JSX: mobile render, @ unaccented multiword selection, Enter does not send, # links open exact record, failed send retains draft');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
