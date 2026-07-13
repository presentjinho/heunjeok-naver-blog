const test=require('node:test');const assert=require('node:assert/strict');
const {build,stageReaderQuestions,stageOutline,stageSections,HOOKS}=require('../assemble');

test('4단계를 순서대로 생성한다',()=>{
  const result=build({topic:'성수동 카페',postType:'visit'});
  assert.equal(result.stages.length,4);
  assert.deepEqual(result.stages.map(s=>s.step),[1,2,3,4]);
  assert.equal(result.stages[0].items.length,5);
  assert.ok(result.stages[1].items.every(h=>h.level==='H2'));
});

test('알 수 없는 글 종류는 기본(visit)으로 처리한다',()=>{
  assert.equal(stageReaderQuestions('unknown').length,5);
  assert.equal(stageOutline('주제','weird').length,5);
});

test('경험 답변이 있으면 소제목 뼈대에 넣고, 없으면 채울 슬롯을 남긴다',()=>{
  const withAnswer=stageSections('카페','visit',{visit_time:'토요일 오후 두 시에 방문'});
  assert.ok(withAnswer[0].skeleton.includes('토요일 오후 두 시에 방문'));
  const empty=stageSections('카페','visit',{});
  assert.ok(empty[0].skeleton.includes('['));
});

test('편집자 검수 단계와 도입 훅이 포함된다',()=>{
  const scene=build({topic:'x',postType:'product',hookStyle:'scene'});
  assert.ok(/장면/.test(scene.hook));
  const question=build({topic:'x',postType:'product',hookStyle:'question'});
  assert.ok(/질문/.test(question.hook));
  assert.ok(scene.stages[3].items.length>=5);
});

test('뼈대는 없는 사실을 만들지 않는다는 안내를 포함한다',()=>{
  const result=build({topic:'x',postType:'daily'});
  assert.match(result.note,/사실을 만들/);
});
test('도입 훅은 다섯 가지 방식마다 편집 가능한 후보 세 개를 제공한다',()=>{for(const style of ['scene','question','contrast','problem','detail']){const result=build({topic:'카페 후기',postType:'visit',hookStyle:style});assert.equal(result.hook,HOOKS[style]);assert.equal(result.hookCandidates.length,3);assert.ok(result.hookCandidates.every(candidate=>candidate.includes('[')))}});

test('assembleToText는 소제목과 빈 슬롯만 만들고 경험을 중복 삽입하지 않는다',()=>{
  const {build,assembleToText}=require('../assemble');
  const text=assembleToText(build({topic:'성수동 카페',postType:'visit',experienceFields:{visit_time:'토요일 오후 방문'},hookStyle:'scene'}));
  assert.match(text,/■ /);
  assert.match(text,/\[여기에/);
  assert.doesNotMatch(text,/토요일 오후 방문/); // 경험 원문을 뼈대에 재삽입하지 않음
  assert.doesNotMatch(text,/\[도입\]/);
  assert.equal(assembleToText(null),'');
});

test('build는 목표 분량을 받으면 소제목별 권장 분량을 배분한다',()=>{
  const {build,assembleToText}=require('../assemble');
  const r=build({topic:'카페',postType:'visit',targetChars:3000});
  assert.equal(r.targetChars,3000);
  assert.equal(r.perSection,600);
  const text=assembleToText(r);
  assert.match(text,/목표 약 3000자/);
  assert.match(text,/권장 약 600자/);
  const none=build({topic:'카페',postType:'visit'});
  assert.equal(none.targetChars,null);
  assert.doesNotMatch(assembleToText(none),/권장 약/);
});
