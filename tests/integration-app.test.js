const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
let JSDOM;try{JSDOM=require('jsdom').JSDOM}catch{}
const itDom=(name,fn)=>test(name,{skip:JSDOM?false:'jsdom 미설치 — 통합 테스트 건너뜀'},fn);

const DIR=path.resolve(__dirname,'..');
const load=f=>fs.readFileSync(path.join(DIR,f),'utf8');
function boot(){
  const dom=new JSDOM(load('index.html'),{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true});
  const {window}=dom;
  window.confirm=()=>true;window.alert=()=>{};window.scrollTo=()=>{};
  window.Element.prototype.scrollIntoView=()=>{};
  window.URL.createObjectURL=window.URL.createObjectURL||(()=>'blob:stub');window.URL.revokeObjectURL=()=>{};
  window.fetch=()=>Promise.reject(new Error('no-server'));
  window.requestAnimationFrame=cb=>cb();
  ['core.js','history.js','photo-vault.js','benchmark.js','quality.js','assemble.js','postlog.js','app.js','benchmark-ui.js','improve-ui.js','postlog-ui.js'].forEach(f=>{try{window.eval(load(f))}catch(e){throw new Error('스크립트 실행 실패 '+f+': '+e.message)}});
  return window;
}

itDom('앱 초기화가 오류 없이 끝나고 주제 카드가 렌더된다',()=>{
  const w=boot();
  assert.ok(w.document.querySelectorAll('.topic-card').length>0,'주제 카드 렌더');
});

itDom('핵심 파이프라인: 주제→경험→초안 생성이 결과 패널을 채운다',()=>{
  const w=boot();const d=w.document;
  d.querySelector('.topic-card').dispatchEvent(new w.Event('click'));
  const fields=d.querySelectorAll('#experienceFields [data-experience-key]');
  assert.ok(fields.length>=3,'경험 질문 렌더');
  fields.forEach((el,i)=>{el.value='토요일 오후에 직접 확인한 내용 '+i;el.dispatchEvent(new w.Event('input'))});
  d.getElementById('generate').dispatchEvent(new w.Event('click'));
  assert.equal(d.getElementById('resultContent').hidden,false,'결과 패널 표시');
  assert.ok(d.getElementById('draft').value.length>0,'초안 본문 생성');
  assert.ok(d.querySelectorAll('#titleCandidates li').length>0,'제목 후보 생성');
});

itDom('생성된 초안이 검수·구조비교와 바로 연동된다',()=>{
  const w=boot();const d=w.document;
  d.querySelector('.topic-card').dispatchEvent(new w.Event('click'));
  d.querySelectorAll('#experienceFields [data-experience-key]').forEach((el,i)=>{el.value='직접 확인한 장면 '+i+' 입니다';el.dispatchEvent(new w.Event('input'))});
  d.getElementById('generate').dispatchEvent(new w.Event('click'));
  d.getElementById('runQuality').dispatchEvent(new w.Event('click'));
  assert.ok(d.getElementById('qualityList').children.length>0,'생성 초안 검수 동작');
});
