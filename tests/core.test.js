const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../core.js');

test('네이버 분야별 글감 템플릿을 세 개 반환한다',()=>{
  assert.equal(Core.getTopics('local').length,3);
  assert.equal(Core.getTopics('tech').length,3);
});

test('공식 네이버 블로그 주소만 ID와 정규 주소로 변환한다',()=>{
  assert.deepEqual(Core.normalizeNaverBlogUrl('https://blog.naver.com/My_blog-1/223456'),{blogId:'My_blog-1',url:'https://blog.naver.com/My_blog-1'});
  assert.deepEqual(Core.normalizeNaverBlogUrl('https://m.blog.naver.com/PostList.naver?blogId=test_id'),{blogId:'test_id',url:'https://blog.naver.com/test_id'});
  assert.deepEqual(Core.normalizeNaverBlogUrl('https://blog.naver.com/real_id?blogId=wrong_id'),{blogId:'real_id',url:'https://blog.naver.com/real_id'});
  for(const value of ['http://blog.naver.com/test','https://blog.naver.com.evil.test/user','javascript:alert(1)','https://user:pass@blog.naver.com/test','https://blog.naver.com:444/test','https://blog.naver.com/PostList.naver'])assert.equal(Core.normalizeNaverBlogUrl(value),null);
});

test('공식 네이버 게시글 주소만 승인 가능한 출처로 정규화한다',()=>{
  assert.deepEqual(Core.normalizeNaverPostUrl('https://m.blog.naver.com/PostView.naver?blogId=my_id&logNo=223456789012'),{blogId:'my_id',logNo:'223456789012',url:'https://blog.naver.com/my_id/223456789012'});
  assert.deepEqual(Core.normalizeNaverPostUrl('https://blog.naver.com/my_id/223456789012?tracking=x'),{blogId:'my_id',logNo:'223456789012',url:'https://blog.naver.com/my_id/223456789012'});
  for(const value of ['https://blog.naver.com/my_id','http://blog.naver.com/my_id/223456','https://blog.naver.com.evil.test/my_id/223456','https://blog.naver.com/my_id/not-a-number','javascript:alert(1)'])assert.equal(Core.normalizeNaverPostUrl(value),null);
});

test('말끝·문장 호흡·자주 쓰는 연결어를 원문 없이 추출한다',()=>{
  const tone=Core.analyzeTone('오늘은 직접 다녀왔어요. 근데 생각보다 좋았어요. 그래서 다음에도 가볼게요.');
  assert.equal(tone.ending,'부드러운 존댓말');
  assert.ok(tone.connectors.includes('근데'));
  assert.ok(tone.connectors.includes('그래서'));
  assert.equal(tone.sampleWords,9);
  assert.equal(Core.analyzeTone('오늘 직접 방문했습니다. 조건을 확인합니다. 결과를 기록합니다.').ending,'정중한 설명체');
  assert.equal(Core.analyzeTone('오늘 직접 다녀왔어. 생각보다 괜찮았어. 다음에도 같이 갈거야.').ending,'친근한 반말체');
});

test('글 종류마다 핵심 세 개와 선택 세 개의 경험 질문을 제공한다',()=>{
  for(const type of ['visit','product','howto','compare','daily']){
    const fields=Core.getInterviewFields(type);
    assert.equal(fields.length,6);
    assert.equal(fields.filter(field=>field.essential).length,3);
    assert.ok(fields.every(field=>field.key&&field.label&&field.heading&&field.placeholder));
  }
  const fields=Core.getInterviewFields('visit');
  fields[0].label='변경';
  assert.notEqual(Core.getInterviewFields('visit')[0].label,'변경');
});

