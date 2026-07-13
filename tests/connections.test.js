const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');
const improve=fs.readFileSync(require.resolve('../improve-ui.js'),'utf8');
const benchmark=fs.readFileSync(require.resolve('../benchmark-ui.js'),'utf8');
const postlog=fs.readFileSync(require.resolve('../postlog-ui.js'),'utf8');

test('조립 결과를 초안 편집기에 삽입하고 훅을 초안에 넣는다',()=>{
  assert.match(improve,/assembleToText/);
  assert.match(improve,/이 뼈대를 초안 편집기에 넣기/);
  assert.match(improve,/insertToDraft/);
});
test('검수 결과에서 발행 기록으로 이어지는 크로스링크가 있다',()=>{
  const ui=require('fs').readFileSync(require('path').join(__dirname,'..','improve-ui.js'),'utf8');
  assert.match(ui,/발행 기록에 저장/);
  assert.doesNotMatch(ui,/잘 나온 글과 구조 비교/);
});
test('구조 비교 UI는 메인 화면에서 제거되었다',()=>{
  const html=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
  assert.doesNotMatch(html,/benchmark-title|benchmarkRun/);
});
test('발행 로그는 현재 초안 제목·태그를 불러오는 버튼을 만든다',()=>{
  assert.match(postlog,/id='logPull'|id="logPull"/);
  assert.match(postlog,/불러오기/);
  assert.match(postlog,/hashtags/);
});
test('초안 삽입은 input 이벤트를 보내 자동 저장·검수와 연동된다',()=>{
  assert.match(improve,/dispatchEvent\(new Event\('input'/);
});
