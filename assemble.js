(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HeunjeokAssemble=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  // 통짜 AI 대신 4단계 조립: ① 독자 질문 → ② H2 목차 → ③ 소제목별 문단 뼈대 → ④ 편집자 검수.
  // 없는 사실을 만들지 않는다. 모든 문단은 사용자가 채울 슬롯을 남긴다.
  const READER_QUESTIONS={
    visit:['어디이고 누구랑 가기 좋은가요?','가는 길·주차·웨이팅은 어땠나요?','실제로 뭘 먹거나 봤고 얼마였나요?','가장 좋았던 점과 아쉬운 점은?','다시 갈 건가요, 누구에게 추천하나요?'],
    product:['무엇을, 왜 샀나요?','얼마였고 어디서 샀나요?','실제로 써 보니 어땠나요(장점)?','불편하거나 아쉬운 점은?','어떤 사람에게 맞고 안 맞나요?'],
    howto:['이 방법이 필요한 상황은 언제인가요?','준비물이나 조건은 무엇인가요?','실제 순서는 어떻게 되나요?','내가 겪은 실수나 주의점은?','결과가 어땠고 얼마나 걸렸나요?'],
    compare:['무엇과 무엇을 비교하나요?','각각의 가격·조건은?','직접 써 보고 느낀 차이는?','어떤 상황엔 A, 어떤 상황엔 B인가요?','결국 나는 무엇을 골랐고 왜인가요?'],
    daily:['언제, 어디서 있었던 일인가요?','그때 무엇을 했나요?','어떤 감정·생각이 들었나요?','기억에 남은 장면 하나는?','이 경험이 남긴 것은?']
  };
  const OUTLINE={
    visit:['방문 계기와 첫인상','가는 길·분위기','실제 경험(주문·이용)','좋았던 점과 아쉬운 점','추천 대상과 마무리'],
    product:['구매 계기','제품 첫인상·스펙','실제 사용 경험','장점과 단점','추천 대상과 총평'],
    howto:['이 방법이 필요한 이유','준비물·사전 조건','단계별 방법','내가 겪은 주의점','결과와 팁'],
    compare:['비교 배경','후보 소개','항목별 비교','상황별 추천','나의 선택과 이유'],
    daily:['그날의 배경','있었던 일','느낀 점','기억에 남은 장면','돌아보며']
  };
  const HOOKS={
    scene:'장면으로 시작: 그 순간 보이거나 들린 것 한 가지를 먼저 적어보세요. (결론 요약으로 시작하지 않기)',
    question:'질문으로 시작: 독자가 검색하며 떠올릴 궁금증 한 줄로 열어보세요.',
    contrast:'기대와 실제 차이로 시작: 가기 전 예상과 직접 겪은 차이를 한 문장씩 대비하세요.',
    problem:'불편했던 문제로 시작: 해결하려고 했던 불편을 구체적인 상황과 함께 먼저 적으세요.',
    detail:'구체적인 한 장면으로 시작: 시간·장소·소리·표정 중 확인한 두 가지를 짧게 묘사하세요.'
  };
  function typeOf(postType){return READER_QUESTIONS[postType]?postType:'visit'}
  function cleanLine(value,max=200){return typeof value==='string'?value.replace(/\s+/g,' ').trim().slice(0,max):''}
  function stageReaderQuestions(postType){return READER_QUESTIONS[typeOf(postType)].slice()}
  function stageOutline(topic,postType){const title=cleanLine(topic,60)||'이 글';return OUTLINE[typeOf(postType)].map((heading,index)=>({level:'H2',order:index+1,heading}))}
  function stageSections(topic,postType,experienceFields={}){
    const answers=experienceFields&&typeof experienceFields==='object'?experienceFields:{};
    const values=Object.values(answers).map(value=>cleanLine(value,200)).filter(Boolean);
    return stageOutline(topic,postType).map((section,index)=>{
      const seed=values[index]||'';
      return{heading:section.heading,skeleton:seed?`${seed}\n(위 경험을 2~3문장으로 풀고, 없는 사실은 넣지 마세요.)`:'[여기에 이 소제목에 해당하는 내 경험을 2~3문장으로 적어주세요]'};
    });
  }
  function stageEditorChecklist(){return['소제목마다 내 경험 문장이 최소 1개 있는가','과장·보장 표현을 뺐는가','도입이 결론 요약이 아니라 장면·질문인가','문단이 모바일에서 2~3줄인가','복붙 템플릿 문구(알아보겠습니다·총정리 등)를 지웠는가','광고·협찬 관계를 표시했는가'];}
  function hookCandidates(topic,style){const subject=cleanLine(topic,50)||'이 경험';const templates={scene:[`[언제·어디서] ${subject}을(를) 마주한 첫 장면부터 적어보세요.`,`[보이거나 들린 것] 하나를 먼저 쓰고 ${subject} 이야기로 연결하세요.`,`[짧은 행동]을 한 순간을 적은 뒤 그 이유를 밝혀보세요.`],question:[`${subject}, [독자가 가장 궁금해할 한 가지]는 어땠을까요?`,`[선택을 망설인 이유]가 있다면 무엇이었을까요?`,`[직접 확인하기 전의 질문]을 한 문장으로 던져보세요.`],contrast:[`${subject}은(는) [기대]와 달리 [직접 확인한 차이]가 있었어요.`,`가기 전에는 [예상], 실제로는 [경험]이었습니다.`,`[좋을 줄 알았던 점]보다 [의외였던 점]이 먼저 보였어요.`],problem:[`[구체적인 불편] 때문에 ${subject}을(를) 찾아보기 시작했어요.`,`[문제가 생긴 순간]부터 해결 과정을 차례로 적어보세요.`,`처음 막힌 건 [문제]였고, 직접 해 본 첫 선택은 [행동]이었어요.`],detail:[`[시간]의 [장소], 가장 먼저 눈에 들어온 건 [구체적인 대상]이었어요.`,`[소리·냄새·촉감] 중 직접 느낀 하나로 ${subject}을(를) 시작하세요.`,`[누구와 무엇을 하던 순간]의 작은 장면을 한 문장으로 적어보세요.`]};return templates[style]||templates.scene}
  function assembleToText(result){
    if(!result||!Array.isArray(result.stages))return '';
    const sections=(result.stages.find(s=>s.step===3)||{}).items||[];
    if(!sections.length)return '';
    const lines=['# 4단계 뼈대 (소제목별로 내 경험만 채우기)'];
    sections.forEach(section=>{lines.push('');lines.push('■ '+section.heading);lines.push('[여기에 이 소제목에 해당하는 내 경험을 2~3문장으로 적어주세요]')});
    return lines.join('\n');
  }
  function build({topic,postType,experienceFields,hookStyle}={}){
    const type=typeOf(postType);
    return{
      postType:type,
      hook:HOOKS[hookStyle]||HOOKS.scene,
      hookCandidates:hookCandidates(topic,HOOKS[hookStyle]?hookStyle:'scene'),
      stages:[
        {step:1,name:'독자 질문',items:stageReaderQuestions(type)},
        {step:2,name:'H2 목차',items:stageOutline(topic,type)},
        {step:3,name:'소제목별 문단',items:stageSections(topic,type,experienceFields)},
        {step:4,name:'편집자 검수',items:stageEditorChecklist()}
      ],
      note:'각 문단의 대괄호 슬롯을 내 경험으로 채우세요. 이 뼈대는 사실을 만들어내지 않습니다.'
    };
  }
  return{build,assembleToText,stageReaderQuestions,stageOutline,stageSections,stageEditorChecklist,hookCandidates,HOOKS};
});
