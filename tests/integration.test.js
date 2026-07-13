const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
let JSDOM;try{JSDOM=require('jsdom').JSDOM}catch{}
const itDom=(name,fn)=>test(name,{skip:JSDOM?false:'jsdom 미설치 — 통합 테스트 건너뜀'},fn);

const DIR=path.resolve(__dirname,'..');
function load(file){return fs.readFileSync(path.join(DIR,file),'utf8')}
function boot(){
  const html=load('index.html');
  const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true});
  const {window}=dom;
  window.confirm=()=>true;window.alert=()=>{};window.scrollTo=()=>{};
  window.Element.prototype.scrollIntoView=()=>{};
  window.URL.createObjectURL=window.URL.createObjectURL||(()=>'blob:stub');window.URL.revokeObjectURL=()=>{};
  // 엔진 → UI 순서로 실제 스크립트를 window 안에서 실행
  ['benchmark.js','quality.js','assemble.js','postlog.js','benchmark-ui.js','improve-ui.js','postlog-ui.js'].forEach(f=>window.eval(load(f)));
  return window;
}
function byText(window,selector,text){return [...window.document.querySelectorAll(selector)].find(el=>el.textContent.includes(text))}

itDom('엔진 전역이 페이지에 로드된다',()=>{
  const w=boot();
  assert.ok(w.HeunjeokAssemble&&w.HeunjeokQuality&&w.HeunjeokBenchmark&&w.HeunjeokPostLog);
});

itDom('조립: 주제 선택 후 4단계와 훅 후보가 렌더된다',()=>{
  const w=boot();const d=w.document;
  d.getElementById('customTopic').value='성수동 조용한 카페';
  d.getElementById('runAssemble').dispatchEvent(new w.Event('click'));
  assert.equal(d.getElementById('assembleResult').hidden,false);
  assert.equal(d.querySelectorAll('.assemble-stage').length,4);
  assert.ok(d.querySelectorAll('.hook-pick').length>=3);
});

itDom('조립→초안: 뼈대를 초안 편집기에 넣는다',()=>{
  const w=boot();const d=w.document;
  d.getElementById('customTopic').value='성수동 카페';
  d.getElementById('runAssemble').dispatchEvent(new w.Event('click'));
  const insert=byText(w,'#assembleResult button','이 뼈대를 초안 편집기에 넣기');
  assert.ok(insert,'삽입 버튼 존재');
  insert.dispatchEvent(new w.Event('click'));
  assert.match(d.getElementById('draft').value,/■/);
});

itDom('조립: 훅 후보를 누르면 초안 맨 앞에 들어간다',()=>{
  const w=boot();const d=w.document;
  d.getElementById('customTopic').value='성수동 카페';
  d.getElementById('runAssemble').dispatchEvent(new w.Event('click'));
  d.querySelector('.hook-pick').dispatchEvent(new w.Event('click'));
  assert.match(d.getElementById('draft').value,/^\[도입\]/);
});

itDom('검수: 나쁜 초안에서 경고·교정본·크로스링크가 나온다',()=>{
  const w=boot();const d=w.document;
  d.getElementById('draft').value='무조건 강력 추천하는 최고의 카페! 효과는 100% 보장합니다. 상위 노출 확실히 됩니다. 지금부터 총정리 정리해봤어요. 문의 주세요 구매 링크.';
  d.getElementById('runQuality').dispatchEvent(new w.Event('click'));
  assert.ok(d.getElementById('qualityList').children.length>0);
  assert.ok(d.getElementById('correctionPreview').value.length>0);
  assert.ok(d.getElementById('qualityCross'),'크로스링크 행 존재');
  assert.doesNotMatch(d.getElementById('correctionPreview').value,/100%\s*보장/);
});

