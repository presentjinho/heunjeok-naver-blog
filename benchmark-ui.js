(function(){
  'use strict';
  const Benchmark=globalThis.HeunjeokBenchmark;
  if(!Benchmark)return;
  const $=id=>document.getElementById(id);
  const els={reference:$('benchmarkReference'),run:$('benchmarkRun'),status:$('benchmarkStatus'),result:$('benchmarkResult'),score:$('benchmarkScore'),gaps:$('benchmarkGaps'),strengths:$('benchmarkStrengths'),draft:$('draft')};
  if(!els.reference||!els.run||!els.draft)return;
  let last=null;
  function currentTopic(){const custom=$('customTopic');if(custom&&custom.value.trim())return custom.value.trim();const status=$('selectedTopicStatus');if(status){const match=status.textContent.match(/주제:\s*(.+)$/);if(match)return match[1].trim()}return''}
  function setStatus(message){els.status.textContent=message||'';els.status.hidden=false;const host=els.run.closest('details');if(host)host.open=true;try{els.status.scrollIntoView({block:'nearest'})}catch{}}
  function crossAction(){
    if($('benchmarkCross'))return;
    const row=document.createElement('div');row.id='benchmarkCross';row.className='improve-controls';
    const q=document.createElement('button');q.type='button';q.className='secondary';q.textContent='이 초안 저품질 검수로 이어가기';
    q.addEventListener('click',()=>{const t=$('quality-title');if(t)t.scrollIntoView({behavior:'smooth',block:'center'});const run=$('runQuality');if(run)run.click()});
    row.append(q);els.result.append(row);
  }
  function render(result){
    els.gaps.innerHTML='';els.strengths.innerHTML='';
    els.score.textContent=result.matchScore+'%';
    if(result.gaps.length===0){const item=document.createElement('li');item.className='is-clear';item.innerHTML='<strong>구조가 기준 글과 잘 맞아요</strong><span>큰 구조 차이는 발견되지 않았어요. 내용의 진솔함이 관건입니다.</span>';els.gaps.append(item)}
    else result.gaps.forEach(gap=>{const item=document.createElement('li');const title=document.createElement('strong');title.textContent=gap.label+' 보완';const detail=document.createElement('span');detail.textContent=gap.hint;const meta=document.createElement('div');const reference=document.createElement('b');const draft=document.createElement('b');reference.textContent=String(gap.reference);draft.textContent=String(gap.draft);meta.append('기준 ',reference,' · 내 초안 ',draft);item.append(title,detail,meta);els.gaps.append(item)});
    result.strengths.slice(0,5).forEach(strength=>{const item=document.createElement('li');item.textContent='잘 지킨 항목: '+strength.label;els.strengths.append(item)});
    els.result.hidden=false;crossAction();
  }
  function run(){
    const reference=els.reference.value.trim();const draft=els.draft.value.trim();
    if(reference.length<40){setStatus('기준 글을 40자 이상 붙여넣어 주세요.');els.reference.focus({preventScroll:true});return}
    if(draft.length<20){setStatus('먼저 초안을 만들어 주세요. (위자드 3단계 초안 또는 「내 경험으로 초안 만들기」) 비교할 내 본문이 20자 이상 필요해요.');return}
    const result=Benchmark.compare(reference,draft,{topic:currentTopic()});
    if(!result.ok){setStatus(result.error==='reference_too_short'?'기준 글이 너무 짧아요.':'비교할 내 본문이 너무 짧아요.');return}
    last=result;setStatus('기준 글 원문은 저장하지 않았어요. 구조 지표만 대조했습니다.');render(result);
  }
  els.run.addEventListener('click',run);
})();
