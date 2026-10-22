(() => {
 if (location.protocol !== 'http:' || !['localhost','127.0.0.1'].includes(location.hostname)) return;
 let revision=window.CATAN_FIGMA_CONTENT?.revision || 'initial',busy=false;
 async function refresh(){if(busy||document.hidden)return;busy=true;try{
  const r=await fetch('/api/revision',{cache:'no-store'});if(!r.ok)return;const state=await r.json();if(state.revision===revision)return;
  const data=await fetch('/api/content',{cache:'no-store'});if(!data.ok)return;const content=await data.json();
  if(!Array.isArray(content.articles))return;window.CATAN_FIGMA_CONTENT=content;revision=content.revision;window.dispatchEvent(new Event('catan-content-updated'));
 }catch{}finally{busy=false}}
 setInterval(refresh,2000);document.addEventListener('visibilitychange',refresh);refresh();
})();
