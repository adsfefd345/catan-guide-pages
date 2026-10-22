(() => {
  'use strict';
  let articles = [...(window.CATAN_ARTICLES || []), ...(window.CATAN_FIGMA_CONTENT?.articles || [])];
  const isArticlePage = document.body.dataset.page === 'article';
  let activeArticleId = isArticlePage ? new URLSearchParams(window.location.search).get('id') : null;
  let categories = ['전체', ...new Set([...(window.CATAN_CATEGORIES || []), ...articles.map(a => a.category)].filter(Boolean))];
  let selected = '전체';
  const $ = id => document.getElementById(id);
  const search = $('search-input');
  let savedOrder = [];
  try { savedOrder = window.CatanOrder.read(localStorage); } catch {}
  let reorderController = null;
  const slidePositions = new Map();
  let cleanupPageNavigation = null;
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
  }
  $('toc-toggle')?.addEventListener('click', () => setTocOpen($('article-toc').hidden));
  $('toc-backdrop')?.addEventListener('click', () => { setTocOpen(false); $('toc-toggle').focus(); });
  $('article-dialog')?.addEventListener('cancel', event => {
    if (!$('article-toc').hidden) { event.preventDefault(); setTocOpen(false); $('toc-toggle').focus(); }
  });
  $('article-dialog')?.addEventListener('close', () => setTocOpen(false));
  function addTocEntry(label, target) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label;
    button.addEventListener('click', () => {
      setTocOpen(false);
      target.scrollIntoView({block:'start',behavior:'instant'});
      target.focus({preventScroll:true});
    });
    $('toc-links').append(button);
  }
  function renderGuideNavigation() {
    if (!isArticlePage) return;
    const container = $('toc-guides'); container.replaceChildren();
    const ordered = window.CatanOrder.sort(articles, savedOrder);
    const numbers = window.CatanOrder.numbers(ordered);
    const groups = new Map();
    for (const article of ordered) {
      const category = article.category || '기타';
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(article);
    }
    for (const [category, guides] of groups) {
      const group = document.createElement('section'); group.className = 'toc-guide-group';
      const label = document.createElement('h4'); label.textContent = category; group.append(label);
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
    renderGuideNavigation();
    $('article-title').textContent = article.title;
    $('article-category').textContent = article.category;
    const body = $('article-body'); body.replaceChildren();
    $('toc-links').replaceChildren();
    if (includeTitle) addTocEntry(article.tocTitle || article.title, $('article-title'));
    const blocks = Array.isArray(article.blocks) ? article.blocks : (article.body ? [{type:'text',text:article.body}] : []);
    let headingIndex = 0;
    for (const block of blocks) {
      if (block.type === 'heading') {
        const heading = document.createElement('h3'); heading.textContent = block.text;
        heading.id = 'article-section-' + (++headingIndex); heading.tabIndex = -1;
        body.append(heading); addTocEntry(block.text, heading);
      } else if (block.type === 'text') {
        const p = document.createElement('p'); p.textContent = block.text; body.append(p);
      } else if (block.type === 'image' && (/^(?:data:image\/(?:png|jpeg|webp);base64,|assets\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|svg)$)/.test(block.src))) {
        const img = document.createElement('img'); img.src = block.src; img.alt = block.alt || article.title; img.loading = block.layout ? 'eager' : 'lazy'; if(block.layout){img.className='figma-layout-image';img.draggable=false;} body.append(img);
      }
    }
    if (Array.isArray(article.slides) && article.slides.length) {
      const player = window.CatanSlides.mount({container:body,slides:article.slides,initialId:slidePositions.get(article.id),onChange:id=>slidePositions.set(article.id,id)});
      article.slides.forEach((slide,index) => {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = (index+1) + '. ' + (slide.title || '슬라이드');
        button.addEventListener('click', () => { player.goTo(index); setTocOpen(false); player.stage.scrollIntoView({block:'start',behavior:'instant'}); player.stage.focus({preventScroll:true}); });
        $('toc-links').append(button);
      });
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
  function renderNumberedPage(article) {
    const allSlides=article.slides;
    const params=new URLSearchParams(window.location.search);
    let beginner=params.get('mode')==='beginner';
    if(!params.has('mode')){try{beginner=localStorage.getItem('catan-guide-beginner')==='true';}catch{}}
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
          document.title=article.title+' · '+article.slides[i].pageNumber+' · CATAN GUIDE';

          $('toc-links').querySelectorAll('[data-native-page]').forEach(link=>{
            if(Number(link.dataset.nativePage)===i)link.setAttribute('aria-current','page');
            else link.removeAttribute('aria-current');
          });
        }
      });
      article.slides.forEach((s,i)=>{
        const button=document.createElement('button');button.type='button';
        button.textContent=s.pageNumber+'. '+s.title;button.dataset.nativePage=String(i);
        if(i===index)button.setAttribute('aria-current','page');
        button.addEventListener('click',()=>{player.goTo(i);setTocOpen(false);player.stage.focus({preventScroll:true});});
        $('toc-links').append(button);
      });
      cleanupPageNavigation=()=>player.destroy();
      return;
    }
    const hasLayout=page.blocks.some(block=>block.layout===true);
    document.body.classList.toggle('figma-layout-page',hasLayout);
    $('article-title').classList.toggle('sr-only',hasLayout);
    renderArticle({...article,title:page.title,tocTitle:page.title,blocks:page.blocks,slides:[]}, {includeTitle:false});
    const prepPlayer=window.CatanPrep?.supports(page)?window.CatanPrep.mount($('article-body'),article):null;
    const boardPlayer=window.CatanBoard?.supports(page)?window.CatanBoard.mount($('article-body'),page):null;
    document.body.classList.add('paged-guide');
    document.title=article.title+' · '+page.pageNumber+' · CATAN GUIDE';
      const href=i=>'article.html?id='+encodeURIComponent(article.id)+'&page='+article.slides[i].pageNumber+(hasVariants?'&mode='+(beginner?'beginner':'basic'):'');
    const surface=$('article-scroll');
      if(hasVariants){
        const toggle=document.createElement('label');toggle.className='guide-mode-toggle';
        const basic=document.createElement('span');basic.textContent='기본';
        const beginnerLabel=document.createElement('span');beginnerLabel.textContent='초보자용';
        const input=document.createElement('input');input.type='checkbox';input.checked=beginner;input.setAttribute('role','switch');input.setAttribute('aria-label','초보자용 배치');
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
    const controls=document.createElement('nav');controls.className='page-turn-controls';controls.setAttribute('aria-label','가이드 페이지 이동');
    function link(label,destination){const node=document.createElement('a');node.textContent=label;node.href=href(destination);return node;}
    if(index>0)controls.append(link('← 이전',index-1));else {const blank=document.createElement('span');blank.className='page-turn-space';controls.append(blank);}
    const count=document.createElement('span');count.className='page-turn-count';count.textContent=(index+1)+' / '+article.slides.length;controls.append(count);
    if(index<article.slides.length-1)controls.append(link('다음 →',index+1));else controls.append(link('처음으로',0));
    const hint=document.createElement('p');hint.className='page-turn-hint';hint.textContent='화면 왼쪽은 이전 페이지, 오른쪽은 다음 페이지로 이동해요.';
    $('article-body').append(hint,controls);
    if(boardPlayer){hint.textContent='화면 왼쪽은 이전 장면, 오른쪽은 재생 또는 다음 장면으로 이동해요.';controls.querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey)return;const direction=a.textContent.startsWith('←')?-1:1;if(boardPlayer.step(direction))e.preventDefault();}));}
    article.slides.forEach((s,i)=>{const a=link(s.pageNumber+'. '+s.title,i);a.className='toc-guide-link';if(i===index)a.setAttribute('aria-current','page');$('toc-links').append(a);});
    let start=null,moved=false;
    const down=e=>{start={x:e.clientX,y:e.clientY};moved=false};
    const move=e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>10)moved=true};
    const cancel=()=>{moved=true};
    const tap=e=>{
      if(moved||window.getSelection?.()?.toString()||e.target.closest('a,button,input,textarea,select'))return;
      const bounds=surface.getBoundingClientRect();
      const direction=e.clientX<bounds.left+bounds.width/2?-1:1;
      if(boardPlayer?.step(direction))return;
      const next=index+direction;
      if(next<0||next>=article.slides.length)return;
      window.location.href=href(next);
    };
    surface.addEventListener('pointerdown',down);surface.addEventListener('pointermove',move);surface.addEventListener('pointercancel',cancel);surface.addEventListener('click',tap);
    cleanupPageNavigation=()=>{boardPlayer?.destroy();prepPlayer?.destroy();surface.removeEventListener('pointerdown',down);surface.removeEventListener('pointermove',move);surface.removeEventListener('pointercancel',cancel);surface.removeEventListener('click',tap);};
  }
  function renderCurrentArticle() {
    $('toc-guide-mode').replaceChildren();
    $('toc-guide-mode').hidden=true;
    if(cleanupPageNavigation){cleanupPageNavigation();cleanupPageNavigation=null;} document.body.classList.remove('paged-guide','figma-layout-page'); $('article-title').classList.remove('sr-only');
    const article = articles.find(item => item.id === activeArticleId);
      if(article?.id==='figma-9:2'&&window.CatanComponents){
        renderArticle({...article,blocks:[],slides:[]});document.body.classList.add('figma-layout-page');$('article-title').classList.add('sr-only');
        const player=window.CatanComponents.mount($('article-body'));const ordered=window.CatanOrder.sort(articles,savedOrder);const index=ordered.findIndex(a=>a.id===article.id);const href=i=>'article.html?id='+encodeURIComponent(ordered[i].id);
        const controls=document.createElement('nav');controls.className='page-turn-controls';controls.setAttribute('aria-label','가이드 이동');
        for(const [direction,label]of [[-1,'← 이전'],[1,'다음 →']]){const i=index+direction;if(i>=0&&i<ordered.length){const a=document.createElement('a');a.href=href(i);a.textContent=label;controls.append(a);}}
        $('article-body').append(controls);let start=null,moved=false;player.stage.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};moved=false;});player.stage.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>10)moved=true;});player.stage.addEventListener('pointercancel',()=>{moved=true;});
        const go=direction=>{const i=index+direction;if(i>=0&&i<ordered.length)location.href=href(i);};player.stage.addEventListener('click',e=>{if(moved||window.getSelection()?.toString())return;const r=player.stage.getBoundingClientRect();go(e.clientX<r.left+r.width/2?-1:1);});player.stage.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();go(e.key==='ArrowLeft'?-1:1);}});cleanupPageNavigation=()=>player.destroy();document.title=article.title+' · CATAN GUIDE';
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
    setTocOpen(false); renderCurrentArticle();
      window.addEventListener('popstate',()=>{activeArticleId=new URLSearchParams(window.location.search).get('id');renderCurrentArticle();});
    window.addEventListener('storage', event => {
      if (event.key === window.CatanOrder.key || event.key === null) {
        try { savedOrder = window.CatanOrder.read(localStorage); } catch { savedOrder = []; }
        renderGuideNavigation();
      }
    });
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

















