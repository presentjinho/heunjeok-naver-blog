const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
let JSDOM;try{JSDOM=require('jsdom').JSDOM}catch{}
const itDom=(name,fn)=>test(name,{skip:JSDOM?false:'jsdom 미설치 — 건너뜀'},fn);
const src=fs.readFileSync(path.resolve(__dirname,'..','polish-ui.js'),'utf8');
function boot(){
  const html='<!doctype html><html><head></head><body>'+
    '<section class="hero"><h1>흔적</h1></section>'+
    '<section id="tone-tool" class="work-card"><div class="card-heading"><span>02</span><div><h2>내 문장 습관</h2></div></div>'+
      '<textarea id="toneSamples"></textarea><button id="saveTone">말투 카드 만들기</button></section>'+
    '<fieldset id="publish-tool" class="checklist"><legend>발행 전 확인</legend>'+
      '<label><input type="checkbox" name="publishCheck"> a</label>'+
      '<label><input type="checkbox" name="publishCheck"> b</label>'+
      '<label><input type="checkbox" name="publishCheck"> c</label>'+
      '<label><input type="checkbox" name="publishCheck"> d</label>'+
      '<details class="optional-checks"><summary>선택 5</summary>'+
        '<label><input type="checkbox" name="publishCheck"> e</label>'+
        '<label><input type="checkbox" name="publishCheck"> f</label></details>'+
      '<p id="checkProgress">0/9 확인</p></fieldset>'+
    '<div class="publish-actions"><button id="copyTitle">첫 제목 복사</button>'+
      '<button id="copyBody">본문 복사</button><button id="copyAll">모두 복사</button></div>'+
    '</body></html>';
  const dom=new JSDOM(html,{runScripts:'outside-only'});dom.window.eval(src);return dom.window;
}
itDom('#1 상단 신뢰 배너가 hero 뒤에 한 번 삽입된다',()=>{
  const w=boot();const d=w.document;
  const banner=d.getElementById('trustBanner');
  assert.ok(banner,'배너 존재');
  assert.equal(banner.previousElementSibling,d.querySelector('.hero'),'hero 바로 뒤');
  w.eval(src);assert.equal(d.querySelectorAll('#trustBanner').length,1,'재실행해도 1개');
});
itDom('#3 말투 입력이 접힘 details로 들어가고 heading은 남는다',()=>{
  const d=boot().document;
  const det=d.querySelector('#tone-tool details.tone-fold');
  assert.ok(det,'tone-fold 생성');
  assert.ok(!det.open,'기본 닫힘');
  assert.ok(d.querySelector('#tone-tool .card-heading'),'02 heading 유지');
  assert.ok(d.getElementById('toneSamples').closest('details.tone-fold'),'입력이 접힘 안으로');
  assert.ok(d.getElementById('saveTone'),'저장 버튼 보존');
});
itDom('#5 복사 위치 안내 문구와 버튼 title이 붙는다',()=>{
  const d=boot().document;
  assert.ok(d.getElementById('copyGuide'),'copy-guide 삽입');
  assert.equal(d.getElementById('copyGuide').nextElementSibling,d.querySelector('.publish-actions'),'버튼 앞');
  assert.match(d.getElementById('copyTitle').title,/제목칸/);
  assert.match(d.getElementById('copyBody').title,/본문/);
});
itDom('#6 필수 4개만 세고 다 체크하면 준비됨 신호',()=>{
  const w=boot();const d=w.document;
  const badge=d.getElementById('requiredProgress');
  assert.ok(badge,'필수 진행 배지');
  assert.match(badge.textContent,/필수 0\/4/);
  const req=[...d.querySelectorAll('#publish-tool > label input')];
  assert.equal(req.length,4,'직속 라벨 4개만 필수');
  req.forEach(c=>{c.checked=true;c.dispatchEvent(new w.Event('change'))});
  assert.ok(badge.classList.contains('is-ready'),'4개 체크 시 준비됨');
  assert.match(badge.textContent,/발행해도 좋아요/);
});