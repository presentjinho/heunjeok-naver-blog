(function(){
  'use strict';
  const Assemble=globalThis.HeunjeokAssemble;const Quality=globalThis.HeunjeokQuality;
  const $=id=>document.getElementById(id);
  function currentTopic(){const custom=$('customTopic');if(custom&&custom.value.trim())return custom.value.trim();const status=$('selectedTopicStatus');if(status){const match=status.textContent.match(/주제:\s*(.+)$/);if(match)return match[1].trim()}return''}
  function currentPostType(){const el=$('postType');return el?el.value:'visit'}
  function currentExperience(){const answers={};document.querySelectorAll('[data-experience-key]').forEach(el=>{const value=String(el.value||'').trim();if(value)answers[el.dataset.experienceKey]=value});return answers}
  function hookStyle(){const el=$('improveHook');return el&&['scene','question','contrast','problem','detail'].includes(el.value)?el.value:'scene'}

  // 4단계 조립
  function renderAssemble(result){
    const host=$('assembleResult');if(!host)return;host.innerHTML='';
    result.stages.forEach(stage=>{
      const box=document.createElement('div');box.className='assemble-stage';
      const title=document.createElement('h4');const badge=document.createElement('span');badge.textContent=stage.step;title.append(badge,document.createTextNode(stage.name));box.append(title);
      if(stage.step===3){stage.items.forEach(section=>{const h=document.createElement('p');h.className='heading-label';h.textContent=section.heading;const skel=document.createElement('p');skel.className='section-skel';skel.textContent=section.skeleton;box.append(h,skel)})}
      else if(stage.step===2){const ol=document.createElement('ol');stage.items.forEach(item=>{const li=document.createElement('li');li.textContent=item.heading;ol.append(li)});box.append(ol)}
      else{const ul=document.createElement('ul');stage.items.forEach(item=>{const li=document.createElement('li');li.textContent=item;ul.append(li)});box.append(ul)}
      host.append(box);
    });
    const hook=document.createElement('div');hook.className='hook-candidates';const hookTitle=document.createElement('strong');hookTitle.textContent='도입 훅 후보';const hookHelp=document.createElement('p');hookHelp.textContent=result.hook;const hookList=document.createElement('ul');(result.hookCandidates||[]).forEach(candidate=>{const item=document.createElement('li');item.textContent=candidate;hookList.append(item)});hook.append(hookTitle,hookHelp,hookList);host.append(hook);
    host.hidden=false;
  }
  function runAssemble(){
    if(!Assemble)return;const topic=currentTopic();
    const status=$('assembleStatus');
    if(!topic){if(status)status.textContent='먼저 위에서 주제를 골라주세요.';return}
    const result=Assemble.build({topic,postType:currentPostType(),experienceFields:currentExperience(),hookStyle:hookStyle()});
    if(status)status.textContent='통짜로 쓰지 말고 이 순서대로 채워보세요. 각 소제목에 내 경험을 넣으면 됩니다.';
    renderAssemble(result);
  }

  // 검수 강화
  function draftTitles(){return[...document.querySelectorAll('#titleCandidates li span')].map(el=>el.textContent.trim()).filter(Boolean)}
  const correctionGuide={'mobile-wall':'마침표 기준으로 두 문장씩 끊고 문단 사이를 한 줄 비워보세요.','exaggeration':'평가어를 지우고 언제·어디서·무엇을 확인했는지로 바꿔보세요.','guarantee':'효과 단정 대신 내가 확인한 조건과 개인 경험 범위를 적으세요.','template':'상투적인 첫 문장을 지우고 실제 장면이나 독자 질문으로 바로 시작하세요.','ad-push':'구매 유도 문장을 빼고 필요한 사람과 맞지 않는 사람을 함께 적으세요.','experience-ratio':'보고·듣고·사용한 장면 하나와 그때 든 판단을 한 문장씩 추가하세요.','clickbait-title':'과장어를 빼고 장소·제품·경험·핵심 차이 중 두 가지를 제목에 넣으세요.','conclusion-first':'결론은 두 번째 문단으로 옮기고 첫 문단을 장면이나 질문으로 바꾸세요.'};
  function renderQuality(result){
    const host=$('qualityList');if(!host)return;host.innerHTML='';
    if(!result.issues.length){const li=document.createElement('li');li.className='is-clear';li.innerHTML='<strong>정해진 패턴에서 경고 없음</strong>정한 저품질·AI티 패턴에서는 걸리는 게 없어요. 내용의 진솔함이 관건입니다.';host.append(li)}
    else result.issues.forEach(issue=>{const li=document.createElement('li');li.className='sev-'+issue.severity;const t=document.createElement('strong');t.textContent=issue.title;const d=document.createElement('span');d.textContent=issue.detail;li.append(t,d);if(issue.snippet){const c=document.createElement('code');c.textContent=issue.snippet;li.append(c)}const guide=correctionGuide[issue.code];if(guide){const action=document.createElement('em');action.className='correction-action';action.textContent='고치는 법 · '+guide;li.append(action)}host.append(li)});
    const good=$('qualityGood');if(good)good.textContent=result.goodSignals.length?'잘된 점: '+result.goodSignals.join(' · '):'';
    const stats=$('qualityStats');if(stats)stats.textContent=`문단 ${result.stats.paragraphs} · 경험문장 ${result.stats.experientialSentences}/${result.stats.totalSentences} · 글자벽 ${result.stats.longWalls}`;
    const advice=$('correctionAdvice');const count=$('correctionCount');if(advice){advice.innerHTML='';(result.sentenceAdvice||[]).forEach(item=>{const li=document.createElement('li');const before=document.createElement('q');before.textContent=item.text;const tip=document.createElement('span');tip.textContent=item.advice;li.append(before,tip);advice.append(li)});if(!(result.sentenceAdvice||[]).length){const li=document.createElement('li');li.textContent='문장별 경고가 없습니다. 사실·가격·최신 정보는 직접 확인해 주세요.';advice.append(li)}}if(count)count.textContent=(result.sentenceAdvice||[]).length+'개';const preview=$('correctionPreview');if(preview)preview.value=result.correction?.text||'';
    const wrap=$('qualityResult');if(wrap)wrap.hidden=false;
  }
  function runQuality(){
    if(!Quality)return;const draft=$('draft');const status=$('qualityStatus');
    const text=draft?draft.value.trim():'';
    if(text.length<20){if(status)status.textContent='먼저 위에서 초안을 만들어 주세요. 검수할 본문이 필요해요.';return}
    if(status)status.textContent='점수가 아니라 고칠 항목만 보여줘요. 노출·순위는 판정하지 않습니다.';
    renderQuality(Quality.audit(text,{titles:draftTitles(),hookStyle:hookStyle()}));
  }

  const assembleBtn=$('runAssemble');if(assembleBtn&&Assemble)assembleBtn.addEventListener('click',runAssemble);
  const qualityBtn=$('runQuality');if(qualityBtn&&Quality)qualityBtn.addEventListener('click',runQuality);
  const applyBtn=$('applyCorrection');if(applyBtn)applyBtn.addEventListener('click',()=>{const draft=$('draft');const preview=$('correctionPreview');if(!draft||!preview||!preview.value.trim())return;if(!confirm('현재 초안을 안전 교정본으로 바꿀까요? 적용 뒤에도 대괄호와 사실을 직접 확인해야 합니다.'))return;draft.value=preview.value;draft.dispatchEvent(new Event('input',{bubbles:true}));const status=$('qualityStatus');if(status)status.textContent='교정본을 초안에 적용했어요. 대괄호와 사실을 확인한 뒤 다시 검수하세요.';draft.scrollIntoView({behavior:'smooth',block:'center'})});
  const copyBtn=$('copyCorrection');if(copyBtn)copyBtn.addEventListener('click',async()=>{const preview=$('correctionPreview');const status=$('qualityStatus');if(!preview||!preview.value.trim())return;try{await navigator.clipboard.writeText(preview.value);if(status)status.textContent='교정본을 복사했어요. 대괄호와 사실을 확인해 주세요.'}catch{preview.focus();preview.select();if(status)status.textContent='자동 복사가 막혔어요. 선택된 교정본을 직접 복사해 주세요.'}});
})();
