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
    question:'질문으로 시작: 독자가 검색하며 떠올릴 궁금증 한 줄로 열어보세요.'
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
  function build({topic,postType,experienceFields,hookStyle}={}){
    const type=typeOf(postType);
    return{
      postType:type,
      hook:HOOKS[hookStyle==='question'?'question':'scene'],
      stages:[
        {step:1,name:'독자 질문',items:stageReaderQuestions(type)},
        {step:2,name:'H2 목차',items:stageOutline(topic,type)},
        {step:3,name:'소제목별 문단',items:stageSections(topic,type,experienceFields)},
        {step:4,name:'편집자 검수',items:stageEditorChecklist()}
      ],
      note:'각 문단의 대괄호 슬롯을 내 경험으로 채우세요. 이 뼈대는 사실을 만들어내지 않습니다.'
    };
  }
  return{build,stageReaderQuestions,stageOutline,stageSections,stageEditorChecklist,HOOKS};
});
