(function(){
  'use strict';
  // 라이브 감사 대응: (#1) 신뢰 문구 상단 통합·나머지 축약  (#3) 말투 입력 접기
  // (#5) 복사 위치 안내  (#6) 체크리스트 필수 완료감. 핵심 파일 미수정, DOM 후처리만.
  const doc=document;
  const $=id=>doc.getElementById(id);
  const make=(tag,cls)=>{const el=doc.createElement(tag);if(cls)el.className=cls;return el};

  if(!$('polishStyle')){
    const style=make('style');style.id='polishStyle';
    style.textContent=[
      '.trust-banner{margin:14px 0 0;padding:11px 15px;border:1px solid #cde0d2;border-left:4px solid var(--naver,#2f9e44);border-radius:12px;background:#f2f8f3;color:#22503a;font-size:13px;line-height:1.6}',
      '.trust-banner b{color:#123b28}',
      '.storage-note,.final-note,.live-disclosure,.specificity-note{opacity:.72}',
      'details.tone-fold{margin-top:2px;border:1px dashed #c6d4cb;border-radius:12px;background:#fbfcfb}',
      'details.tone-fold>summary{list-style:none;cursor:pointer;padding:11px 14px;font-weight:700;color:#275b43;display:flex;align-items:center;flex-wrap:wrap;gap:6px}',
      'details.tone-fold>summary::-webkit-details-marker{display:none}',
      'details.tone-fold>summary::after{content:"열기 ▾";margin-left:auto;font-size:12px;font-weight:600;color:var(--muted,#4f625a)}',
      'details.tone-fold[open]>summary::after{content:"접기 ▴"}',
      'details.tone-fold>summary small{font-weight:500;color:var(--muted,#4f625a);font-size:12px}',
      'details.tone-fold>summary:focus-visible{outline:2px solid var(--naver,#2f9e44);outline-offset:2px;border-radius:10px}',
      '.tone-fold-body{padding:4px 14px 14px}',
      '.copy-guide{margin:2px 0 10px;padding:9px 12px;border-radius:10px;background:#eef5f0;color:#25543d;font-size:12.5px;line-height:1.6}',
      '.copy-guide b{color:#123b28}',
      '.required-progress{margin:4px 0 0;font-size:12.5px;font-weight:700;color:#8a5a12}',
      '.required-progress.is-ready{color:#1f7a43}'
    ].join('');
    doc.head.appendChild(style);
  }

  // (#1) 상단 신뢰 요약 배너 — 반복 문구를 한 번에 대신함
  (function trustBanner(){
    const hero=doc.querySelector('.hero');
    if(!hero||$('trustBanner'))return;
    const b=make('div','trust-banner');b.id='trustBanner';
    b.innerHTML='<b>먼저 알아두세요</b> — 흔적은 네이버 공식 서비스가 아니고, 조회수·노출 순위를 수집하거나 보장하지 않아요. 입력한 내용은 이 브라우저에만 저장되고 외부로 보내지 않습니다.';
    hero.insertAdjacentElement('afterend',b);
  })();

  // (#3) 말투(02) 입력 접기 — 선택임을 분명히, 없이도 바로 시작
  (function foldTone(){
    const tone=$('tone-tool');
    if(!tone||tone.dataset.toneFolded||tone.closest('details'))return;
    const heading=tone.querySelector('.card-heading');
    const det=make('details','tone-fold');
    const sum=make('summary');
    sum.innerHTML='말투 반영하기 <small>선택 · 말투 없이도 바로 시작돼요</small>';
    det.append(sum);
    const body=make('div','tone-fold-body');
    Array.prototype.slice.call(tone.children).forEach(ch=>{if(ch!==heading)body.append(ch)});
    det.append(body);tone.append(det);
    tone.dataset.toneFolded='1';
  })();

  // (#5) 복사 위치 안내 — 제목/본문/모두를 네이버 어디에 붙일지
  (function copyGuide(){
    const actions=doc.querySelector('.publish-actions');
    if(actions&&!$('copyGuide')){
      const g=make('p','copy-guide');g.id='copyGuide';
      g.innerHTML='붙여넣을 곳 — <b>첫 제목 복사</b>→네이버 <b>제목칸</b>, <b>본문 복사</b>→<b>본문 영역</b>, <b>모두 복사</b>→제목칸부터 순서대로';
      actions.insertAdjacentElement('beforebegin',g);
    }
    [['copyTitle','네이버 글쓰기의 제목칸에 붙여넣기'],['copyBody','네이버 본문 영역에 붙여넣기'],['copyAll','제목칸부터 순서대로 붙여넣기'],['copyTags','본문 끝에 해시태그로 붙여넣기']].forEach(([id,t])=>{const b=$(id);if(b)b.title=t});
  })();

  // (#6) 체크리스트 필수 완료감 — 필수 4개 진행률 + '발행 준비됨' 신호
  (function requiredProgress(){
    const fieldset=$('publish-tool');const prog=$('checkProgress');
    if(!fieldset||!prog||$('requiredProgress'))return;
    const required=Array.prototype.slice.call(fieldset.querySelectorAll(':scope > label input[name="publishCheck"]'));
    if(!required.length)return;
    const badge=make('p','required-progress');badge.id='requiredProgress';badge.setAttribute('role','status');
    prog.insertAdjacentElement('afterend',badge);
    const update=()=>{
      const done=required.filter(c=>c.checked).length;
      const ready=done>=required.length;
      badge.textContent=ready?'✓ 필수 확인 완료 — 이제 발행해도 좋아요 (나머지는 선택)':('필수 '+done+'/'+required.length+' — 제목·본문 일치, 수치, 사진 권리, 협찬 표시');
      badge.classList.toggle('is-ready',ready);
    };
    required.forEach(c=>c.addEventListener('change',update));
    update();
  })();
})();