test('입력 현황을 검증 점수가 아닌 기능 상태로만 표시한다',()=>{
  assert.equal(Core.evaluateSpecificity('일반적인 설명입니다').level,'추가 답변 필요');
  assert.equal(Core.evaluateSpecificity('',{context:'토요일 오전 성수동',reason:'작업하려고 골랐어요',process:'안쪽 자리에 앉았어요'},'visit').level,'보완용 뼈대');
  assert.equal(Core.evaluateSpecificity('',{context:'토요일 오전 10시 성수동',reason:'작업하려고 골랐어요',costTime:'대기 15분',process:'안쪽 자리에 앉았어요',pros:'콘센트가 가까웠어요'},'visit').level,'답변 충분');
});

test('경험이 없는 메모에 체험 경고나 체험 사실을 본문으로 덧붙이지 않는다',()=>{
  const memo='카페 자리를 고르는 기준을 정리한다';
  const result=Core.createPackage({topic:'카페 자리 고르는 법',memo,category:'local'});
  assert.equal(result.body,`${memo}.`);
  assert.equal(result.specificity.signals.experience,false);
  assert.doesNotMatch(result.body,/내가 확인|경험 장면|보강 필요|발행 전/);
});

test('사용·방문 같은 명사와 부정문을 실제 체험으로 오인하지 않는다',()=>{
  const memo='이 제품 사용 방법과 가격을 알아보는 글입니다. 구체적인 경험은 아직 없습니다.';
  const result=Core.createPackage({topic:'제품 사용 방법',memo,postType:'product'});
  assert.equal(result.specificity.signals.experience,false);
  assert.equal(Core.evaluateSpecificity('저는 아직 방문하지 않았어요. 직접 사용하지도 않았어요.').signals.experience,false);
});

test('한 글자 답변 여러 개는 초안 근거로 인정하지 않는다',()=>{
  const specificity=Core.evaluateSpecificity('',{context:'a',reason:'b',process:'c'},'visit');
  assert.equal(specificity.answered,0);
  assert.equal(specificity.level,'추가 답변 필요');
});

