(function(){
  'use strict';
  // 접기: 부가 도구를 메인에서 접어 "경험→초안→검수→복사"가 주인공이 되게 한다.
  if(document.getElementById('foldStyle'))return;
  const doc=document;
  const style=doc.createElement('style');style.id='foldStyle';
  style.textContent=[
    '.folded-tool{border:1px solid var(--line,#c9d4cc);border-radius:14px;background:#fbfcfb;margin-top:14px;overflow-wrap:anywhere;word-break:keep-all}',
    '.folded-tool>summary{list-style:none;cursor:pointer;display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;padding:13px 15px;min-height:52px}',
    '.folded-tool>summary::-webkit-details-marker{display:none}',
    '.folded-tool>summary:focus-visible{outline:2px solid var(--naver,#2f9e44);outline-offset:2px;border-radius:12px}',
    '.folded-tool>summary::after{content:"펼치기 ▾";margin-left:auto;color:var(--muted,#4f625a);font-size:12px;font-weight:600;white-space:nowrap}',
    '.folded-tool[open]>summary::after{content:"접기 ▴"}',
    '.folded-tool .fold-title{font:700 15px "Apple SD Gothic Neo","Malgun Gothic",system-ui,serif;color:var(--navy-2,#0b2b22);overflow-wrap:anywhere}',
    '.folded-tool .fold-hint{flex:1 1 12rem;color:var(--muted,#4f625a);font-size:12px;font-weight:500;line-height:1.45;overflow-wrap:anywhere}',
    '.folded-tool .fold-body{padding:2px 15px 15px;overflow-wrap:anywhere;word-break:keep-all}',
    '.is-folded-section{padding:0!important;border:0!important;background:none!important;box-shadow:none!important;margin:0!important}'
  ].join('');
  doc.head.appendChild(style);

  function fold(section,hint){
    if(!section||section.dataset.folded)return;
    if(section.closest('details'))return;
    if(section.querySelector(':scope>details.folded-tool'))return;
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
  [
    ['[aria-labelledby="live-research-title"]','참고 · 문장 말고 구조만'],
    ['#live-research','참고 · 문장 말고 구조만'],
    ['[aria-labelledby="benchmark-title"]','고급 · 구조 비교'],
    ['[aria-labelledby="comment-title"]','발행 후 · 필요할 때만'],
    ['[aria-labelledby="assemble-title"]','선택 · 뼈대부터 쌓기'],
    ['#hook-tool','선택 · 뼈대부터 쌓기'],
    ['[aria-labelledby="postlog-title"]','기록 · 직접 남기는 성과']
  ].forEach(([sel,hint])=>{const s=pick(sel);if(s&&!s.dataset.folded)fold(s,hint)});
})();
