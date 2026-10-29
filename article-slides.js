(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CatanSlides=api;})(typeof window==='object'?window:globalThis,()=>{
 function mount({container,slides,initialId,onChange=()=>{}}){
  if(!slides.length)return null;
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
  const region=el('section','guide-slideshow');region.setAttribute('aria-label','터치로 넘기는 가이드');
  const stage=el('div','slide-stage');stage.tabIndex=0;stage.setAttribute('role','group');
  const content=el('div','slide-content'),hint=el('p','slide-hint');stage.append(content,hint);
  const controls=el('div','slide-controls'),prev=el('button','slide-prev','← 이전'),next=el('button','slide-next','다음 →'),counter=el('span','slide-counter'),restart=el('button','slide-restart','처음부터');
  for(const b of [prev,next,restart])b.type='button';counter.setAttribute('role','status');counter.setAttribute('aria-live','polite');counter.setAttribute('aria-atomic','true');
  controls.append(prev,counter,next);region.append(stage,controls,restart);container.append(region);
  let index=Math.max(0,slides.findIndex(s=>s.id===initialId)),start=null,moved=false;
  function show(value){if(value<0){window.CatanArticleEnd?.start();return;}if(value>=slides.length){window.CatanArticleEnd?.show();return;}index=Math.max(0,Math.min(slides.length-1,value));const slide=slides[index];content.replaceChildren();
   const title=el('h3','slide-title',slide.title||String(index+1));content.append(title);
   for(const block of slide.blocks||[]){if(block.type==='text'||block.type==='heading'){content.append(el(block.type==='heading'?'h4':'p','',block.text));}else if(block.type==='image'&&(/^(?:data:image\/(?:png|jpeg|webp);base64,|assets\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|svg)$)/.test(block.src))){const img=el('img');img.src=block.src;img.alt=block.alt||slide.title||'';content.append(img)}}
   if(!(slide.blocks||[]).length)content.append(el('p','article-empty','아직 작성된 내용이 없어요.'));
   prev.disabled=index===0;next.disabled=index===slides.length-1;restart.hidden=slides.length<2||index!==slides.length-1;
   counter.textContent=(index+1)+' / '+slides.length;stage.setAttribute('aria-label',(index+1)+' / '+slides.length+' · '+(slide.title||'슬라이드'));
   hint.textContent='';
   onChange(slide.id,index);
  }
  prev.addEventListener('click',()=>show(index-1));next.addEventListener('click',()=>show(index+1));restart.addEventListener('click',()=>show(0));
  window.CatanSwipe.mount(stage,direction=>show(index+direction));
  stage.addEventListener('keydown',event=>{if(event.target!==stage)return;if(['ArrowRight',' ','Enter'].includes(event.key)){event.preventDefault();show(index+1)}else if(event.key==='ArrowLeft'){event.preventDefault();show(index-1)}});
  show(index);return{goTo:show,getIndex:()=>index,stage,region};
 }
 return{mount};
});
