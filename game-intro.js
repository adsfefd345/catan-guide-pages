window.CatanReplay={mount(host,restart){
const button=document.createElement('button');button.type='button';button.className='animation-replay';button.hidden=true;button.title='애니메이션 다시보기';button.setAttribute('aria-label','애니메이션 다시보기');
button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2.6 8.4M3 4v6h6"/></svg>';
button.addEventListener('click',event=>{event.stopPropagation();host.closest('[tabindex]')?.focus({preventScroll:true});button.hidden=true;restart();});host.append(button);
return{set:complete=>{button.hidden=!complete;}};
}};
window.CatanIntro={mount({container,article,initialIndex=0,autoplayInitial=initialIndex===0,onChange=()=>{},onPlayersChange=()=>{}}){
const scenes=article.sceneIds.map(id=>id==='91:303'?{id,html:catanPiecesScene()}:window.CatanIntroScenes.find(s=>s.id===id));
const viewport=document.createElement('div');viewport.className='import-viewport';viewport.tabIndex=0;viewport.setAttribute('role','group');container.replaceChildren(viewport);
let index=initialIndex,video=null,disposed=false,frame=null,complete=true,generation=0,board=null,replay=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function report(){if(disposed)return;board?.update(complete);replay?.set(complete&&video?.readyState>=2&&!video.seeking);const fraction=video?(complete?1:video.duration?Math.min(1,video.currentTime/video.duration):0):1;onChange(index,fraction,!!video&&!video.paused&&!complete);}
function fit(){if(frame){const scale=viewport.clientWidth/390;frame.style.transform='scale('+scale+')';viewport.style.height=680*scale+'px';}else viewport.style.height='';}
function show(value,{skip=false,autoplay=false,historyMode='replace'}={}){
if(disposed)return;index=Math.max(0,Math.min(scenes.length-1,value));generation++;const current=generation;
board?.destroy();board=null;replay=null;if(video){video.pause();video.removeAttribute('src');video.load();}video=null;frame=null;viewport.replaceChildren();
const scene=scenes[index];viewport.dataset.page=String(index+1);viewport.setAttribute('aria-label',article.title+' '+(index+1)+' / '+scenes.length);
if(scene.video){complete=false;const media=video=document.createElement('video');media.className='import-video';media.muted=true;media.playsInline=true;media.preload='auto';media.disablePictureInPicture=true;media.src=scene.video;media.setAttribute('aria-label',article.title+' '+(index+1));viewport.append(media);
const live=()=>!disposed&&current===generation;
media.addEventListener('loadeddata',()=>{if(!live())return;if(skip||reduced.matches){complete=true;media.currentTime=media.duration;report();}else if(autoplay||scene.advanceChoice)media.play().catch(()=>report());});
for(const event of ['timeupdate','playing','pause','seeked'])media.addEventListener(event,()=>{if(live())report();});
media.addEventListener('ended',()=>{if(live()){complete=true;report();}});
}else{complete=true;frame=document.createElement('div');frame.className='import-frame';frame.innerHTML=scene.html;viewport.append(frame);}
if(article.sceneGroups){const choices=document.createElement('div');choices.className='prep-player-count';choices.setAttribute('role','group');choices.setAttribute('aria-label','플레이 인원');for(const count of [3,4]){const button=document.createElement('button');button.type='button';button.textContent=count+'인용';button.setAttribute('aria-pressed',String(article.players===count));button.addEventListener('click',()=>{if(article.players!==count)onPlayersChange(count);});choices.append(button);}viewport.append(choices);}
if(scene.board)board=scene.elementMap?mountFigmaBoard(viewport,video,scene.elementMap):mountPrepBoard(viewport,video);
if(scene.advanceChoice){const choice=document.createElement('button');choice.type='button';choice.className='progress-start-choice';choice.setAttribute('aria-label','네, 제가 시작 플레이어입니다.');choice.hidden=true;choice.addEventListener('click',e=>{e.stopPropagation();show(index+1,{autoplay:true});viewport.focus({preventScroll:true});});for(const event of ['pointerdown','pointerup'])choice.addEventListener(event,e=>e.stopPropagation());viewport.append(choice);board={update(done){choice.hidden=!(done&&video.readyState>=2&&!video.seeking);},destroy(){choice.remove();}};}
if(scene.progressPlayers){const link=document.createElement('a');link.className='progress-player-link';link.href='article.html?id='+encodeURIComponent('figma-pages-'+encodeURIComponent('게임 준비'))+'&players=3&introPage=6';link.setAttribute('aria-label','3인용');viewport.append(link);}
if(video)replay=window.CatanReplay.mount(viewport,()=>{complete=false;video.currentTime=0;report();video.play().catch(()=>{complete=true;report();});});
fit();report();const url=new URL(location.href);url.searchParams.set('introPage',index+1);url.searchParams.delete('component');url.searchParams.delete('page');if(historyMode!=='none')history[historyMode==='push'?'pushState':'replaceState']({},'',url);
}
function finish(){if(!video)return;complete=true;video.pause();if(Number.isFinite(video.duration))video.currentTime=video.duration;report();}
function go(direction){if(scenes[index].advanceChoice){report();return;}if(direction<0){if(index===0){window.CatanArticleEnd.start();return;}show(index-1,{skip:true});return;}
if(video&&!complete){if(video.paused&&video.currentTime===0){if(reduced.matches)finish();else video.play().catch(()=>report());}else finish();return;}
if(index+1>=scenes.length){window.CatanArticleEnd.show();return;}show(index+1,{autoplay:true});}
const removeSwipe=window.CatanSwipe.mount(viewport,go);viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;if(['ArrowLeft','ArrowRight',' '].includes(e.key)){e.preventDefault();go(e.key==='ArrowLeft'?-1:1);}});
const observer=new ResizeObserver(fit);observer.observe(viewport);show(initialIndex,{historyMode:'none',autoplay:autoplayInitial,skip:new URLSearchParams(location.search).get('skipMotion')==='1'});
return{stage:viewport,getIndex:()=>index,goTo:i=>{let target=Math.max(0,Math.min(scenes.length-1,i));for(let n=index;n<target;n++)if(scenes[n].advanceChoice){target=n;break;}if(target===index){report();return;}show(target,{skip:true});},destroy(){disposed=true;generation++;board?.destroy();removeSwipe();observer.disconnect();if(video){video.pause();video.removeAttribute('src');video.load();}}};
}};

