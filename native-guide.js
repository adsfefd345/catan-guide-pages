(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CatanNative = api;
})(typeof window === 'object' ? window : globalThis, function() {
  'use strict';
  const slideIds = ['figma-15:2', 'figma-42:7'];
  const assets = ['base','seafarers','extension','cities','traders','explorers'].map(name => 'assets/guide-' + name + '.png');
  function supports(article) {
    return slideIds.includes(article.id) ||
      (article.slides?.length === 2 && article.slides.every((s,i) => s.id === slideIds[i]));
  }
  function mount({container, article, initialIndex = 0, onChange = () => {}}) {
    const standalone = slideIds.includes(article.id);
    if (standalone) initialIndex = slideIds.indexOf(article.id);
    const el = (tag, cls, text) => {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const region = el('section','native-guide');
    const viewport = el('div','native-viewport');
    if (standalone && initialIndex===1) viewport.style.visibility='hidden';
    viewport.tabIndex = 0;
    viewport.setAttribute('role','group');
    const scene = el('div','native-scene');
    viewport.append(scene);
    const hint = el('p','page-turn-hint','화면 왼쪽은 이전 페이지, 오른쪽은 다음 페이지로 이동해요.');
    const controls = el('nav','page-turn-controls');
    controls.setAttribute('aria-label','가이드 페이지 이동');
    const prev = el('a',null,'← 이전'), next = el('a',null,'다음 →');
    const counter = el('span','page-turn-count');
    counter.setAttribute('role','status');
    counter.setAttribute('aria-live','polite');
    controls.append(prev,counter,next);
    region.append(viewport,hint,controls);
    if (standalone) {
      hint.remove();
      controls.remove();
      viewport.style.cursor = 'default';
    }
    container.replaceChildren(region);
    let index = initialIndex, disposed = false, generation = 0, pointer = null, moved = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    function place(parent, node, id, x,y,w,h) {
      node.classList.add('native-layer');
      if (id) node.dataset.nodeId = id;
      Object.assign(node.style,{left:x+'px',top:y+'px',...(w?{width:w+'px'}:{}),...(h?{height:h+'px'}:{})});
      parent.append(node);
      return node;
    }
    function text(parent,id,copy,x,y,w,kind='') {
      return place(parent,el(kind==='title'?'h3':'p','native-copy '+kind,copy),id,x,y,w);
    }
    function image(parent,id,src,alt,x,y,w,h=w) {
      const img=el('img'); img.src=src;img.alt=alt;img.draggable=false;img.width=w;img.height=h;
      return place(parent,img,id,x,y,w,h);
    }
    function introContent(transition) {
      const old=el('div','native-intro-content');
      scene.append(old);
      text(old,transition?'47:49':'29:92','카탄에 오신 것을 환영합니다!',24,161,342,'bold');
      text(old,transition?'47:53':'42:5','주요 정보',24,445,342,'bold');
      const prose=text(old,transition?'47:57':'31:96','',24,200,342);
      prose.classList.add('native-prose');
      prose.append(document.createTextNode('여러분은 카탄 섬에서 자원을\n채집하고 개척지를 건설해,\n다른 이들보다 먼저 성공적으로\n정착하는 것이 목표입니다.\n\n\n'));
      const paragraph=el('span','native-justified','플레이어는 한정된 땅과 자원을 바탕으로 다른 플레이어와 경쟁하고 협력해야 합니다. 서로에게 필요한 자원을 교환하거나 앞서가는 플레이어를 함께 견제하세요.');
      prose.append(paragraph);
      // A real full-size wrapper keeps the source frame's coordinates during its fade.
      const facts=el('div','native-facts');
      if(transition)facts.dataset.nodeId='47:9';
      old.append(facts);
      for(const [copy,x,y,w,kind] of [
        ['인원',52,484,30,''],['연령',142,484,30,''],['소요 시간',252,484,63,''],
        ['3-4인',47,578,40,'bold'],['만 10+',133,578,47,'bold'],
        ['초보자',224,560,45,'muted'],['숙련자',302,560,45,'muted'],
        ['90-120분',213,580,68,'bold'],['60-90분',294,580,59,'bold']
      ])text(facts,null,copy,x,y,w,kind);
      image(facts,null,'assets/guide-players.svg','',38.5997,521.6,56.8007,38.8);
      image(facts,null,'assets/guide-age.svg','',135.6,517.6,45.8,47.8);
      image(facts,null,'assets/guide-beginner.svg','',222.1835,507.6,54.2165,51.8);
      image(facts,null,'assets/guide-experienced.svg','',300.1835,507.6,53.7165,51.8);
      if(transition)old.classList.add('native-outgoing');
    }
    function trail() {
      // Preserve the exported outline. Only the reveal mask uses the centerline:
      // trimming an outlined/tapered fill itself would create a triangular flash.
      const ns='http://www.w3.org/2000/svg';
      const svg=document.createElementNS(ns,'svg');
      svg.setAttribute('viewBox','0 0 390 680');svg.setAttribute('width','390');svg.setAttribute('height','680');
      svg.setAttribute('aria-hidden','true');svg.classList.add('native-trail');
      const maskId='guide-trail-reveal-'+generation;
      svg.innerHTML='<defs><mask id="'+maskId+'" maskUnits="userSpaceOnUse" x="-40" y="0" width="600" height="700"><path class="trail-reveal" pathLength="1" d="M57.979 246 C36.979 280 19.979 314 23.979 350 C27.979 465 114.979 574 234.979 603 C334.979 630 427.979 567 494.979 500" fill="none" stroke="white" stroke-width="48" stroke-linecap="round" stroke-linejoin="round"/></mask></defs>';
      const wrapper=document.createElementNS(ns,'g');
      wrapper.setAttribute('mask','url(#'+maskId+')');
      const art=new DOMParser().parseFromString(window.CATAN_TRAIL_SVG,'image/svg+xml').documentElement;
      art.setAttribute('x','2.0844');art.setAttribute('y','224');
      wrapper.append(document.importNode(art,true));svg.append(wrapper);
      scene.append(svg);
    }
    function expansions() {
      text(scene,'42:45','카탄의 다양한 확장팩을 만나보세요!',24,139,342,'bold');
      text(scene,'44:64','본 가이드는 기본판을 바탕으로 작성되었습니다.',24,167,342);
      for(const [id,asset,alt,x,y,w,h] of [
        ['42:53','seafarers','항해사',15,211,110,110],
        ['42:54','extension','5–6인용 확장',311,285,69,137],
        ['42:55','cities','도시와 기사',15,382,110,110],
        ['44:57','explorers','탐험가와 해적',122,499,110,110],
        ['42:56','traders','상인과 야만인',263,511,110,110]
      ])image(scene,id,'assets/guide-'+asset+'.png',alt,x,y,w,h);
      for(const [id,copy,x,y,w,color] of [
        ['42:47','항해사',132,214,45,'#009DD3'],
        ['44:62','5-6인용 확장',275,256,86,'#A41B22'],
        ['44:63','카탄 - 기본판',164,431,87,null],
        ['44:60','도시와 기사',15,503,78,'#E59B13'],
        ['44:58','탐험가와 해적',130,616,92,'#173A64'],
        ['44:61','상인과 야만인',265,627,92,'#93416F']
      ]) {
        const label=text(scene,id,copy,x,y,w);
        if(color){
          const dot=el('span','expansion-color-dot');
          dot.style.backgroundColor=color;
          dot.setAttribute('aria-hidden','true');
          label.prepend(dot);
        }
      }
    }
    const href = i => 'article.html?id='+encodeURIComponent(article.id)+'&page='+article.slides[i].pageNumber;
    function show(value, animate=false, historyMode='push') {
      index=Math.max(0,Math.min(1,value));generation++;
      scene.className='native-scene';scene.replaceChildren();
      if(index===1)trail();
      text(scene,null,article.category || '',24,32,342,'guide-category');
      text(scene,null,standalone ? article.title : '게임 소개',24,66,342,'title');
      introContent(index===1);
      if(index===1)expansions();
      image(scene,index===1?'42:50':'42:6',assets[0],'카탄 기본판',index===1?155:234,index===1?285:155,137);
      scene.dataset.page=String(index+1);
      viewport.setAttribute('aria-label',standalone ? article.title : '게임 소개 '+(index+1)+' / 2');
      counter.textContent=(index+1)+' / 2';
      if (!standalone) {
      prev.href=href(0);prev.style.visibility=index===0?'hidden':'visible';prev.tabIndex=index===0?-1:0;
      next.href=href(index===0?1:0);next.textContent=index===0?'다음 →':'처음으로';
      if(historyMode!=='none')history[historyMode==='replace'?'replaceState':'pushState']({nativeGuidePage:index+1},'',href(index));
      }
      if(animate&&index===1&&!reduced.matches)scene.classList.add('is-playing');
      scene.querySelector('.native-outgoing')?.setAttribute('aria-hidden','true');
      onChange(index);
    }
    const ready=Promise.all([
      document.fonts.load('400 16px "Catan Guide"'),
      document.fonts.load('700 16px "Catan Guide"'),
      ...assets.map(src=>{const img=new Image();img.src=src;return img.decode().catch(()=>{});})
    ]);
    function goTo(value) {
      if(disposed || standalone)return;
      show(value,index===0&&value===1);
    }
    prev.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey)return;event.preventDefault();goTo(0);});
    next.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey)return;event.preventDefault();goTo(index===0?1:0);});
    viewport.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};moved=false;});
    viewport.addEventListener('pointermove',e=>{if(pointer&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>10)moved=true;});
    viewport.addEventListener('pointercancel',()=>{moved=true;pointer=null;});
    viewport.addEventListener('click',e=>{
      if(moved||window.getSelection()?.toString())return;
      const bounds=viewport.getBoundingClientRect(),destination=index+(e.clientX<bounds.left+bounds.width/2?-1:1);
      if(destination>=0&&destination<=1)goTo(destination);
    });
    viewport.addEventListener('keydown',e=>{
      if(e.target!==viewport)return;
      if(['ArrowRight','Enter',' '].includes(e.key)){e.preventDefault();if(index===0)goTo(1);}
      if(e.key==='ArrowLeft'){e.preventDefault();if(index===1)goTo(0);}
    });
    const pop=()=>show(Number(new URLSearchParams(location.search).get('page'))===2?1:0,false,'none');
    if (!standalone) window.addEventListener('popstate',pop);
    function size(){const scale=viewport.clientWidth/390;scene.style.transform='scale('+scale+')';viewport.style.height=680*scale+'px';}
    const observer=new ResizeObserver(size);observer.observe(viewport);
    show(index,false,'none');size();
    ready.then(()=>{
      if(disposed)return;
      if(standalone && index===1)show(index,true,'none');
      viewport.style.visibility='';
      region.dataset.ready='true';
    });
    return {goTo,stage:viewport,getIndex:()=>index,destroy(){disposed=true;observer.disconnect();window.removeEventListener('popstate',pop);scene.getAnimations({subtree:true}).forEach(a=>a.cancel());}};
  }
  return {supports,mount};
});


