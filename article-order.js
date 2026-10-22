(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CatanOrder=api;})(typeof window==='object'?window:globalThis,()=>{
  const key='catan-guide-order';
  function read(storage){try{const ids=JSON.parse(storage.getItem(key)||'[]');return Array.isArray(ids)?[...new Set(ids.filter(id=>typeof id==='string'))]:[];}catch{return [];}}
  function sort(articles,ids){const rank=new Map(ids.map((id,i)=>[id,i]));return articles.map((a,i)=>({a,i})).sort((x,y)=>(rank.get(x.a.id)??Infinity)-(rank.get(y.a.id)??Infinity)||x.i-y.i).map(x=>x.a);}
  function numbers(articles){const counts=new Map(),result=new Map();for(const a of articles){const n=(counts.get(a.category)||0)+1;counts.set(a.category,n);result.set(a.id,n);}return result;}
  function mergeVisible(all,visible){const set=new Set(visible);let i=0;return all.map(id=>set.has(id)?visible[i++]:id);}
  function attach({list,enabled,commit,announce}){
    let state=null,blockClickUntil=0,raf=0;
    const rows=()=>[...list.querySelectorAll('.article-row')];
    function cleanup(){if(!state)return;clearTimeout(state.timer);cancelAnimationFrame(raf);state.row.classList.remove('is-dragging');list.classList.remove('is-reordering');state=null;}
    function cancel(){finish(true);}
    function finish(cancelled){if(!state)return;const active=state.active,original=state.original;const current=rows().map(r=>r.dataset.articleId);if(active)blockClickUntil=Date.now()+700;cleanup();if(active){if(cancelled){const byId=new Map(rows().map(r=>[r.dataset.articleId,r]));original.forEach(id=>list.append(byId.get(id)));announce('순서 변경을 취소했어요.');}else{commit(current);}}}
    function place(x,y){const target=document.elementFromPoint(x,y)?.closest('.article-row');if(!target||target===state.row||!list.contains(target))return;const box=target.getBoundingClientRect();list.insertBefore(state.row,y<box.top+box.height/2?target:target.nextSibling);}
    function scroll(){if(!state?.active)return;const header=document.querySelector('.site-header');const top=(header?.getBoundingClientRect().bottom||0)+48;const bottom=window.innerHeight-70;const dy=state.y<top?-10:state.y>bottom?10:0;if(dy){window.scrollBy(0,dy);place(state.x,state.y);}raf=requestAnimationFrame(scroll);}
    function start(row,x,y,kind){if(!enabled()||state)return;state={row,x,y,startX:x,startY:y,kind,active:false,original:rows().map(r=>r.dataset.articleId)};state.timer=setTimeout(()=>{if(!state||!enabled())return cancel();state.active=true;row.classList.add('is-dragging');list.classList.add('is-reordering');announce('이동할 위치로 끌어 놓으세요.');raf=requestAnimationFrame(scroll);},450);}
    function move(event,x,y,kind){if(!state||state.kind!==kind)return;if(!enabled())return finish(true);if(!state.active){if(Math.hypot(x-state.startX,y-state.startY)>10)cleanup();return;}event.preventDefault();state.x=x;state.y=y;place(x,y);}
    list.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'||event.button!==0)return;const row=event.target.closest('.article-row');if(row)start(row,event.clientX,event.clientY,'pointer');});
    window.addEventListener('pointermove',event=>move(event,event.clientX,event.clientY,'pointer'));
    window.addEventListener('pointerup',()=>{if(state?.kind==='pointer')finish(false)});
    window.addEventListener('pointercancel',()=>{if(state?.kind==='pointer')finish(true)});
    list.addEventListener('touchstart',event=>{if(event.touches.length!==1){finish(true);return;}const row=event.target.closest('.article-row'),t=event.touches[0];if(row)start(row,t.clientX,t.clientY,'touch');},{passive:true});
    window.addEventListener('touchmove',event=>{if(event.touches.length!==1){finish(true);return;}const t=event.touches[0];move(event,t.clientX,t.clientY,'touch');},{passive:false});
    window.addEventListener('touchend',event=>{if(state?.kind!=='touch')return;if(state.active)event.preventDefault();finish(false)},{passive:false});
    window.addEventListener('touchcancel',()=>{if(state?.kind==='touch')finish(true)});
    list.addEventListener('click',event=>{if(Date.now()<blockClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
    list.addEventListener('contextmenu',event=>{if(enabled())event.preventDefault();});
    list.addEventListener('dragstart',event=>{if(enabled())event.preventDefault();});
    list.addEventListener('keydown',event=>{if(!enabled())return;if(event.key==='Escape'){finish(true);return;}if(!event.altKey||!['ArrowUp','ArrowDown'].includes(event.key))return;const row=event.target.closest('.article-row');if(!row)return;event.preventDefault();const order=rows().map(r=>r.dataset.articleId),i=order.indexOf(row.dataset.articleId),j=i+(event.key==='ArrowUp'?-1:1);if(j<0||j>=order.length)return;[order[i],order[j]]=[order[j],order[i]];commit(order);rows().find(r=>r.dataset.articleId===row.dataset.articleId)?.focus();});
    window.addEventListener('blur',()=>finish(true));
    return {cancel};
  }
  return {key,read,sort,numbers,mergeVisible,attach};
});

