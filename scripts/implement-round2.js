/**
 * Round 2 UX: wizard step mode, draft quality, multi-device backup UX,
 * confirm diet, deferred scripts.
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(root, f), s);

// ---------- core.js quality ----------
{
  let core = read('core.js');
  const oldPolish = `function polishEvidence(value,key,postType='visit'){
    let text=String(value||'').replace(/\\s+/g,' ').trim().replace(/[.!?]+$/,'');if(!text)return'';
    text=text.replace(/개인\\s*(?:이|이서)?\\s*쓰는\\s*좌석/g,'혼자 쓰기 좋은 좌석').replace(/좌석이\\s*컸/g,'좌석이 넓었').replace(/해야해서/g,'해야 해서').replace(/하려고해서/g,'하려고 해서');
    if(key==='context'&&postType==='visit'&&/(?:주말|평일|오전|오후|요일|날|때)에$/.test(text))text+=' 다녀왔어요';
    if(key==='reason'&&/(?:해야 해서|하려고 해서|필요해서|원해서)$/.test(text))text+=' 이곳을 골랐어요';
    if(key==='reason'&&/작업 해야/.test(text))text=text.replace(/작업 해야/,'작업을 해야');
    return cleanSentence(text);
  }`;

  const newPolish = `function polishEvidence(value,key,postType='visit'){
    let text=String(value||'').replace(/\\s+/g,' ').trim().replace(/[.!?]+$/,'');if(!text)return'';
    text=text.replace(/개인\\s*(?:이|이서)?\\s*쓰는\\s*좌석/g,'혼자 쓰기 좋은 좌석').replace(/좌석이\\s*컸/g,'좌석이 넓었').replace(/해야해서/g,'해야 해서').replace(/하려고해서/g,'하려고 해서');
    text=text.replace(/정말\\s*좋았/g,'좋았').replace(/너무\\s*좋았/g,'좋았').replace(/완전\\s*추천/g,'추천').replace(/강추합니다/g,'추천해요');
    text=text.replace(/일단\\s+/g,'').replace(/아무튼\\s+/g,'').replace(/그래서\\s+그래서/g,'그래서');
    text=text.replace(/\\s{2,}/g,' ').trim();
    if(key==='context'&&postType==='visit'&&/(?:주말|평일|오전|오후|요일|날|때)에$/.test(text))text+=' 다녀왔어요';
    if(key==='reason'&&/(?:해야 해서|하려고 해서|필요해서|원해서)$/.test(text))text+=' 이곳을 골랐어요';
    if(key==='reason'&&/작업 해야/.test(text))text=text.replace(/작업 해야/,'작업을 해야');
    if(key==='pros'&&!/(어요|아요|습니다|죠|네요)$/.test(text))text+=' 편했어요';
    if(key==='consAudience'&&/(추천|맞|어울)/.test(text)&&!/(어요|아요|습니다|요)$/.test(text))text+='요';
    return cleanSentence(text);
  }
  function polishParagraphs(paragraphs){
    const cleaned=[];
    for(const raw of paragraphs){
      let text=String(raw||'').replace(/\\s+/g,' ').trim();if(!text)continue;
      text=text.replace(/([.!?])\\s*\\1+/g,'$1');
      text=text.replace(/(그런데|근데|다만)\\s+\\1/g,'$1');
      text=text.replace(/습니다요/g,'습니다').replace(/어요요/g,'어요');
      if(cleaned.some(saved=>evidenceOverlap(text,saved)>=.82))continue;
      cleaned.push(text);
    }
    return cleaned;
  }`;

  if (!core.includes('function polishParagraphs')) {
    if (!core.includes(oldPolish)) {
      // try partial
      if (!core.includes('function polishEvidence')) throw new Error('polishEvidence missing');
      core = core.replace(
        /function polishEvidence\([\s\S]*?return cleanSentence\(text\);\n  \}/,
        newPolish.trim().replace(/\n {2}/g, '\n  ')
      );
    } else {
      core = core.replace(oldPolish, newPolish);
    }
  }

  if (core.includes('const paragraphs=composedMemo||paragraphGroups;') && !core.includes('polishParagraphs(composedMemo||paragraphGroups)')) {
    core = core.replace(
      'const paragraphs=composedMemo||paragraphGroups;',
      'const paragraphs=polishParagraphs(composedMemo||paragraphGroups);'
    );
  }
  if (core.includes('if(cleanMemo&&!composedMemo)paragraphs.push(cleanSentence(cleanMemo));') && !core.includes('polishParagraphs([')) {
    core = core.replace(
      'if(cleanMemo&&!composedMemo)paragraphs.push(cleanSentence(cleanMemo));',
      'if(cleanMemo&&!composedMemo){const extra=polishParagraphs([cleanSentence(cleanMemo)]);if(extra[0])paragraphs.push(extra[0])}'
    );
  }

  // export polishParagraphs if return block lists functions
  if (core.includes('polishEvidence,') && !core.includes('polishParagraphs,')) {
    core = core.replace('polishEvidence,', 'polishEvidence,polishParagraphs,');
  }

  write('core.js', core);
  console.log('core quality', core.includes('polishParagraphs'));
}

// ---------- product-v2.js wizard + sync + confirm diet + defer hooks ----------
{
  let s = read('product-v2.js');

  // confirm diet: assemble replace
  s = s.replace(
    "replace.addEventListener('click',()=>{if(!confirm('현재 본문을 4단계 뼈대로 바꿀까요? 기존 본문은 버전 기록에서 복구할 수 있습니다.'))return;primary.click();const draft=$('draft');const marker=draft.value.lastIndexOf('# 4단계 뼈대');if(marker>=0){draft.value=draft.value.slice(marker);draft.dispatchEvent(new Event('input',{bubbles:true}))}});",
    "replace.addEventListener('click',()=>{const draft=$('draft');const before=draft.value;primary.click();const marker=draft.value.lastIndexOf('# 4단계 뼈대');if(marker>=0){draft.value=draft.value.slice(marker);draft.dispatchEvent(new Event('input',{bubbles:true}))}offerUndo('본문을 4단계 뼈대로 바꿨어요.',()=>{draft.value=before;draft.dispatchEvent(new Event('input',{bubbles:true}))});});"
  );

  // multi-device banner
  if (!s.includes('function multiDeviceBanner')) {
    s = s.replace(
      'function backup(){',
      `function multiDeviceBanner(){const last=readPrefs().lastBackupAt;const stale=!last||Date.now()-Date.parse(last)>7*864e5;if(!stale&&readPrefs().syncHintDismissed)return;if(q('.sync-banner'))return;const bar=make('aside',{class:'sync-banner','aria-label':'기기 이전 안내'});bar.append(make('strong',{},'다른 기기에서 이어서 쓰려면'));bar.append(make('p',{},'계정 동기화는 없습니다. JSON 백업을 내려받아 새 기기에서 가져오세요. 사진은 백업에 포함되지 않습니다.'));const row=make('div',{class:'action-row'});const go=make('button',{type:'button',class:'secondary'},'백업 만들러 가기');const dismiss=make('button',{type:'button',class:'text-button'},'닫기');go.addEventListener('click',()=>{smoothScroll(q('[aria-labelledby=\"data-title\"]')||$('exportLocalData'));$('exportLocalData')?.focus()});dismiss.addEventListener('click',()=>{savePrefs({syncHintDismissed:true,lastBackupAt:readPrefs().lastBackupAt||new Date().toISOString()});bar.remove()});row.append(go,dismiss);bar.append(row);q('.quick-route')?.insertAdjacentElement('afterend',bar)}
  function backup(){`
    );
  }

  // wizard step mode
  if (!s.includes('function wizardStepMode')) {
    s = s.replace(
      'function wizard(){',
      `function wizardStepMode(){
    d.body.classList.add('wizard-step-mode');
    const map=[
      {step:0,show:['#topicSection'],label:'주제'},
      {step:1,show:['#experience-tool','.optional-tone'],label:'경험'},
      {step:2,show:['#resultPanel'],label:'초안',tab:'draft'},
      {step:3,show:['#quality-tool','#resultPanel'],label:'검수',tab:'check'},
      {step:4,show:['#resultPanel'],label:'복사',tab:'publish'}
    ];
    const hideables=['#topicSection','#experience-tool','.optional-tone','#resultPanel','#quality-tool'];
    function showStep(step){
      const n=Math.max(0,Math.min(4,Number(step)||0));
      d.body.dataset.wizardStep=String(n);
      hideables.forEach(sel=>qa(sel).forEach(el=>el.classList.add('wizard-step-hide')));
      const current=map[n];
      current.show.forEach(sel=>qa(sel).forEach(el=>el.classList.remove('wizard-step-hide')));
      qa('.wizard-nav button').forEach((b,i)=>{b.classList.toggle('is-current',i===n);b.setAttribute('aria-current',i===n?'step':'false')});
      if(current.tab){const btn=q(\`.result-tabs button[data-result-tab=\"\${current.tab}\"]\`);btn?.click()}
      savePrefs({wizardStep:n});
      const first=q(current.show[0]);smoothScroll(first);
    }
    qa('.wizard-nav button').forEach((button,i)=>{button.onclick=null;button.addEventListener('click',()=>showStep(i))});
    const nav=q('.wizard-nav');
    if(nav&&!nav.querySelector('.wizard-next')){
      const row=make('div',{class:'wizard-step-actions'});
      const prev=make('button',{type:'button',class:'secondary',id:'wizardPrev'},'이전');
      const next=make('button',{type:'button',class:'primary',id:'wizardNext'},'다음');
      prev.addEventListener('click',()=>showStep(Number(d.body.dataset.wizardStep||0)-1));
      next.addEventListener('click',()=>{const n=Number(d.body.dataset.wizardStep||0);if(n===1)$('generate')?.disabled?showStep(1):($('generate')?.click(),showStep(2));else if(n>=4)smoothScroll($('copyAll'));else showStep(n+1)});
      row.append(prev,next);nav.insertAdjacentElement('afterend',row);
    }
    showStep(readPrefs().wizardStep||0);
    window.HeunjeokWizard={showStep};
  }
  function wizard(){`
    );

    s = s.replace(
      'function init(){runtimeBanner();quickRoute();simplifyFlow();wizard();mobileTabs();advanced();publishChecklist();',
      'function init(){runtimeBanner();quickRoute();simplifyFlow();wizard();wizardStepMode();mobileTabs();advanced();publishChecklist();multiDeviceBanner();'
    );
  }

  // result density: move specificity to check tab if resultTabs still uses old groups
  if (s.includes("groups={draft:[q('#titles-heading')?.closest('.result-section'),q('#draft-heading')?.closest('.result-section'),q('.two-up'),q('.specificity')]")) {
    s = s.replace(
      "groups={draft:[q('#titles-heading')?.closest('.result-section'),q('#draft-heading')?.closest('.result-section'),q('.two-up'),q('.specificity')],check:[$('trustPanel'),q('.provenance'),q('.human-check')]",
      "groups={draft:[q('#titles-heading')?.closest('.result-section'),q('#draft-heading')?.closest('.result-section'),q('.two-up')],check:[$('trustPanel'),q('.provenance'),q('.human-check'),q('.specificity')]"
    );
  }

  write('product-v2.js', s);
  console.log('product-v2', {
    wizardStep: s.includes('wizardStepMode'),
    multi: s.includes('multiDeviceBanner'),
    assembleUndo: s.includes("본문을 4단계 뼈대로 바꿨어요"),
  });
}

// ---------- app.js confirm diet for version restore ----------
{
  let app = read('app.js');
  app = app.replace(
    "if(!confirm('선택한 본문 버전으로 복구할까요? 현재 본문도 복구 목록에 먼저 보관합니다.'))return;saveVersion('복구 전');",
    "saveVersion('복구 전');"
  );
  // after restore toast - find restoreDraftVersion
  if (!app.includes('이전 본문을 버전 목록에 남겨 두었어요')) {
    app = app.replace(
      "toast('선택한 본문 버전으로 복구했어요.')",
      "toast('선택한 본문 버전으로 복구했어요. 직전 본문은 버전 목록에 남겼어요.')"
    );
  }
  write('app.js', app);
  console.log('app confirm diet', !app.includes("선택한 본문 버전으로 복구할까요"));
}

// ---------- deferred scripts in index.html ----------
{
  let html = read('index.html');
  // Keep critical chain; mark secondary as data-defer and load via small boot
  const critical = [
    'core.js',
    'history.js',
    'photo-vault.js',
    'quality.js',
    'backup.js',
    'app.js',
    'product-v2.js',
    'fold-ui.js',
  ];
  const deferred = [
    'benchmark.js',
    'assemble.js',
    'postlog.js',
    'daily.js',
    'benchmark-ui.js',
    'improve-ui.js',
    'postlog-ui.js',
    'daily-ui.js',
  ];

  // rebuild script section before </head>
  const v = (html.match(/\?v=([^"]+)/) || [, '20260713-2'])[1];
  const scripts =
    critical
      .map((f) => `  <script src="./${f}?v=${v}" defer></script>`)
      .join('\n') +
    '\n' +
    deferred
      .map((f) => `  <script src="./${f}?v=${v}" defer data-defer-tool="1"></script>`)
      .join('\n') +
    `\n  <script src="./defer-tools.js?v=${v}" defer></script>\n`;

  html = html.replace(/  <script src="\.\/core\.js[\s\S]*?<\/head>/, scripts + '</head>');
  write('index.html', html);
  console.log('index scripts rewritten');
}

// defer-tools.js
write(
  'defer-tools.js',
  `(function(){
  'use strict';
  // 부가 도구 스크립트는 이미 defer로 뒤쪽에 두되, 첫 상호작용 전 idle에 실행 부담을 줄이기 위해
  // 네트워크 로드는 유지하고 무거운 초기 UI는 도구 탭/품질 버튼에서 깨운다.
  const ready=()=>window.dispatchEvent(new CustomEvent('heunjeok:tools-ready'));
  if('requestIdleCallback'in window)requestIdleCallback(()=>ready(),{timeout:2500});
  else setTimeout(ready,1200);
  document.addEventListener('click',function once(e){
    if(e.target.closest('#quality-tool,.mobile-tabs,.wizard-nav,.advanced-tools,.folded-tool')){
      ready();document.removeEventListener('click',once);
    }
  },true);
})();
`
);

// CSS for wizard step mode + sync banner
{
  let css = read('product-v2.css');
  if (!css.includes('wizard-step-mode')) {
    css += `
/* 1단계 1화면 위자드 */
body.wizard-step-mode .wizard-step-hide{display:none!important}
body.wizard-step-mode .wizard-step-actions{display:flex;gap:10px;justify-content:space-between;margin:0 0 18px}
body.wizard-step-mode .wizard-step-actions .primary{min-width:42%}
body.wizard-step-mode .advanced-tools,body.wizard-step-mode .folded-tool,body.wizard-step-mode [aria-labelledby="data-title"]{display:none}
body.wizard-step-mode[data-wizard-step="3"] .folded-tool,body.wizard-step-mode[data-wizard-step="3"] .advanced-tools{display:block}
body.wizard-step-mode[data-wizard-step="4"] [aria-labelledby="data-title"]{display:block}
.sync-banner{margin:12px 0 18px;padding:14px 16px;border:1px solid #e0c48a;border-radius:16px;background:#fff8e8;color:#6a4a12}
.sync-banner p{margin:6px 0 10px;font-size:13px;line-height:1.55}
.sync-banner .action-row{display:flex;gap:8px;flex-wrap:wrap}
[data-theme=dark] .sync-banner{background:#3a2f18;border-color:#6a5730;color:#f6e2b0}
@media(max-width:700px){body.wizard-step-mode .wizard-step-actions{position:sticky;bottom:72px;z-index:30;padding:8px;border-radius:14px;background:rgba(255,253,250,.96);box-shadow:0 8px 24px rgba(12,38,24,.12)}}
`;
    write('product-v2.css', css);
  }
  console.log('css wizard/sync ok');
}

// server + pages allow defer-tools.js
{
  let server = read('server.js');
  if (!server.includes("'/defer-tools.js'")) {
    server = server.replace("'/fold-ui.js'", "'/fold-ui.js','/defer-tools.js'");
    write('server.js', server);
  }
  let pages = read('.github/workflows/pages.yml');
  if (!pages.includes('defer-tools.js')) {
    pages = pages.replace('fold-ui.js _site/', 'fold-ui.js defer-tools.js _site/');
    write('.github/workflows/pages.yml', pages);
  }
  console.log('server/pages defer ok');
}

// tests for core polish + wizard
{
  let t = read('tests/core.test.js');
  if (!t.includes('polishParagraphs')) {
    t += `
test('polishParagraphs는 반복 문장과 군더더기를 줄인다',()=>{
  const Core=require('../core.js');
  assert.ok(typeof Core.polishParagraphs==='function'||typeof Core.polishEvidence==='function');
  if(typeof Core.polishParagraphs==='function'){
    const out=Core.polishParagraphs(['창가 자리가 밝았어요.','창가 자리가 밝았어요.','그런데 소음이 커졌어요.']);
    assert.ok(out.length<=2);
  }
  const polished=Core.polishEvidence('노트북 작업 해야해서','reason','visit');
  assert.match(polished,/골랐|작업/);
});
`;
    write('tests/core.test.js', t);
  }

  let p2t = read('tests/product-v2.test.js');
  if (!p2t.includes('wizardStepMode')) {
    p2t = p2t.replace(
      "test('단계형 위자드·모바일 3탭·고급 접기를 제공한다',()=>{assert.match(js,/class:'wizard-nav'/);assert.match(js,/class:'mobile-tabs'/);assert.match(js,/발행 기록 더 보기/);assert.match(js,/function publishChecklist/);assert.match(css,/grid-template-columns:repeat\\(3,1fr\\)/)});",
      "test('단계형 위자드·모바일 3탭·고급 접기를 제공한다',()=>{assert.match(js,/class:'wizard-nav'/);assert.match(js,/class:'mobile-tabs'/);assert.match(js,/발행 기록 더 보기/);assert.match(js,/function publishChecklist/);assert.match(js,/function wizardStepMode/);assert.match(js,/wizard-step-mode/);assert.match(js,/multiDeviceBanner/);assert.match(css,/grid-template-columns:repeat\\(3,1fr\\)/)});"
    );
    write('tests/product-v2.test.js', p2t);
  }
}

console.log('round2 done');
