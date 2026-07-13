const test=require('node:test');const assert=require('node:assert/strict');
const {createEntry,normalizeLog,addEntry,updateMetrics,dueForFollowup,summarize,removeEntry,toNonNegativeInt}=require('../postlog');
const fs=require('node:fs');const ui=fs.readFileSync(require.resolve('../postlog-ui.js'),'utf8');

const DAY=24*60*60*1000;

test('발행 기록 UI는 저장·삭제 실패를 성공으로 표시하지 않는다',()=>{assert.match(ui,/if\(!write\(updated\)\)/);assert.match(ui,/저장하지 못했어요/);assert.match(ui,/if\(!write\(Log\.removeEntry/);assert.match(ui,/삭제하지 못했어요/)});

test('createEntry는 주제를 요구하고 기본 역할을 기타로 둔다',()=>{
  assert.equal(createEntry({topic:'x'}).ok,false);
  const e=createEntry({topic:'성수동 카페 후기',keywords:'성수동, 카페',role:'수익'},()=>1000);
  assert.equal(e.ok,true);
  assert.equal(e.value.role,'수익');
  assert.deepEqual(e.value.keywords,['성수동','카페']);
  assert.equal(e.value.metrics,null);
});

test('normalizeLog는 잘못된 항목을 버리고 최신순 정렬한다',()=>{
  const list=normalizeLog([{topic:'오래된 글',publishedAt:1000},{topic:'x'},null,{topic:'최근 글',publishedAt:5000}]);
  assert.equal(list.length,2);
  assert.equal(list[0].topic,'최근 글');
});

test('updateMetrics는 음수·문자를 거부하고 수동 입력만 반영한다',()=>{
  let list=addEntry([],createEntry({topic:'카페 후기',publishedAt:1000}).value);
  const id=list[0].id;
  list=updateMetrics(list,id,{views:'1,200',inflow:'30'},()=>2000);
  assert.equal(list[0].metrics.views,1200);
  assert.equal(list[0].metrics.inflow,30);
  const bad=updateMetrics(list,id,{views:'-5',inflow:'abc'});
  assert.equal(bad[0].metrics,null);
});

test('dueForFollowup은 7일 지나고 성과 미입력 글만 고른다',()=>{
  const now=100*DAY;
  let list=addEntry([],createEntry({topic:'옛날 글',publishedAt:now-8*DAY}).value);
  list=addEntry(list,createEntry({topic:'어제 글',publishedAt:now-1*DAY}).value);
  const due=dueForFollowup(list,()=>now);
  assert.equal(due.length,1);
  assert.equal(due[0].topic,'옛날 글');
});

test('summarize는 평균 조회수와 역할 분포를 낸다',()=>{
  let list=[];
  list=addEntry(list,createEntry({topic:'글A',role:'수익',publishedAt:1000}).value);
  list=addEntry(list,createEntry({topic:'글B',role:'일상',publishedAt:2000}).value);
  list=updateMetrics(list,list.find(e=>e.topic==='글A').id,{views:'100'});
  list=updateMetrics(list,list.find(e=>e.topic==='글B').id,{views:'300'});
  const s=summarize(list);
  assert.equal(s.total,2);
  assert.equal(s.recorded,2);
  assert.equal(s.avgViews,200);
  assert.equal(s.byRole['수익'],1);
});

test('removeEntry는 지정 항목만 지운다',()=>{
  let list=addEntry([],createEntry({topic:'지울 글',publishedAt:1000}).value);
  const id=list[0].id;
  assert.equal(removeEntry(list,id).length,0);
});

test('toNonNegativeInt는 콤마·공백을 처리하고 빈값은 null',()=>{
  assert.equal(toNonNegativeInt('1,234'),1234);
  assert.equal(toNonNegativeInt(''),null);
  assert.equal(toNonNegativeInt('-1'),null);
});
