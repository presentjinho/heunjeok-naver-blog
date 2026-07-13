(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HeunjeokBenchmark=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  // 기준 글 원문은 저장·전송하지 않는다. 아래 함수들은 구조 지표만 계산한다.
  const CTA_WORDS=['공감','댓글','이웃추가','이웃 추가','구독','좋아요','공유','저장','팔로우','알림설정','알림 설정','서로이웃'];
  const HOOK_QUESTION=/[?？]/;
  function normalize(value){return typeof value==='string'?value.replace(/\r\n?/g,'\n'):''}
  function nonSpaceLength(text){return normalize(text).replace(/\s/g,'').length}
  function splitParagraphs(text){return normalize(text).split(/\n\s*\n+/).map(part=>part.trim()).filter(Boolean)}
  function splitLines(text){return normalize(text).split('\n').map(line=>line.trim()).filter(Boolean)}
  function splitSentences(text){return normalize(text).replace(/\n+/g,' ').split(/(?<=[.!?。！？…])\s+|\.\s+/).map(s=>s.trim()).filter(Boolean)}
  function countMatches(text,regex){const found=normalize(text).match(regex);return found?found.length:0}
  function isHeadingLine(line){const clean=line.trim();if(clean.length===0||clean.length>28)return false;if(/[.。!?！？]$/.test(clean))return false;return /^[\[\(■◆▶◼️#0-9]/.test(clean)||/^[0-9]+[.)]/.test(clean)||clean.split(/\s+/).length<=4}
  function countCta(text){const lower=normalize(text);return CTA_WORDS.reduce((total,word)=>total+(lower.includes(word)?1:0),0)}
  function countEmoji(text){return countMatches(text,/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}←-⇿⬀-⯿]/gu)}
  function metrics(text){
    const source=normalize(text);
    const paragraphs=splitParagraphs(source);
    const sentences=splitSentences(source);
    const lines=splitLines(source);
    const chars=nonSpaceLength(source);
    const headingCount=lines.filter(isHeadingLine).length;
    const firstSentence=sentences[0]||'';
    return{
      chars,
      paragraphCount:paragraphs.length,
      sentenceCount:sentences.length,
      avgSentenceChars:sentences.length?Math.round(chars/sentences.length):0,
      headingCount,
      questionCount:countMatches(source,/[?？]/g),
      ctaCount:countCta(source),
      numberCount:countMatches(source,/\d+(?:[.,]\d+)?/g),
      photoCount:countMatches(source,/사진|이미지|\[?사진\]?|포토|컷/g),
      emojiCount:countEmoji(source),
      hashtagCount:countMatches(source,/(^|\s)#[0-9A-Za-z가-힣_]+/g),
      hookShort:firstSentence.length>0&&firstSentence.replace(/\s/g,'').length<=45,
      hookQuestion:HOOK_QUESTION.test(firstSentence)
    };
  }
  function topicKeywords(topic){return String(topic||'').split(/[\s,·]+/).map(word=>word.trim()).filter(word=>word.length>=2).slice(0,8)}
  function topicCoverage(text,topic){const keywords=topicKeywords(topic);if(!keywords.length)return{keywords:0,covered:0,missing:[]};const source=normalize(text);const missing=keywords.filter(word=>!source.includes(word));return{keywords:keywords.length,covered:keywords.length-missing.length,missing}}
  function ratio(draftValue,referenceValue){if(referenceValue<=0)return 1;return draftValue/referenceValue}
  function compare(referenceText,draftText,options={}){
    const reference=metrics(referenceText);
    const draft=metrics(draftText);
    if(reference.chars<40)return{ok:false,error:'reference_too_short'};
    if(draft.chars<20)return{ok:false,error:'draft_too_short'};
    const gaps=[];const strengths=[];let met=0;let dimensions=0;
    function judge(key,label,draftValue,referenceValue,hint,{minRatio=0.7}={}){
      dimensions+=1;const r=ratio(draftValue,referenceValue);
      if(referenceValue<=0){met+=1;return}
      if(r>=minRatio){met+=1;strengths.push({key,label,reference:referenceValue,draft:draftValue})}
      else gaps.push({key,label,reference:referenceValue,draft:draftValue,hint,ratio:Math.round(r*100)/100})
    }
    judge('length','분량',draft.chars,reference.chars,'기준 글보다 짧아요. 경험 장면을 한두 개 더 넣어 분량을 맞춰보세요.');
    judge('paragraphs','문단 수',draft.paragraphCount,reference.paragraphCount,'문단을 더 나눠 읽는 호흡을 주세요. 한 문단이 너무 길면 중간에서 끊어보세요.');
    judge('headings','소제목·구간',draft.headingCount,reference.headingCount,'짧은 소제목으로 구간을 나누면 스캔하기 쉬워집니다.');
    judge('numbers','구체적 수치',draft.numberCount,reference.numberCount,'가격·시간·수량 같은 숫자를 더 넣으면 신뢰도가 올라갑니다.','');
    judge('photos','사진 배치 언급',draft.photoCount,reference.photoCount,'사진이 들어갈 위치를 본문에 더 표시해보세요.');
    // 이분형(있고 없음) 항목
    dimensions+=1;if(reference.questionCount>0){if(draft.questionCount>0){met+=1;strengths.push({key:'question',label:'독자에게 묻기',reference:reference.questionCount,draft:draft.questionCount})}else gaps.push({key:'question',label:'독자에게 묻기',reference:reference.questionCount,draft:0,hint:'질문을 던지는 문장이 없어요. 공감을 부르는 질문을 한 줄 넣어보세요.'})}else met+=1;
    dimensions+=1;if(reference.ctaCount>0){if(draft.ctaCount>0){met+=1;strengths.push({key:'cta',label:'마무리 유도',reference:reference.ctaCount,draft:draft.ctaCount})}else gaps.push({key:'cta',label:'마무리 유도',reference:reference.ctaCount,draft:0,hint:'공감·댓글·이웃추가 같은 마무리 유도가 없어요. 강요가 아닌 부드러운 한 줄이면 충분합니다.'})}else met+=1;
    dimensions+=1;if(reference.hookQuestion||reference.hookShort){if(draft.hookQuestion||draft.hookShort){met+=1;strengths.push({key:'hook',label:'도입 첫 문장',reference:1,draft:1})}else gaps.push({key:'hook',label:'도입 첫 문장',reference:1,draft:0,hint:'첫 문장이 길고 무거워요. 짧은 문장이나 질문으로 시작하면 이탈이 줄어듭니다.'})}else met+=1;
    const coverage=topicCoverage(draftText,options.topic);
    if(coverage.keywords>0){dimensions+=1;if(coverage.missing.length===0){met+=1;strengths.push({key:'topic',label:'주제어 반영',reference:coverage.keywords,draft:coverage.covered})}else gaps.push({key:'topic',label:'주제어 반영',reference:coverage.keywords,draft:coverage.covered,hint:`제목 주제어 중 본문에 빠진 말: ${coverage.missing.join(' · ')}`})}
    const matchScore=dimensions?Math.round((met/dimensions)*100):0;
    return{ok:true,matchScore,reference,draft,gaps,strengths,coverage,note:'구조 유사도는 참고용이며 실제 조회수를 예측하지 않습니다. 기준 글 원문은 저장하지 않았습니다.'};
  }
  return{metrics,compare,topicKeywords,topicCoverage,splitSentences,splitParagraphs};
});
