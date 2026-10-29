(() => {
  'use strict';
  let articles = [...(window.CATAN_ARTICLES || []), ...(window.CATAN_FIGMA_CONTENT?.articles || [])];
  const isArticlePage = document.body.dataset.page === 'article';
  let activeArticleId = isArticlePage ? new URLSearchParams(window.location.search).get('id') : null;
  let categories = ['전체', ...new Set([...(window.CATAN_CATEGORIES || []), ...articles.map(a => a.category)].filter(Boolean))];
  let selected = '전체';
  const $ = id => document.getElementById(id);
  const search = $('search-input');
  let alignPageViewport=()=>{};
  // Let the banner scroll with the page before enabling directional hiding.
  const scrollingHeader=document.querySelector('.site-header');
  if(scrollingHeader){
    let lastY=Math.max(0,window.scrollY),travel=0,direction=0,scheduled=false;
    const reveal=()=>document.body.classList.remove('header-hidden');
    const syncThreshold=()=>{
      const height=scrollingHeader.offsetHeight;
      document.body.style.setProperty('--scroll-header-height',height+'px');
      const before=window.scrollY<height&&!document.body.classList.contains('header-hidden');
      document.body.classList.toggle('header-before-threshold',before);
      if(before)reveal();
      return before;
    };
    const update=()=>{
      scheduled=false;
      const maxY=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
      const y=Math.max(0,Math.min(window.scrollY,maxY)),delta=y-lastY;lastY=y;
      const wasBefore=document.body.classList.contains('header-before-threshold');
      if(delta){
        const nextDirection=Math.sign(delta);
        travel=nextDirection===direction?travel+Math.abs(delta):Math.abs(delta);
        direction=nextDirection;
      }
      if(y===0||(direction<0&&travel>=scrollingHeader.offsetHeight))reveal();
      if(syncThreshold()){travel=0;direction=0;return;}
      if(wasBefore&&delta>=0){document.body.classList.add('header-hidden');travel=0;return;}
      if(!delta)return;
      if(travel<(direction<0?scrollingHeader.offsetHeight:12))return;
      document.body.classList.toggle('header-hidden',direction>0);
      travel=0;
    };
    window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}},{passive:true});
    scrollingHeader.addEventListener('focusin',reveal);
    const reset=()=>{lastY=Math.max(0,window.scrollY);travel=0;direction=0;syncThreshold();};
    window.addEventListener('resize',reset);
    window.addEventListener('pageshow',reset);
    alignPageViewport=()=>{
      document.body.classList.remove('header-before-threshold');
      document.body.classList.add('header-hidden');
      window.scrollTo({top:scrollingHeader.offsetHeight,left:window.scrollX,behavior:'instant'});
      lastY=Math.max(0,window.scrollY);travel=0;direction=0;
    };
    new ResizeObserver(syncThreshold).observe(scrollingHeader);
    syncThreshold();
  }
  let savedOrder = [];
  try { savedOrder = window.CatanOrder.read(localStorage); } catch {}
  let reorderController = null;
  const slidePositions = new Map();
  let cleanupPageNavigation = null;
  let endNoticeTimer;
  function showArticleEnd(boundary='end') {
    const notice=$('article-end-notice');if(!notice)return;
    clearTimeout(endNoticeTimer);notice.classList.remove('is-visible');
    notice.textContent=boundary==='start'?'글의 시작입니다.':'글의 끝입니다.';
    void notice.offsetWidth;notice.classList.add('is-visible');
    endNoticeTimer=setTimeout(()=>{notice.classList.remove('is-visible');notice.textContent='';},1000);
  }
  window.CatanArticleEnd={show:showArticleEnd,start:()=>showArticleEnd('start')};
  const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase('ko').replace(/\s+/g, ' ').trim();
  function renderCategories() {
    if (isArticlePage) return;
    $('categories').replaceChildren();
  categories.forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'category';
    button.textContent = category;
    button.setAttribute('aria-pressed', String(category === selected));
    button.addEventListener('click', () => { selected = category; render(); });
    $('categories').append(button);
  });
  }
  renderCategories();
  function setTocOpen(open) {
    if (!isArticlePage) return;
    $('article-toc').hidden = !open;
    $('toc-backdrop').hidden = !open;
    $('toc-toggle').setAttribute('aria-expanded', String(open));
    $('toc-toggle').setAttribute('aria-label', open ? '목차 닫기' : '목차 열기');
    $('article-dialog').classList.toggle('toc-open', open);
    document.documentElement.classList.toggle('toc-scroll-locked',open);
  }
  $('toc-toggle')?.addEventListener('click', () => setTocOpen($('article-toc').hidden));
  $('toc-backdrop')?.addEventListener('click', () => { setTocOpen(false); $('toc-toggle').focus(); });
  $('article-dialog')?.addEventListener('cancel', event => {
    if (!$('article-toc').hidden) { event.preventDefault(); setTocOpen(false); $('toc-toggle').focus(); }
  });
  $('article-dialog')?.addEventListener('close', () => setTocOpen(false));
  let pageSeek=null,seekDragging=false,swipeHintTimer,swipeHintFrame,swipeHintFadeTimer;
  const swipeHintVisitedArticles=new Set();
  let swipeHintPointer=null,swipeHintLastTap=null;
  function hideSwipeHint(){clearTimeout(swipeHintTimer);clearTimeout(swipeHintFadeTimer);swipeHintPointer=swipeHintLastTap=null;const hint=$('article-swipe-hint');if(hint){hint.hidden=true;hint.classList.remove('is-fading');}}
  function startSwipeHintTap(event){
    const hint=$('article-swipe-hint');
    if(!hint||hint.hidden||hint.classList.contains('is-fading')||!event.isPrimary||event.button!==0)return;
    // Give the second tap its full window even near the automatic timeout.
    clearTimeout(swipeHintTimer);swipeHintTimer=setTimeout(fadeSwipeHint,1600);
    swipeHintPointer={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()};
  }
  function endSwipeHintTap(event){
    const start=swipeHintPointer;swipeHintPointer=null;
    if(!start||start.id!==event.pointerId)return;
    const now=performance.now();
    if(now-start.time>500||Math.hypot(event.clientX-start.x,event.clientY-start.y)>25){swipeHintLastTap=null;return;}
    if(swipeHintLastTap&&now-swipeHintLastTap.time<=450&&Math.hypot(event.clientX-swipeHintLastTap.x,event.clientY-swipeHintLastTap.y)<=40){swipeHintLastTap=null;fadeSwipeHint();}
    else swipeHintLastTap={time:now,x:event.clientX,y:event.clientY};
  }
  function fadeSwipeHint(){
    clearTimeout(swipeHintTimer);const hint=$('article-swipe-hint');if(!hint||hint.hidden||hint.classList.contains('is-fading'))return;
    hint.classList.add('is-fading');
    swipeHintFadeTimer=setTimeout(hideSwipeHint,400);
  }
  function queueSwipeHint(){
    if(swipeHintFrame)return;
    swipeHintFrame=requestAnimationFrame(()=>{swipeHintFrame=null;maybeShowSwipeHint();});
  }
  function maybeShowSwipeHint(){
    if(!isArticlePage||!pageSeek||!activeArticleId)return;
    // Opening a later step also consumes the hint, so returning to step one
    // never looks like a first visit (including TOC and progress-slider jumps).
    if(pageSeek.getCurrent()!==0){hideSwipeHint();swipeHintVisitedArticles.add(activeArticleId);return;}
    if(swipeHintVisitedArticles.has(activeArticleId)||document.querySelector('dialog[open]'))return;
    swipeHintVisitedArticles.add(activeArticleId);hideSwipeHint();
    $('article-swipe-hint').hidden=false;
    swipeHintTimer=setTimeout(fadeSwipeHint,1600);
  }
  function configurePageSeek(total,getCurrent,goTo){
    pageSeek={total,getCurrent,goTo};const slider=$('article-page-slider');
    slider.max=String(total);slider.value=String(getCurrent()+1);slider.disabled=total<2;
    queueSwipeHint();
  }
  let previousProgressPage=null,pageViewportFrame;
  function setArticleProgress(current,total,completion=1,playing=false){
    const progress=$('article-progress');if(!progress)return;
    total=Math.max(1,total);current=Math.max(1,Math.min(total,current));
    if(previousProgressPage&&previousProgressPage.total===total&&previousProgressPage.current!==current){
      cancelAnimationFrame(pageViewportFrame);
      pageViewportFrame=requestAnimationFrame(alignPageViewport);
    }
    previousProgressPage={current,total};
    const percent=total>1?Math.max(0,Math.min(1,(current-2+Math.max(0,Math.min(1,completion)))/(total-1)))*100:0;
    if(!seekDragging)progress.value=percent;
    if(!seekDragging)$('article-progress-track').style.setProperty('--progress-position',percent+'%');
    if(pageSeek&&!seekDragging)$('article-page-slider').value=String(pageSeek.getCurrent()+1);
    $('article-progress-label').textContent=current+' / '+total;
    progress.setAttribute('aria-valuetext',current+' / '+total);
    const status=$('article-reading-status');
    const state=playing?'playing':current===total&&completion>=1?'complete':'reading';
    const label=state==='playing'?'애니메이션 재생중':state==='complete'?'모두읽음':'읽는중';
    if(status.textContent!==label)status.textContent=label;
    status.dataset.state=state;
    queueSwipeHint();
  }
  window.CatanArticleProgress={set:setArticleProgress};
  function renderArticleNeighbors() {
    const nav = $('article-neighbors');
    if (!nav) return;
    const tocButton=$('toc-toggle');
    nav.replaceChildren(tocButton);
    const ordered = window.CatanOrder.sort(articles, savedOrder);
    const index = ordered.findIndex(article => article.id === activeArticleId);
    if (index >= 0) for (const [offset, label, direction] of [[-1, '이전 글', 'previous'], [1, '다음 글', 'next']]) {
      const article = ordered[index + offset];
      if (!article) {
        const disabled=document.createElement('button');disabled.type='button';disabled.disabled=true;
        disabled.className='article-neighbor article-neighbor-'+direction;disabled.textContent=label;nav.append(disabled);continue;
      }
      const link = document.createElement('a'); link.className = 'article-neighbor article-neighbor-' + direction;
      link.href = 'article.html?id=' + encodeURIComponent(article.id);
      link.rel = offset < 0 ? 'prev' : 'next';
      const caption = document.createElement('span'); caption.className = 'article-neighbor-label';
      caption.textContent = offset < 0 ? '← ' + label : label + ' →';
      const title = document.createElement('strong'); title.textContent = article.title;
      link.append(caption, title); nav.append(link);
    }
    nav.hidden = nav.childElementCount === 0;

  }
  function renderGuideNavigation() {
    if (!isArticlePage) return;
    renderArticleNeighbors();
    const container = $('toc-guides');
    const previousStates = container.dataset.articleId === activeArticleId
      ? new Map([...container.querySelectorAll('details.toc-guide-group')].map(group => [group.dataset.category, group.open])) : new Map();
    container.replaceChildren(); container.dataset.articleId = activeArticleId || '';
    const ordered = window.CatanOrder.sort(articles, savedOrder);
    const numbers = window.CatanOrder.numbers(ordered);
    const groups = new Map();
    for (const article of ordered) {
      const category = article.category || '기타';
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(article);
    }
    for (const [category, guides] of groups) {
      const group = document.createElement('details'); group.className = 'toc-guide-group';
      group.dataset.category = category;
      group.open = previousStates.has(category) ? previousStates.get(category) : guides.some(guide => guide.id === activeArticleId);
      const label = document.createElement('summary'); label.className = 'toc-category-toggle'; label.textContent = category; group.append(label);
      for (const guide of guides) {
        const link = document.createElement('a');
        link.href = 'article.html?id=' + encodeURIComponent(guide.id);
        link.className = 'toc-guide-link';
        if (guide.id === activeArticleId) link.setAttribute('aria-current', 'page');
        const number = document.createElement('span'); number.className = 'toc-guide-number'; number.textContent = String(numbers.get(guide.id)).padStart(2, '0');
        const title = document.createElement('span'); title.textContent = guide.title;
        link.append(number, title); group.append(link);
      }
      container.append(group);
    }
  }
  function renderArticle(article, {includeTitle = true} = {}) {
    previousProgressPage=null;cancelAnimationFrame(pageViewportFrame);
    renderGuideNavigation();
    configurePageSeek(1,()=>0,()=>{});
    setArticleProgress(1,1);
    $('article-title').textContent = article.title;
    $('article-category').textContent = article.category;
    const body = $('article-body'); body.replaceChildren();
    const blocks = Array.isArray(article.blocks) ? article.blocks : (article.body ? [{type:'text',text:article.body}] : []);
    let headingIndex = 0;
    for (const block of blocks) {
      if (block.type === 'heading') {
        const heading = document.createElement('h3'); heading.textContent = block.text;
        heading.id = 'article-section-' + (++headingIndex); heading.tabIndex = -1;
        body.append(heading);
      } else if (block.type === 'text') {
        const p = document.createElement('p'); p.textContent = block.text; body.append(p);
      } else if (block.type === 'image' && (/^(?:data:image\/(?:png|jpeg|webp);base64,|assets\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|svg)$)/.test(block.src))) {
        const img = document.createElement('img'); img.src = block.src; img.alt = block.alt || article.title; img.loading = block.layout ? 'eager' : 'lazy'; if(block.layout){img.className='figma-layout-image';img.draggable=false;} body.append(img);
      }
    }
    if (Array.isArray(article.slides) && article.slides.length) {
      const player = window.CatanSlides.mount({container:body,slides:article.slides,initialId:slidePositions.get(article.id),onChange:(id,index)=>{slidePositions.set(article.id,id);setArticleProgress(index+1,article.slides.length);}});
      configurePageSeek(article.slides.length,()=>player.getIndex(),i=>player.goTo(i));
    }
    if (!blocks.length && !article.slides?.length) {
      const empty = document.createElement('p'); empty.className = 'article-empty'; empty.textContent = '아직 작성된 내용이 없어요.'; body.append(empty);
    }
  }
  window.addEventListener('catan-content-updated', () => {
    articles = [...(window.CATAN_ARTICLES || []), ...(window.CATAN_FIGMA_CONTENT?.articles || [])];
    categories = ['전체', ...new Set([...(window.CATAN_CATEGORIES || []), ...articles.map(a => a.category)].filter(Boolean))];
    if (!categories.includes(selected)) selected = '전체';
    renderCategories(); render();
    if (isArticlePage) renderCurrentArticle();
  });
  function render() {
    if (isArticlePage) return;
    const query = normalize(search.value);
    reorderController?.cancel();
    const orderedArticles = window.CatanOrder.sort(articles, savedOrder);
    const articleNumbers = window.CatanOrder.numbers(orderedArticles);
    const matches = orderedArticles.filter(article => (selected === '전체' || article.category === selected) && normalize([article.title, article.summary, article.body, article.category].join(' ')).includes(query));
    [...$('categories').children].forEach(button => button.setAttribute('aria-pressed', String(button.textContent === selected)));
    $('search-clear').hidden = !search.value;
    $('result-summary').replaceChildren();
    const count = document.createElement('strong');
    count.textContent = matches.length;
    $('result-summary').append(query ? '검색 결과 ' : selected === '전체' ? '전체 글 ' : selected + ' ', count, '개');
    $('article-list').replaceChildren();
    const labeledCategories = new Set();
    matches.forEach((article, index) => {
      const row = document.createElement('a');
      row.className = 'article-row'; row.dataset.articleId = article.id; row.draggable = false; row.href = 'article.html?id=' + encodeURIComponent(article.id);
      const number = document.createElement('span'); number.className = 'article-number'; number.textContent = String(articleNumbers.get(article.id)).padStart(2, '0');
      const copy = document.createElement('span'); copy.className = 'article-copy';
      const category = document.createElement('small'); category.textContent = article.category;
      const title = document.createElement('h3'); title.textContent = article.title;
      const summary = document.createElement('p'); summary.textContent = article.summary || '';
      const arrow = document.createElement('span'); arrow.className = 'row-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      copy.append(title, category, summary); row.append(number, copy, arrow);

      const categoryName = article.category || '기타';
      if (!labeledCategories.has(categoryName)) {
        labeledCategories.add(categoryName);
        row.classList.add('category-start');
        const label = document.createElement('span');
        label.className = 'article-category-divider';
        label.textContent = categoryName;
        row.prepend(label);
      }
      $('article-list').append(row);
    });
    $('empty-state').hidden = matches.length > 0;
    const filtered = Boolean(query) || selected !== '전체';
    $('empty-title').textContent = query ? '검색 결과가 없어요' : selected !== '전체' ? '이 카테고리에 아직 글이 없어요' : '아직 등록된 글이 없어요';
    $('empty-description').textContent = query ? '다른 검색어를 입력하거나 전체 글을 확인해 보세요.' : '새로운 카탄 이야기가 이곳에 차곡차곡 쌓일 예정이에요.';
    $('reset-filters').hidden = !filtered;
  }
  search.addEventListener('input', render);
  $('search-form').addEventListener('submit', event => { event.preventDefault(); if (isArticlePage) { window.location.href = 'index.html?q=' + encodeURIComponent(search.value); } else render(); });
  $('search-clear').addEventListener('click', () => { search.value = ''; render(); search.focus(); });
  $('reset-filters')?.addEventListener('click', () => { search.value = ''; selected = '전체'; render(); });
  $('settings-open').addEventListener('click', () => {
    resetTextSizeDraft();
    $('settings-dialog').showModal();
  });
  $('settings-close').addEventListener('click', () => $('settings-dialog').close());
  $('settings-dialog').addEventListener('close', resetTextSizeDraft);
  $('settings-done').addEventListener('click', () => {
    appliedTextSize = normalizeTextSize(textSize.value);
    applyTextSize();
    try { localStorage.setItem(textSizeKey, String(appliedTextSize)); } catch {}
    applyEditMode();
    showSettingsConfirmation();
  });

  let settingsNoticeTimer;
  function showSettingsConfirmation() {
    const notice = $('settings-notice');
    clearTimeout(settingsNoticeTimer);
    notice.classList.remove('is-visible');
    notice.textContent = '';
    // Restart the animation and announcement for every explicit save.
    void notice.offsetWidth;
    notice.textContent = '설정 완료';
    notice.classList.add('is-visible');
    settingsNoticeTimer = setTimeout(() => {
      notice.classList.remove('is-visible');
      notice.textContent = '';
    }, 1000);
  }
  $('settings-dialog').addEventListener('close', () => {
    clearTimeout(settingsNoticeTimer);
    $('settings-notice').classList.remove('is-visible');
    $('settings-notice').textContent = '';
  });
  const textSize = $('text-size');
  const textSizeKey = 'catan-text-size';
  let appliedTextSize = 100;
  function normalizeTextSize(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 90 && number <= 130 ? Math.round(number / 10) * 10 : 100;
  }
  try {
    const saved = localStorage.getItem(textSizeKey);
    appliedTextSize = saved === null ? (localStorage.getItem('catan-large-text') === 'true' ? 120 : 100) : normalizeTextSize(saved);
  } catch {}
  function applyTextSize() {
    document.documentElement.style.setProperty('--text-scale', String(appliedTextSize / 100));
  }
  function previewTextSize() {
    const size = normalizeTextSize(textSize.value);
    textSize.value = String(size);
    $('text-size-value').value = size + '%';
    textSize.setAttribute('aria-valuetext', size + '퍼센트' + (size === 100 ? ', 기본 크기' : ''));
    // Use pixels so the draft preview is independent of the applied root scale.
    $('text-size-sample').style.fontSize = (16 * size / 100) + 'px';
  }
  function resetTextSizeDraft() {
    textSize.value = String(appliedTextSize);
    previewTextSize();
  }
  textSize.addEventListener('input', previewTextSize);
  const editModeKey = 'catan-edit-mode';
  let editModeEnabled = false;
  try { editModeEnabled = window.CatanAuth.getState().loggedIn && localStorage.getItem(editModeKey) === 'true'; } catch {}
  function updateEditModeUI() {
    document.body.dataset.editMode = String(editModeEnabled);
    if ($('edit-actions')) $('edit-actions').hidden = !editModeEnabled;
    $('edit-mode').checked = editModeEnabled;
  }
  function saveEditMode() {
    try { localStorage.setItem(editModeKey, String(editModeEnabled)); } catch {}
  }
  function applyEditMode() {
    editModeEnabled = window.CatanAuth.getState().loggedIn && $('edit-mode').checked;
    if (!editModeEnabled) reorderController?.cancel();
    saveEditMode(); updateEditModeUI();
  }
  $('settings-dialog').addEventListener('close', () => {
    $('edit-mode').checked = editModeEnabled;
  });
  function renderAccount(state) {
    $('edit-mode-row').hidden = !state.loggedIn;
    if (!state.loggedIn) {
      reorderController?.cancel();
      editModeEnabled = false;
      saveEditMode();
    }
    updateEditModeUI();
    $('login-status').textContent = state.loggedIn ? '로그인 상태' : '로그아웃 상태';
    $('login-toggle').textContent = state.loggedIn ? '로그아웃' : '로그인';
    $('login-toggle').classList.toggle('is-logged-in', state.loggedIn);
  }
  window.addEventListener('storage', event => {
    if (event.key !== editModeKey && event.key !== null) return;
    try { editModeEnabled = window.CatanAuth.getState().loggedIn && localStorage.getItem(editModeKey) === 'true'; } catch { editModeEnabled = false; }
    if (!editModeEnabled) reorderController?.cancel();
    updateEditModeUI();
  });
  window.CatanAuth.subscribe(renderAccount);
  $('login-toggle').addEventListener('click', () => {
    if (window.CatanAuth.getState().loggedIn) window.CatanAuth.logout();
    else window.CatanAuth.login();
  });
  renderAccount(window.CatanAuth.getState());
  function readBeginnerMode(){
    const mode=new URLSearchParams(window.location.search).get('mode');
    if(mode)return mode==='beginner';
    if(articles.find(article=>article.id===activeArticleId)?.guideMode==='beginner')return true;
    try{return localStorage.getItem('catan-guide-beginner')==='true';}catch{return false;}
  }
  function renderGuideMode(){
    const beginner=readBeginnerMode();
        const toggle=document.createElement('label');toggle.className='guide-mode-toggle';
        const basic=document.createElement('span');basic.textContent='기본';
        const beginnerLabel=document.createElement('span');beginnerLabel.textContent='초보자용';
        const input=document.createElement('input');input.type='checkbox';input.checked=beginner;input.setAttribute('role','switch');input.setAttribute('aria-label','초보자용');
        const track=document.createElement('span');track.className='guide-mode-track';track.setAttribute('aria-hidden','true');
        toggle.append(basic,input,track,beginnerLabel);
        $('toc-guide-mode').replaceChildren(toggle);
        $('toc-guide-mode').hidden=false;
        input.addEventListener('change',()=>{
          try{localStorage.setItem('catan-guide-beginner',String(input.checked));}catch{}
          const url=new URL(window.location.href);url.searchParams.set('mode',input.checked?'beginner':'basic');
          window.history.pushState({},'',url);renderCurrentArticle();
          $('toc-guide-mode').querySelector('.guide-mode-toggle input')?.focus({preventScroll:true});
        });
      }

  function renderNumberedPage(article) {
    const allSlides=article.slides;
    const params=new URLSearchParams(window.location.search);
    const beginner=readBeginnerMode();
    const hasVariants=allSlides.some(s=>s.variant);
    if(hasVariants&&!params.has('mode')){const url=new URL(window.location.href);url.searchParams.set('mode',beginner?'beginner':'basic');window.history.replaceState({},'',url);}
    if(window.CatanVariants)article={...article,slides:window.CatanVariants.select(allSlides,beginner)};
    const requested=Number(new URLSearchParams(window.location.search).get('page'));
    const index=Math.max(0,article.slides.findIndex(s=>s.pageNumber===requested));
    const page=article.slides[index];
    if (window.CatanNative?.supports(article)) {
      renderArticle({...article,tocTitle:page.title,blocks:[],slides:[]}, {includeTitle:false});
      document.body.classList.add('paged-guide','figma-layout-page');
      $('article-title').classList.add('sr-only');
      const player=window.CatanNative.mount({
        container:$('article-body'),article,initialIndex:index,
        onChange:i=>{
          setArticleProgress(i+1,article.slides.length);
          document.title=article.title+' · '+article.slides[i].pageNumber+' · CATAN GUIDE';

        }
      });
      configurePageSeek(article.slides.length,()=>player.getIndex(),i=>player.goTo(i,true));
      cleanupPageNavigation=()=>player.destroy();
      return;
    }
    const hasLayout=page.blocks.some(block=>block.layout===true);
    document.body.classList.toggle('figma-layout-page',hasLayout);
    $('article-title').classList.toggle('sr-only',hasLayout);
    renderArticle({...article,title:page.title,tocTitle:page.title,blocks:page.blocks,slides:[]}, {includeTitle:false});
    const stepCounts=article.slides.map(slide=>window.CatanBoard?.stepCount(slide)||window.CatanPrep?.stepCount(slide)||1);
    const totalSteps=stepCounts.reduce((a,b)=>a+b,0),stepOffset=stepCounts.slice(0,index).reduce((a,b)=>a+b,0);
    const reportProgress=(step,completion=1,playing=false)=>setArticleProgress(stepOffset+step,totalSteps,completion,playing);
    reportProgress(1);
    const prepPlayer=window.CatanPrep?.supports(page)?window.CatanPrep.mount($('article-body'),article,reportProgress):null;
    const boardPlayer=window.CatanBoard?.supports(page)?window.CatanBoard.mount($('article-body'),page,reportProgress):null;
    document.body.classList.add('paged-guide');
    document.title=article.title+' · '+page.pageNumber+' · CATAN GUIDE';
      const href=i=>'article.html?id='+encodeURIComponent(article.id)+'&page='+article.slides[i].pageNumber+'&mode='+(beginner?'beginner':'basic');
    configurePageSeek(totalSteps,()=>stepOffset+(boardPlayer?.getIndex()??prepPlayer?.getIndex()??0),target=>{
      target=Math.max(0,Math.min(totalSteps-1,Math.round(target)));
      let pageIndex=0,sceneIndex=target;
      while(pageIndex<stepCounts.length-1&&sceneIndex>=stepCounts[pageIndex]){sceneIndex-=stepCounts[pageIndex];pageIndex++;}
      const url=new URL(href(pageIndex),location.href);url.searchParams.set('skipMotion','1');url.searchParams.set('motionStep',String(sceneIndex+1));
      history.pushState({},'',url);renderCurrentArticle();
    });
    const surface=$('article-scroll');
    const controls=document.createElement('nav');controls.className='page-turn-controls';controls.setAttribute('aria-label','가이드 페이지 이동');
    function link(label,destination){const node=document.createElement('a');node.textContent=label;node.href=href(destination);return node;}
    const prev=document.createElement('button'),next=document.createElement('button');
    prev.type=next.type='button';prev.textContent='이전 페이지';next.textContent='다음 페이지';prev.disabled=index===0&&!boardPlayer;
    controls.append(prev,next);$('article-body').append(controls);
    function go(direction){if(boardPlayer?.step(direction))return;const destination=index+direction;if(destination>=article.slides.length){showArticleEnd();return;}if(destination<0){showArticleEnd('start');return;}window.location.href=href(destination);}
    prev.addEventListener('click',()=>go(-1));next.addEventListener('click',()=>go(1));
    const removeSwipe=window.CatanSwipe.mount(surface,go);
    cleanupPageNavigation=()=>{removeSwipe();boardPlayer?.destroy();prepPlayer?.destroy();};
  }
  function renderCurrentArticle({replayMotion=false}={}) {
    hideSwipeHint();
    clearTimeout(endNoticeTimer);$('article-end-notice').classList.remove('is-visible');$('article-end-notice').textContent='';
    renderGuideMode();
    if(cleanupPageNavigation){cleanupPageNavigation();cleanupPageNavigation=null;} document.body.classList.remove('paged-guide','figma-layout-page'); $('article-title').classList.remove('sr-only');
    let article = articles.find(item => item.id === activeArticleId);
      if(article?.source==='figma-game-intro-20261029'||article?.source==='figma-local-scenes'){
        if(article.sceneGroups){const players=new URLSearchParams(location.search).get('players')==='3'?'3':'4';article={...article,players:Number(players),sceneIds:article.sceneGroups[players]};}
        renderArticle({...article,blocks:[],slides:[]});document.body.classList.add('figma-layout-page');$('article-title').classList.add('sr-only');
        const requested=Number(new URLSearchParams(location.search).get('introPage'))||1;
        const initialIndex=Math.max(0,Math.min(article.sceneIds.length-1,requested-1));
        const player=window.CatanIntro.mount({container:$('article-body'),article,initialIndex,autoplayInitial:replayMotion||initialIndex===0,onPlayersChange:players=>{const url=new URL(location.href);url.searchParams.set('players',players);url.searchParams.set('introPage',player.getIndex()+1);url.searchParams.delete('skipMotion');history.pushState({},'',url);renderCurrentArticle({replayMotion:true});},onChange:(i,fraction,playing)=>{setArticleProgress(i+1,article.sceneIds.length,fraction,playing);}});
        configurePageSeek(article.sceneIds.length,()=>player.getIndex(),i=>player.goTo(i));
        cleanupPageNavigation=()=>player.destroy();document.title=article.title+' - CATAN GUIDE';
      }
      else if(article?.id==='figma-9:2'&&window.CatanComponents){
        renderArticle({...article,blocks:[],slides:[]});document.body.classList.add('figma-layout-page');$('article-title').classList.add('sr-only');
        const player=window.CatanComponents.mount($('article-body'),{onComplete:showArticleEnd});
        configurePageSeek(5,()=>player.getIndex(),i=>player.goTo(i));
        cleanupPageNavigation=()=>player.destroy();document.title=article.title+' · CATAN GUIDE';
      }
      else if (article && !article.slides?.length && window.CatanNative?.supports(article)) {
        renderArticle({...article,blocks:[],slides:[]});
        document.body.classList.add('figma-layout-page');
        $('article-title').classList.add('sr-only');
        const player=window.CatanNative.mount({container:$('article-body'),article});
        cleanupPageNavigation=()=>player.destroy();
        document.title=article.title+' · CATAN GUIDE';
      }
      else if (article?.presentation === 'pages' && article.slides?.length) renderNumberedPage(article);
    else if (article) { renderArticle(article); document.title = article.title + ' · CATAN GUIDE'; }
    else {
      renderArticle({title:'글을 찾을 수 없어요',category:'',blocks:[{type:'text',text:'글이 삭제되었거나 주소가 올바르지 않아요. 목록으로 돌아가 확인해 주세요.'}]});
      document.title = '글을 찾을 수 없어요 · CATAN GUIDE';
    }
  }
  if (isArticlePage) {
    document.addEventListener('pointerdown',startSwipeHintTap,{capture:true,passive:true});
    document.addEventListener('pointerup',endSwipeHintTap,{capture:true,passive:true});
    document.addEventListener('pointercancel',()=>{swipeHintPointer=swipeHintLastTap=null;},{capture:true,passive:true});
    document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>requestAnimationFrame(maybeShowSwipeHint)));
    const slider=$('article-page-slider');
    slider.addEventListener('input',()=>{seekDragging=true;const percent=pageSeek.total>1?(Number(slider.value)-1)/(pageSeek.total-1)*100:0;$('article-progress').value=percent;$('article-progress-track').style.setProperty('--progress-position',percent+'%');});
    slider.addEventListener('change',()=>{seekDragging=false;pageSeek?.goTo(Number(slider.value)-1);});
    slider.addEventListener('pointercancel',()=>{seekDragging=false;slider.value=String(pageSeek.getCurrent()+1);});
    $('article-neighbors').addEventListener('click', event => event.stopPropagation());
    setTocOpen(false); renderCurrentArticle();
      window.addEventListener('popstate',()=>{activeArticleId=new URLSearchParams(window.location.search).get('id');renderCurrentArticle();});
    window.addEventListener('storage', event => {
      if (event.key === window.CatanOrder.key || event.key === null) {
        try { savedOrder = window.CatanOrder.read(localStorage); } catch { savedOrder = []; }
        renderGuideNavigation();
      }
    });
    const bottomBanner=$('article-bottom-banner');
    const updateBottomHeight=()=>document.documentElement.style.setProperty('--article-bottom-height',bottomBanner.getBoundingClientRect().height+'px');
    updateBottomHeight();
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(updateBottomHeight).observe(bottomBanner);
    const header = document.querySelector('.site-header');
    const updateHeaderHeight = () => document.documentElement.style.setProperty('--site-header-height', header.getBoundingClientRect().height + 'px');
    updateHeaderHeight();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updateHeaderHeight).observe(header);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !$('article-toc').hidden) { setTocOpen(false); $('toc-toggle').focus(); }
    });
  } else {
    search.value = new URLSearchParams(window.location.search).get('q') || '';
  }
  if (!isArticlePage) {
    reorderController = window.CatanOrder.attach({
      list: $('article-list'), enabled: () => editModeEnabled && window.CatanAuth.getState().loggedIn,
      announce: message => { $('reorder-status').textContent = message; },
      commit: visibleIds => {
        const allIds = window.CatanOrder.sort(articles, savedOrder).map(article => article.id);
        savedOrder = window.CatanOrder.mergeVisible(allIds, visibleIds);
        let persisted = true;
        try { localStorage.setItem(window.CatanOrder.key, JSON.stringify(savedOrder)); } catch { persisted = false; }
        render();
        $('reorder-status').textContent = persisted ? '글 순서를 저장했어요.' : '순서를 변경했어요. 이 브라우저에서는 저장할 수 없어요.';
      }
    });
    window.addEventListener('storage', event => {
      if (event.key === window.CatanOrder.key || event.key === null) {
        try { savedOrder = window.CatanOrder.read(localStorage); } catch { savedOrder = []; }
        render();
      }
    });
  }
  applyTextSize(); resetTextSizeDraft(); render();
})();

















