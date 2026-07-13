(function(){
  'use strict';
  const Daily=globalThis.HeunjeokDaily;
  if(!Daily)return;
  const $=id=>document.getElementById(id);
  const doc=document;
  const hero=doc.querySelector('.hero')||( $('hero-title')&&$('hero-title').closest('section'))||doc.querySelector('main');
  if(!hero||$('onboarding'))return;

  const now=new Date();
  const section=doc.createElement('section');
  section.id='onboarding';section.className='onboarding';section.setAttribute('aria-label','사용 안내와 오늘의 글감');

  // 1) 사용법(맨 앞) + 시작 CTA
  const top=doc.createElement('div');top.className='onboard-top';
  const date=doc.createElement('span');date.className='onboard-date';date.textContent='오늘 · '+Daily.todayLabel(now);
  const h=doc.createElement('h2');h.textContent='3분이면 네이버에 올릴 글 한 편';
  const p=doc.createElement('p');p.textContent='AI가 대신 써주는 게 아니라, 내 경험으로 쓰고 저품질·AI 티를 걸러 발행까지 돕습니다.';
  const steps=doc.createElement('ol');steps.className='onboard-steps';
  [['1','주제 고르고 경험 3줄 답하기'],['2','초안 만들고 도입 훅·4단계로 구성하기'],['3','저품질 검수 → 복사해서 네이버에 발행']].forEach(([n,t])=>{const li=doc.createElement('li');const b=doc.createElement('b');b.textContent=n;li.append(b,doc.createTextNode(' '+t));steps.append(li)});
  const cta=doc.createElement('button');cta.id='onboardStart';cta.type='button';cta.className='primary large';cta.textContent='지금 시작하기 →';
  cta.addEventListener('click',()=>{const t=$('topicSection');if(t){t.scrollIntoView({behavior:'smooth',block:'start'});const first=t.querySelector('button,select,input');if(first)first.focus({preventScroll:true})}});
  top.append(date,h,p,steps,cta);

  // 2) 오늘의 글감 (매일 회전) — 누르면 바로 작성 흐름으로 전환
  const daily=doc.createElement('div');daily.className='onboard-daily';
  const dh=doc.createElement('h3');dh.innerHTML='오늘의 글감 <small>매일 바뀜 · 경험 기반 제안</small>';
  const grid=doc.createElement('div');grid.id='dailyPrompts';grid.className='daily-prompts';
  Daily.dailyPrompts(now,3).forEach(item=>{
    const card=doc.createElement('button');card.type='button';card.className='daily-card';
    const strong=doc.createElement('strong');strong.textContent=item.topic;
    const tag=doc.createElement('span');tag.textContent='#'+item.keyword;
    card.append(strong,tag);
    card.addEventListener('click',()=>startWith(item));
    grid.append(card);
  });
  const note=doc.createElement('p');note.className='onboard-note';note.textContent='네이버 조회수 순위가 아니라, 오늘 써볼 만한 경험 글감이에요. 실제 조회수는 수집·표시하지 않습니다.';
  daily.append(dh,grid,note);

  // 3) 자세한 예시 (before → after)
  const ex=doc.createElement('details');ex.className='onboard-example';
  const sm=doc.createElement('summary');sm.textContent='자세한 예시 보기 — 입력하면 이렇게 나와요';
  ex.append(sm);
  const exBody=doc.createElement('div');exBody.className='example-body';
  exBody.innerHTML=[
    '<div class="example-col"><h4>① 내가 넣는 경험 (3줄)</h4><ul>',
    '<li>토요일 오후 2시, 성수동 어니언 카페 혼자 방문</li>',
    '<li>창고를 개조해 천장 높고 30석, 창가가 조용</li>',
    '<li>아메리카노 5000원, 두 시간 노트북 작업</li>',
    '</ul></div>',
    '<div class="example-col"><h4>② 만들어지는 초안 (예)</h4>',
    '<p class="example-title">제목: 성수동 노트북 작업하기 좋은 조용한 카페 방문기</p>',
    '<p class="example-draft">토요일 오후 2시에 성수동 어니언 카페를 혼자 방문했어요. 창고를 개조한 공간이라 천장이 높고 30석 정도로 넓었고, 창가 자리가 특히 조용했습니다. 아메리카노 5000원을 주문해 두 시간 정도 노트북 작업을 했어요.</p></div>',
    '<div class="example-col"><h4>③ 저품질 검수 → 안전 교정</h4>',
    '<p class="example-before">전: 무조건 강력 추천하는 최고의 카페! 효과는 100% 보장합니다.</p>',
    '<p class="example-after">후: (과장·보장 표현 제거) 카페! → 확인한 조건만 남기고 <code>[직접 확인한 범위를 적어주세요]</code>로 대체</p></div>'
  ].join('');
  ex.append(exBody);

  section.append(top,daily,ex);
  hero.insertAdjacentElement('afterend',section);

  function startWith(item){
    const cat=$('category');if(cat&&item.category&&[...cat.options].some(o=>o.value===item.category)){cat.value=item.category;cat.dispatchEvent(new Event('change',{bubbles:true}))}
    const pt=$('postType');if(pt&&item.postType&&[...pt.options].some(o=>o.value===item.postType)){pt.value=item.postType;pt.dispatchEvent(new Event('change',{bubbles:true}))}
    const custom=$('customTopic');const use=$('useCustomTopic');
    if(custom&&use){custom.value=item.topic;use.click();}
    const t=$('topicSection');if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
  }
  // 내 주제와 비슷한 글 바로 보기 (관련도 높은 순 · 실시간 검색)
  function currentTopicText(){const c=$('customTopic');if(c&&c.value.trim())return c.value.trim();const st=$('selectedTopicStatus');if(st){const m=st.textContent.match(/주제:\s*(.+)$/);if(m)return m[1].trim()}const t=doc.querySelector('#titleCandidates li span');return t?t.textContent.trim():''}
  function enhanceLiveResearch(){
    const host=$('live-research')||doc.querySelector('[aria-labelledby="live-research-title"]');
    if(!host||$('similarSearch'))return;
    const box=doc.createElement('div');box.id='similarSearch';box.className='similar-search';
    const label=doc.createElement('label');label.setAttribute('for','similarQuery');label.textContent='내 주제와 비슷한 글 바로 보기';
    const row=doc.createElement('div');row.className='similar-row';
    const input=doc.createElement('input');input.id='similarQuery';input.type='text';input.placeholder='예: 성수동 노트북 카페';input.value=currentTopicText();
    const btn=doc.createElement('button');btn.type='button';btn.className='primary';btn.textContent='비슷한 글 보기 →';
    const open=sort=>{const q=(input.value||currentTopicText()).trim();if(q.length<2){input.focus({preventScroll:true});return}const url='https://search.naver.com/search.naver?where=blog&sort='+sort+'&query='+encodeURIComponent(q);window.open(url,'_blank','noopener')};
    btn.addEventListener('click',()=>open('sim'));
    const recent=doc.createElement('button');recent.type='button';recent.className='secondary';recent.textContent='최신순';recent.addEventListener('click',()=>open('date'));
    row.append(input,btn,recent);
    const note=doc.createElement('p');note.className='onboard-note';note.textContent='관련도(정확도) 높은 순으로 네이버 블로그 검색을 새 창에서 엽니다. 네이버가 조회수 순위를 외부에 주지 않아, 관련도 순으로 인기 글에 가깝게 보여줘요. 문장 대신 구조만 참고하세요.';
    box.append(label,row,note);
    const anchor=host.querySelector('p');if(anchor)anchor.insertAdjacentElement('afterend',box);else host.append(box);
  }
  enhanceLiveResearch();

})();
