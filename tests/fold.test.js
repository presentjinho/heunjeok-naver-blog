const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
let JSDOM;try{JSDOM=require('jsdom').JSDOM}catch{}
const itDom=(name,fn)=>test(name,{skip:JSDOM?false:'jsdom 미설치 — 건너뜀'},fn);
const src=fs.readFileSync(path.resolve(__dirname,'..','fold-ui.js'),'utf8');
function boot(){
  const html='<!doctype html><html><head></head><body>'+
    '<section aria-labelledby="live-research-title"><h2 id="live-research-title">실시간 글 탐색</h2><p>설명</p><a href="#">링크</a></section>'+
    '<section id="live-research" aria-labelledby="x"><h2>x</h2></section>'+
    '<section aria-labelledby="benchmark-title"><h2 id="benchmark-title">인기 글 구조 비교</h2><textarea></textarea></section>'+
    '<section aria-labelledby="comment-title"><h2 id="comment-title">댓글 답변 틀</h2><button id="makeReplies">만들기</button></section>'+
    '</body></html>';
  const dom=new JSDOM(html,{runScripts:'outside-only'});dom.window.eval(src);return dom.window.document;
}
itDom('부가 도구가 접힌 details로 변환된다',()=>{
  const d=boot();
  const folded=d.querySelectorAll('details.folded-tool');
  assert.ok(folded.length>=2,'최소 2개 접힘');
  assert.ok([...folded].every(el=>!el.open),'기본 접힘');
});
itDom('제목은 요약에 남고 본문에는 중복 없음, 원래 요소는 보존',()=>{
  const d=boot();
  assert.equal(d.querySelectorAll('.fold-body h2').length,0);
  assert.ok(d.querySelector('.fold-title').textContent.length>0);
  assert.ok(d.getElementById('makeReplies'),'댓글 버튼 보존');
  assert.ok(d.getElementById('foldStyle'),'스타일 주입');
  assert.match(d.getElementById('foldStyle').textContent,/overflow-wrap/);
  assert.match(d.getElementById('foldStyle').textContent,/focus-visible/);
});
itDom('두 번 실행해도 중복 접힘이 없다(멱등)',()=>{
  const d=boot();const first=d.querySelectorAll('details.folded-tool').length;
  d.defaultView.eval(src);
  assert.equal(d.querySelectorAll('details.folded-tool').length,first,'재실행해도 개수 동일');
});
itDom('이미 details 안에 있는 섹션은 이중으로 접지 않는다',()=>{
  const html='<!doctype html><html><head></head><body>'+
    '<details class="advanced-group"><summary>고급</summary>'+
    '<section aria-labelledby="comment-title"><h2 id="comment-title">댓글 답변 틀</h2><button id="mk">만들기</button></section>'+
    '</details></body></html>';
  const dom=new JSDOM(html,{runScripts:'outside-only'});dom.window.eval(src);const d=dom.window.document;
  assert.equal(d.querySelectorAll('details.folded-tool').length,0,'상위 details가 있으면 접지 않음');
  assert.ok(d.getElementById('mk'),'원래 요소 보존');
});
