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
    const hook=document.createElement('p');hook.className='improve-status';hook.textContent='도입 힌트 · '+result.hook;host.append(hook);
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
  function renderQuality(result){
    const host=$('qualityList');if(!host)return;host.innerHTML='';
    if(!result.issues.length){const li=document.createElement('li');li.className='is-clear';li.innerHTML='<strong>정해진 패턴에서 경고 없음</strong>정한 저품질·AI티 패턴에서는 걸리는 게 없어요. 내용의 진솔함이 관건입니다.';host.append(li)}
    else result.issues.forEach(issue=>{const li=document.createElement('li');li.className='sev-'+issue.severity;const t=document.createElement('strong');t.textContent=issue.title;const d=document.createElement('span');d.textContent=issue.detail;li.append(t,d);if(issue.snippet){const c=document.createElement('code');c.textContent=issue.snippet;li.append(c)}host.append(li)});
    const good=$('qualityGood');if(good)good.textContent=result.goodSignals.length?'잘된 점: '+result.goodSignals.join(' · '):'';
    const stats=$('qualityStats');if(stats)stats.textContent=`문단 ${result.stats.paragraphs} · 경험문장 ${result.stats.experientialSentences}/${result.stats.totalSentences} · 글자벽 ${result.stats.longWalls}`;
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
})();
