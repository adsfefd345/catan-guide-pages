window.CatanReplay={mount(host,restart){
const button=document.createElement('button');button.type='button';button.className='animation-replay';button.hidden=true;button.title='애니메이션 다시보기';button.setAttribute('aria-label','애니메이션 다시보기');
button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2.6 8.4M3 4v6h6"/></svg>';
button.addEventListener('click',event=>{event.stopPropagation();host.closest('[tabindex]')?.focus({preventScroll:true});button.hidden=true;restart();});host.append(button);
return{set:complete=>{button.hidden=!complete;}};
}};
window.CatanIntro={mount({container,article,initialIndex=0,autoplayInitial=initialIndex===0,onChange=()=>{},onPlayersChange=()=>{},onStartChoice=()=>{}}){
const scenes=article.sceneIds.map(id=>{const scene=window.CatanIntroScenes.find(s=>s.id===id);return ['553:73875','760:5034'].includes(id)?{...scene,advanceChoice:true}:scene;});
const viewport=document.createElement('div');viewport.className='import-viewport';viewport.tabIndex=0;viewport.setAttribute('role','group');container.replaceChildren(viewport);
let index=initialIndex,video=null,disposed=false,frame=null,complete=true,generation=0,board=null,replay=null,ruleLinks=[];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function report(){if(disposed)return;board?.update(complete);for(const link of ruleLinks)link.hidden=!(complete&&(!video||(video.readyState>=2&&!video.seeking)));replay?.set(complete&&video?.readyState>=2&&!video.seeking);const fraction=video?(complete?1:video.duration?Math.min(1,video.currentTime/video.duration):0):1;onChange(index,fraction,!!video&&!video.paused&&!complete);}
function fit(){if(frame){const scale=viewport.clientWidth/390;frame.style.transform='scale('+scale+')';viewport.style.height=680*scale+'px';}else viewport.style.height='';}
function show(value,{skip=false,autoplay=false,historyMode='replace'}={}){
if(disposed)return;index=Math.max(0,Math.min(scenes.length-1,value));generation++;const current=generation;
board?.destroy();board=null;replay=null;ruleLinks=[];if(video){video.pause();video.removeAttribute('src');video.load();}video=null;frame=null;viewport.replaceChildren();
const scene=scenes[index];viewport.dataset.page=String(index+1);viewport.setAttribute('aria-label',article.title+' '+(index+1)+' / '+scenes.length);
viewport.dataset.sceneId=scene.id;
if(scene.step)viewport.dataset.step=scene.step;else delete viewport.dataset.step;
if(scene.description){const description=document.createElement('p');description.className='sr-only';description.id='current-scene-description';description.textContent=scene.description;viewport.append(description);viewport.setAttribute('aria-describedby',description.id);}else viewport.removeAttribute('aria-describedby');
if(scene.video){complete=false;const media=video=document.createElement('video');media.className='import-video';media.muted=true;media.playsInline=true;media.preload='auto';media.disablePictureInPicture=true;media.src=scene.video;media.setAttribute('aria-label',article.title+' '+(index+1));viewport.append(media);
const live=()=>!disposed&&current===generation;
media.addEventListener('loadeddata',()=>{if(!live())return;if(skip||reduced.matches){complete=true;media.currentTime=media.duration;report();}else if(autoplay||scene.advanceChoice)media.play().catch(()=>report());});
for(const event of ['timeupdate','playing','pause','seeked'])media.addEventListener(event,()=>{if(live())report();});
media.addEventListener('ended',()=>{if(live()){complete=true;report();}});
}else if(scene.image){complete=true;const image=document.createElement('img');image.className='import-scene-image';image.src=scene.image;image.alt=scene.description||scene.title;image.width=390;image.height=680;viewport.append(image);
}else{complete=true;frame=document.createElement('div');frame.className='import-frame';frame.innerHTML=scene.html;viewport.append(frame);}
if(article.sceneGroups){const choices=document.createElement('div');choices.className='prep-player-count';choices.setAttribute('role','group');choices.setAttribute('aria-label','플레이 인원');for(const count of [3,4]){const button=document.createElement('button');button.type='button';button.textContent=count+'인용';button.setAttribute('aria-pressed',String(article.players===count));button.addEventListener('click',()=>{if(article.players!==count)onPlayersChange(count);});choices.append(button);}viewport.append(choices);}
if(scene.board)board=mountFigmaBoard(viewport,video,scene.elementMap);
const ruleTargets=[];
if(['689:2715','754:6129','760:10939','760:23200'].includes(scene.id))ruleTargets.push({id:'figma-781:3341',label:'건설 규칙 바로가기',x:24,y:510,w:142,h:28});
if(['487:11137','549:505'].includes(scene.id))ruleTargets.push({id:'figma-790:3394',label:'도둑 규칙 바로가기',x:213,y:374,w:43,h:30,map:true});
if(['777:6259','777:12454'].includes(scene.id))ruleTargets.push({id:'figma-790:3394',label:'도둑 규칙 바로가기',x:24,y:147,w:120,h:30});
if(['781:3347','781:3377'].includes(scene.id))ruleTargets.push({id:'figma-790:3394',label:'도둑 규칙 바로가기',x:24,y:347,w:32,h:28});
for(const target of ruleTargets){const link=document.createElement('a');link.className='scene-rule-link'+(target.map?' scene-rule-link-map':'');link.href='article.html?id='+encodeURIComponent(target.id)+'&introPage=1';link.setAttribute('aria-label',target.label);link.title=target.label;link.style.cssText='left:'+target.x/390*100+'%;top:'+target.y/680*100+'%;width:'+target.w/390*100+'%;height:'+target.h/680*100+'%';for(const event of ['pointerdown','pointerup','click','keydown'])link.addEventListener(event,e=>e.stopPropagation());viewport.append(link);ruleLinks.push(link);}
if(scene.resultImage){const spec=scene.resultImage,result=document.createElement('div'),image=document.createElement('img');result.className='progress-result-image';result.hidden=true;result.style.cssText='position:absolute;pointer-events:none;left:'+spec.x/390*100+'%;top:'+spec.y/680*100+'%;width:'+spec.width/390*100+'%;height:'+spec.height/680*100+'%;background:'+spec.background;image.src=spec.src;image.alt=spec.alt;image.style.cssText='display:block;width:100%;height:100%;object-fit:contain;margin:0;border-radius:0';result.append(image);viewport.append(result);board={update(done){result.hidden=!(video.readyState>=2&&!video.seeking&&(done||video.currentTime>=spec.at));},destroy(){result.remove();}};}
if(scene.advanceChoice){const choices=[['yes','네, 제가 시작 플레이어입니다.'],['no','아니요, 시작 플레이어가 아닙니다.']].map(([value,label])=>{const choice=document.createElement('button');choice.type='button';choice.className='progress-start-choice'+(value==='no'?' progress-start-choice-no':'');choice.setAttribute('aria-label',label);choice.hidden=true;choice.addEventListener('click',e=>{e.stopPropagation();onStartChoice(value);});for(const event of ['pointerdown','pointerup'])choice.addEventListener(event,e=>e.stopPropagation());viewport.append(choice);return choice;});board={update(done){for(const choice of choices)choice.hidden=!(done&&(!video||(video.readyState>=2&&!video.seeking)));},destroy(){choices.forEach(choice=>choice.remove());}};}
if(scene.progressPlayers&&!article.sceneGroups){const link=document.createElement('a');link.className='progress-player-link';link.href='article.html?id='+encodeURIComponent('figma-pages-'+encodeURIComponent('게임 준비'))+'&players=3&introPage=6';link.setAttribute('aria-label','3인용');viewport.append(link);}
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

// Original completed-board variants and slider artwork; no synthetic rotation.
function mountFigmaBoard(host,video,key){
 const ids={
  '4-4':['562:10155','562:11086','562:12017','562:12948','562:13879','562:14810'],
  '3-4':['562:15742','562:16473','562:17204','562:17935','562:18666','562:19397'],
  '4-3':['562:22255','562:22726','562:23198','562:23670','562:24142','562:24614'],
  '3-3':['562:25087','562:25558','562:26030','562:26502','562:26974','562:27446']
 };
 const renderedBounds={"4-4":{"0":{"x":0,"y":0,"width":390,"height":346},"60":{"x":-18.923583984375,"y":-40,"width":427.846923828125,"height":418.5263671875},"120":{"x":-18.923583984375,"y":-40,"width":427.846923828125,"height":418.5263671875},"180":{"x":0,"y":0,"width":390,"height":346},"240":{"x":-18.92333984375,"y":-65.945068359375,"width":427.846923828125,"height":441.945068359375},"300":{"x":-18.923583984375,"y":-65.945068359375,"width":427.846923828125,"height":441.945068359375}},"3-4":{"0":{"x":0,"y":0,"width":390,"height":346},"60":{"x":-18.9234619140625,"y":-40,"width":427.846923828125,"height":418.5263671875},"120":{"x":-18.9234619140625,"y":-40,"width":427.846923828125,"height":418.5263671875},"180":{"x":0,"y":0,"width":390,"height":346},"240":{"x":-18.9234619140625,"y":-65.945068359375,"width":427.846923828125,"height":441.945068359375},"300":{"x":-18.9234619140625,"y":-65.945068359375,"width":427.846923828125,"height":441.945068359375}},"4-3":{"0":{"x":0,"y":0,"width":390,"height":346},"60":{"x":-18.923583984375,"y":-40,"width":427.846923828125,"height":418.5262451171875},"120":{"x":-18.923583984375,"y":-40,"width":427.846923828125,"height":418.5262451171875},"180":{"x":0,"y":0,"width":390,"height":346},"240":{"x":-18.92333984375,"y":-65.9449462890625,"width":427.846923828125,"height":441.9449462890625},"300":{"x":-18.923583984375,"y":-65.9449462890625,"width":427.846923828125,"height":441.9449462890625}},"3-3":{"0":{"x":0,"y":0,"width":390,"height":346},"60":{"x":-18.9234619140625,"y":-40,"width":427.846923828125,"height":418.5262451171875},"120":{"x":-18.9234619140625,"y":-40,"width":427.846923828125,"height":418.5262451171875},"180":{"x":0,"y":0,"width":390,"height":346},"240":{"x":-18.9234619140625,"y":-65.9449462890625,"width":427.846923828125,"height":441.9449462890625},"300":{"x":-18.9234619140625,"y":-65.9449462890625,"width":427.846923828125,"height":441.9449462890625}}};
 const angles=[-180,-120,-60,0,60,120,180];
 const boardMask=angle=>'assets/completed-board-'+key+'-'+((angle+360)%360)+'.png';
 const boardSource=angle=>'assets/completed-board-'+key+'-'+((angle+360)%360)+'-4x.png';
 const sliderSource=angle=>'assets/figma-rotation-slider-'+angle+'.svg';
 const inline=document.createElement('div');inline.className='prep-board-elements';inline.hidden=true;
 const boardImage=document.createElement('img');boardImage.className='figma-completed-board-image';boardImage.width=390;boardImage.height=346;const inlineMask=document.createElement('div');inlineMask.className='figma-completed-board-mask';inlineMask.append(boardImage);inline.append(inlineMask);
 const createControl=(label,className)=>{
  const control=document.createElement('label');control.className='figma-rotation-control '+className;
  const scale=document.createElement('div');scale.className='figma-rotation-scale';
  const artwork=document.createElement('img');artwork.className='figma-rotation-art';artwork.alt='';artwork.height=36;artwork.setAttribute('aria-hidden','true');
  const input=document.createElement('input');input.type='range';input.min='-180';input.max='180';input.step='60';input.value='0';input.disabled=true;input.setAttribute('aria-label',label);
  scale.append(artwork,input);control.append(scale);return{control,scale,artwork,input};
 };
 const normal=createControl('지도 회전 각도','prep-board-control');normal.control.hidden=true;
 const full=document.createElement('button');full.type='button';full.className='prep-board-fullscreen';full.setAttribute('aria-label','지도 전체화면');full.innerHTML='<span aria-hidden="true">⛶</span>전체화면';full.disabled=true;
 const dialog=document.createElement('dialog');dialog.className='prep-board-dialog';dialog.setAttribute('aria-label','카탄 지도 전체화면');
 const close=document.createElement('button');close.type='button';close.className='prep-board-close';close.setAttribute('aria-label','전체화면 닫기');close.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>';
 const enlarged=document.createElement('div');enlarged.className='prep-board-enlarged';
 const enlargedImage=boardImage.cloneNode(),largeMask=inlineMask.cloneNode();largeMask.append(enlargedImage);enlarged.append(largeMask);
 const large=createControl('전체화면 지도 회전 각도','prep-board-dialog-control');
 dialog.append(close,enlarged,large.control);document.body.append(dialog);host.append(inline,normal.control,full);
 let ready=false,imagesReady=false,disposed=false,lastComplete=false,angle=0;
 const fit=()=>{for(const c of [normal,large])c.scale.style.transform='scale('+c.control.clientWidth/294+')';};
 function rotate(value){
  angle=Math.max(-180,Math.min(180,Math.round(Number(value)/60)*60));
  const direction=(angle+360)%360,bounds=renderedBounds[key][direction];
  for(const mask of [inlineMask,largeMask])mask.style.maskImage='url("'+(window.CatanBoardMaskData?.[boardMask(angle)]||boardMask(angle))+'")';
  for(const image of [boardImage,enlargedImage]){image.src=boardSource(angle);image.style.left=bounds.x/390*100+'%';image.style.top=bounds.y/346*100+'%';image.style.width=bounds.width/390*100+'%';image.style.height=bounds.height/346*100+'%';image.alt=key[0]+'인용 게임 준비 '+key[2]+'단계 완료 게임판 · '+angle+'도';image.dataset.nodeId=ids[key][direction/60];}
  for(const c of [normal,large]){c.input.value=String(angle);c.input.setAttribute('aria-valuetext',angle+'도');c.artwork.src=sliderSource(angle);c.artwork.width=Math.abs(angle)===180?308:302;c.artwork.style.left=(angle===-180?-10:-4)+'px';}
  inline.dataset.angle=enlarged.dataset.angle=String(angle);fit();
 }
 for(const c of [normal,large]){c.input.addEventListener('input',()=>rotate(c.input.value));for(const event of ['pointerdown','pointerup','click','keydown'])c.control.addEventListener(event,e=>e.stopPropagation());}
 close.addEventListener('click',()=>dialog.close());
 full.addEventListener('click',()=>{if(!ready)return;dialog.showModal();fit();close.focus();});
 for(const event of ['pointerdown','pointerup','click','keydown'])full.addEventListener(event,e=>e.stopPropagation());
 const observer=new ResizeObserver(fit);observer.observe(normal.control);observer.observe(large.control);
 rotate(0);
 const preload=src=>{const image=new Image();image.src=src;return image.decode();};
 Promise.all([...new Set(angles.map(boardSource)),...new Set(angles.map(boardMask)),...angles.map(sliderSource)].map(preload)).then(()=>{if(!disposed){imagesReady=true;update(lastComplete);}}).catch(()=>{if(!disposed)host.dataset.boardLoadError='true';});
 function update(complete){
  lastComplete=complete;const available=complete&&video.readyState>=2&&!video.seeking&&imagesReady;
  normal.input.disabled=large.input.disabled=full.disabled=!available;normal.control.hidden=!available;inline.hidden=!available;
  if(available){if(!ready){ready=true;rotate(0);}fit();}else ready=false;
 }
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
