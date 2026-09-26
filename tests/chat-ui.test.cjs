const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {apsoChatNormalize:n,apsoChatContext:c,apsoChatReconcile:r}=require('../chat-enhancements');
assert.equal(n('Đặng Thị Hồng'),'dang thi hong');
assert.deepEqual(c('Xin chào @Đặng Thị',18),{marker:'@',query:'Đặng Thị',start:9,end:18});
assert.equal(c('abc@example.com',15),null);
assert.equal(c('@An ',4,[{start:0,end:3}]).query,'An ');
assert.deepEqual(r('@An hi','@Anh hi',[{start:0,end:3,token:'@An'}]),[]);
assert.deepEqual(r('@An hi','@Bn hi',[{start:0,end:3,token:'@An'}]),[]);
assert.equal(r('@An hi','Xin @An hi',[{start:0,end:3,token:'@An'}])[0].start,4);
(async()=>{
 const {chromium}=require('@playwright/test');const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.setContent('<style>*{box-sizing:border-box}body{margin:0}header{position:fixed;top:0;height:56px}nav{position:fixed;bottom:0;height:64px}section>div:nth-child(2){overflow:auto}textarea{padding:10px}button{min-height:36px}</style><header class="fixed">APSO</header><nav class="fixed">Điều hướng</nav><section data-apso-chat><div><h2>Trao đổi công việc</h2></div><div>'+Array(40).fill('<p>Tin nhắn thử nghiệm</p>').join('')+'</div><div><form><label>📎</label><label>📷</label><button>⚡</button><button>📍</button><textarea aria-label="Nội dung tin nhắn"></textarea><button type="submit">Gửi</button></form></div></section>');
  await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'../chat-enhancements.js'),'utf8')});
  await page.evaluate(()=>{window.cleanup=useApsoChatLayout({useEffect:f=>{window.cleanup=f()}},true)});
  const check=async()=>{const box=await page.locator('textarea').boundingBox(),root=await page.locator('section').boundingBox();assert(box.width>250);assert(box.y>=root.y);assert(box.y+box.height<=root.y+root.height+1);assert(root.y+root.height<=await page.evaluate(()=>innerHeight));};
  await check();await page.screenshot({path:'tmp/chat-mobile.png'});
  await page.locator('textarea').focus();await page.setViewportSize({width:390,height:420});await check();
  await page.screenshot({path:'tmp/chat-keyboard.png'});
  assert(await page.locator('html').evaluate(el=>el.classList.contains('apso-chat-keyboard')));
  await page.setViewportSize({width:1280,height:800});await check();
  console.log('PASS chat: multiword/accent search, reference edits, mobile/keyboard/desktop composer geometry');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
