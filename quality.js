(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HeunjeokQuality=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  // 점수 대신 체크리스트. 노출·순위 보장 문구는 절대 만들지 않는다.
  const EXAGGERATION=['강력 추천','강력추천','강추','무조건','반드시','절대','최고','최고의','인생','인생템','대박','완벽','완벽한','후회 없','후회없','국룰','필수템','안 사면 손해','안사면 손해','미쳤','역대급','끝판왕','갓성비','초대박'];
  const GUARANTEE=['보장','확실히','100%','무조건 됩니다','효과 보장','상위 노출','상위노출','무조건 효과'];
  const TEMPLATE=['알아보겠습니다','소개해 드리겠습니다','소개해드리겠습니다','소개해드릴게요','지금부터','함께 알아봐요','총정리','정리해봤어요','정리해 봤어요','도움이 되셨길','도움이 되셨다면','뒤로가기 전에','본격적으로','서론이 길었','오늘은 ','포스팅을 시작','자 그럼','그럼 시작'];
  const CLICKBAIT=['충격','헉','이것만은','반드시 알아야','알고 보니','알고보니','결국','미쳤다','대박','TOP','top ','베스트','절대 하지 마','절대하지마','하는 이유','하는 법','하지 않으면','이유 3가지','가지 이유','실화'];
  const AD_PUSH=['문의 주세요','문의주세요','디엠','dm 주세요','디엠 주세요','구매 링크','구매링크','아래 링크','링크 클릭','구입 문의','상담 문의','예약 문의','카톡 주세요','전화 주세요'];
  const EXPERIENCE_MARK=/(저는|제가|직접|가 봤|가봤|가서|써 봤|써봤|먹어 봤|먹어봤|사용해|방문|다녀왔|다녀온|느꼈|느낀|보였|들렸|주문했|시켰|해 봤|해봤|겪었|경험)/;
  const MOBILE_PARAGRAPH_CHARS=170;
  function normalize(value){return typeof value==='string'?value.replace(/\r\n?/g,'\n'):''}
  function splitParagraphs(text){return normalize(text).split(/\n\s*\n+/).map(part=>part.trim()).filter(Boolean)}
  function splitSentences(text){return normalize(text).replace(/\n+/g,' ').split(/(?<=[.!?。！？…])\s+/).map(s=>s.trim()).filter(Boolean)}
  function countHits(text,list){const lower=normalize(text);const hits=[];for(const word of list){if(lower.includes(word))hits.push(word)}return hits}
  function experienceRatio(text){const sentences=splitSentences(text);if(!sentences.length)return{ratio:0,total:0,experiential:0};const experiential=sentences.filter(sentence=>EXPERIENCE_MARK.test(sentence)).length;return{ratio:Math.round((experiential/sentences.length)*100)/100,total:sentences.length,experiential}}
  function longWalls(text){return splitParagraphs(text).filter(paragraph=>paragraph.replace(/\s/g,'').length>MOBILE_PARAGRAPH_CHARS||splitSentences(paragraph).length>3)}
  function firstSentence(text){return splitSentences(text)[0]||''}
  function conclusionFirst(text){const first=firstSentence(text);return /(결론|한 줄 요약|먼저 결론|요약하면|바로 결론)/.test(first)}
  const SAFE_REPLACEMENTS=[
    [/100%\s*(보장(?:합니다)?|확실(?:합니다)?)/g,'[직접 확인한 조건과 범위를 적어주세요]'],
    [/(상위\s*노출|효과)\s*(을|를|이|가)?\s*(보장(?:합니다)?|확실(?:합니다)?)/g,'[확인할 수 없는 결과 단정은 삭제하고 내 경험만 적어주세요]'],
    [/(무조건|반드시|절대|진짜|정말|완전|엄청)\s+/g,''],
    [/(최고의|완벽한|역대급|끝판왕|초대박|인생템|갓성비|필수템|강력\s*추천|강추)\s+/g,''],
    [/(오늘은\s*)?(.{0,30})에 대해 알아보겠습니다[.!]?/g,''],
    [/(지금부터|자 그럼|그럼 시작|함께 알아봐요|포스팅을 시작(?:합니다)?)[.!]?/g,''],
    [/(도움이 되셨길|도움이 되셨다면)[^.!?]*[.!]?/g,'']
  ];
  function reflowParagraph(paragraph){const sentences=splitSentences(paragraph);if(sentences.length<=3&&paragraph.replace(/\s/g,'').length<=MOBILE_PARAGRAPH_CHARS)return paragraph;const groups=[];for(let index=0;index<sentences.length;index+=2)groups.push(sentences.slice(index,index+2).join(' '));return groups.join('\n\n')}
  function safeCorrect(draft){let text=normalize(draft);const changes=[];for(const [pattern,replacement] of SAFE_REPLACEMENTS){text=text.replace(pattern,match=>{changes.push({before:match.trim(),after:replacement||'(삭제)',reason:replacement?'단정·상투 표현을 검토 자리로 바꿈':'불필요한 과장·상투 표현 삭제'});return replacement})}text=splitParagraphs(text).map(reflowParagraph).join('\n\n').replace(/[ \t]+([.!?])/g,'$1').replace(/ {2,}/g,' ').replace(/\n{3,}/g,'\n\n').trim();return{text,changes:changes.slice(0,30),changed:text!==normalize(draft).trim()}}
  function sentenceAdvice(draft){return splitSentences(draft).map((sentence,index)=>{const flags=[];if(countHits(sentence,GUARANTEE).length)flags.push('결과 단정');if(countHits(sentence,EXAGGERATION).length)flags.push('과장');if(countHits(sentence,TEMPLATE).length)flags.push('상투 문구');if(countHits(sentence,AD_PUSH).length)flags.push('홍보 압박');if(sentence.replace(/\s/g,'').length>90)flags.push('긴 문장');return{index:index+1,text:sentence.slice(0,140),flags,advice:flags.length?`${flags.join(' · ')}을 고치고 직접 확인한 장면·조건만 남겨보세요.`:'현재 규칙에서 뚜렷한 경고 없음'}}).filter(item=>item.flags.length).slice(0,20)}
  function repetition(text){
    const sentences=splitSentences(text);const seen=new Map();const duplicates=[];
    for(const sentence of sentences){const key=sentence.replace(/\s/g,'');if(key.length<6)continue;if(seen.has(key)){if(!duplicates.includes(sentence))duplicates.push(sentence)}else seen.set(key,1)}
    const starters={};for(const paragraph of splitParagraphs(text)){const first=((splitSentences(paragraph)[0]||'').trim().split(/\s+/)[0]||'');if(first.length>=2)starters[first]=(starters[first]||0)+1}
    const repeatedStarters=Object.keys(starters).filter(key=>starters[key]>=3);
    return{duplicates:duplicates.slice(0,5),repeatedStarters};
  }
  function audit(draft,options={}){
    const text=normalize(draft);const issues=[];const good=[];
    const paragraphs=splitParagraphs(text);
    const walls=longWalls(text);
    if(walls.length)issues.push({code:'mobile-wall',severity:'high',title:'모바일 글자벽',detail:`한 문단이 너무 길어요(모바일 2~3줄 권고). 긴 문단 ${walls.length}개를 중간에서 끊어보세요.`,snippet:walls[0].slice(0,40)});
    else if(paragraphs.length)good.push('문단이 모바일에서 읽기 좋은 길이예요');
    const exaggeration=countHits(text,EXAGGERATION);
    if(exaggeration.length>=2)issues.push({code:'exaggeration',severity:'medium',title:'과장 표현',detail:`과장으로 읽힐 수 있는 표현이 ${exaggeration.length}곳: ${exaggeration.slice(0,5).join(' · ')}. 실제 경험 묘사로 바꾸면 신뢰가 올라가요.`});
    const guarantee=countHits(text,GUARANTEE);
    if(guarantee.length)issues.push({code:'guarantee',severity:'high',title:'보장·단정 표현',detail:`효과·노출을 단정하는 표현이 있어요: ${guarantee.slice(0,5).join(' · ')}. 광고 심의와 독자 신뢰를 위해 사실 경험으로 바꿔 주세요.`});
    const template=countHits(text,TEMPLATE);
    if(template.length>=2)issues.push({code:'template',severity:'medium',title:'복붙 템플릿 냄새',detail:`틀에 박힌 도입·마무리 표현이 ${template.length}곳: ${template.slice(0,5).join(' · ')}. 내 문장으로 바꾸면 AI 티가 줄어요.`});
    const adPush=countHits(text,AD_PUSH);
    if(adPush.length)issues.push({code:'ad-push',severity:'medium',title:'광고 압박 표현',detail:`독자가 싫어하는 홍보 유도 표현이 있어요: ${adPush.slice(0,4).join(' · ')}. 정보 전달 뒤 자연스러운 안내로 바꿔 주세요.`});
    const exp=experienceRatio(text);
    if(exp.total>=4&&exp.ratio<0.3)issues.push({code:'experience-ratio',severity:'high',title:'경험 문장 부족',detail:`내 경험이 담긴 문장이 전체의 ${Math.round(exp.ratio*100)}%뿐이에요. 직접 보고 느낀 장면을 더 넣으면 AI 인용·저품질 논란을 피할 수 있어요.`});
    else if(exp.total>=4&&exp.ratio>=0.5)good.push('경험이 담긴 문장 비율이 충분해요');
    const titles=Array.isArray(options.titles)?options.titles:[];
    const clickbait=titles.filter(title=>countHits(title,CLICKBAIT).length>0);
    if(clickbait.length)issues.push({code:'clickbait-title',severity:'medium',title:'낚시형 제목',detail:`낚시·과장으로 읽힐 수 있는 제목 ${clickbait.length}개가 있어요. 내용을 정확히 담은 제목이 이탈을 줄입니다.`,snippet:clickbait[0].slice(0,40)});
    if(conclusionFirst(text)&&options.hookStyle==='scene')issues.push({code:'conclusion-first',severity:'low',title:'도입이 결론부터',detail:'첫 문장이 결론 요약이에요. 장면·질문으로 시작하는 도입이 스크롤을 멈추게 합니다.'});
    const rep=repetition(text);
    if(rep.duplicates.length)issues.push({code:'repetition',severity:'medium',title:'반복되는 문장',detail:`거의 같은 문장이 ${rep.duplicates.length}곳 반복돼요. 하나만 남기고 나머지는 다른 경험으로 바꿔보세요.`,snippet:rep.duplicates[0].slice(0,40)});
    if(rep.repeatedStarters.length)issues.push({code:'monotone-start',severity:'low',title:'문단 시작이 단조로움',detail:`여러 문단이 같은 말('${rep.repeatedStarters[0]}…')로 시작해요. 첫 단어를 바꾸면 리듬이 살아요.`});
    return{issues,goodSignals:good,sentenceAdvice:sentenceAdvice(text),correction:safeCorrect(text),stats:{paragraphs:paragraphs.length,longWalls:walls.length,exaggeration:exaggeration.length,guarantee:guarantee.length,template:template.length,experienceRatio:exp.ratio,experientialSentences:exp.experiential,totalSentences:exp.total,duplicates:repetition(text).duplicates.length}};
  }
  return{audit,repetition,safeCorrect,sentenceAdvice,experienceRatio,longWalls,EXAGGERATION,GUARANTEE,TEMPLATE,CLICKBAIT,AD_PUSH};
});
