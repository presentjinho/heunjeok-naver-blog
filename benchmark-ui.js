(function(){
  'use strict';
  const Benchmark=globalThis.HeunjeokBenchmark;
  if(!Benchmark)return;
  const $=id=>document.getElementById(id);
  const els={reference:$('benchmarkReference'),run:$('benchmarkRun'),coach:$('benchmarkCoach'),status:$('benchmarkStatus'),result:$('benchmarkResult'),score:$('benchmarkScore'),gaps:$('benchmarkGaps'),strengths:$('benchmarkStrengths'),coaching:$('benchmarkCoaching'),draft:$('draft')};
  if(!els.reference||!els.run||!els.draft)return;
  let last=null;
  function currentTopic(){const custom=$('customTopic');if(custom&&custom.value.trim())return custom.value.trim();const status=$('selectedTopicStatus');if(status){const match=status.textContent.match(/주제:\s*(.+)$/);if(match)return match[1].trim()}return''}
  function setStatus(message){els.status.textContent=message||''}
  function render(result){
    els.gaps.innerHTML='';els.strengths.innerHTML='';els.coaching.hidden=true;els.coaching.innerHTML='';
    els.score.textContent=result.matchScore+'%';
    if(result.gaps.length===0){const item=document.createElement('li');item.className='is-clear';item.innerHTML='<strong>구조가 기준 글과 잘 맞아요</strong><span>큰 구조 차이는 발견되지 않았어요. 내용의 진솔함이 관건입니다.</span>';els.gaps.append(item)}
    else result.gaps.forEach(gap=>{const item=document.createElement('li');const title=document.createElement('strong');title.textContent=gap.label+' 보완';const detail=document.createElement('span');detail.textContent=gap.hint;const meta=document.createElement('div');const reference=document.createElement('b');const draft=document.createElement('b');reference.textContent=String(gap.reference);draft.textContent=String(gap.draft);meta.append('기준 ',reference,' · 내 초안 ',draft);item.append(title,detail,meta);els.gaps.append(item)});
    result.strengths.slice(0,5).forEach(strength=>{const item=document.createElement('li');item.textContent='잘 지킨 항목: '+strength.label;els.strengths.append(item)});
    els.result.hidden=false;
    if(els.coach)els.coach.hidden=false;
  }
  function run(){
    const reference=els.reference.value.trim();const draft=els.draft.value.trim();
    if(reference.length<40){setStatus('기준 글을 40자 이상 붙여넣어 주세요.');els.reference.focus();return}
    if(draft.length<20){setStatus('먼저 위에서 초안을 만들어 주세요. 비교할 내 본문이 필요해요.');return}
    const result=Benchmark.compare(reference,draft,{topic:currentTopic()});
    if(!result.ok){setStatus(result.error==='reference_too_short'?'기준 글이 너무 짧아요.':'비교할 내 본문이 너무 짧아요.');return}
    last=result;setStatus('기준 글 원문은 저장하지 않았어요. 구조 지표만 대조했습니다.');render(result);
  }
  async function coach(){
    if(!last){setStatus('먼저 구조 비교를 실행해 주세요.');return}
    if(!els.coach)return;
    els.coach.disabled=true;const label=els.coach.textContent;els.coach.textContent='코칭 받는 중';
    try{
      const session=await fetch('/api/v1/session',{credentials:'same-origin',headers:{accept:'application/json'}});
      if(!session.ok)throw new Error('session');
      const csrf=(await session.json()).csrfToken;
      const response=await fetch('/api/v1/ai/benchmark',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','X-CSRF-Token':csrf,accept:'application/json'},body:JSON.stringify({draft:els.draft.value.trim(),gaps:last.gaps.map(gap=>({label:gap.label,hint:gap.hint})),matchScore:last.matchScore,topic:currentTopic()})});
      const payload=await response.json();
      if(response.status===401){setStatus('AI 코칭은 네이버 로그인 후 사용할 수 있어요.');return}
      if(!response.ok||!payload.result||!Array.isArray(payload.result.tips))throw new Error(payload.error||'coach_failed');
      renderCoaching(payload.result);setStatus('내 초안만 근거로 코칭했어요. 기준 글 원문은 전송하지 않았습니다.');
    }catch(error){setStatus('AI 코칭을 불러오지 못했어요. 로컬 구조 비교 결과는 그대로 남아 있어요.')}
    finally{els.coach.disabled=false;els.coach.textContent=label}
  }
  function renderCoaching(result){
    els.coaching.innerHTML='';const heading=document.createElement('h4');heading.textContent='AI 개선 코칭';const overall=document.createElement('p');overall.className='coach-overall';overall.textContent=result.overall;const list=document.createElement('ul');
    result.tips.forEach(tip=>{const item=document.createElement('li');const area=document.createElement('strong');area.textContent=tip.area;const advice=document.createElement('span');advice.textContent=tip.advice;item.append(area,advice);list.append(item)});
    els.coaching.append(heading,overall,list);els.coaching.hidden=false;
  }
  els.run.addEventListener('click',run);
  if(els.coach)els.coach.addEventListener('click',coach);
})();
