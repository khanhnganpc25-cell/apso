/* Readable chat UI/mention improvements; injected into the recovered application. */
function apsoChatNormalize(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/\s+/g,' ').trim()}
function apsoChatContext(text,caret,refs=[]){
  const end=caret==null?text.length:caret;
  if(refs.some(r=>end>=r.start&&end<=r.end))return null;
  const m=text.slice(0,end).match(/(?:^|\s)([@#])([^@#\n]{0,80})$/u);
  if(m&&refs.some(r=>r.start===end-m[1].length-m[2].length))return null;
  return m?{marker:m[1],query:m[2],start:end-m[1].length-m[2].length,end}:null;
}
function apsoChatReconcile(before,after,refs){
  let start=0,oldEnd=before.length,newEnd=after.length;
  while(start<oldEnd&&start<newEnd&&before[start]===after[start])start++;
  while(oldEnd>start&&newEnd>start&&before[oldEnd-1]===after[newEnd-1]){oldEnd--;newEnd--}
  return refs.flatMap(r=>r.end<=start?[r]:r.start>=oldEnd?[{...r,start:r.start+newEnd-oldEnd,end:r.end+newEnd-oldEnd}]:[]).filter(r=>after.slice(r.start,r.end)===r.token&&!/[\p{L}\p{N}]/u.test(after[r.end]||''));
}
function apsoChatLegacyRefs(text,refs){
  return refs.flatMap(r=>{
    if(Number.isInteger(r.start))return [r];
    const token=(r.kind==='resident'?'#':'@')+r.name;
    if(refs.some(other=>other.id!==r.id&&other.kind===r.kind&&other.name===r.name))return [];
    const found=[];let at=text.indexOf(token);
    while(at>=0){const end=at+token.length;if((at===0||/\s/.test(text[at-1]))&&!/[\p{L}\p{N}]/u.test(text[end]||''))found.push({...r,token,start:at,end});at=text.indexOf(token,end)}return found;
  });
}
function useApsoChatLayout(React,active){
  React.useEffect(()=>{
    if(!active)return;
    const root=document.querySelector('[data-apso-chat]');if(!root)return;
    const style=document.createElement('style');style.textContent=`
      [data-apso-chat]{min-height:0!important;display:flex;flex-direction:column;background:#f4f7fb;border:1px solid #dce5ef;border-radius:18px;overflow:hidden}
      [data-apso-chat]>div{flex-shrink:0}
      [data-apso-chat]>div:nth-child(2){flex:1 1 0%;min-height:0;overscroll-behavior:contain}
      [data-apso-chat]>div:first-child{background:#174b85;padding:12px 16px}
      [data-apso-chat]>div:first-child p{font-size:11px;color:#fde68a;margin-top:4px}
      [data-apso-chat]>div:first-child button.bg-white{color:#174b85!important}
      [data-apso-chat] button[type=submit]{background:#1763b3;color:white}
      [data-apso-chat] button[type=submit]:disabled{opacity:.45}
      [data-apso-chat]>div:first-child>div:first-child>div:first-child>div:first-child{display:none}
      [data-apso-chat]>div:first-child>div:last-child>div:first-child{display:none}
      [data-apso-chat] form{display:grid;grid-template-columns:repeat(4,36px) 1fr 64px;gap:6px}
      [data-apso-chat] textarea{grid-row:2;grid-column:1/6;width:100%;min-width:0;font-size:16px;line-height:24px;max-height:96px;padding:10px 12px}
      [data-apso-chat] button[type=submit]{grid-row:2;grid-column:6;height:44px}
      [data-apso-chat] [data-chat-picker]{position:absolute;bottom:100%;left:8px;right:8px;max-height:min(200px,35dvh);overflow:auto;background:white;border:1px solid #cad9ec;border-radius:12px;box-shadow:0 -8px 30px #17325320;padding:6px}
      [data-chat-picker] button{display:block;width:100%;padding:10px;text-align:left;border-radius:8px;color:#173253}
      [data-chat-picker] button[aria-selected=true]{background:#e8f1ff}
      [data-chat-picker] small{display:block;color:#64748b}
      @media(max-width:1023px){[data-apso-chat]{position:fixed!important;left:0;right:0;z-index:41;margin:0!important;border-radius:0}html.apso-chat-keyboard nav.fixed{visibility:hidden}html.apso-chat-keyboard [data-apso-chat]>div:first-child{display:none}[data-apso-chat]>div:first-child>div:first-child{gap:8px}[data-apso-chat]>div:first-child h2{font-size:15px}[data-apso-chat]>div:first-child button{padding:5px 8px;font-size:11px}}
    `;document.head.appendChild(style);
    let baseline=window.innerHeight;
    const resize=()=>{
      const vv=window.visualViewport,h=vv?vv.height:window.innerHeight,offset=vv?vv.offsetTop:0;
      const focused=root.contains(document.activeElement)&&document.activeElement.tagName==='TEXTAREA';
      if(!focused)baseline=Math.max(baseline,window.innerHeight);
      const keyboard=focused&&baseline-h>120;
      document.documentElement.classList.toggle('apso-chat-keyboard',keyboard);
      if(window.innerWidth<1024){
        const header=document.querySelector('header.fixed'),nav=document.querySelector('nav.fixed');
        const top=keyboard?offset:Math.max(offset,header?.getBoundingClientRect().bottom||0);
        root.style.top=top+'px';root.style.height=Math.max(120,h+offset-top-(keyboard?0:nav?.getBoundingClientRect().height||64))+'px';
      }else{root.style.top='';root.style.height=Math.max(260,window.innerHeight-root.getBoundingClientRect().top-20)+'px'}
    };
    const input=()=>{const el=root.querySelector('textarea');if(el){el.style.height='auto';el.style.height=Math.min(96,el.scrollHeight)+'px'}resize()};
    window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);root.addEventListener('focusin',resize);root.addEventListener('focusout',resize);root.addEventListener('input',input);resize();
    return()=>{style.remove();document.documentElement.classList.remove('apso-chat-keyboard');window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('scroll',resize);root.removeEventListener('focusin',resize);root.removeEventListener('focusout',resize);root.removeEventListener('input',input)};
  },[active]);
}
if(typeof module!=='undefined')module.exports={apsoChatNormalize,apsoChatContext,apsoChatReconcile};
