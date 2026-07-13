const test=require('node:test');const assert=require('node:assert/strict');
const {metrics,compare,topicCoverage}=require('../benchmark');
const fs=require('node:fs');const ui=fs.readFileSync(require.resolve('../benchmark-ui.js'),'utf8');

test('구조 비교 UI는 지표를 HTML 문자열로 조립하지 않는다',()=>{assert.doesNotMatch(ui,/meta\.innerHTML/);assert.match(ui,/reference\.textContent/);assert.match(ui,/draft\.textContent/)});

const reference=[
  '오늘은 성수동 카페에 다녀온 이야기예요.',
  '입구는 좁지만 안쪽은 넓었어요. 자리는 20개 정도.',
  '메뉴',
  '아메리카노 4500원, 라떼 5000원이었어요. 두 시간 머물렀습니다.',
  '사진으로 분위기를 남겨봤어요. 창가 사진이 제일 예뻤어요.',
  '다들 어떤 카페 좋아하세요? 공감과 댓글 남겨주세요.'
].join('\n\n');

test('metrics는 분량·문단·질문·CTA·숫자·사진을 센다',()=>{
  const m=metrics(reference);
  assert.ok(m.chars>50);
  assert.ok(m.paragraphCount>=5);
  assert.ok(m.questionCount>=1);
  assert.ok(m.ctaCount>=1);
  assert.ok(m.numberCount>=3);
  assert.ok(m.photoCount>=1);
});

test('compare는 짧고 밋밋한 초안의 부족한 점을 gaps로 돌려준다',()=>{
  const draft='그냥 동네 카페에 갔다왔어요. 커피 마시고 조금 쉬다가 왔습니다. 분위기는 그럭저럭 괜찮았어요.';
  const result=compare(reference,draft,{topic:'성수동 카페'});
  assert.equal(result.ok,true);
  const keys=result.gaps.map(g=>g.key);
  assert.ok(keys.includes('length'));
  assert.ok(keys.includes('cta'));
  assert.ok(keys.includes('question'));
  assert.ok(result.matchScore<70);
});

test('compare는 기준을 충족한 초안은 강점으로 인정하고 점수가 높다',()=>{
  const result=compare(reference,reference,{topic:'성수동 카페'});
  assert.equal(result.ok,true);
  assert.equal(result.gaps.length,0);
  assert.equal(result.matchScore,100);
});

test('compare는 너무 짧은 기준·초안을 거부한다',()=>{
  assert.equal(compare('짧음','이것은 충분히 긴 초안 문장입니다.').ok,false);
  assert.equal(compare(reference,'짧').ok,false);
});

test('topicCoverage는 본문에 빠진 주제어를 알려준다',()=>{
  const cov=topicCoverage('성수동 이야기',' 성수동 카페 추천');
  assert.equal(cov.keywords,3);
  assert.ok(cov.missing.includes('카페'));
});

test('compare 결과에는 기준 글 원문이 포함되지 않는다',()=>{
  const result=compare(reference,'그냥 카페 갔다왔어요. 좋았습니다. 조금 더 길게 적어봅니다.',{topic:'카페'});
  assert.doesNotMatch(JSON.stringify(result),/아메리카노|성수동 카페에 다녀온/);
});
