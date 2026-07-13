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
test('검수 결과에서 구조 비교·발행 기록으로 이어지는 크로스링크가 있다',()=>{
  assert.match(improve,/benchmark-title/);
  assert.match(improve,/postlog-title/);
  assert.match(improve,/logPull/);
});
test('구조 비교 뒤 저품질 검수로 이어가는 버튼이 있다',()=>{
  assert.match(benchmark,/runQuality/);
  assert.match(benchmark,/이어가기/);
});
test('발행 로그는 현재 초안 제목·태그를 불러오는 버튼을 만든다',()=>{
  assert.match(postlog,/id='logPull'|id="logPull"/);
  assert.match(postlog,/불러오기/);
  assert.match(postlog,/hashtags/);
});
test('초안 삽입은 input 이벤트를 보내 자동 저장·검수와 연동된다',()=>{
  assert.match(improve,/dispatchEvent\(new Event\('input'/);
});