itDom('검수→교정 적용: 초안이 교정본으로 바뀐다',()=>{
  const w=boot();const d=w.document;
  d.getElementById('draft').value='무조건 최고! 100% 보장합니다. 지금부터 알아보겠습니다.';
  d.getElementById('runQuality').dispatchEvent(new w.Event('click'));
  const before=d.getElementById('draft').value;
  d.getElementById('applyCorrection').dispatchEvent(new w.Event('click'));
  assert.notEqual(d.getElementById('draft').value,before);
  assert.doesNotMatch(d.getElementById('draft').value,/100%\s*보장/);
});

itDom('구조 비교: 기준 글과 초안을 대조하고 점수·크로스링크를 낸다',()=>{
  const w=boot();const d=w.document;
  d.getElementById('draft').value='저는 토요일에 성수동 카페에 다녀왔어요. 창가 자리에 앉아 아메리카노를 마셨습니다. 두 시간 머물렀어요.';
  d.getElementById('benchmarkReference').value=['오늘은 성수동 카페 방문기예요.','입구는 좁지만 안은 넓었어요. 자리는 20석 정도.','메뉴','아메리카노 4500원. 두 시간 머물렀습니다.','사진도 남겼어요.','다들 어떤 카페 좋아하세요? 공감과 댓글 부탁해요.'].join('\n\n');
  d.getElementById('benchmarkRun').dispatchEvent(new w.Event('click'));
  assert.equal(d.getElementById('benchmarkResult').hidden,false);
  assert.match(d.getElementById('benchmarkScore').textContent,/%$/);
  assert.ok(d.getElementById('benchmarkCross'),'검수로 이어가기 버튼 존재');
});

itDom('발행 로그: 기록 추가가 목록과 저장소에 반영된다',()=>{
  const w=boot();const d=w.document;
  d.getElementById('logTopic').value='성수동 카페 후기';
  d.getElementById('logKeywords').value='성수동, 카페';
  d.getElementById('logAdd').dispatchEvent(new w.Event('click'));
  assert.ok(d.getElementById('logList').children.length>0);
  const saved=JSON.parse(w.localStorage.getItem('heunjeok-postlog'));
  assert.equal(saved[0].topic,'성수동 카페 후기');
});

itDom('발행 로그: 현재 초안 불러오기 버튼이 제목·태그를 채운다',()=>{
  const w=boot();const d=w.document;
  // 제목 후보와 해시태그를 흉내
  const li=d.createElement('li');const span=d.createElement('span');span.textContent='성수동 노트북 카페 방문기';li.append(span);d.getElementById('titleCandidates').append(li);
  d.getElementById('hashtags').textContent='#성수동 #카페 #노트북';
  d.getElementById('logPull').dispatchEvent(new w.Event('click'));
  assert.equal(d.getElementById('logTopic').value,'성수동 노트북 카페 방문기');
  assert.match(d.getElementById('logKeywords').value,/성수동/);
});

itDom('검수→발행 로그 크로스링크가 logPull을 호출한다',()=>{
  const w=boot();const d=w.document;
  const li=d.createElement('li');const span=d.createElement('span');span.textContent='내 초안 제목';li.append(span);d.getElementById('titleCandidates').append(li);
  d.getElementById('draft').value='저는 직접 가봤어요. 조용하고 좋았습니다. 다음에 또 가려고 해요.';
  d.getElementById('runQuality').dispatchEvent(new w.Event('click'));
  const logBtn=byText(w,'#qualityCross button','발행 기록에 저장');
  assert.ok(logBtn);
  logBtn.dispatchEvent(new w.Event('click'));
  assert.equal(d.getElementById('logTopic').value,'내 초안 제목');
});

itDom('중복 방지: 훅을 여러 번 눌러도 [도입]은 하나만 유지된다',()=>{
  const w=boot();const d=w.document;
  d.getElementById('customTopic').value='성수동 카페';
  d.getElementById('runAssemble').dispatchEvent(new w.Event('click'));
  const hooks=d.querySelectorAll('.hook-pick');
  hooks[0].dispatchEvent(new w.Event('click'));
  hooks[1].dispatchEvent(new w.Event('click'));
  hooks[0].dispatchEvent(new w.Event('click'));
  assert.equal((d.getElementById('draft').value.match(/\[도입\]/g)||[]).length,1);
});