// Completed maps use the individual authored Figma layers, not a video crop.
function mountFigmaBoard(host,video,key){
 const maps=window.CatanFigmaElements.maps;
 const inline=document.createElement('div');inline.className='prep-board-elements';inline.hidden=true;inline.setAttribute('role','img');inline.setAttribute('aria-label','회전 가능한 카탄 배치 지도');
 const control=document.createElement('label');control.className='prep-board-control';control.innerHTML='<input type="range" min="-180" max="180" step="60" value="0" aria-label="지도 회전 각도">';const slider=control.firstElementChild;
 const full=document.createElement('button');full.type='button';full.className='prep-board-fullscreen';full.setAttribute('aria-label','지도 전체화면');full.innerHTML='<span aria-hidden="true">⛶</span>전체화면';
 const dialog=document.createElement('dialog');dialog.className='prep-board-dialog';dialog.setAttribute('aria-label','카탄 지도 전체화면');
 const close=document.createElement('button');close.type='button';close.className='prep-board-close';close.setAttribute('aria-label','전체화면 닫기');close.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>';
 const enlarged=document.createElement('div');enlarged.className='prep-board-enlarged';enlarged.setAttribute('role','img');enlarged.setAttribute('aria-label','확대한 카탄 배치 지도');
 const largeSlider=slider.cloneNode();largeSlider.setAttribute('aria-label','전체화면 지도 회전 각도');dialog.append(close,enlarged,largeSlider);document.body.append(dialog);host.append(inline,control,full);
 const layers=[inline,enlarged].map(parent=>{const scale=document.createElement('div');scale.className='figma-map-scale';scale.innerHTML=maps[key];parent.append(scale);const drawing=scale.firstElementChild;drawing.classList.add('figma-map-drawing');drawing.style.width='390px';drawing.style.height='346px';return{parent,scale,drawing,upright:[...drawing.querySelectorAll('[data-name]')].filter(e=>/초보자 숫자 칩|마을 · 흰색 테두리 그룹|도둑 · 사막/.test(e.dataset.name))};});
 let ready=false,angle=0,disposed=false,lastComplete=false;
 const fit=()=>{for(const {parent,scale}of layers)scale.style.transform='scale('+parent.clientWidth/390+')';};
 function rotate(value){angle=Number(value);slider.value=largeSlider.value=String(angle);slider.setAttribute('aria-valuetext',angle+'도');largeSlider.setAttribute('aria-valuetext',angle+'도');control.style.setProperty('--rotation-progress',((angle+180)/360*100)+'%');
  const rad=angle*Math.PI/180,vertices=[[-171,0],[-85.5,-148.29],[85.5,-148.29],[171,0],[85.5,148.29],[-85.5,148.29]].map(([x,y])=>[x*Math.cos(rad)-y*Math.sin(rad),x*Math.sin(rad)+y*Math.cos(rad)]);const span=n=>Math.max(...vertices.map(p=>p[n]))-Math.min(...vertices.map(p=>p[n]));const factor=Math.min(1,342/span(0),296.58/span(1));
  for(const {drawing,upright}of layers){drawing.style.transform='scale('+factor+') rotate('+angle+'deg)';for(const node of upright)node.style.rotate=-angle+'deg';}inline.dataset.angle=String(angle);fit();
 }
 slider.addEventListener('input',()=>rotate(slider.value));largeSlider.addEventListener('input',()=>rotate(largeSlider.value));close.addEventListener('click',()=>dialog.close());full.addEventListener('click',()=>{if(!ready)return;dialog.showModal();fit();close.focus();});
 for(const el of [control,full])for(const event of ['pointerdown','pointerup','click','keydown'])el.addEventListener(event,e=>e.stopPropagation());
 const observer=new ResizeObserver(fit);observer.observe(inline);observer.observe(enlarged);
 const loaded=Promise.all([...inline.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));let imagesReady=false;loaded.then(()=>{if(!disposed){imagesReady=true;update(lastComplete);}});
 function update(complete){lastComplete=complete;const available=complete&&video.readyState>=2&&!video.seeking&&imagesReady;slider.disabled=full.disabled=!available;if(available){inline.hidden=false;if(!ready){ready=true;rotate(0);}fit();}else{ready=false;inline.hidden=true;}}
 return{update,destroy(){disposed=true;observer.disconnect();if(dialog.open)dialog.close();dialog.remove();}};
}

