const test=require('node:test');const assert=require('node:assert/strict');
const {audit,safeCorrect,sentenceAdvice,experienceRatio,informationSignals}=require('../quality');

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

test('안전 교정본은 과장·보장·상투 문구를 줄이고 새 사실 대신 확인 자리를 남긴다',()=>{const source='오늘은 제품에 대해 알아보겠습니다. 무조건 최고의 제품이며 효과는 100% 보장합니다.';const result=safeCorrect(source);assert.equal(result.changed,true);assert.doesNotMatch(result.text,/알아보겠습니다|무조건|최고의|100% 보장/);assert.match(result.text,/직접 확인한 조건/);assert.ok(result.changes.length>=3)});

test('문장별 조언은 문제 문장과 원인을 연결한다',()=>{const result=sentenceAdvice('무조건 최고입니다. 저는 직접 써봤어요. 구매 링크 클릭.');assert.ok(result.some(item=>item.flags.includes('과장')));assert.ok(result.some(item=>item.flags.includes('홍보 압박')));assert.ok(result.every(item=>item.text&&item.advice))});

test('긴 문단 교정은 두 문장 단위로 나누되 문장을 만들지 않는다',()=>{const source='첫 문장입니다. 두 번째 문장입니다. 세 번째 문장입니다. 네 번째 문장입니다.';const result=safeCorrect(source);assert.match(result.text,/두 번째 문장입니다\.\n\n세 번째/);for(const sentence of ['첫 문장입니다.','두 번째 문장입니다.','세 번째 문장입니다.','네 번째 문장입니다.'])assert.match(result.text,new RegExp(sentence.replace('.','\\.')))});

test('repetition은 반복 문장과 단조로운 문단 시작을 잡는다',()=>{
  const {audit,repetition}=require('../quality');
  const dup='저는 직접 방문했어요. 날씨가 맑았습니다. 저는 직접 방문했어요.';
  assert.ok(repetition(dup).duplicates.length>=1);
  const monotone=['저는 갔어요. 좋았습니다.','저는 먹었어요. 맛있었습니다.','저는 봤어요. 예뻤습니다.'].join('\n\n');
  assert.ok(repetition(monotone).repeatedStarters.length>=1);
  const result=audit(dup);
  assert.ok(result.issues.some(i=>i.code==='repetition'));
});

test('구체 정보가 적고 평가만 반복되면 읽는 사람 피로를 경고한다',()=>{const text='정말 좋았어요. 아주 만족했어요. 누구에게나 추천해요. 정말 편리하고 유용했어요.';const result=audit(text);assert.equal(informationSignals(text).fatigue,'높음');assert.ok(result.issues.some(issue=>issue.code==='reader-fatigue'));assert.equal(result.stats.concreteFacts,0)});
