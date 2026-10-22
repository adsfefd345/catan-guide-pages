window.CatanComponents={mount(container, {onComplete = () => {}} = {}){
const region=document.createElement('section');region.className='native-guide components-guide';const viewport=document.createElement('div');viewport.className='native-viewport';viewport.tabIndex=0;viewport.setAttribute('aria-label','게임 구성물');const scene=document.createElement('div');scene.className='native-scene components-scene';viewport.append(scene);region.append(viewport);container.replaceChildren(region);
function text(id,copy,x,y,w,cls=''){const p=document.createElement('p');p.dataset.nodeId=id;p.className='native-layer '+cls;p.textContent=copy;Object.assign(p.style,{left:x+'px',top:y+'px',width:w+'px',lineHeight:'23px'});scene.append(p);return p;}
text('9:3','게임 소개',24,32,342,'guide-category').style.lineHeight='17px';text('9:4','게임 구성물',24,66,342,'title').style.lineHeight='41px';const lead=text('86:181','',23,143,342);const bold=document.createElement('strong');bold.textContent='타일 ';lead.append(bold,'땅과 바다를 구성하는 타일입니다.');text('86:182','아무런 자원도\n생산하지 않습니다.',251,191,126).style.textAlign='center';
function tile(id,name,x,y,w,h,rotation=0,bw=w,bh=h){const wrap=document.createElement('div');wrap.className='native-layer';wrap.dataset.nodeId=id;Object.assign(wrap.style,{left:x+'px',top:y+'px',width:bw+'px',height:bh+'px',display:'flex',alignItems:'center',justifyContent:'center'});const img=document.createElement('img');img.src='assets/components-'+name+'.png';img.alt='';img.draggable=false;Object.assign(img.style,{width:w+'px',height:h+'px',transform:'rotate('+rotation+'deg)',flexShrink:'0'});wrap.append(img);scene.append(wrap);}
tile('86:177','imgDesert011',56,175,60,69);text('86:185','사막 타일 x1',132,200,110);
const rows=[
{y:243,label:'산 타일 x3',ty:275,tx:159.14,ids:['86:208','86:210','86:211'],names:['imgBrick012','imgBrick022','imgBrick032'],slots:[[26,0,60.345,70,-15,76.406,83.233],[56.14,6,59.74,69,0,59.74,69],[72.14,1,59.74,69,15,75.563,82.111]]},
{y:323.89,label:'언덕 타일 x3',ty:356,tx:159.14,ids:['86:176','86:186','86:187'],names:['imgBrick011','imgBrick021','imgBrick031'],slots:[[26,0,60.172,69.8,-15,76.188,82.995],[56.14,6.11,59.87,69.15,0,59.87,69.15],[72.1,1,59.87,69.15,15,75.727,82.289]]},
...[[406,'농지 타일 x4',['86:216','86:218','86:221','86:219'],['imgBrick013','imgBrick023','imgBrick024','imgBrick033']],[487,'초원 타일 x4',['86:227','86:229','86:230','86:231'],['imgBrick014','imgBrick025','imgBrick026','imgBrick034']],[568,'숲 타일 x4',['86:237','86:239','86:240','86:241'],['imgBrick015','imgBrick027','imgBrick028','imgBrick035']]].map(([y,label,ids,names])=>({y,label,ty:y+31,tx:168,ids,names,slots:[[12,.15,60.172,69.8,-15,76.188,82.995],[39.25,3.63,59.87,69.15,-5,65.669,74.105],[63.09,3.62,59.87,69.15,5,65.669,74.105],[y===568?81.09:80.96,0,59.87,69.15,15,75.727,82.289]]}))];
for(const row of rows){row.slots.forEach(([x,dy,w,h,r,bw,bh],i)=>tile(row.ids[i],row.names[i],x,row.y+dy,w,h,r,bw,bh));text('',row.label,row.tx,row.ty,140);}
const progress=window.CatanMotionProgress.mount(viewport);
const pages=[scene];
for(let i=2;i<=5;i++){
 const page=document.createElement('div');page.className='native-scene components-scene';page.hidden=true;
 const img=document.createElement('img');img.src='assets/components-page-'+i+'-4x.png';img.alt=['','', '바다 테두리와 자원 카드','발전 카드','건설 비용 카드, 특별 승점 카드와 플레이어 말','도둑 말, 주사위, 숫자 칩과 보관함'][i];
 Object.assign(img.style,{width:'390px',height:'680px'});page.append(img);pages.push(page);viewport.append(page);
}
const controls=document.createElement('nav');controls.className='page-turn-controls';controls.setAttribute('aria-label','구성물 페이지 이동');
const prev=document.createElement('button'),next=document.createElement('button'),counter=document.createElement('span');
prev.type=next.type='button';prev.textContent='← 이전';next.textContent='다음 →';counter.setAttribute('aria-live','polite');controls.append(prev,counter,next);region.append(controls);
let index=0,disposed=false,animation=null;
function show(value,animate=true){
 index=Math.max(0,Math.min(4,value));animation?.cancel();pages.forEach((page,i)=>page.hidden=i!==index);
 progress.set(index+1,pages.length);viewport.dataset.page=String(index+1);viewport.setAttribute('aria-label','게임 구성물 '+(index+1)+' / 5');counter.textContent=(index+1)+' / 5';prev.disabled=index===0;
 if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)animation=pages[index].animate([{opacity:0},{opacity:1}],{duration:300,easing:'ease-out'});
}
function go(direction){if(disposed)return;if(index===4&&direction>0){onComplete();return;}if(index===0&&direction<0)return;show(index+direction);const url=new URL(location.href);url.searchParams.set('component',index+1);history.replaceState(null,'',url);}
prev.onclick=()=>go(-1);next.onclick=()=>go(1);
let startPoint=null,moved=false;
viewport.addEventListener('pointerdown',e=>{startPoint={x:e.clientX,y:e.clientY};moved=false;});
viewport.addEventListener('pointermove',e=>{if(startPoint&&Math.hypot(e.clientX-startPoint.x,e.clientY-startPoint.y)>10)moved=true;});
viewport.addEventListener('pointercancel',()=>{moved=true;});
viewport.addEventListener('click',e=>{if(moved||getSelection()?.toString())return;const r=viewport.getBoundingClientRect();go(e.clientX<r.left+r.width/2?-1:1);});
viewport.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();go(e.key==='ArrowLeft'?-1:1);}});
const size=()=>{const scale=viewport.clientWidth/390;pages.forEach(page=>page.style.transform='scale('+scale+')');viewport.style.height=680*scale+'px';};const observer=new ResizeObserver(size);observer.observe(viewport);size();
const requested=Number(new URLSearchParams(location.search).get('component'));show(Number.isFinite(requested)&&requested>0?requested-1:0,false);
return{stage:viewport,destroy(){disposed=true;animation?.cancel();observer.disconnect();}};
}};
