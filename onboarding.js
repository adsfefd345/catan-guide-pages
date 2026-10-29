(() => {
  'use strict';
  const seenKey='catan-welcome-seen-v1';
  const closeIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  const welcome=document.createElement('dialog');welcome.id='welcome-dialog';welcome.className='onboarding-dialog';welcome.setAttribute('aria-labelledby','welcome-title');welcome.setAttribute('aria-describedby','welcome-description');
  welcome.innerHTML='<span class="onboarding-eyebrow">CATAN 가이드</span><div class="welcome-symbol" aria-hidden="true"><svg viewBox="0 0 100 82" fill="none"><path d="m50 5 31 18v36L50 77 19 59V23Z" fill="#f4e7c8" stroke="#c64c2d" stroke-width="2"/><path d="M36 29h28M36 41h21M36 53h14" stroke="#c64c2d" stroke-width="3" stroke-linecap="round"/></svg></div><h2 id="welcome-title">혹시 카탄 가이드가<br>처음이신가요?</h2><p id="welcome-description">목차부터 화면 넘기기까지,<br>가이드 사용법을 짧게 알려드릴게요.</p><div class="welcome-actions"><button type="button" id="welcome-accept" class="onboarding-primary">좋아요</button><button type="button" id="welcome-dismiss" class="onboarding-secondary">괜찮습니다.</button></div>';
  const tutorial=document.createElement('dialog');tutorial.id='tutorial-dialog';tutorial.className='onboarding-dialog tutorial-dialog';tutorial.setAttribute('aria-labelledby','tutorial-title');
  tutorial.innerHTML='<div class="tutorial-heading"><span class="onboarding-eyebrow">가이드 사용법</span><button type="button" class="icon-button" id="tutorial-close" aria-label="튜토리얼 닫기">'+closeIcon+'</button></div><div id="tutorial-stage" class="tutorial-stage"><div id="tutorial-art" class="tutorial-art" aria-hidden="true"></div><div class="tutorial-copy" aria-live="polite" aria-atomic="true"><span id="tutorial-step" class="tutorial-step"></span><h2 id="tutorial-title"></h2><p id="tutorial-description"></p></div></div><div id="tutorial-dots" class="tutorial-dots" aria-label="튜토리얼 단계"></div><div class="tutorial-actions"><button type="button" id="tutorial-prev" class="onboarding-secondary">이전</button><button type="button" id="tutorial-next" class="onboarding-primary">다음</button></div>';
  document.body.append(welcome,tutorial);
  const slides=[
    {title:'목차로 원하는 글 찾기',description:'하단 배너의 목차 버튼을 누르면 목차가 열려요. 카테고리 이름을 눌러 접거나 펼치고, 읽고 싶은 글을 선택하세요.',art:'<div class="tour-toc"><span class="tour-handle">목차</span><div class="tour-toc-panel"><b>가이드 목록</b><span>게임 소개　⌄</span><strong>01　개요</strong><span>02　게임 구성물</span><span>시작하기　›</span></div><div class="tour-page-lines"><i></i><i></i><i></i></div></div>'},
    {title:'좌우로 스와이프해서 이동',description:'왼쪽으로 밀면 모션 재생 또는 다음 장면, 오른쪽으로 밀면 이전 장면으로 이동해요. 재생 중 왼쪽으로 한 번 더 밀면 즉시 완료돼요. 위의 숫자로 진행 순서를 확인하세요.',art:'<div class="tour-screen"><div class="tour-screen-top"><span>시작하기</span><span>2 / 6</span></div><div class="tour-touch-zones"><div><b>←</b><span>이전 장면</span></div><div><b>→</b><span>재생 · 다음 장면</span></div></div></div>'},
    {title:'다른 글은 화면 맨 아래에서',description:'아래로 스크롤하면 이전 글과 다음 글의 제목이 보여요. 타일 버튼을 눌러 이동하세요. 마지막 화면에서 왼쪽으로 밀면 글의 끝이라는 안내가 나타나요.',art:'<div class="tour-article-end"><div class="tour-end-label">글의 끝입니다.</div><div class="tour-neighbors"><div><span>← 이전 글</span><strong>게임 구성물</strong></div><div><span>다음 글 →</span><strong>근거지 마련</strong></div></div></div>'},
    {title:'처음이라면 초보자용으로',description:'기본·초보자용이 나뉜 글은 목차 최상단의 스위치로 바꿀 수 있어요. 이 튜토리얼은 언제든 설정의 ‘튜토리얼 보기’에서 다시 볼 수 있어요.',art:'<div class="tour-mode"><div class="tour-mode-row"><span>기본</span><span class="tour-switch"><i></i></span><strong>초보자용</strong></div><b>가이드 목록</b><span>시작하기　⌄</span><div class="tour-mode-link">게임 준비</div><div class="tour-settings-note">설정 → 튜토리얼 보기</div></div>'}
  ];
  let index=0,opener=null;
  const find=id=>document.getElementById(id);
  function markSeen(){try{localStorage.setItem(seenKey,'true');}catch{}}
  function show(value){index=Math.max(0,Math.min(slides.length-1,value));const slide=slides[index];find('tutorial-art').innerHTML=slide.art;find('tutorial-title').textContent=slide.title;find('tutorial-description').textContent=slide.description;find('tutorial-step').textContent=(index+1)+' / '+slides.length;tutorial.dataset.step=String(index+1);find('tutorial-prev').disabled=index===0;find('tutorial-next').textContent=index===slides.length-1?'완료':'다음';[...find('tutorial-dots').children].forEach((dot,i)=>{if(i===index)dot.setAttribute('aria-current','step');else dot.removeAttribute('aria-current');});}
  function openTutorial(){opener=document.activeElement;show(0);tutorial.showModal();find('tutorial-next').focus();}
  slides.forEach((slide,i)=>{const dot=document.createElement('button');dot.type='button';dot.className='tutorial-dot';dot.setAttribute('aria-label',(i+1)+'단계: '+slide.title);dot.addEventListener('click',()=>show(i));find('tutorial-dots').append(dot);});
  find('welcome-accept').addEventListener('click',()=>{markSeen();welcome.close();openTutorial();});
  find('welcome-dismiss').addEventListener('click',()=>{markSeen();welcome.close();});welcome.addEventListener('cancel',markSeen);
  find('tutorial-open').addEventListener('click',openTutorial);
  find('tutorial-close').addEventListener('click',()=>tutorial.close());
  find('tutorial-prev').addEventListener('click',()=>show(index-1));
  find('tutorial-next').addEventListener('click',()=>{if(index===slides.length-1)tutorial.close();else show(index+1);});
  tutorial.addEventListener('close',()=>{if(opener?.isConnected&&opener.getClientRects().length)opener.focus();else find('settings-open').focus();});
  tutorial.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();show(index+1);}else if(event.key==='ArrowLeft'){event.preventDefault();show(index-1);}});
  let pointer=null;
  find('tutorial-stage').addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};});
  find('tutorial-stage').addEventListener('pointerup',e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)show(index+(dx<0?1:-1));});
  find('tutorial-stage').addEventListener('pointercancel',()=>{pointer=null;});
  let seen=false;try{seen=localStorage.getItem(seenKey)==='true';}catch{}
  if(document.body.dataset.page!=='article'&&!seen)welcome.showModal();
})();
