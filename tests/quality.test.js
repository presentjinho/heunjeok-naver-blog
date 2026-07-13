const test=require('node:test');const assert=require('node:assert/strict');
const {audit,experienceRatio}=require('../quality');

test('경험 문장 비율을 계산한다',()=>{
  const r=experienceRatio('저는 어제 직접 방문했어요. 날씨가 좋았습니다. 제가 먹어봤어요.');
  assert.ok(r.total>=3);assert.ok(r.experiential>=2);assert.ok(r.ratio>0.5);
});

test('과장·보장·템플릿·글자벽을 잡아낸다',()=>{
  const bad=['오늘은 성수동 카페에 대해 알아보겠습니다.','무조건 강력 추천하는 최고의 카페! 효과는 100% 보장합니다. 상위 노출 확실히 됩니다. 지금부터 총정리 정리해봤어요.','문의 주세요 구매 링크 아래 링크 클릭.'].join('\n\n');
  const result=audit(bad,{titles:['충격 실화 TOP3 이것만은 보세요']});
  const codes=result.issues.map(i=>i.code);
  assert.ok(codes.includes('guarantee'));
  assert.ok(codes.includes('exaggeration'));
  assert.ok(codes.includes('template'));
  assert.ok(codes.includes('ad-push'));
  assert.ok(codes.includes('clickbait-title'));
});

test('경험이 충분한 짧은 문단 글은 경고가 적고 강점이 잡힌다',()=>{
  const good=['저는 토요일 오후에 직접 방문했어요.','자리는 20석 정도였고 제가 앉은 창가가 조용했습니다.','아메리카노를 주문해 마셔봤어요. 두 시간 머물렀습니다.','다음에 또 가보려고 해요.'].join('\n\n');
  const result=audit(good,{titles:['성수동 조용한 카페 방문 후기']});
  assert.equal(result.issues.filter(i=>i.severity==='high').length,0);
  assert.ok(result.goodSignals.length>=1);
});

test('긴 글자벽 문단을 지적한다',()=>{
  const wall='가'.repeat(200);
  const result=audit(wall);
  assert.ok(result.issues.some(i=>i.code==='mobile-wall'));
});

test('결과에 노출·순위 보장 문구를 만들지 않는다',()=>{
  const result=audit('저는 직접 가봤어요. 좋았습니다.',{titles:['후기']});
  assert.doesNotMatch(JSON.stringify(result),/상위 노출을 보장|순위를 올려|조회수가 오릅니다/);
});