itDom('중복 방지: 뼈대를 두 번 넣어도 소제목이 중복되지 않는다',()=>{
  const w=boot();const d=w.document;
  d.getElementById('customTopic').value='성수동 카페';
  d.getElementById('runAssemble').dispatchEvent(new w.Event('click'));
  const insert=[...d.querySelectorAll('#assembleResult button')].find(b=>b.textContent.includes('초안 편집기에 넣기'));
  insert.dispatchEvent(new w.Event('click'));
  const once=(d.getElementById('draft').value.match(/■/g)||[]).length;
  insert.dispatchEvent(new w.Event('click'));
  const twice=(d.getElementById('draft').value.match(/■/g)||[]).length;
  assert.equal(once,twice,'두 번째 삽입은 차단되어 개수 동일');
});

itDom('중복 방지: 뼈대 삽입이 이미 쓴 경험을 재삽입하지 않는다',()=>{
  const w=boot();const d=w.document;
  d.getElementById('customTopic').value='성수동 카페';
  const exp=d.querySelectorAll('#experienceFields [data-experience-key]');
  // app.js 없이도 동작하도록 draft에 경험을 직접 넣고 조립 실행
  d.getElementById('draft').value='토요일 오후에 직접 방문한 고유 경험 문장입니다.';
  d.getElementById('runAssemble').dispatchEvent(new w.Event('click'));
  const insert=[...d.querySelectorAll('#assembleResult button')].find(b=>b.textContent.includes('초안 편집기에 넣기'));
  insert.dispatchEvent(new w.Event('click'));
  assert.equal((d.getElementById('draft').value.match(/토요일 오후에 직접 방문한 고유 경험 문장입니다/g)||[]).length,1);
});

itDom('분량 미터: 목표 대비 글자수와 진행 상태를 표시한다',()=>{
  const w=boot();const d=w.document;
  const meter=d.getElementById('lengthMeter');
  assert.ok(meter,'분량 미터 주입됨');
  const sel=d.getElementById('lengthTarget');sel.value='3000';sel.dispatchEvent(new w.Event('change'));
  d.getElementById('draft').value='가'.repeat(500);d.getElementById('draft').dispatchEvent(new w.Event('input'));
  assert.match(d.querySelector('#lengthMeter .length-count').textContent,/500/);
  assert.equal(meter.dataset.state,'low');
  d.getElementById('draft').value='가'.repeat(2200);d.getElementById('draft').dispatchEvent(new w.Event('input'));
  assert.equal(meter.dataset.state,'near');
  d.getElementById('draft').value='가'.repeat(3100);d.getElementById('draft').dispatchEvent(new w.Event('input'));
  assert.equal(meter.dataset.state,'done');
});

itDom('긴 글(2500자)에서 검수·교정·구조비교가 정상 동작한다',()=>{
  const w=boot();const d=w.document;
  const para='저는 토요일 오후에 성수동 카페를 직접 방문했어요. 창가 자리에 앉아 아메리카노를 마시며 두 시간 정도 노트북 작업을 했습니다. 콘센트가 자리마다 있어서 편했어요.';
  const long=Array.from({length:16},()=>para).join('\n\n'); // 약 2500자+
  d.getElementById('draft').value=long;
  d.getElementById('runQuality').dispatchEvent(new w.Event('click'));
  assert.ok(d.getElementById('qualityList').children.length>0,'긴 글 검수 동작');
  assert.ok(d.getElementById('correctionPreview').value.length>0,'긴 글 교정본 생성');
  d.getElementById('benchmarkReference').value=long;
  d.getElementById('benchmarkRun').dispatchEvent(new w.Event('click'));
  assert.equal(d.getElementById('benchmarkResult').hidden,false,'긴 글 구조 비교 동작');
});
