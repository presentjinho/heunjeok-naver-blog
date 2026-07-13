const test=require('node:test');const assert=require('node:assert/strict');
const {todayLabel,dailySeed,rotate,dailyPrompts,dailyKeywords,POOL}=require('../daily');

test('todayLabel은 연·월·일·요일을 만든다',()=>{
  assert.match(todayLabel(new Date('2026-07-13T00:00:00')),/2026년 7월 13일 .요일/);
});

test('같은 날은 같은 글감, 다른 날은 다른 글감(회전)',()=>{
  const a=dailyPrompts(new Date('2026-07-13'));
  const a2=dailyPrompts(new Date('2026-07-13'));
  const b=dailyPrompts(new Date('2026-07-14'));
  assert.deepEqual(a,a2,'같은 날 동일');
  assert.notDeepEqual(a[0],b[0],'다른 날 첫 글감 다름');
  assert.equal(a.length,3);
});

test('dailyKeywords는 중복 없이 그날의 키워드를 준다',()=>{
  const k=dailyKeywords(new Date('2026-07-13'),6);
  assert.equal(new Set(k).size,k.length);
  assert.ok(k.length>=1&&k.length<=6);
});

test('rotate는 시작점만 바꾸고 항목을 잃지 않는다',()=>{
  const r=rotate(POOL,new Date('2026-07-13'));
  assert.equal(r.length,POOL.length);
  assert.equal(new Set(r.map(x=>x.topic)).size,POOL.length);
});

test('잘못된 날짜도 오늘로 안전 처리',()=>{
  assert.ok(dailyPrompts('bad-date').length>=1);
});
