(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.HeunjeokCore=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const TOPICS={
    local:[
      {title:'주말 웨이팅을 줄인 방문 시간과 실제 분위기',opportunity:'높음',intent:'방문 전 확인',reason:'시간·대기·동선을 경험으로 설명하기 좋아요.'},
      {title:'가격보다 만족도가 높았던 메뉴와 선택 이유',opportunity:'높음',intent:'메뉴 비교',reason:'가격표와 실제 선택 기준을 함께 보여줄 수 있어요.'},
      {title:'혼자 머물기 편했던 자리와 이용 팁',opportunity:'보통',intent:'상황별 추천',reason:'사진과 구체적인 자리 경험이 차별점이 돼요.'}
    ],
    travel:[
      {title:'숙소 예약 전에 확인한 조건과 실제 이용 후기',opportunity:'높음',intent:'예약 결정',reason:'가격·위치·시설을 경험과 연결하기 좋아요.'},
      {title:'비 오는 날에도 편했던 여행 동선',opportunity:'보통',intent:'일정 계획',reason:'날씨와 이동 시간을 구체적으로 기록할 수 있어요.'},
      {title:'교통비를 줄인 이동 방법과 실제 비용',opportunity:'높음',intent:'비용 비교',reason:'금액과 이동 시간을 함께 검증할 수 있어요.'}
    ],
    beauty:[
      {title:'일주일 사용하며 달라진 점과 아쉬운 점',opportunity:'높음',intent:'구매 검토',reason:'사용 전후와 피부 반응을 날짜별로 기록하기 좋아요.'},
      {title:'비슷한 제품 사이에서 이것을 고른 기준',opportunity:'높음',intent:'제품 비교',reason:'가격·성분·사용감을 내 기준으로 비교할 수 있어요.'},
      {title:'처음 사용할 때 놓치기 쉬운 순서와 양',opportunity:'보통',intent:'사용 방법',reason:'실제 사용 장면을 사진과 함께 보여주기 좋아요.'}
    ],
    parenting:[
      {title:'아이와 직접 해 보고 오래 유지된 생활 방법',opportunity:'보통',intent:'경험 탐색',reason:'연령·상황·실패 경험을 구체적으로 나눌 수 있어요.'},
      {title:'사기 전에 확인한 육아용품 선택 기준',opportunity:'높음',intent:'구매 검토',reason:'안전·크기·세척·가격을 실제 사용과 연결할 수 있어요.'},
      {title:'외출 준비 시간을 줄인 순서와 준비물',opportunity:'보통',intent:'문제 해결',reason:'준비 과정과 빠뜨린 점이 유용한 정보가 돼요.'}
    ],
    tech:[
      {title:'한 달 사용 후 남긴 장점·단점과 추천 대상',opportunity:'높음',intent:'구매 검토',reason:'사용 기간과 작업 변화를 근거로 설명하기 좋아요.'},
      {title:'무료와 유료 기능을 써 보고 비교한 결과',opportunity:'높음',intent:'요금 비교',reason:'비용과 절약한 시간을 함께 기록할 수 있어요.'},
      {title:'처음 설정할 때 막힌 부분과 해결 과정',opportunity:'보통',intent:'문제 해결',reason:'화면과 오류 상황을 순서대로 보여주기 좋아요.'}
    ],
    life:[
      {title:'직접 실패해 보고 바꾼 초보자 방법',opportunity:'보통',intent:'방법 탐색',reason:'실패와 수정 과정 자체가 차별화된 정보가 돼요.'},
      {title:'한 달 유지하는 데 실제로 든 비용과 시간',opportunity:'높음',intent:'비용 확인',reason:'금액·횟수·시간을 구체적으로 기록할 수 있어요.'},
      {title:'사기 전에 알았으면 좋았을 선택 기준',opportunity:'높음',intent:'구매 검토',reason:'후회한 점과 다시 고를 기준을 함께 나눌 수 있어요.'}
    ]
  };
  const INTERVIEW_TEMPLATES={
    visit:{label:'방문 후기',fields:[
      {key:'context',label:'언제·어디서 다녀왔나요?',heading:'방문 시점과 장소',placeholder:'예: 7월 첫째 주 토요일 오전, 성수동 카페'},
      {key:'reason',label:'왜 이곳을 골랐나요?',heading:'선택한 이유',placeholder:'예: 노트북 작업과 콘센트가 필요해서'},
      {key:'costTime',label:'가격·대기·이용 시간은?',heading:'가격과 이용 시간',placeholder:'예: 라테 6,000원, 대기 15분, 2시간 이용'},
      {key:'process',label:'무엇을 했거나 먹었나요?',heading:'이용한 과정',placeholder:'예: 주문 후 안쪽 긴 테이블에서 작업'},
      {key:'pros',label:'가장 좋았던 점은?',heading:'좋았던 점',placeholder:'예: 좌석 간격이 넓고 콘센트가 가까웠어요'},
      {key:'consAudience',label:'아쉬운 점과 추천 대상은?',heading:'아쉬운 점과 추천 대상',placeholder:'예: 오후엔 붐벼서 오전 방문을 추천해요'}
    ]},
    product:{label:'제품 사용기',fields:[
      {key:'context',label:'어떤 제품을 얼마나 썼나요?',heading:'제품과 사용 기간',placeholder:'예: 무선 키보드를 3주 동안 매일 사용'},
      {key:'reason',label:'왜 이 제품을 골랐나요?',heading:'선택한 이유',placeholder:'예: 휴대성과 조용한 키감을 원해서'},
      {key:'costTime',label:'구매가·구매처는?',heading:'구매 정보',placeholder:'예: 공식몰에서 8만 원대에 구매'},
      {key:'process',label:'어떻게 사용했나요?',heading:'사용한 환경과 방법',placeholder:'예: 카페와 사무실에서 노트북에 연결'},
      {key:'pros',label:'좋았던 변화나 장점은?',heading:'좋았던 점',placeholder:'예: 가방이 가벼워지고 타이핑 소음이 줄었어요'},
      {key:'consAudience',label:'아쉬운 점과 추천 대상은?',heading:'아쉬운 점과 추천 대상',placeholder:'예: 키 간격이 좁아 손이 큰 분은 확인이 필요해요'}
    ]},
    howto:{label:'방법·정보',fields:[
      {key:'context',label:'어떤 문제를 해결하려 했나요?',heading:'해결하려던 문제',placeholder:'예: 사진 정리에 매번 한 시간이 걸렸어요'},
      {key:'reason',label:'시도 전 상황은 어땠나요?',heading:'시도 전 상황',placeholder:'예: 폴더 이름이 제각각이라 찾기 어려웠어요'},
      {key:'process',label:'실제로 어떤 순서로 했나요?',heading:'실행 순서',placeholder:'예: 날짜별 분류 후 중복 사진부터 삭제'},
      {key:'costTime',label:'걸린 시간·비용은?',heading:'들어간 시간과 비용',placeholder:'예: 첫 정리에 40분, 추가 비용 없음'},
      {key:'pros',label:'결과는 어떻게 달라졌나요?',heading:'실행 결과',placeholder:'예: 원하는 사진을 1분 안에 찾게 됐어요'},
      {key:'consAudience',label:'실패·주의점과 추천 대상은?',heading:'주의할 점과 추천 대상',placeholder:'예: 원본 백업 후 정리하는 것을 추천해요'}
    ]},
    compare:{label:'비교·선택기',fields:[
      {key:'context',label:'무엇과 무엇을 비교했나요?',heading:'비교한 대상',placeholder:'예: A 키보드와 B 키보드'},
      {key:'reason',label:'왜 비교하게 됐나요?',heading:'비교한 이유',placeholder:'예: 휴대용 키보드를 새로 고르려고'},
      {key:'process',label:'중요하게 본 기준은?',heading:'비교 기준',placeholder:'예: 무게, 키감, 배터리, 가격'},
      {key:'costTime',label:'가격·시간 차이는?',heading:'가격과 조건 차이',placeholder:'예: A가 2만 원 저렴하고 충전은 B가 빨랐어요'},
      {key:'pros',label:'무엇을 골랐고 이유는?',heading:'최종 선택과 이유',placeholder:'예: 무게가 가벼운 A를 골랐어요'},
      {key:'consAudience',label:'포기한 점과 추천 대상은?',heading:'포기한 점과 추천 대상',placeholder:'예: 키감보다 휴대성이 중요한 분께 맞아요'}
    ]},
    daily:{label:'일상 기록',fields:[
      {key:'context',label:'언제·어디서 있었던 일인가요?',heading:'시간과 장소',placeholder:'예: 금요일 퇴근 후 동네 산책길'},
      {key:'reason',label:'기록하게 된 계기는?',heading:'기록한 이유',placeholder:'예: 평소와 다른 노을을 봐서'},
      {key:'process',label:'가장 기억에 남은 장면은?',heading:'기억에 남은 장면',placeholder:'예: 벤치에 앉아 있던 10분'},
      {key:'costTime',label:'그때의 구체적인 상황은?',heading:'그날의 상황',placeholder:'예: 비가 그친 뒤라 길이 조용했어요'},
      {key:'pros',label:'무엇을 느꼈나요?',heading:'느낀 점',placeholder:'예: 서두르지 않아도 괜찮다는 생각'},
      {key:'consAudience',label:'남기고 싶은 한 줄은?',heading:'한 줄 기록',placeholder:'예: 다음 주에도 같은 길을 걸어보려고 해요'}
    ]}
  };
  const PACKAGE_VERSION=2;
  const RELATIONSHIP_TEXT={none:'',selfpaid:'',provided:'이 글은 제품 또는 서비스를 제공받아 작성했습니다.',paid:'이 글은 원고료를 제공받아 작성했습니다.',affiliate:'이 글에는 제휴 링크가 포함되어 있으며, 구매 시 일정 수수료를 받을 수 있습니다.'};
  const splitSentences=text=>String(text||'').split(/[.!?。\n]+/).map(value=>value.trim()).filter(Boolean);
  const countWords=text=>String(text||'').trim().split(/\s+/).filter(Boolean).length;
  const evidenceLength=text=>String(text||'').replace(/\s/g,'').length;
  function normalizeNaverBlogUrl(value){
    const raw=String(value||'').trim();if(!raw||raw.length>300)return null;
    let parsed;try{parsed=new URL(raw)}catch{return null}
    if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.port||!['blog.naver.com','m.blog.naver.com'].includes(parsed.hostname.toLowerCase()))return null;
    const parts=parsed.pathname.split('/').filter(Boolean).map(part=>{try{return decodeURIComponent(part)}catch{return''}});
    const route=String(parts[0]||'').toLowerCase();const queryId=parsed.searchParams.get('blogId');const routed=['postlist.naver','postview.naver','blogprofile.naver'].includes(route);
    const blogId=routed?queryId:parts[0];
    if(!blogId||!/^[A-Za-z0-9_-]{2,50}$/.test(blogId))return null;
    return{blogId,url:`https://blog.naver.com/${blogId}`};
  }
  function normalizeNaverPostUrl(value){
    const raw=String(value||'').trim();if(!raw||raw.length>500)return null;let parsed;try{parsed=new URL(raw)}catch{return null}
    if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.port||!['blog.naver.com','m.blog.naver.com'].includes(parsed.hostname.toLowerCase()))return null;
    const parts=parsed.pathname.split('/').filter(Boolean);const route=String(parts[0]||'').toLowerCase();let blogId='';let logNo='';
    if(route==='postview.naver'){blogId=parsed.searchParams.get('blogId')||'';logNo=parsed.searchParams.get('logNo')||''}else{blogId=parts[0]||'';logNo=parts[1]||''}
    if(!/^[A-Za-z0-9_-]{2,50}$/.test(blogId)||!/^\d{5,30}$/.test(logNo))return null;
    return{blogId,logNo,url:`https://blog.naver.com/${blogId}/${logNo}`};
  }
  function getTopics(category){return (TOPICS[category]||TOPICS.local).map(item=>({...item}))}
  function getInterviewFields(postType='visit'){
    const template=INTERVIEW_TEMPLATES[postType]||INTERVIEW_TEMPLATES.visit;
    return template.fields.map(field=>({...field,essential:['context','reason','pros'].includes(field.key)}));
  }
  function analyzeTone(text){
    const value=String(text||'');const padded=`${value} `;
    const friendly=/(해요|어요|아요|이에요|예요|네요|군요|까요|죠|게요)[.!?\s]/.test(padded);
    const formal=/(합니다|입니다|습니다|됩니다)[.!?\s]/.test(padded);
    const casual=/(?:했|였|됐|갔|왔|봤|먹었|썼|걸었|좋았|싫었|편했|불편했)(?:어|지)[.!?\s]|(?:이야|거야|할게|거든|잖아|했는데)[.!?\s]|[가-힣]+(?:았|었|였)고(?:\s|,)/.test(padded);
    const sentences=splitSentences(value);const average=Math.round(value.replace(/\s/g,'').length/Math.max(1,sentences.length));
    const paragraphs=value.split(/\n\s*\n/).filter(part=>part.trim()).length;const emoji=(value.match(/[😀-🙏✨❤♥]/gu)||[]).length;
    const connectorWords=['그래서','그런데','근데','다만','특히','사실','솔직히','무엇보다','개인적으로'];
    const connectors=connectorWords.map(word=>({word,count:(value.match(new RegExp(word,'g'))||[]).length})).filter(item=>item.count).sort((a,b)=>b.count-a.count).slice(0,3).map(item=>item.word);
    return{ending:friendly?'부드러운 존댓말':formal?'정중한 설명체':casual?'친근한 반말체':'차분한 서술형',sentenceLength:average<34?'짧고 빠른 문장':'여유 있는 문장',paragraphStyle:paragraphs>=3?'문단을 자주 나눔':'문단을 길게 이어감',emoji:emoji?'이모지 사용':'이모지 거의 없음',connectors,sampleWords:countWords(value)};
  }
  function evaluateSpecificity(memo,experienceFields={},postType='visit'){
    const answers=experienceFields&&typeof experienceFields==='object'?experienceFields:{};
    const answerValues=Object.values(answers).map(value=>String(value||'').trim()).filter(value=>evidenceLength(value)>=2);
    const memoValue=String(memo||'').trim();const value=[memoValue,...answerValues].filter(Boolean).join(' ');
    const experiencedMemo=/다녀왔|방문했|사용했|써봤|먹었|느꼈|구매했|샀|앉았|겪었|해봤|이용했|골랐|선택했|머물렀|걸렸|기다렸|가봤|좋았|아쉬웠|편했|불편했/.test(memoValue);
    const signals={numbers:/\d/.test(value),experience:answerValues.length>0||experiencedMemo,context:Boolean(String(answers.context||'').trim())||/(오전|오후|분|시간|원|명|장|주말|평일|날|개월|주일|처음|마지막)/.test(value)};
    const count=Object.values(signals).filter(Boolean).length;const answered=answerValues.length;
    const memoReady=evidenceLength(memoValue)>=30&&count>=2;const answerReady=answered>=3&&answerValues.reduce((total,item)=>total+evidenceLength(item),0)>=15;
    const essentialFields=getInterviewFields(postType).filter(field=>field.essential);
    const essentialAnswered=essentialFields.filter(field=>evidenceLength(answers[field.key])>=2).length;
    const level=answered>=5&&essentialAnswered===essentialFields.length&&count>=2?'답변 충분':answerReady||memoReady?'보완용 뼈대':'추가 답변 필요';
    return{level,signals,count,answered,essentialAnswered,essentialTotal:essentialFields.length,total:getInterviewFields(postType).length};
  }
  function photoSuggestions(category){const map={local:['대표 장면 또는 외관','가격·메뉴를 확인할 수 있는 장면','내가 고른 메뉴나 자리','이용 후 기억에 남은 장면'],travel:['장소를 보여주는 대표 장면','동선·교통을 설명하는 장면','가격이나 시설을 확인하는 장면','여행 후 가장 기억에 남은 장면'],beauty:['제품 전체와 용량 표시','제형 또는 사용 과정','사용 전후를 비교할 수 있는 장면','장점·아쉬움을 보여주는 장면'],parenting:['사용 환경 전체 모습','준비 과정 또는 크기 비교','아이와 사용한 상황','정리·세척·보관 장면'],tech:['제품 또는 서비스 첫 화면','설정·사용 과정','비교 기준을 보여주는 화면','사용 후 결과나 작업 변화'],life:['준비물 전체','실행 과정','비용·시간을 확인하는 장면','완료 후 결과']};return map[category]||map.local}
  function cleanTopicTag(word){
    let clean=String(word||'').replace(/[^가-힣a-zA-Z0-9]/g,'');
    if(!clean||/^\d/.test(clean))return'';
    clean=clean.replace(/(?:하는|했던)$/,'').replace(/^(?:해본|써본|가본|먹어본|고른|선택한)$/,'');
    clean=clean.replace(/(?:으로|에서|부터|까지|처럼|보다|에게|한테|은|는|이|가|을|를|의|에|와|과|로|도|만)$/,'');
    if(clean.length<2||/^(방법|후기|리뷰|기록|비교|사용|추천|이유|실제)$/.test(clean))return'';
    return clean;
  }
  function createHashtags(topic,category,memo,relationship,postType='visit'){
    const typeTags={visit:['방문후기','경험기록'],product:['제품사용기','사용후기'],howto:['방법정리','문제해결'],compare:['비교후기','선택기준'],daily:['일상기록','오늘의기록']};
    const categoryTag={local:'지역정보',travel:'여행정보',beauty:'뷰티기록',parenting:'육아기록',tech:'테크기록',life:'생활정보'};
    const words=String(topic||'').split(/\s+/).map(cleanTopicTag).filter(Boolean).slice(0,4);
    const tags=[...words,...(typeTags[postType]||typeTags.visit),categoryTag[category]||categoryTag.local];
    if(relationship==='selfpaid'||/내돈내산|직접\s*구매|구매했/.test(String(memo||'')))tags.push('내돈내산');
    return[...new Set(tags)].slice(0,8).map(tag=>`#${tag}`);
  }
  function titleSnippet(value,max=36){
    const clean=String(value||'').replace(/\s+/g,' ').trim();
    const candidates=clean.split(/[.!?。]|[,，;:]/).map(part=>part.trim()).filter(Boolean);
    return candidates.find(part=>part.length>=4&&part.length<=max&&/\s/.test(part)&&!/\d$/.test(part)&&!/(?:고|며|면|서|는데|지만|해서|하며|이고|그리고|및|또는|때문에|거나)$/.test(part))||'';
  }
  function createTitles(topic,byKey,postType){
    const plans={visit:[[['pros','consAudience','costTime'],'써본 뒤 판단'],[['context','reason','process'],'방문한 때와 분위기']],product:[[['pros','consAudience','costTime'],'사용한 뒤 판단'],[['reason','context','process'],'고른 이유']],howto:[[['pros','costTime','consAudience'],'해본 뒤 결과'],[['process','reason','context'],'직접 해본 순서 정리']],compare:[[['pros','consAudience','costTime'],'비교 뒤 선택'],[['reason','process','context'],'비교하게 된 이유']],daily:[[['pros','consAudience','costTime'],'그날 느낀 점'],[['context','reason','process'],'그날의 장면']]};
    const extra={visit:['방문 시간과 분위기 기록','메뉴와 자리 후기'],product:['써보고 남긴 장단점','고른 이유와 사용감'],howto:['해보고 남긴 순서와 결과','겪은 시행착오와 팁'],compare:['비교 기준과 최종 선택','상황별 추천'],daily:['그날의 장면과 생각','오래 남은 여운']};
    const [primary,secondary]=(plans[postType]||plans.visit);
    const fit=Math.max(10,52-topic.length-2);
    const pick=(keys,max)=>keys.map(key=>titleSnippet(byKey[key]&&byKey[key].text,max)).find(Boolean)||'';
    const standalone=pick(primary[0],46);
    const pool=[topic];
    // 2번: 강한 경험 스니펫이면 접두어 없이 단독 제목
    pool.push(standalone&&standalone.length>=10&&standalone!==topic?standalone:`${topic}, ${primary[1]}`);
    // 3번 이후: 접두어 제목은 경험 원문을 덤프하지 않고 큐레이션된 마무리 각도만 사용
    [secondary[1],primary[1],...(extra[postType]||extra.visit)].forEach(tail=>pool.push(`${topic}, ${tail}`));
    const bad=/(?:고|며|면|서|는데|지만|해서|하며|이고|그리고|및|또는|때문에|거나)$/;
    const out=[];for(const raw of pool){const title=raw.length<=52?raw:raw.slice(0,52).replace(/[,\s]+\S*$/,'');if(!title||title.length>52||out.includes(title))continue;if(out.length>0&&bad.test(title))continue;out.push(title);if(out.length===3)break}
    return out;
  }
  function cleanSentence(value){const clean=String(value||'').trim();if(!clean)return'';return/[.!?。~…ㅋㅎ]$/.test(clean)?clean:`${clean}.`}
  function polishEvidence(value,key,postType='visit'){
    let text=String(value||'').replace(/\s+/g,' ').trim().replace(/[.!?]+$/,'');if(!text)return'';
    text=text.replace(/개인\s*(?:이|이서)?\s*쓰는\s*좌석/g,'혼자 쓰기 좋은 좌석').replace(/좌석이\s*컸/g,'좌석이 넓었').replace(/해야해서/g,'해야 해서').replace(/하려고해서/g,'하려고 해서');
    if(key==='context'&&postType==='visit'&&/(?:주말|평일|오전|오후|요일|날|때)에$/.test(text))text+=' 다녀왔어요';
    if(key==='reason'&&/(?:해야 해서|하려고 해서|필요해서|원해서)$/.test(text))text+=' 이곳을 골랐어요';
    if(key==='reason'&&/작업 해야/.test(text))text=text.replace(/작업 해야/,'작업을 해야');
    return cleanSentence(text);
  }
  function contentTokens(value){return[...new Set(String(value||'').toLowerCase().replace(/[^가-힣a-z0-9\s]/g,' ').split(/\s+/).map(token=>token.replace(/(?:은|는|이|가|을|를|에|에서|으로|해서|했어요|였어요|어요|아요)$/,'')).filter(token=>token.length>=2))]}
  function evidenceOverlap(left,right){const a=contentTokens(left);const b=new Set(contentTokens(right));if(!a.length)return 0;return a.filter(token=>b.has(token)).length/a.length}
  function composeWithMemo(memo,byKey,postType){
    const memoSentences=splitSentences(memo).map(cleanSentence).filter(Boolean);if(memoSentences.length<2||evidenceLength(memo)<80)return null;
    const additions={before:[],afterFirst:[],beforeContrast:[],after:[]};
    const slots={context:'before',reason:'afterFirst',process:'beforeContrast',costTime:'beforeContrast',pros:'beforeContrast',consAudience:'after'};
    for(const key of ['context','reason','process','costTime','pros','consAudience']){const section=byKey[key];if(!section)continue;const polished=polishEvidence(section.text,key,postType);if(!polished||memoSentences.some(sentence=>evidenceOverlap(polished,sentence)>=.5))continue;additions[slots[key]].push(polished)}
    const contrastIndex=memoSentences.findIndex(sentence=>/^(다만|하지만|그런데|근데)|아쉬|불편/.test(sentence));const pivot=contrastIndex>0?contrastIndex:memoSentences.length;
    const ordered=[...additions.before,memoSentences[0],...additions.afterFirst,...memoSentences.slice(1,pivot),...additions.beforeContrast,...memoSentences.slice(pivot),...additions.after];
    const unique=[];for(const sentence of ordered){if(!unique.some(saved=>evidenceOverlap(sentence,saved)>=.75))unique.push(sentence)}
    const paragraphs=[];for(let index=0;index<unique.length;index+=3)paragraphs.push(unique.slice(index,index+3).join(' '));return paragraphs;
  }
  function createPackage({topic,memo,tone,category='local',photoNotes='',relationship='none',postType='visit',experienceFields={}}){
    const cleanTopic=String(topic||'오늘의 기록').trim();const cleanMemo=String(memo||'').trim();
    const template=INTERVIEW_TEMPLATES[postType]||INTERVIEW_TEMPLATES.visit;const fields=getInterviewFields(postType);
    const answers=experienceFields&&typeof experienceFields==='object'?experienceFields:{};
    const sections=fields.map(field=>({...field,text:String(answers[field.key]||'').trim(),source:'user'})).filter(section=>section.text);
    if(cleanMemo)sections.push({key:'memo',label:'추가 메모',heading:'추가 경험 메모',text:cleanMemo,source:'user'});
    const structuredAnswers=sections.filter(section=>section.key!=='memo');const meaningfulAnswers=structuredAnswers.filter(section=>evidenceLength(section.text)>=2);
    const missingFields=fields.filter(field=>evidenceLength(answers[field.key])<2).map(field=>({key:field.key,label:field.label,heading:field.heading}));
    const specificity=evaluateSpecificity(cleanMemo,answers,postType);const byKey=Object.fromEntries(structuredAnswers.map(section=>[section.key,section]));
    const titles=createTitles(cleanTopic,byKey,postType);const connectivePhrases=[];
    const avoided=new Set(tone&&Array.isArray(tone.avoidPhrases)?tone.avoidPhrases:[]);
    const preferredConnector=tone&&Array.isArray(tone.connectors)?tone.connectors.find(word=>['그런데','근데','다만'].includes(word)&&!avoided.has(word)):'';
    const plans={visit:[['context','reason'],['process','costTime'],['pros','consAudience']],product:[['context','reason'],['process','costTime'],['pros','consAudience']],howto:[['context','reason'],['process','costTime'],['pros','consAudience']],compare:[['context','reason'],['process','costTime'],['pros','consAudience']],daily:[['context','reason'],['process','costTime'],['pros','consAudience']]};
    const paragraphGroups=[];
    (plans[postType]||plans.visit).forEach(keys=>{
      const lines=keys.map(key=>byKey[key]).filter(Boolean).map(section=>polishEvidence(section.text,section.key,postType));
      if(keys.includes('consAudience')&&lines.length===2&&preferredConnector&&!/^(그런데|근데|다만)/.test(lines[1])){lines[1]=`${preferredConnector} ${lines[1]}`;connectivePhrases.push(preferredConnector)}
      if(!lines.length)return;
      paragraphGroups.push(lines.join(' '));
    });
    const composedMemo=composeWithMemo(cleanMemo,byKey,postType);const paragraphs=composedMemo||paragraphGroups;
    if(cleanMemo&&!composedMemo)paragraphs.push(cleanSentence(cleanMemo));
    const userDisclosure=[cleanMemo,...structuredAnswers.map(section=>section.text)].some(text=>/(제공받|협찬|원고료|제휴\s*링크|수수료)/.test(text));
    const disclosure=userDisclosure?'':RELATIONSHIP_TEXT[relationship]||'';
    const body=[disclosure,...paragraphs].filter(Boolean).join('\n\n');
    const markers=String(photoNotes||'').split(/\n+/).map(value=>value.trim()).filter(Boolean);const photoPlan=markers.length?markers:photoSuggestions(category);
    const evidenceText=[cleanMemo,...meaningfulAnswers.map(section=>section.text)].filter(Boolean).join(' ');const hashtags=createHashtags(cleanTopic,category,evidenceText,relationship,postType);
    const usedEvidence=sections.map(section=>({key:section.key,heading:section.heading,text:section.text,source:'user'}));
    const provenance={userEvidenceCount:usedEvidence.length,connectivePhrases:[...new Set(connectivePhrases)],addedFacts:0,disclosureAdded:Boolean(disclosure),userDisclosure};
    return{packageVersion:PACKAGE_VERSION,topic:cleanTopic,postType,postTypeLabel:template.label,titles,body,sections,missingFields,usedEvidence,provenance,interviewCompletion:{answered:meaningfulAnswers.length,total:fields.length},photoPlan,hashtags,specificity,disclosure,createdAt:new Date().toISOString()};
  }
  function auditHumanDraft(text,topic='',tone=null,context={}){
    const value=String(text||'').trim();const issues=[];const goodSignals=[];
    const addIssue=(code,title,detail,match='')=>{if(!issues.some(issue=>issue.code===code))issues.push({code,title,detail,snippet:titleSnippet(match,70)})};
    const genericPatterns=[/오늘은.{0,50}(알아보|소개해|살펴보)/,/이번 (포스팅|글)에서는/,/도움이 되셨(길|다면)/,/지금까지.{0,40}(알아봤|살펴봤)/,/결론적으로|총정리해/];
    const generic=genericPatterns.map(pattern=>value.match(pattern)).find(Boolean);if(generic)addIssue('generic','익숙한 자동 작성 문구','첫 장면이나 내 판단으로 바꾸면 덜 틀에 박혀 보여요.',generic[0]);
    const avoided=tone&&Array.isArray(tone.avoidPhrases)?tone.avoidPhrases.find(phrase=>phrase&&value.toLowerCase().includes(String(phrase).toLowerCase())):'';if(avoided)addIssue('avoided','내가 쓰지 않기로 한 표현이 있어요','말투 카드에 등록한 표현을 내 문장으로 바꿔보세요.',avoided);
    const overclaim=value.match(/무조건|완벽한|최고의|인생\s*(?:맛집|템|제품)|절대|확실히|100%|강력\s*추천/);if(overclaim)addIssue('overclaim','확신이 너무 큰 표현','조건이나 실제 장면을 함께 적어 과장을 줄여보세요.',overclaim[0]);
    const placeholder=value.match(/\[[^\]]*(?:답변|보강|확인|입력|사진|주소|링크|내용|수정|추가)[^\]]*\]|(?:답변|내용|상황)을\s*적어(?:주세요|줘)|(?:TODO|TBD)\b/i);if(placeholder)addIssue('placeholder','편집용 표시가 남아 있어요','표시된 내용을 채우거나 문장을 지운 뒤 복사하세요.',placeholder[0]);
    const titleValues=Array.isArray(context.titles)?context.titles.map(title=>String(title||'').trim()):[];
    const titlePlaceholder=titleValues.find(title=>/\[[^\]]*(?:확인|입력|사진|주소|링크|내용|수정|추가)[^\]]*\]|(?:TODO|TBD)\b/i.test(title));if(titlePlaceholder)addIssue('title-placeholder','제목에 편집용 표시가 남아 있어요','제목을 완성한 뒤 복사하세요.',titlePlaceholder);
    const brokenTitle=titleValues.find(title=>/…$|(?:고|며|면|서|는데|지만|해서|하며|이고|그리고|및|또는|때문에|거나)$/.test(title));if(brokenTitle)addIssue('broken-title','제목 문장이 중간에서 멈췄어요','완결된 말로 끝나는 제목을 골라주세요.',brokenTitle);
    const longParagraph=value.split(/\n\s*\n/).find(paragraph=>evidenceLength(paragraph)>350);if(longParagraph)addIssue('long-paragraph','한 문단이 너무 길어요','모바일에서 읽기 쉽도록 장면이 바뀌는 곳에서 문단을 나눠보세요.',longParagraph);
    const sentences=splitSentences(value);if(value&&evidenceLength(value)<80||value&&sentences.length<3)addIssue('thin-draft','아직 본문 뼈대에 가까워요','선택 질문이나 실제 장면을 더 넣으면 발행할 글에 가까워져요.',value);
    const essentialKeys=new Set(getInterviewFields(context.postType||'visit').filter(field=>field.essential).map(field=>field.key));
    const missingEssential=Array.isArray(context.missingFields)?context.missingFields.filter(field=>essentialKeys.has(field.key)):[];if(missingEssential.length)addIssue('missing-core','핵심 경험이 비어 있어요',`${missingEssential.map(field=>field.heading).join(' · ')} 답변을 더하면 판단 근거가 분명해져요.`);
    const shortParagraphs=value.split(/\n\s*\n/).filter(Boolean);if(shortParagraphs.length>=5&&shortParagraphs.filter(paragraph=>evidenceLength(paragraph)<45).length/shortParagraphs.length>=.8)addIssue('answer-list','답변 목록처럼 끊겨 보여요','서로 이어지는 두 문장을 한 문단으로 묶어보세요.');
    const vague=sentences.find(sentence=>/^(?:정말\s*)?(?:좋았|만족했|추천해|최고였)(?:어요|습니다|어|다)$/.test(sentence.trim()));if(vague)addIssue('vague','좋다는 말의 이유가 짧아요','무엇이 언제 어떻게 좋았는지 한 장면을 덧붙여보세요.',vague);
    const endings=sentences.map(sentence=>{const clean=sentence.trim();if(/(?:습니다|입니다|합니다)$/.test(clean))return'습니다';if(/(?:해요|어요|아요|예요|이에요|네요|죠)$/.test(clean))return'요';if(/[가-힣]+(?:았|었|였)어$/.test(clean))return'어';if(/[가-힣]+(?:았|었|였)지$/.test(clean))return'지';if(/다$/.test(clean))return'다';return''}).filter(Boolean);
    const endingCounts=endings.reduce((map,ending)=>(map[ending]=(map[ending]||0)+1,map),{});const dominantEnding=Object.entries(endingCounts).sort((a,b)=>b[1]-a[1])[0];
    const rhythmEndings=sentences.map(sentence=>{const match=sentence.trim().match(/(했습니다|했습니다|했어요|였어요|았어요|었어요|합니다|입니다|습니다|했어|였어|았어|었어|한다|했다|이다)$/);return match?match[1]:''}).filter(Boolean);const rhythmCounts=rhythmEndings.reduce((map,ending)=>(map[ending]=(map[ending]||0)+1,map),{});const repeatedEnding=Object.entries(rhythmCounts).sort((a,b)=>b[1]-a[1])[0];
    if(rhythmEndings.length>=4&&repeatedEnding&&repeatedEnding[1]/rhythmEndings.length>=.75)addIssue('rhythm','같은 말끝이 계속 반복돼요','짧은 문장과 긴 문장을 섞거나 한두 문장은 메모하듯 끊어보세요.',repeatedEnding[0]);
    if(endings.length>=3&&dominantEnding&&tone&&tone.ending){const expected={부드러운존댓말:['요'],정중한설명체:['습니다','다'],친근한반말체:['어','지'],차분한서술형:['다']}[String(tone.ending).replace(/\s/g,'')]||[];if(expected.length&&!expected.includes(dominantEnding[0]))addIssue('tone-ending','등록한 말투와 말끝이 달라요',`말투 카드는 ${tone.ending}으로 읽었지만 현재 본문은 ‘${dominantEnding[0]}’ 말끝이 가장 많아요.`)}
    const keyword=String(topic||'').replace(/[^가-힣a-zA-Z0-9\s]/g,' ').split(/\s+/).filter(word=>word.length>=2).find(word=>(value.match(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length>=8);if(keyword)addIssue('keyword','같은 핵심어가 자주 반복돼요','자연스러운 대명사나 구체적인 장면으로 일부를 바꿔보세요.',keyword);
    if(/(?:\d+|한|두|세|네)\s*(?:분|시간|원|명|개|장|일|주|개월|km|m|%)/i.test(value))goodSignals.push('구체적인 시간·가격·수량이 있어요');
    if(/아쉬|불편|다만|그런데|근데/.test(value))goodSignals.push('좋은 점만 쓰지 않고 한계도 담았어요');
    if(/오전|오후|주말|평일|처음|마지막|(?:\d+|한|두|세|네)\s*(?:분|시간|원|명|일|주|개월)/.test(value))goodSignals.push('상황을 떠올릴 구체적인 맥락이 있어요');
    if(/다녀왔|방문했|사용했|써봤|먹었|느꼈|구매했|골랐|선택했|걸었|정리했|삭제했|비교했|설정했|확인했|만들었/.test(value))goodSignals.push('내 행동과 판단이 드러나요');
    return{issues,goodSignals,blocking:issues.some(issue=>['placeholder','title-placeholder'].includes(issue.code))};
  }
  function createReplyCandidates(comment,tone){const value=String(comment||'').trim();const question=/\?|궁금|어떻게|어디|언제|얼마|인가요|나요/.test(value);const praise=/감사|도움|좋|잘\s*봤|유용/.test(value);const shared=/저도|저는|저희|제 경우|저 같은/.test(value);const friendly=tone&&tone.ending&&tone.ending.includes('존댓말');const casual=tone&&tone.ending&&tone.ending.includes('반말');if(question)return friendly?['질문 남겨주셔서 감사해요. 제가 확인한 범위에서는 [답변을 적어주세요]. 달라진 내용이 있으면 본문에도 반영할게요.','궁금하셨던 부분은 [답변을 적어주세요]. 방문이나 구매 전에는 최신 정보도 한 번 확인해 주세요.','좋은 질문이에요. 제가 경험한 상황은 [상황을 적어주세요]였고, 그때는 [답변을 적어주세요].']:casual?['질문 고마워. 내가 확인한 범위에서는 [답변을 적어줘]. 달라진 내용이 있으면 본문에도 반영할게.','궁금했던 부분은 [답변을 적어줘]. 결정 전에는 최신 정보도 한 번 확인해 봐.','좋은 질문이야. 내 상황은 [상황을 적어줘]였고, 그때는 [답변을 적어줘].']:['질문 감사합니다. 확인한 범위에서는 [답변을 적어주세요]. 변경된 내용이 있으면 본문에도 반영하겠습니다.','문의하신 부분은 [답변을 적어주세요]. 결정 전 최신 정보도 확인하시기 바랍니다.','좋은 질문입니다. 당시 상황은 [상황을 적어주세요]였으며, 답변은 [답변을 적어주세요].'];if(shared)return['경험을 나눠주셔서 감사해요. 같은 주제라도 상황에 따라 다를 수 있다는 점이 정말 도움이 되네요.','댓글로 알려주신 경험도 참고할게요. 다른 분들에게도 유용한 정보가 될 것 같아요.','저와 다른 경험을 들려주셔서 감사해요. 다음에 다시 확인할 때 함께 살펴볼게요.'];if(praise)return['좋게 봐주셔서 감사해요. 도움이 되었다니 기뻐요!','따뜻한 댓글 감사합니다. 다음 기록도 꼼꼼하게 준비해볼게요.','읽어주시고 댓글까지 남겨주셔서 감사해요. 좋은 하루 보내세요!'];return['댓글 남겨주셔서 감사해요. 말씀해주신 내용도 잘 참고할게요.','읽어주시고 의견 나눠주셔서 감사합니다. 다음 글에도 반영해볼게요.','소중한 댓글 감사합니다. 덕분에 놓친 부분을 다시 생각해보게 됐어요.']}
  function formatAll(pkg,draft){const body=draft===undefined||draft===null?pkg.body:draft;return`${pkg.titles[0]}\n\n${String(body||'').trim()}\n\n${pkg.hashtags.join(' ')}`}
  return{PACKAGE_VERSION,normalizeNaverBlogUrl,normalizeNaverPostUrl,getTopics,getInterviewFields,analyzeTone,evaluateSpecificity,polishEvidence,evidenceOverlap,composeWithMemo,createPackage,auditHumanDraft,createHashtags,createReplyCandidates,formatAll,splitSentences};
});