(function(){
const stages=[{"id":"86:169","duration":3200,"items":[{"id":"86:157","name":"카드 보관함 · 자원 3칸","src":"assets/prep-img3.png","x":42,"y":458,"w":130,"h":70,"opacity":1},{"id":"86:158","name":"카드 보관함 · 자원 2칸 + 발전 1칸","src":"assets/prep-img3.png","x":221,"y":458,"w":130,"h":70,"opacity":1},{"id":"105:630","name":"orange_city 1","src":"assets/prep-imgOrangeCity1.png","x":49,"y":246,"w":50,"h":50,"opacity":1},{"id":"105:631","name":"orange_road_left 1","src":"assets/prep-imgOrangeRoadLeft1.png","x":111,"y":248,"w":50,"h":50,"opacity":1},{"id":"105:632","name":"orange_settlement 1","src":"assets/prep-imgOrangeSettlement1.png","x":86,"y":207,"w":50,"h":50,"opacity":1},{"id":"105:633","name":"storage-chest-closed 1","src":"assets/prep-imgStorageChestClosed1.png","x":216,"y":212,"w":100,"h":86,"opacity":0},{"id":"86:156","name":"storage-chest-open 1","src":"assets/prep-imgStorageChestOpen1.png","x":216,"y":201,"w":100,"h":95,"opacity":1},{"id":"111:3","name":"보관 연출 · 이미지 편집으로 비운 상자","src":"assets/prep-img.png","x":216,"y":201,"w":100,"h":95,"opacity":0},{"id":"109:22","name":"보관 연출 · orange_settlement 1 → 상자","src":"assets/prep-imgOrangeSettlement2.svg","x":132,"y":235,"w":114,"h":29.017,"opacity":1,"svg":"<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path id=\"&#235;&#179;&#180;&#234;&#180;&#128; &#236;&#151;&#176;&#236;&#182;&#156; &#194;&#183; orange_settlement 1 &#226;&#134;&#146; &#236;&#131;&#129;&#236;&#158;&#144;\" opacity=\"0\" d=\"M0 14.0167C46 -9.98332 79 -1.98332 114 29.0167\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke=\"#C64C2D\"/>\n</svg>\n"},{"id":"109:43","name":"보관 연출 · orange_city 1 → 상자","src":"assets/prep-imgOrangeCity2.svg","x":99,"y":269,"w":147,"h":23.107,"opacity":1,"svg":"<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path id=\"&#235;&#179;&#180;&#234;&#180;&#128; &#236;&#151;&#176;&#236;&#182;&#156; &#194;&#183; orange_city 1 &#226;&#134;&#146; &#236;&#131;&#129;&#236;&#158;&#144;\" opacity=\"0\" d=\"M0 19C51 29 100 20 147 0\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke=\"#C64C2D\"/>\n</svg>\n"},{"id":"109:64","name":"보관 연출 · orange_road_left 1 → 상자","src":"assets/prep-imgOrangeRoadLeft2.svg","x":160,"y":272,"w":86,"h":24.476,"opacity":1,"svg":"<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path id=\"&#235;&#179;&#180;&#234;&#180;&#128; &#236;&#151;&#176;&#236;&#182;&#156; &#194;&#183; orange_road_left 1 &#226;&#134;&#146; &#236;&#131;&#129;&#236;&#158;&#144;\" opacity=\"0\" d=\"M0 22C31 29 57 21 86 0\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke=\"#C64C2D\"/>\n</svg>\n"},{"id":"105:757","name":"resource_lumber 2","src":"assets/prep-imgResourceLumber2.png","x":285,"y":383,"w":38,"h":60,"opacity":1},{"id":"105:758","name":"resource_ore 2","src":"assets/prep-imgResourceOre2.png","x":242,"y":383,"w":38,"h":60,"opacity":1},{"id":"105:759","name":"resource_wool 2","src":"assets/prep-imgResourceWool2.png","x":199,"y":383,"w":38,"h":60,"opacity":1},{"id":"105:756","name":"resource_grain 2","src":"assets/prep-imgResourceGrain2.png","x":155,"y":383,"w":39,"h":60,"opacity":1},{"id":"105:755","name":"resource_brick 2","src":"assets/prep-imgResourceBrick2.png","x":328,"y":384,"w":38,"h":60,"opacity":1},{"id":"105:913","name":"knight_01 2","src":"assets/prep-imgKnight012.png","x":78,"y":548,"w":39,"h":60,"opacity":1},{"id":"105:914","name":"monopoly 5","src":"assets/prep-imgMonopoly5.png","x":101,"y":548,"w":39,"h":60,"opacity":1},{"id":"105:915","name":"road_building 4","src":"assets/prep-imgRoadBuilding4.png","x":126,"y":548,"w":39,"h":60,"opacity":1},{"id":"105:921","name":"year_of_plenty 5","src":"assets/prep-imgYearOfPlenty5.png","x":149,"y":548,"w":39,"h":60,"opacity":1},{"id":"105:917","name":"victory_library 1","src":"assets/prep-imgVictoryLibrary1.png","x":174,"y":548,"w":39,"h":60,"opacity":1},{"id":"105:918","name":"victory_market 1","src":"assets/prep-imgVictoryMarket1.png","x":201,"y":548,"w":39,"h":60,"opacity":1},{"id":"105:919","name":"victory_town_hall 1","src":"assets/prep-imgVictoryTownHall1.png","x":225,"y":548,"w":39,"h":60,"opacity":1},{"id":"105:916","name":"victory_cathedral 1","src":"assets/prep-imgVictoryCathedral1.png","x":249,"y":548,"w":39,"h":60,"opacity":1},{"id":"105:920","name":"victory_university 1","src":"assets/prep-imgVictoryUniversity1.png","x":273,"y":548,"w":39,"h":60,"opacity":1},{"id":"105:912","name":"10_back 1","src":"assets/prep-img10Back1.png","x":325,"y":548,"w":39,"h":60,"opacity":0}]},{"id":"115:3","duration":2400,"items":[{"id":"115:4","name":"카드 보관함 · 자원 3칸","x":42,"y":458,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-img3.png"},{"id":"115:5","name":"카드 보관함 · 자원 2칸 + 발전 1칸","x":221,"y":458,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-img3.png"},{"id":"115:13","name":"orange_city 1","x":49,"y":246,"w":50,"h":50,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgOrangeCity1.png"},{"id":"115:14","name":"orange_road_left 1","x":111,"y":248,"w":50,"h":50,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgOrangeRoadLeft1.png"},{"id":"115:15","name":"orange_settlement 1","x":86,"y":207,"w":50,"h":50,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgOrangeSettlement1.png"},{"id":"115:16","name":"storage-chest-closed 1","x":216,"y":212,"w":100,"h":86,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step2-imgStorageChestClosed1.png"},{"id":"115:17","name":"storage-chest-open 1","x":216,"y":201,"w":100,"h":95,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgStorageChestOpen1.png"},{"id":"115:18","name":"보관 연출 · 이미지 편집으로 비운 상자","x":216,"y":201,"w":100,"h":95,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step2-img.png"},{"id":"115:19","name":"보관 연출 · orange_settlement 1 → 상자","x":132,"y":235,"w":114,"h":29.017,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgOrangeSettlement2.svg","svg":"<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path id=\"&#235;&#179;&#180;&#234;&#180;&#128; &#236;&#151;&#176;&#236;&#182;&#156; &#194;&#183; orange_settlement 1 &#226;&#134;&#146; &#236;&#131;&#129;&#236;&#158;&#144;\" opacity=\"0\" d=\"M0 14.0167C46 -9.98332 79 -1.98332 114 29.0167\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke=\"#C64C2D\"/>\n</svg>\n"},{"id":"115:20","name":"보관 연출 · orange_city 1 → 상자","x":99,"y":269,"w":147,"h":23.107,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgOrangeCity2.svg","svg":"<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path id=\"&#235;&#179;&#180;&#234;&#180;&#128; &#236;&#151;&#176;&#236;&#182;&#156; &#194;&#183; orange_city 1 &#226;&#134;&#146; &#236;&#131;&#129;&#236;&#158;&#144;\" opacity=\"0\" d=\"M0 19C51 29 100 20 147 0\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke=\"#C64C2D\"/>\n</svg>\n"},{"id":"115:21","name":"보관 연출 · orange_road_left 1 → 상자","x":160,"y":272,"w":86,"h":24.476,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgOrangeRoadLeft2.svg","svg":"<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path id=\"&#235;&#179;&#180;&#234;&#180;&#128; &#236;&#151;&#176;&#236;&#182;&#156; &#194;&#183; orange_road_left 1 &#226;&#134;&#146; &#236;&#131;&#129;&#236;&#158;&#144;\" opacity=\"0\" d=\"M0 22C31 29 57 21 86 0\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke=\"#C64C2D\"/>\n</svg>\n"},{"id":"115:29","name":"knight_01 2","x":78,"y":548,"w":39,"h":60,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgKnight012.png"},{"id":"115:30","name":"monopoly 5","x":101,"y":548,"w":39,"h":60,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgMonopoly5.png"},{"id":"115:31","name":"road_building 4","x":126,"y":548,"w":39,"h":60,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgRoadBuilding4.png"},{"id":"115:32","name":"year_of_plenty 5","x":149,"y":548,"w":39,"h":60,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgYearOfPlenty5.png"},{"id":"115:33","name":"victory_library 1","x":174,"y":548,"w":39,"h":60,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgVictoryLibrary1.png"},{"id":"115:34","name":"victory_market 1","x":201,"y":548,"w":39,"h":60,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgVictoryMarket1.png"},{"id":"115:35","name":"victory_town_hall 1","x":225,"y":548,"w":39,"h":60,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgVictoryTownHall1.png"},{"id":"115:36","name":"victory_cathedral 1","x":249,"y":548,"w":39,"h":60,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgVictoryCathedral1.png"},{"id":"115:37","name":"victory_university 1","x":273,"y":548,"w":39,"h":60,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgVictoryUniversity1.png"},{"id":"115:38","name":"10_back 1","x":325,"y":548,"w":39,"h":60,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step2-img10Back1.png"},{"id":"119:3","name":"원본 사진 · resource_grain 2 수납 완료","x":42,"y":458,"w":43.333,"h":70,"opacity":1,"clip":true,"children":[{"id":"119:4","name":"Rectangle","x":0,"y":0,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgRectangle.png"}]},{"id":"119:9","name":"원본 사진 · resource_wool 2 수납 완료","x":85.33,"y":458,"w":43.333,"h":70,"opacity":1,"clip":true,"children":[{"id":"119:10","name":"Rectangle","x":-43.33,"y":0,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgRectangle.png"}]},{"id":"119:15","name":"원본 사진 · resource_ore 2 수납 완료","x":128.67,"y":458,"w":43.333,"h":70,"opacity":1,"clip":true,"children":[{"id":"119:16","name":"Rectangle","x":-86.67,"y":0,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgRectangle.png"}]},{"id":"119:21","name":"원본 사진 · resource_lumber 2 수납 완료","x":221,"y":458,"w":43.333,"h":70,"opacity":1,"clip":true,"children":[{"id":"119:22","name":"Rectangle","x":0,"y":0,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgRectangle1.png"}]},{"id":"119:27","name":"원본 사진 · resource_brick 2 수납 완료","x":264.33,"y":458,"w":43.333,"h":70,"opacity":1,"clip":true,"children":[{"id":"119:28","name":"Rectangle","x":-43.33,"y":0,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgRectangle1.png"}]},{"id":"119:33","name":"원본 사진 · 발전 카드 수납 완료","x":307.67,"y":458,"w":43.333,"h":70,"opacity":0,"clip":true,"children":[{"id":"119:34","name":"Rectangle","x":-86.67,"y":0,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step2-imgRectangle1.png"}]},{"id":"115:27","name":"resource_grain 2","x":51,"y":466,"w":34,"h":52,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step2-imgResourceGrain2.png"},{"id":"115:26","name":"resource_wool 2","x":94.33,"y":466,"w":34,"h":52,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step2-imgResourceWool2.png"},{"id":"115:25","name":"resource_ore 2","x":137.67,"y":466,"w":34,"h":52,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step2-imgResourceOre2.png"},{"id":"115:24","name":"resource_lumber 2","x":230,"y":466,"w":34,"h":52,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step2-imgResourceLumber2.png"},{"id":"115:28","name":"resource_brick 2","x":273.33,"y":466,"w":34,"h":52,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step2-imgResourceBrick2.png"}]},{"id":"115:83","duration":3400,"items":[{"id":"115:84","name":"카드 보관함 · 자원 3칸","x":42,"y":458,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-img3.png"},{"id":"115:85","name":"카드 보관함 · 자원 2칸 + 발전 1칸","x":221,"y":458,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-img3.png"},{"id":"115:93","name":"orange_city 1","x":49,"y":246,"w":50,"h":50,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-imgOrangeCity1.png"},{"id":"115:94","name":"orange_road_left 1","x":111,"y":248,"w":50,"h":50,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-imgOrangeRoadLeft1.png"},{"id":"115:95","name":"orange_settlement 1","x":86,"y":207,"w":50,"h":50,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-imgOrangeSettlement1.png"},{"id":"115:96","name":"storage-chest-closed 1","x":216,"y":212,"w":100,"h":86,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgStorageChestClosed1.png"},{"id":"115:97","name":"storage-chest-open 1","x":216,"y":201,"w":100,"h":95,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-imgStorageChestOpen1.png"},{"id":"115:98","name":"보관 연출 · 이미지 편집으로 비운 상자","x":216,"y":201,"w":100,"h":95,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-img.png"},{"id":"115:99","name":"보관 연출 · orange_settlement 1 → 상자","x":132,"y":235,"w":114,"h":29.017,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-imgOrangeSettlement2.svg","svg":"<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path id=\"&#235;&#179;&#180;&#234;&#180;&#128; &#236;&#151;&#176;&#236;&#182;&#156; &#194;&#183; orange_settlement 1 &#226;&#134;&#146; &#236;&#131;&#129;&#236;&#158;&#144;\" opacity=\"0\" d=\"M0 14.0167C46 -9.98332 79 -1.98332 114 29.0167\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke=\"#C64C2D\"/>\n</svg>\n"},{"id":"115:100","name":"보관 연출 · orange_city 1 → 상자","x":99,"y":269,"w":147,"h":23.107,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-imgOrangeCity2.svg","svg":"<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path id=\"&#235;&#179;&#180;&#234;&#180;&#128; &#236;&#151;&#176;&#236;&#182;&#156; &#194;&#183; orange_city 1 &#226;&#134;&#146; &#236;&#131;&#129;&#236;&#158;&#144;\" opacity=\"0\" d=\"M0 19C51 29 100 20 147 0\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke=\"#C64C2D\"/>\n</svg>\n"},{"id":"115:101","name":"보관 연출 · orange_road_left 1 → 상자","x":160,"y":272,"w":86,"h":24.476,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-imgOrangeRoadLeft2.svg","svg":"<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path id=\"&#235;&#179;&#180;&#234;&#180;&#128; &#236;&#151;&#176;&#236;&#182;&#156; &#194;&#183; orange_road_left 1 &#226;&#134;&#146; &#236;&#131;&#129;&#236;&#158;&#144;\" opacity=\"0\" d=\"M0 22C31 29 57 21 86 0\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke=\"#C64C2D\"/>\n</svg>\n"},{"id":"115:109","name":"knight_01 2","x":190,"y":548,"w":39,"h":60,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgKnight012.png"},{"id":"115:110","name":"monopoly 5","x":190,"y":548,"w":39,"h":60,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgMonopoly5.png"},{"id":"115:111","name":"road_building 4","x":190,"y":548,"w":39,"h":60,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgRoadBuilding4.png"},{"id":"115:112","name":"year_of_plenty 5","x":190,"y":548,"w":39,"h":60,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgYearOfPlenty5.png"},{"id":"115:113","name":"victory_library 1","x":190,"y":548,"w":39,"h":60,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgVictoryLibrary1.png"},{"id":"115:114","name":"victory_market 1","x":190,"y":548,"w":39,"h":60,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgVictoryMarket1.png"},{"id":"115:115","name":"victory_town_hall 1","x":190,"y":548,"w":39,"h":60,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgVictoryTownHall1.png"},{"id":"115:116","name":"victory_cathedral 1","x":190,"y":548,"w":39,"h":60,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgVictoryCathedral1.png"},{"id":"115:117","name":"victory_university 1","x":190,"y":548,"w":39,"h":60,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgVictoryUniversity1.png"},{"id":"119:135","name":"원본 사진 · resource_grain 2 수납 완료","x":42,"y":458,"w":43.333,"h":70,"opacity":1,"clip":true,"children":[{"id":"119:136","name":"Rectangle","x":0,"y":0,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-imgRectangle.png"}]},{"id":"119:137","name":"원본 사진 · resource_wool 2 수납 완료","x":85.33,"y":458,"w":43.333,"h":70,"opacity":1,"clip":true,"children":[{"id":"119:138","name":"Rectangle","x":-43.33,"y":0,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-imgRectangle.png"}]},{"id":"119:139","name":"원본 사진 · resource_ore 2 수납 완료","x":128.67,"y":458,"w":43.333,"h":70,"opacity":1,"clip":true,"children":[{"id":"119:140","name":"Rectangle","x":-86.67,"y":0,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-imgRectangle.png"}]},{"id":"119:141","name":"원본 사진 · resource_lumber 2 수납 완료","x":221,"y":458,"w":43.333,"h":70,"opacity":1,"clip":true,"children":[{"id":"119:142","name":"Rectangle","x":0,"y":0,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-imgRectangle1.png"}]},{"id":"119:143","name":"원본 사진 · resource_brick 2 수납 완료","x":264.33,"y":458,"w":43.333,"h":70,"opacity":1,"clip":true,"children":[{"id":"119:144","name":"Rectangle","x":-43.33,"y":0,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-imgRectangle1.png"}]},{"id":"119:145","name":"원본 사진 · 발전 카드 수납 완료","x":307.67,"y":458,"w":43.333,"h":70,"opacity":1,"clip":true,"children":[{"id":"119:146","name":"Rectangle","x":-86.67,"y":0,"w":130,"h":70,"opacity":1,"clip":false,"children":[],"src":"assets/prep-step3-imgRectangle1.png"}]},{"id":"115:107","name":"resource_grain 2","x":51,"y":466,"w":34,"h":52,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgResourceGrain2.png"},{"id":"115:106","name":"resource_wool 2","x":94.33,"y":466,"w":34,"h":52,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgResourceWool2.png"},{"id":"115:105","name":"resource_ore 2","x":137.67,"y":466,"w":34,"h":52,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgResourceOre2.png"},{"id":"115:104","name":"resource_lumber 2","x":230,"y":466,"w":34,"h":52,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgResourceLumber2.png"},{"id":"115:108","name":"resource_brick 2","x":273.33,"y":466,"w":34,"h":52,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-imgResourceBrick2.png"},{"id":"115:118","name":"10_back 1","x":316,"y":466,"w":34,"h":52,"opacity":0,"clip":false,"children":[],"src":"assets/prep-step3-img10Back1.png"}]}];
window.CatanPrep={supports:page=>page.id==='figma-86:169',mount(container,article={}){
const viewport=document.createElement('div');viewport.className='native-viewport prep-viewport';
const scene=document.createElement('div');scene.className='native-scene prep-scene';viewport.append(scene);container.replaceChildren(viewport);
let disposed=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function place(n,id,x,y,w,h,parent=scene){n.dataset.nodeId=id;n.classList.add('native-layer');Object.assign(n.style,{left:x+'px',top:y+'px',width:w+'px',...(h?{height:h+'px'}:{})});parent.append(n);return n;}
function text(id,copy,x,y,w,size=16,bold=false,line=25){const n=document.createElement('p');n.textContent=copy;n.className='prep-text';Object.assign(n.style,{fontSize:size+'px',fontWeight:bold?'700':'400',lineHeight:line+'px',whiteSpace:'pre-wrap'});return place(n,id,x,y,w);}
function layer(item,parent=scene){const n=document.createElement('div');place(n,item.id,item.x,item.y,item.w,item.h,parent);n.style.opacity=item.opacity;if(item.clip)n.style.overflow='hidden';
if(item.svg){const svg=new DOMParser().parseFromString(item.svg,'image/svg+xml').documentElement;svg.querySelectorAll('path').forEach(p=>p.setAttribute('pathLength','1'));n.append(document.importNode(svg,true));}
else if(item.src){const img=document.createElement('img');img.src=item.src;img.alt=item.name;img.draggable=false;Object.assign(img.style,{width:item.w+'px',height:item.h+'px',objectFit:'cover'});n.append(img);}
(item.children||[]).forEach(child=>layer(child,n));}
async function show(index){
if(disposed)return;
scene.classList.remove('is-playing');scene.replaceChildren();
stages[index].items.forEach(item=>layer(item));
text('107:4','개인 말 보관하기',24,140,174,16,true);
text('107:5','말은 색깔별로 모아 보관 상자에 넣어주세요.',24,175,342);
text('107:7','카드 정리하기',27,318,342,16,true);
text('107:8','자원 카드는 종류별로 나누어 앞면이 보이게 각 칸에 넣어주세요.',27,353,342);
text('107:11','발전 카드는 하나의 더미로 모은 후,  잘 섞어 뒷면이 보이게 한 칸에 넣어주세요.',24,612,342);
text('86:170',article.category || '',24,32,342,12,false,14).style.color='#c64c2d';
text('86:171','구성물 정리하기',24,66,342,28,true,34);

// Apply and hold the opening keyframe before image decoding yields a paint.
const animate=!reduced.matches;
if(animate)scene.classList.add('is-playing');
const animations=scene.getAnimations({subtree:true});
animations.forEach(a=>{a.pause();a.currentTime=0;});
try{await Promise.all(Array.from(scene.querySelectorAll('img'),img=>img.decode()));}catch{if(!disposed)viewport.dataset.error='asset-load';return;}
if(disposed)return;
viewport.dataset.stage=String(index+1);
if(!animate){viewport.dataset.complete='true';return;}
animations.forEach(a=>a.play());
try{await Promise.all(animations.map(a=>a.finished));}catch{return;}
if(disposed)return;
if(index+1<stages.length)show(index+1);else viewport.dataset.complete='true';
}
const size=()=>{const scale=viewport.clientWidth/390;scene.style.transform='scale('+scale+')';viewport.style.height=680*scale+'px';};
const observer=new ResizeObserver(size);observer.observe(viewport);size();
const sources=new Set();const collect=items=>items.forEach(item=>{if(item.src&&!item.svg)sources.add(item.src);collect(item.children||[]);});stages.forEach(stage=>collect(stage.items));
Promise.all([document.fonts.load('400 16px "Catan Guide"'),document.fonts.load('700 16px "Catan Guide"'),...Array.from(sources,src=>{const img=new Image();img.src=src;return img.decode();})]).then(()=>{if(disposed)return;show(reduced.matches?stages.length-1:0);viewport.dataset.ready='true';}).catch(()=>{if(!disposed)viewport.dataset.error='asset-load';});
return {destroy(){disposed=true;observer.disconnect();scene.getAnimations({subtree:true}).forEach(a=>a.cancel());}};
}};
})();

(function(){
const sequences={
 'figma-129:1889':['129-1889','137-3892','158-3','158-71','177-1116','193-3'],
 'figma-137:2627':['137-2627','197-2441']
};

function mountBoardRotation(host){
 const tokens=[{"id":"202:143","name":"초보자 숫자 칩 · 8 · 3행 5","x":134.5502166748047,"y":268.1770324707031,"w":18,"h":18},{"id":"202:163","name":"초보자 숫자 칩 · 5 · 4행 4","x":186,"y":268.1770324707031,"w":18,"h":18},{"id":"202:178","name":"초보자 숫자 칩 · 11 · 5행 3","x":237.44976806640625,"y":268.1770324707031,"w":18,"h":18},{"id":"202:123","name":"초보자 숫자 칩 · 10 · 2행 4","x":108.82532501220703,"y":312.7338562011719,"w":18,"h":18},{"id":"202:138","name":"초보자 숫자 칩 · 3 · 3행 4","x":160.27511596679688,"y":312.7338562011719,"w":18,"h":18},{"id":"202:158","name":"초보자 숫자 칩 · 4 · 4행 3","x":211.72488403320312,"y":312.7338562011719,"w":18,"h":18},{"id":"202:173","name":"초보자 숫자 칩 · 6 · 5행 2","x":263.1746826171875,"y":312.7338562011719,"w":18,"h":18},{"id":"202:103","name":"초보자 숫자 칩 · 9 · 1행 3","x":83.10043334960938,"y":357.2906799316406,"w":18,"h":18},{"id":"202:118","name":"초보자 숫자 칩 · 4 · 2행 3","x":134.5502166748047,"y":357.2906799316406,"w":18,"h":18},{"id":"202:153","name":"초보자 숫자 칩 · 3 · 4행 2","x":237.44976806640625,"y":357.2906799316406,"w":18,"h":18},{"id":"202:168","name":"초보자 숫자 칩 · 5 · 5행 1","x":288.8995666503906,"y":357.2906799316406,"w":18,"h":18},{"id":"202:98","name":"초보자 숫자 칩 · 2 · 1행 2","x":108.82532501220703,"y":401.8475036621094,"w":18,"h":18},{"id":"202:113","name":"초보자 숫자 칩 · 6 · 2행 2","x":160.27511596679688,"y":401.8475036621094,"w":18,"h":18},{"id":"202:133","name":"초보자 숫자 칩 · 11 · 3행 2","x":211.72488403320312,"y":401.8475036621094,"w":18,"h":18},{"id":"202:148","name":"초보자 숫자 칩 · 8 · 4행 1","x":263.1746826171875,"y":401.8475036621094,"w":18,"h":18},{"id":"202:93","name":"초보자 숫자 칩 · 10 · 1행 1","x":134.5502166748047,"y":446.4043273925781,"w":18,"h":18},{"id":"202:108","name":"초보자 숫자 칩 · 12 · 2행 1","x":186,"y":446.4043273925781,"w":18,"h":18},{"id":"202:128","name":"초보자 숫자 칩 · 9 · 3행 1","x":237.44976806640625,"y":446.4043273925781,"w":18,"h":18},{"id":"206:3","name":"도둑 · 초보자 사막에 배치","x":175,"y":346.2906799316406,"w":40,"h":40}];
 const view=document.createElement('div');view.className='board-rotation';view.hidden=true;
 const background=document.createElement('canvas');background.width=1170;background.height=2040;background.setAttribute('aria-label','초보자를 위한 배치');background.className='board-rotation-background';
 const terrain=document.createElement('div');terrain.className='board-rotation-terrain';
 const ground=document.createElement('video');ground.src='assets/rotation-terrain.mp4';ground.muted=true;ground.playsInline=true;ground.preload='auto';ground.setAttribute('aria-label','회전하는 카탄 지도');terrain.append(ground);
 const tokenImages=tokens.map(t=>{const img=document.createElement('img');img.src=t.id==='206:3'?'assets/rotation-robber-source.png':'assets/rotation-'+t.id.replace(':','-')+'.png';img.alt=t.name;img.className='board-rotation-token';img.dataset.nodeId=t.id;view.append(img);return img;});
 view.prepend(background,terrain);
 const control=document.createElement('label');control.className='board-rotation-control';
 const caption=document.createElement('span');caption.textContent='지도 회전';caption.className='sr-only';
 const slider=document.createElement('input');slider.type='range';slider.min='-180';slider.max='180';slider.step='60';slider.value='0';slider.setAttribute('aria-label','지도 회전 각도');
 const output=document.createElement('output');output.textContent='0°';output.className='sr-only';const track=document.createElement('span');track.className='rotation-track';track.setAttribute('aria-hidden','true');const fill=document.createElement('span');fill.className='rotation-fill';const thumb=document.createElement('span');thumb.className='rotation-thumb';track.append(fill);for(let i=0;i<=6;i++){const dot=document.createElement('span');dot.className='rotation-stop';dot.style.left=(i/6*100)+'%';track.append(dot);}control.append(caption,track,thumb,slider,output);view.append(control);host.append(view);
 ['pointerdown','pointerup','click','touchstart','touchend','keydown'].forEach(type=>control.addEventListener(type,e=>e.stopPropagation()));
 let displayedAngle=0,displayedShrink=0,targetAngle=0,rotationFrame=0,baseFrame=null;
 const reduceRotation=matchMedia('(prefers-reduced-motion: reduce)');
 function drawMap(degrees,shrink=0){
 const angle=degrees*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),cx=195,cy=366.2906494140625;
 const vertices=[[-85.5,-148.29065],[85.5,-148.29065],[171,0],[85.5,148.29065],[-85.5,148.29065],[-171,0]].map(([x,y])=>{const ry=x*s+y*c;return [x*c-y*s,ry];});
 const width=Math.max(...vertices.map(p=>p[0]))-Math.min(...vertices.map(p=>p[0])),height=Math.max(...vertices.map(p=>p[1]))-Math.min(...vertices.map(p=>p[1]));
 const scale=Math.min(1,342/width,296.5813/height)*(1-shrink);
 const active=Math.abs(degrees)>0.0001||shrink>0.0001;
 if(baseFrame){const ctx=background.getContext('2d');ctx.drawImage(baseFrame,0,0);if(active){const sx=background.width/390,sy=background.height/680;ctx.drawImage(baseFrame,3,3,1,1,24*sx,218*sy,342*sx,296.5813*sy);}}
 terrain.style.transform='rotate('+degrees+'deg) scale('+scale+')';
 terrain.style.visibility=active?'':'hidden';tokenImages.forEach(img=>img.style.visibility=active?'':'hidden');
 tokens.forEach((t,i)=>{const dx=t.x+t.w/2-cx,dy=t.y+t.h/2-cy,ry=dx*s+dy*c,rx=dx*c-dy*s;Object.assign(tokenImages[i].style,{left:(cx+rx*scale-t.w*scale/2)/390*100+'%',top:(cy+ry*scale-t.h*scale/2)/680*100+'%',width:t.w*scale/390*100+'%',height:t.h*scale/680*100+'%'});});
 displayedAngle=degrees;displayedShrink=shrink;view.dataset.displayAngle=String(degrees);view.dataset.scale=String(scale);
 }
 function rotate(immediate=false){
 const degrees=Math.round(Number(slider.value)/60)*60;slider.value=String(degrees);control.style.setProperty('--rotation-progress',((degrees+180)/360*100)+'%');
 output.value=degrees+'°';slider.setAttribute('aria-valuetext',degrees+'도');view.dataset.angle=String(degrees);
 if(degrees===targetAngle&&immediate!==true)return;
 targetAngle=degrees;cancelAnimationFrame(rotationFrame);
 if(immediate===true||reduceRotation.matches){drawMap(degrees);return;}
 const from=displayedAngle,fromShrink=displayedShrink,started=performance.now();
 function frame(now){const t=Math.min(1,(now-started)/500),ease=t*t*(3-2*t);drawMap(from+(degrees-from)*ease,t===1?0:fromShrink*(1-ease)+0.03*Math.sin(Math.PI*t));if(t<1)rotationFrame=requestAnimationFrame(frame);else rotationFrame=0;}
 rotationFrame=requestAnimationFrame(frame);
 }
 let dragPointer=null;
 function setAngleFromPointer(event){const box=control.getBoundingClientRect();const fraction=Math.max(0,Math.min(1,(event.clientX-box.left)/box.width));slider.value=String(Math.round((fraction*360-180)/60)*60);rotate();}
 control.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();dragPointer=event.pointerId;control.setPointerCapture(event.pointerId);slider.focus({preventScroll:true});setAngleFromPointer(event);});
 control.addEventListener('pointermove',event=>{if(event.pointerId!==dragPointer)return;event.preventDefault();event.stopPropagation();setAngleFromPointer(event);});
 const stopDrag=event=>{if(event.pointerId!==dragPointer)return;event.stopPropagation();dragPointer=null;if(control.hasPointerCapture(event.pointerId))control.releasePointerCapture(event.pointerId);};
 control.addEventListener('pointerup',stopDrag);control.addEventListener('pointercancel',stopDrag);
 control.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();});
 slider.addEventListener('input',()=>rotate());rotate(true);
 const terrainReady=new Promise((resolve,reject)=>{ground.addEventListener('error',reject,{once:true});ground.addEventListener('loadeddata',()=>{ground.pause();ground.currentTime=ground.duration;},{once:true});ground.addEventListener('seeked',resolve,{once:true});});
 const ready=Promise.all([terrainReady,...tokenImages.map(img=>img.decode())]);
 let capturedSource=null;
 function capture(source){if(capturedSource===source.currentSrc)return;capturedSource=source.currentSrc;background.width=source.videoWidth;background.height=source.videoHeight;background.getContext('2d').drawImage(source,0,0);baseFrame=document.createElement('canvas');baseFrame.width=background.width;baseFrame.height=background.height;baseFrame.getContext('2d').drawImage(source,0,0);
 const sx=source.videoWidth/390,sy=source.videoHeight/680;
 tokens.forEach((t,i)=>{if(t.id==='206:3')return;const chip=document.createElement('canvas');chip.width=Math.round(t.w*sx);chip.height=Math.round(t.h*sy);const ctx=chip.getContext('2d');ctx.beginPath();ctx.ellipse(chip.width/2,chip.height/2,chip.width/2,chip.height/2,0,0,Math.PI*2);ctx.clip();ctx.drawImage(source,t.x*sx,t.y*sy,t.w*sx,t.h*sy,0,0,chip.width,chip.height);const previous=tokenImages[i];chip.className=previous.className;chip.style.cssText=previous.style.cssText;chip.dataset.nodeId=t.id;chip.setAttribute('role','img');chip.setAttribute('aria-label',t.name);previous.replaceWith(chip);tokenImages[i]=chip;});}
 return {view,ready,capture,destroy(){cancelAnimationFrame(rotationFrame);ground.pause();},reset(){cancelAnimationFrame(rotationFrame);baseFrame=null;capturedSource=null;slider.value='0';rotate(true);}};
}