// Render the pieces on the panel itself: a GIF's opaque, quantized background
// cannot match either the panel color or the compressed video behind it.
function catanPiecesScene(){
const text=(id,x,y,content,extra='')=>`<p data-node-id="${id}" style="position:absolute;left:${x}px;top:${y}px;${extra}">${content}</p>`;
const img=(id,x,y,w,h,src)=>`<img data-node-id="${id}" alt="" src="${src}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;object-fit:contain">`;
const pieces=['city','settlement','road_left'];
const colors=['red','orange','blue','white'];
return `<div class="intro-pieces-scene" data-node-id="91:303">
${text('91:305',24,32,'게임 소개','font-size:12px;color:#c64c2d')}
${text('91:306',24,66,'게임 구성물','font-size:28px;line-height:34px;font-weight:700')}
${text('91:307',24,131,'<b>건설비용카드</b> 건설비와 승점을 보여줍니다.')}
${img('400:1130',43,170,70,80,'assets/game-intro-20261029/4eb0c4de-181b-4db3-afdc-26d7fea6166e.png')}
${text('400:1197',128,219,'x4')}
${text('400:1231',24,281,'게임 말','font-weight:700')}
<div class="intro-pieces-panel" data-node-id="390:99"></div>
${text('97:529',36,323,'<span style="font-weight:500">플레이어 말 :</span><br>4가지 색이 존재합니다.(빨강, 주황, 파랑, 하양)')}
<div class="import-pieces" data-node-id="439:3" role="img" aria-label="빨강, 주황, 파랑, 하양의 도시, 마을, 도로 말">
${colors.map((color,i)=>`<div class="intro-piece-color" style="--color-index:${i}">${pieces.map((piece,j)=>img('',17.5+j*120,5,65,65,`assets/game-intro-20261029/${color}_${piece}.png`)).join('')}</div>`).join('')}
</div>
${['도시 x4','마을 x5','도로 x15'].map((label,i)=>text('',76.5+i*118,443,label,'transform:translateX(-50%);font-weight:500')).join('')}
${['자원 2 생산<br>승점 2점','자원 1 생산<br>승점 1점','자원 생산 X<br>승점 0점'].map((label,i)=>text('400:'+([1270,1272,1274][i]),76.5+i*118,465,label,'transform:translateX(-50%);text-align:center')).join('')}
${text('97:528',36,528,'<span style="font-weight:500">도둑 말 :</span> 위치한 타일에서 자원 생산을 막습니다.')}
${img('97:526',42.5,559,65,65,'assets/game-intro-20261029/f7b9bc9d-0fa0-4838-a3ca-5bef61635447.png')}
${text('400:1232',119,582,' x1')}
</div>`;
}

