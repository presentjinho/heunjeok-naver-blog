(function(){
  'use strict';
  const Log=globalThis.HeunjeokPostLog;
  if(!Log)return;
  const KEY='heunjeok-postlog';
  const $=id=>document.getElementById(id);
  const els={topic:$('logTopic'),platform:$('logPlatform'),role:$('logRole'),keywords:$('logKeywords'),url:$('logUrl'),note:$('logNote'),add:$('logAdd'),status:$('logStatus'),summary:$('logSummary'),followup:$('logFollowup'),list:$('logList')};
  if(!els.add||!els.list)return;
  function read(){try{return Log.normalizeLog(localStorage.getItem(KEY))}catch{return[]}}
  function write(list){try{localStorage.setItem(KEY,JSON.stringify(list));return true}catch{return false}}
  function currentTopic(){const custom=$('customTopic');if(custom&&custom.value.trim())return custom.value.trim();const status=$('selectedTopicStatus');if(status){const m=status.textContent.match(/주제:\s*(.+)$/);if(m)return m[1].trim()}return''}
  function currentHashtags(){const el=$('hashtags');if(!el)return'';return el.textContent.split(/\s+/).map(t=>t.replace(/^#/,'').trim()).filter(Boolean).slice(0,10).join(', ')}
  function firstTitle(){const el=document.querySelector('#titleCandidates li span');return el?el.textContent.trim():''}
  function fmtDate(ms){try{return new Date(ms).toLocaleDateString('ko-KR',{year:'2-digit',month:'2-digit',day:'2-digit'})}catch{return''}}
  function num(n){return typeof n==='number'?n.toLocaleString('ko-KR'):'-'}
  function setStatus(message){if(els.status)els.status.textContent=message||''}
  function pull(){
    const topic=firstTitle()||currentTopic();
    if(els.topic&&topic)els.topic.value=topic;
    const kw=currentHashtags();if(els.keywords&&kw)els.keywords.value=kw;
    const pt=$('postType');if(els.role&&pt){/* leave role as-is */}
    setStatus('현재 작업 중인 초안의 제목·해시태그를 불러왔어요. 발행한 뒤 기록을 저장하세요.');
    if(els.topic)els.topic.focus({preventScroll:true});
  }
  function render(){
    const list=read();
    if(els.summary){const s=Log.summarize(list);els.summary.innerHTML='';[`기록 ${s.total}편`,`성과 입력 ${s.recorded}편`,s.avgViews!==null?`평균 조회 ${num(s.avgViews)}`:'평균 조회 –',`수익 ${s.byRole['수익']} · 일상 ${s.byRole['일상']} · 포폴 ${s.byRole['포트폴리오']}`].forEach(text=>{const chip=document.createElement('span');chip.textContent=text;els.summary.append(chip)})}
    if(els.followup){const due=Log.dueForFollowup(list);els.followup.hidden=due.length===0;if(due.length)els.followup.textContent=`발행 7일이 지난 글 ${due.length}편의 조회수·유입을 직접 입력하면 내 성과 기록이 쌓여요.`}
    els.list.innerHTML='';
    const now=Date.now();
    list.forEach(entry=>{
      const item=document.createElement('li');item.className='postlog-item';
      const due=!entry.metrics&&(now-entry.publishedAt)>=Log.FOLLOWUP_DAYS*86400000;if(due)item.classList.add('is-due');
      const head=document.createElement('div');head.className='postlog-item-head';
      const title=document.createElement('strong');title.textContent=entry.topic;
      const role=document.createElement('span');role.className='postlog-role';role.textContent=`${entry.platform==='x'?'X':entry.platform==='both'?'네이버+X':'네이버'} · ${entry.role}`;
      head.append(title,role);item.append(head);
      const meta=document.createElement('p');meta.className='postlog-meta';meta.textContent=fmtDate(entry.publishedAt)+(entry.postType?' · '+entry.postType:'');item.append(meta);
      if(entry.keywords.length){const kw=document.createElement('div');kw.className='postlog-keywords';entry.keywords.forEach(k=>{const s=document.createElement('span');s.textContent='#'+k;kw.append(s)});item.append(kw)}
      const metrics=document.createElement('div');metrics.className='postlog-metrics';
      const viewsInput=document.createElement('input');viewsInput.type='text';viewsInput.inputMode='numeric';viewsInput.placeholder='조회수';viewsInput.setAttribute('aria-label',entry.topic+' 조회수');viewsInput.value=entry.metrics&&entry.metrics.views!==null?String(entry.metrics.views):'';
      const inflowInput=document.createElement('input');inflowInput.type='text';inflowInput.inputMode='numeric';inflowInput.placeholder='유입수';inflowInput.setAttribute('aria-label',entry.topic+' 유입수');inflowInput.value=entry.metrics&&entry.metrics.inflow!==null?String(entry.metrics.inflow):'';
      const save=document.createElement('button');save.type='button';save.className='secondary';save.textContent='성과 저장';
      const impressions=document.createElement('input');impressions.type='text';impressions.inputMode='numeric';impressions.placeholder='노출수(X)';impressions.value=entry.metrics&&entry.metrics.impressions!==null?String(entry.metrics.impressions):'';
      const likes=document.createElement('input');likes.type='text';likes.inputMode='numeric';likes.placeholder='좋아요(X)';likes.value=entry.metrics&&entry.metrics.likes!==null?String(entry.metrics.likes):'';
      const bookmarks=document.createElement('input');bookmarks.type='text';bookmarks.inputMode='numeric';bookmarks.placeholder='북마크(X)';bookmarks.value=entry.metrics&&entry.metrics.bookmarks!==null?String(entry.metrics.bookmarks):'';
      save.addEventListener('click',()=>{const updated=Log.updateMetrics(read(),entry.id,{views:viewsInput.value,inflow:inflowInput.value,impressions:impressions.value,likes:likes.value,bookmarks:bookmarks.value});if(!write(updated)){setStatus('브라우저 저장이 차단돼 성과를 저장하지 못했어요.');return}render();setStatus('직접 입력한 성과를 저장했어요. 조회수는 대신 조회하지 않습니다.')});
      metrics.append(viewsInput,inflowInput);if(entry.platform!=='naver')metrics.append(impressions,likes,bookmarks);metrics.append(save);
      if(entry.metrics&&entry.metrics.recordedAt){const rec=document.createElement('span');rec.className='postlog-recorded';rec.textContent='입력됨';metrics.append(rec)}
      const remove=document.createElement('button');remove.type='button';remove.className='text-button postlog-remove';remove.textContent='삭제';
      remove.addEventListener('click',()=>{if(!confirm('이 발행 기록을 삭제할까요?'))return;if(!write(Log.removeEntry(read(),entry.id))){setStatus('브라우저 저장이 차단돼 기록을 삭제하지 못했어요.');return}render();setStatus('발행 기록을 삭제했어요.')});
      metrics.append(remove);item.append(metrics);
      els.list.append(item);
    });
  }
  function add(){
    const topic=(els.topic&&els.topic.value.trim())||currentTopic();
    const created=Log.createEntry({topic,platform:els.platform?els.platform.value:'naver',role:els.role?els.role.value:'기타',keywords:els.keywords?els.keywords.value:'',url:els.url?els.url.value:'',note:els.note?els.note.value:'',postType:($('postType')&&$('postType').value)||''});
    if(!created.ok){setStatus('발행한 글의 주제를 2자 이상 적어주세요.');if(els.topic)els.topic.focus({preventScroll:true});return}
    if(!write(Log.addEntry(read(),created.value))){setStatus('브라우저 저장이 차단돼 기록하지 못했어요.');return}
    if(els.topic)els.topic.value='';if(els.keywords)els.keywords.value='';if(els.url)els.url.value='';if(els.note)els.note.value='';
    setStatus('발행 기록을 이 브라우저에만 저장했어요. 7일 뒤 성과를 직접 입력해 주세요.');render();
  }
  // 현재 초안 불러오기 버튼을 동적으로 추가
  const pullBtn=document.createElement('button');pullBtn.id='logPull';pullBtn.type='button';pullBtn.className='secondary';pullBtn.textContent='현재 초안 제목·태그 불러오기';pullBtn.addEventListener('click',pull);
  els.add.parentNode.insertBefore(pullBtn,els.add);
  els.add.addEventListener('click',add);
  if(els.topic&&!els.topic.value)els.topic.value=currentTopic();
  render();
})();