test('사용자가 답한 사실만 자연스러운 문단과 출처 기록에 사용한다',()=>{
  const result=Core.createPackage({
    topic:'성수동 작업 카페 후기',postType:'visit',category:'local',
    experienceFields:{
      context:'7월 첫째 주 토요일 오전 10시 성수동에서 방문했어요.',
      reason:'노트북 작업과 콘센트가 필요해서 골랐어요.',
      costTime:'라테 6,000원, 대기 15분이었어요.'
    }
  });
  assert.match(result.body,/7월 첫째 주 토요일 오전 10시/);
  assert.match(result.body,/라테 6,000원, 대기 15분이었어요/);
  assert.doesNotMatch(result.body,/\[|발행 전|보강 필요|내가 확인한 사실/);
  assert.equal(result.titles[0],'성수동 작업 카페 후기');
  assert.equal(result.interviewCompletion.answered,3);
  assert.equal(result.missingFields.length,3);
  assert.ok(result.usedEvidence.every(item=>item.source==='user'));
  assert.equal(result.provenance.addedFacts,0);
  assert.equal(result.provenance.userEvidenceCount,3);
  assert.doesNotMatch(result.body,/주차|영업시간|무료/);
});

test('말투 카드의 문단 호흡과 연결어만 사용하고 새 사실은 만들지 않는다',()=>{
  const result=Core.createPackage({
    topic:'카페 후기',postType:'visit',
    tone:{paragraphStyle:'문단을 자주 나눔',sentenceLength:'짧고 빠른 문장',connectors:['근데']},
    experienceFields:{context:'토요일 오전에 갔어요',reason:'작업할 곳이 필요했어요',pros:'콘센트가 가까웠어요',consAudience:'오후에는 많이 붐볐어요'}
  });
  assert.match(result.body,/근데 오후에는 많이 붐볐어요/);
  assert.deepEqual(result.provenance.connectivePhrases,['근데']);
  assert.equal(result.provenance.addedFacts,0);
});

test('글 종류별 질문 제목은 출처 기록에 남고 복사용 본문에는 섞이지 않는다',()=>{
  const product=Core.createPackage({topic:'무선 키보드 후기',postType:'product',experienceFields:{context:'3주 동안 썼어요',reason:'가벼워서 골랐어요',pros:'소음이 줄었어요'}});
  const compare=Core.createPackage({topic:'키보드 비교',postType:'compare',experienceFields:{context:'A와 B를 비교했어요',reason:'휴대용을 고르려고 봤어요',pros:'A를 골랐어요'}});
  assert.equal(product.usedEvidence[0].heading,'제품과 사용 기간');
  assert.equal(compare.usedEvidence[0].heading,'비교한 대상');
  assert.doesNotMatch(product.body,/제품과 사용 기간/);
});

test('사람다운 글 점검은 상투 문구·과장·편집 표시를 구체적으로 찾는다',()=>{
  const audit=Core.auditHumanDraft('오늘은 성수 카페를 알아보겠습니다. 무조건 최고의 카페예요. [답변을 적어주세요]','성수 카페',{avoidPhrases:['최고의 카페']});
  const codes=audit.issues.map(issue=>issue.code);
  assert.ok(codes.includes('generic'));
  assert.ok(codes.includes('overclaim'));
  assert.ok(codes.includes('placeholder'));
  assert.ok(codes.includes('avoided'));
});

test('문장 점검은 같은 말끝의 반복과 구체적인 장점도 함께 보여준다',()=>{
  const audit=Core.auditHumanDraft('토요일 오전 10시를 확인했어요. 대기 15분을 확인했어요. 안쪽 자리를 확인했어요. 콘센트 위치를 확인했어요. 다만 혼잡한 시간도 확인했어요.','카페');
  assert.ok(audit.issues.some(issue=>issue.code==='rhythm'));
  assert.ok(audit.goodSignals.some(signal=>signal.includes('시간')));
  assert.ok(audit.goodSignals.some(signal=>signal.includes('한계')));
});

test('광고 관계 문구와 해시태그를 포함한다',()=>{
  const result=Core.createPackage({topic:'성수 카페 방문 기록',memo:'토요일 오전 10시에 방문했어요',category:'local',relationship:'provided'});
  assert.match(result.body,/제공받아 작성/);
  assert.ok(result.hashtags.length>0);
  assert.ok(result.hashtags.every(tag=>tag.startsWith('#')));
});

test('전체 복사 문자열은 제목·본문·해시태그 순서다',()=>{
  const result=Core.createPackage({topic:'성수 카페',memo:'오전 10시에 방문했어요',category:'local'});
  const output=Core.formatAll(result,'편집한 본문');
  assert.ok(output.startsWith(result.titles[0]));
  assert.match(output,/편집한 본문/);
  assert.match(output,/#카페/);
});

test('사용자가 본문을 모두 지우면 전체 복사에서 원문을 되살리지 않는다',()=>{
  const result=Core.createPackage({topic:'성수 카페',memo:'오전 10시에 방문했어요',category:'local'});
  const output=Core.formatAll(result,'');
  assert.doesNotMatch(output,/오전 10시에 방문했어요/);
  assert.ok(output.startsWith(result.titles[0]));
});

test('내돈내산 선택은 태그에 반영한다',()=>{
  const result=Core.createPackage({topic:'무선 키보드 후기',memo:'한 달 사용했어요',category:'tech',relationship:'selfpaid'});
  assert.ok(result.hashtags.includes('#내돈내산'));
});

test('질문 댓글은 사실을 꾸며내지 않는 편집용 틀을 만든다',()=>{
  const replies=Core.createReplyCandidates('주차는 어디에 하면 되나요?',{ending:'부드러운 존댓말'});
  assert.equal(replies.length,3);
  assert.ok(replies.every(reply=>reply.includes('답변')||reply.includes('상황')));
});

test('제목 후보는 단어 중간을 자르거나 말줄임표를 붙이지 않는다',()=>{
  const result=Core.createPackage({topic:'사진 폴더 정리 방법',postType:'howto',experienceFields:{context:'사진이 여러 폴더에 흩어져 찾기 어려웠어요',reason:'매번 한 시간 넘게 걸려서 정리했어요',pros:'좌석 사이가 넓고, 원하는 사진을 금방 찾게 되었지만 백업은 따로 해야 했어요'}});
  assert.equal(result.titles.length,3);
  assert.ok(result.titles.every(title=>!title.endsWith('…')));
  assert.ok(result.titles.every(title=>title.length<=52));
  assert.ok(result.titles.every(title=>!/(?:고|며|면|서|는데|지만|해서|이고|그리고)$/.test(title)));
});

test('답변은 질문 목록이 아니라 목적별 문단으로 묶인다',()=>{
  const result=Core.createPackage({topic:'카페 후기',postType:'visit',experienceFields:{context:'토요일 오전에 갔어요',reason:'작업할 곳이 필요했어요',process:'안쪽 자리에 앉았어요',costTime:'대기는 10분이었어요',pros:'콘센트가 가까웠어요',consAudience:'오후에는 붐볐어요'}});
  const paragraphs=result.body.split(/\n\n/);
  assert.equal(paragraphs.length,3);
  assert.match(paragraphs[0],/갔어요\. 작업할 곳/);
  assert.match(paragraphs[1],/앉았어요\. 대기는/);
});

test('반말 과거형을 인식하되 자연스러운 말끝 변화는 반복으로 오인하지 않는다',()=>{
  assert.equal(Core.analyzeTone('공원을 걸었어. 바람이 좋았고 풍경도 괜찮았어. 다음에도 갈 거야.').ending,'친근한 반말체');
  const audit=Core.auditHumanDraft('공원을 걸었어. 바람이 좋았어. 길이 조용했어. 풍경도 괜찮았어. 다음에도 가고 싶었어.','공원');
  assert.ok(!audit.issues.some(issue=>issue.code==='rhythm'));
});

test('본문 말끝이 저장한 문장 습관과 다르면 바꿀 지점을 알려준다',()=>{
  const audit=Core.auditHumanDraft('첫날 방문했습니다. 십 분 기다렸습니다. 창가에 앉았습니다. 다시 갈 생각입니다.','방문', {ending:'친근한 반말체'});
  assert.ok(audit.issues.some(issue=>issue.code==='tone-ending'));
});

test('피할 말로 등록한 연결어는 생성기가 다시 넣지 않는다',()=>{
  const result=Core.createPackage({topic:'카페 후기',postType:'visit',tone:{connectors:['근데'],avoidPhrases:['근데']},experienceFields:{context:'토요일에 갔어요',reason:'작업하려고 골랐어요',pros:'자리가 넓었어요',consAudience:'오후에는 붐볐어요'}});
  assert.doesNotMatch(result.body,/근데/);
  assert.deepEqual(result.provenance.connectivePhrases,[]);
});

test('해시태그는 조사·숫자 파편 대신 글 종류에 맞는 말을 쓴다',()=>{
  const tags=Core.createHashtags('2만 장을 정리하는 방법','tech','', 'none','howto');
  assert.ok(tags.includes('#정리'));
  assert.ok(tags.includes('#방법정리'));
  assert.ok(!tags.includes('#2만')&&!tags.includes('#장을'));
  assert.ok(!tags.includes('#제품리뷰'));
  assert.ok(Core.createHashtags('성수 조용한 작업 카페','local','','none','visit').includes('#카페'));
});

test('넓은 편집 표시와 구버전 출처 스키마를 구분한다',()=>{
  const audit=Core.auditHumanDraft('주소는 [주소 확인]이고 사진은 [사진 넣기]. TODO','기록',null,{titles:['기록 [제목 수정]']});
  assert.ok(audit.issues.some(issue=>issue.code==='placeholder'));
  assert.ok(audit.issues.some(issue=>issue.code==='title-placeholder'));
  assert.equal(audit.blocking,true);
  assert.equal(Core.createPackage({topic:'기록',memo:'오늘 두 시간 걸었어요'}).packageVersion,Core.PACKAGE_VERSION);
});

test('사용자가 관계를 언급해도 법적 고지는 본문 첫 줄에 고정한다',()=>{
  const result=Core.createPackage({topic:'제품 후기',postType:'product',relationship:'provided',experienceFields:{context:'브랜드에서 제품을 제공받아 일주일 썼어요',reason:'크기를 비교하려고 골랐어요',pros:'가방에 넣기 편했어요'}});
  assert.ok(result.body.startsWith(Core.requiredDisclosure('provided')));
  assert.equal(result.provenance.disclosureAdded,true);
  assert.equal(result.provenance.userDisclosure,true);
});

test('협찬 고지가 지워지거나 중간으로 이동하면 필수 고지 누락으로 판단한다',()=>{const notice=Core.requiredDisclosure('paid');assert.equal(Core.hasRequiredDisclosure(`${notice}\n\n직접 써본 내용입니다.`,'paid'),true);assert.equal(Core.hasRequiredDisclosure(`직접 써본 내용입니다.\n\n${notice}`,'paid'),false);assert.equal(Core.hasRequiredDisclosure('일상 기록입니다.','none'),true)});

test('해시태그는 검색어 채우기처럼 보이지 않게 최대 3개만 만든다',()=>{const tags=Core.createHashtags('성수 조용한 노트북 작업 카페','local','직접 구매했어요','selfpaid','visit');assert.ok(tags.length<=3)});

test('짧은 답변을 교정해 긴 메모 안에 합치고 같은 장면은 반복하지 않는다',()=>{const memo='지난 주말 성수동에 있는 작은 카페에 다녀왔어요. 창가 자리는 햇빛이 잘 들어왔고, 직접 마셔본 라테는 고소한 맛이 진했습니다. 다만 오후에는 사람이 많아 조금 시끄러웠어요. 조용히 머물고 싶다면 오전에 방문하는 편이 좋을 것 같습니다.';const result=Core.createPackage({topic:'성수동 카페 후기',postType:'visit',experienceFields:{context:'지난 주말에.',reason:'노트북 작업 해야해서.',pros:'개인 쓰는 좌석이 컸어요.'},memo});assert.equal((result.body.match(/지난 주말/g)||[]).length,1);assert.match(result.body,/노트북 작업을 해야 해서 이곳을 골랐어요/);assert.match(result.body,/혼자 쓰기 좋은 좌석이 넓었어요/);assert.ok(result.body.indexOf('노트북 작업')>result.body.indexOf('지난 주말 성수동'));assert.ok(result.body.indexOf('혼자 쓰기 좋은 좌석')<result.body.indexOf('다만 오후에는'));assert.doesNotMatch(result.body,/지난 주말에\.|작업 해야해서|개인 쓰는 좌석/)});

test('풍부한 메모가 없을 때도 파편 답변을 자연스러운 문장으로 다듬는다',()=>{const result=Core.createPackage({topic:'카페 후기',postType:'visit',experienceFields:{context:'지난 주말에.',reason:'노트북 작업 해야해서.',pros:'개인 쓰는 좌석이 컸어요.'}});assert.match(result.body,/지난 주말에 다녀왔어요/);assert.match(result.body,/노트북 작업을 해야 해서 이곳을 골랐어요/);assert.match(result.body,/혼자 쓰기 좋은 좌석이 넓었어요/)});

test('말투 카드는 평균 문장 길이와 말끝 분포만 저장하고 강 적용 때 말끝을 안전 범위에서 바꾼다',()=>{const tone=Core.analyzeTone('첫날 방문했어요. 자리가 넓었어요. 다만 오후에는 붐볐어요.');assert.equal(typeof tone.averageSentenceChars,'number');assert.ok(tone.endingCounts.soft>=3);assert.equal(Core.applyToneStrength('직접 확인했습니다.',{strength:'strong',ending:'부드러운 존댓말'}),'직접 확인했어요.');assert.equal(Core.applyToneStrength('직접 확인했습니다.',{strength:'weak',ending:'부드러운 존댓말'}),'직접 확인했습니다.')});