window.CatanBoard={supports:page=>!!sequences[page.id],mount(container,page){
 const sources=sequences[page.id];
 const region=document.createElement('div');region.className='board-motion';region.tabIndex=0;region.setAttribute('aria-label',page.title+' 애니메이션. 왼쪽은 이전 장면, 오른쪽은 재생 또는 다음 장면');
 const video=document.createElement('video');video.className='board-motion-video';video.muted=true;video.playsInline=true;video.preload='auto';video.disablePictureInPicture=true;video.setAttribute('aria-label',page.title);
 const status=document.createElement('p');status.className='board-motion-status';status.setAttribute('aria-live','polite');
 const media=document.createElement('div');media.className='board-motion-media';media.append(video);region.append(media,status);container.replaceChildren(region);
 const rotation=page.id==='figma-137:2627'?mountBoardRotation(media):null;
 let rotationReady=false;
 rotation?.ready.then(()=>{rotationReady=true;updateRotation();}).catch(()=>{});
 let index=0,started=false,ready=false,disposed=false,pendingPlay=false,completed=false,pendingComplete=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function updateRotation(){if(!rotation)return;const visible=rotationReady&&sources[index]==='197-2441'&&ready&&completed&&!video.seeking&&video.currentTime>=video.duration-0.05;if(visible)rotation.capture(video);rotation.view.hidden=!visible;}
 function announce(){updateRotation();status.textContent=(index+1)+' / '+sources.length+' · '+(!ready?'장면을 준비하고 있어요':!started?'오른쪽을 눌러 재생하세요':completed||video.ended?'오른쪽을 누르면 다음 장면으로 이동해요':'재생 중 · 한 번 더 누르면 즉시 완료');region.dataset.stage=String(index+1);region.dataset.started=String(started);}
 function finish(){completed=true;pendingPlay=false;video.pause();if(ready&&Number.isFinite(video.duration)){pendingComplete=false;video.currentTime=video.duration;}else pendingComplete=true;announce();}
 function play(){if(disposed)return;started=true;if(!ready){pendingPlay=true;announce();return;}
 if(reduced.matches){finish();return;}
 video.play().then(announce).catch(()=>{if(disposed||completed)return;started=false;status.textContent='오른쪽을 눌러 다시 재생하세요';});announce();}
 function show(next,autoPlay=false,showCompleted=false){rotation?.reset();if(rotation)rotation.view.hidden=true;index=next;ready=false;started=autoPlay||showCompleted;completed=showCompleted;pendingComplete=showCompleted;pendingPlay=autoPlay;video.pause();video.style.visibility='hidden';video.src='assets/board-'+sources[index]+(sources[index]==='197-2441'?'-slider':'')+'.mp4';video.load();announce();}
 video.addEventListener('loadeddata',()=>{if(disposed)return;ready=true;if(pendingComplete){finish();}else{video.style.visibility='';if(pendingPlay){pendingPlay=false;play();}else announce();}});
 video.addEventListener('seeked',()=>{if(!disposed&&ready&&completed){video.style.visibility='';updateRotation();}});
 // Skip trailing holds after each scene's final Figma keyframe.
 const motionEndTimes={'129-1889':3.45,'137-2627':3.45,'137-3892':3.7};
 video.addEventListener('timeupdate',()=>{const end=motionEndTimes[sources[index]];if(end&&started&&!completed&&!video.seeking&&video.currentTime>=end)finish();});
 video.addEventListener('ended',()=>{completed=true;announce();});
 video.addEventListener('error',()=>{if(!disposed)status.textContent='애니메이션을 불러오지 못했어요. 새로고침해 주세요.';});
 function step(direction){
 if(disposed)return false;
 if(direction<0){if(index===0)return false;show(index-1,false,true);return true;}
 if(!started){play();return true;}
 if(!completed&&!video.ended){finish();return true;}
 if(!ready||video.seeking)return true;
 if(index+1<sources.length){show(index+1,true);return true;}
 return false;
 }
 show(0);
 return {step,destroy(){disposed=true;rotation?.destroy();video.pause();video.removeAttribute('src');video.load();}};
}};
})();