// Interactive controls for the two board-layout stages. The video supplies the
// current authored board, so 3- and 4-player pieces always stay with their map.
function mountPrepBoard(host,video){
const canvas=document.createElement('canvas');canvas.className='prep-board-canvas';canvas.width=1026;canvas.height=890;canvas.hidden=true;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','회전 가능한 카탄 배치 지도');
const control=document.createElement('label');control.className='prep-board-control';control.innerHTML='<span class="sr-only">지도 회전</span><input type="range" min="-180" max="180" step="60" value="0" aria-label="지도 회전 각도">';
const slider=control.querySelector('input');
const full=document.createElement('button');full.type='button';full.className='prep-board-fullscreen';full.setAttribute('aria-label','지도 전체화면');full.innerHTML='<span aria-hidden="true">⛶</span>전체화면';
const dialog=document.createElement('dialog');dialog.className='prep-board-dialog';dialog.setAttribute('aria-label','카탄 지도 전체화면');
const enlarged=document.createElement('canvas');enlarged.width=1026;enlarged.height=890;enlarged.setAttribute('role','img');enlarged.setAttribute('aria-label','확대된 카탄 배치 지도');
const close=document.createElement('button');close.type='button';close.className='prep-board-close';close.setAttribute('aria-label','전체화면 닫기');close.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';close.addEventListener('click',()=>dialog.close());
const largeSlider=slider.cloneNode();largeSlider.setAttribute('aria-label','전체화면 지도 회전 각도');dialog.append(close,enlarged,largeSlider);document.body.append(dialog);host.append(canvas,control,full);
let ready=false,angle=0;
function draw(target){const ctx=target.getContext('2d'),w=target.width,h=target.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#faf4e7';if(target===canvas)ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w/2,h/2);ctx.rotate(angle*Math.PI/180);const r=angle*Math.PI/180,vertices=[[-171,0],[-85.5,-148.29],[85.5,-148.29],[171,0],[85.5,148.29],[-85.5,148.29]].map(([x,y])=>[x*Math.cos(r)-y*Math.sin(r),x*Math.sin(r)+y*Math.cos(r)]);const span=n=>Math.max(...vertices.map(p=>p[n]))-Math.min(...vertices.map(p=>p[n]));const scale=Math.min(1,342/span(0),296.58/span(1));ctx.scale(scale,scale);ctx.beginPath();ctx.moveTo(-w/2,0);ctx.lineTo(-w/4,-h/2);ctx.lineTo(w/4,-h/2);ctx.lineTo(w/2,0);ctx.lineTo(w/4,h/2);ctx.lineTo(-w/4,h/2);ctx.closePath();ctx.clip();const sx=video.videoWidth/390,sy=video.videoHeight/680;ctx.drawImage(video,24*sx,218*sy,342*sx,296.58*sy,-w/2,-h/2,w,h);ctx.restore();}
function rotate(value){if(!ready)return;angle=Number(value);slider.value=largeSlider.value=String(angle);slider.setAttribute('aria-valuetext',angle+'도');largeSlider.setAttribute('aria-valuetext',angle+'도');control.style.setProperty('--rotation-progress',((angle+180)/360*100)+'%');canvas.hidden=angle===0;canvas.dataset.angle=String(angle);draw(canvas);if(dialog.open)draw(enlarged);}
slider.addEventListener('input',()=>rotate(slider.value));largeSlider.addEventListener('input',()=>rotate(largeSlider.value));
full.addEventListener('click',()=>{if(!ready)return;dialog.showModal();draw(enlarged);close.focus();});
for(const el of [control,full])for(const event of ['pointerdown','pointerup','click','keydown'])el.addEventListener(event,e=>e.stopPropagation());
return{update(complete){const available=complete&&video.readyState>=2&&!video.seeking;slider.disabled=full.disabled=!available;if(available&&!ready){ready=true;rotate(0);}else if(!available){ready=false;canvas.hidden=true;}},destroy(){if(dialog.open)dialog.close();dialog.remove();}};
}
