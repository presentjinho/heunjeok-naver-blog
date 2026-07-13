(function(){
  'use strict';
  // 접기 패치: 부가 도구(실시간 탐색·댓글·구조 비교)를 메인에서 접힌 상태로 둔다.
  // "경험 기록 → 검수 → 복사"가 주인공이고, 검색·비교·댓글은 secondary.
  if(document.getElementById('foldStyle'))return;
  const doc=document;
  const style=doc.createElement('style');style.id='foldStyle';
  style.textContent=[
    '.folded-tool{border:1px solid var(--line,#c9d4cc);border-radius:14px;background:#fbfcfb;margin-top:14px}',
    '.folded-tool>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;padding:13px 15px}',
    '.folded-tool>summary::-webkit-details-marker{display:none}',
    '.folded-tool>summary::after{content:"펼치기 ▾";margin-left:auto;color:var(--muted,#4f625a);font-size:12px;font-weight:600}',
    '.folded-tool[open]>summary::after{content:"접기 ▴"}',
    '.folded-tool .fold-title{font:700 15px "Gowun Batang",serif;color:var(--navy-2,#0b2b22)}',
    '.folded-tool .fold-hint{color:var(--muted,#4f625a);font-size:12px;font-weight:500}',
    '.folded-tool .fold-body{padding:2px 15px 15px}',
    '.is-folded-section{padding:0!important;border:0!important;background:none!important;box-shadow:none!important;margin:0!important}'
  ].join('');
  doc.head.appendChild(style);

  function fold(section,hint){
    if(!section||section.dataset.folded)return;
    section.dataset.folded='1';
    const heading=section.querySelector('h2,h3');
    const title=heading?heading.textContent.trim():'도구';
    const details=doc.createElement('details');details.className='folded-tool';
    const summary=doc.createElement('summary');
    const ts=doc.createElement('span');ts.className='fold-title';ts.textContent=title;summary.append(ts);
    if(hint){const hs=doc.createElement('span');hs.className='fold-hint';hs.textContent=hint;summary.append(hs)}
    details.append(summary);
    const body=doc.createElement('div');body.className='fold-body';
    while(section.firstChild)body.append(section.firstChild);
    const dupHeading=body.querySelector('h2,h3');if(dupHeading)dupHeading.remove();
    details.append(body);
    section.append(details);
    section.classList.add('is-folded-section');
  }
  function pick(sel){return doc.querySelector(sel)}
  // 순서: 마지막에 실행되도록 head에서 다른 -ui.js 뒤에 로드
  [
    ['[aria-labelledby="live-research-title"]','참고용 · 문장 말고 구조만 보세요'],
    ['#live-research','참고용 · 문장 말고 구조만 보세요'],
    ['[aria-labelledby="benchmark-title"]','고급 · 내 과거 글과 구조만 비교'],
    ['[aria-labelledby="comment-title"]','발행 후 · 필요할 때만']
  ].forEach(([sel,hint])=>{const s=pick(sel);if(s&&!s.dataset.folded)fold(s,hint)});
})();
