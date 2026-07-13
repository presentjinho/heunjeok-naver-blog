const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

// 1) CSS: stop hiding structure compare / postlog in wizard mode
{
  const file = path.join(root, 'product-v2.css');
  let css = fs.readFileSync(file, 'utf8');
  const bad =
    'body.wizard-step-mode .advanced-tools,body.wizard-step-mode .folded-tool,body.wizard-step-mode [aria-labelledby="data-title"]{display:none}\nbody.wizard-step-mode[data-wizard-step="3"] .folded-tool,body.wizard-step-mode[data-wizard-step="3"] .advanced-tools{display:block}\nbody.wizard-step-mode[data-wizard-step="4"] [aria-labelledby="data-title"]{display:block}';
  const good =
    '/* 부가 도구(구조 비교·발행 기록 등)는 위자드 단계와 무관하게 항상 노출 — 숨기면 버튼이 죽은 것처럼 보임 */\nbody.wizard-step-mode [aria-labelledby="data-title"]{display:none}\nbody.wizard-step-mode[data-wizard-step="4"] [aria-labelledby="data-title"],body.wizard-step-mode[data-wizard-step="3"] [aria-labelledby="data-title"]{display:block}\nbody.wizard-step-mode .folded-tool,body.wizard-step-mode .advanced-tools{display:block}\nbody.wizard-step-mode .wizard-tools-note{margin:8px 0 0;font-size:12px;color:#5d7065}';
  if (css.includes(bad)) {
    css = css.replace(bad, good);
    console.log('css: replaced hide rules');
  } else if (css.includes('부가 도구(구조 비교')) {
    console.log('css: already fixed');
  } else {
    // append safety override
    css += '\n' + good + '\n';
    console.log('css: appended override');
  }
  fs.writeFileSync(file, css);
}

// 2) product-v2 benchmarkGuard: don't hard-disable run
{
  const file = path.join(root, 'product-v2.js');
  let s = fs.readFileSync(file, 'utf8');
  const old =
    "function benchmarkGuard(){const reference=$('benchmarkReference'),run=$('benchmarkRun');const label=make('label',{class:'storage-note'});const check=make('input',{type:'checkbox',id:'benchmarkRights'});label.append(check,d.createTextNode(' 내 글 또는 구조를 비교할 권리가 있는 글만 붙여넣었습니다.'));reference.insertAdjacentElement('afterend',label);run.disabled=true;check.addEventListener('change',()=>run.disabled=!check.checked);const notice=make('p',{class:'storage-note'},'구조 유사도는 문단·소제목 배치를 비교할 뿐 조회수·노출을 예측하지 않습니다. 결과에서는 우선 고칠 3가지만 먼저 보세요.');run.parentElement.insertAdjacentElement('afterend',notice);run.addEventListener('click',()=>setTimeout(()=>{const gaps=$('benchmarkGaps');const extras=[...gaps.children].slice(3);extras.forEach(item=>item.hidden=true);gaps.parentElement.querySelector('.benchmark-more')?.remove();if(gaps.children.length){const prev=gaps.previousElementSibling;if(!prev||prev.tagName!=='STRONG')gaps.insertAdjacentElement('beforebegin',make('strong',{},'우선 고칠 3가지'))}if(extras.length){const more=make('button',{type:'button',class:'text-button benchmark-more'},`나머지 ${extras.length}개 보기`);more.addEventListener('click',()=>{extras.forEach(item=>item.hidden=false);more.remove()});gaps.insertAdjacentElement('afterend',more)}},0))}";

  // Replace disabled logic only if present
  if (s.includes("run.disabled=true;check.addEventListener('change',()=>run.disabled=!check.checked)")) {
    s = s.replace(
      "run.disabled=true;check.addEventListener('change',()=>run.disabled=!check.checked);",
      "run.disabled=false;run.removeAttribute('aria-disabled');"
    );
    // intercept click before benchmark-ui if rights not checked - use capture on parent
    if (!s.includes('benchmarkRightsGate')) {
      s = s.replace(
        "const notice=make('p',{class:'storage-note'},'구조 유사도는 문단·소제목 배치를 비교할 뿐 조회수·노출을 예측하지 않습니다. 결과에서는 우선 고칠 3가지만 먼저 보세요.');run.parentElement.insertAdjacentElement('afterend',notice);",
        "const notice=make('p',{class:'storage-note'},'구조 유사도는 문단·소제목 배치를 비교할 뿐 조회수·노출을 예측하지 않습니다. 결과에서는 우선 고칠 3가지만 먼저 보세요.');run.parentElement.insertAdjacentElement('afterend',notice);run.addEventListener('click',function benchmarkRightsGate(event){const box=$('benchmarkRights');if(box&&!box.checked){event.preventDefault();event.stopImmediatePropagation();const st=$('benchmarkStatus');if(st){st.textContent='비교하려면 위 권리 확인 칸에 체크해 주세요.';st.focus?.()}else showCopyStatus('비교하려면 권리 확인 칸에 체크해 주세요.',true);box.focus();}},true);"
      );
    }
    console.log('benchmarkGuard: enable button + rights gate on click');
  } else {
    console.log('benchmarkGuard pattern missing or already fixed');
  }

  // wizard note under nav
  if (!s.includes('wizard-tools-note') && s.includes('function wizardStepMode')) {
    s = s.replace(
      "if(nav&&!nav.querySelector('.wizard-next')){",
      "if(nav&&!q('.wizard-tools-note')){const note=make('p',{class:'wizard-tools-note'},'구조 비교·발행 기록·댓글 도구는 아래 접힌 칸에서 언제든 펼칠 수 있어요.');nav.insertAdjacentElement('afterend',note)}if(nav&&!nav.querySelector('.wizard-next')&&!q('#wizardNext')){"
    );
    console.log('wizard tools note added');
  }

  fs.writeFileSync(file, s);
}

// 3) postlog-ui: better feedback + auto topic from draft + scroll status into view
{
  const file = path.join(root, 'postlog-ui.js');
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes('function flashStatus')) {
    s = s.replace(
      'function setStatus(message){if(els.status)els.status.textContent=message||\'\'}',
      "function setStatus(message){if(els.status){els.status.textContent=message||'';els.status.hidden=false;try{els.status.scrollIntoView({block:'nearest',behavior:'smooth'})}catch{}}}function flashStatus(message){setStatus(message);if(typeof window!=='undefined'&&window.console)console.info('[postlog]',message)}"
    );
    s = s.replace(/setStatus\(/g, 'flashStatus(');
    // fix double flashStatus rename of function definition - careful
    s = s.replace('function flashStatus(message){flashStatus(message)', 'function flashStatus(message){setStatus(message)');
    // Actually I made a mess - rewrite setStatus properly
  }
  // rewrite cleanly
  s = fs.readFileSync(file, 'utf8');
  s = s.replace(
    'function setStatus(message){if(els.status)els.status.textContent=message||\'\'}',
    "function setStatus(message){if(!els.status)return;els.status.hidden=false;els.status.textContent=message||'';els.status.setAttribute('role','status');try{els.status.scrollIntoView({block:'nearest'})}catch{}}"
  );
  // improve add() topic fallback
  s = s.replace(
    "const topic=(els.topic&&els.topic.value.trim())||currentTopic();",
    "const topic=(els.topic&&els.topic.value.trim())||firstTitle()||currentTopic();"
  );
  // open advanced/fold parent when adding fails
  s = s.replace(
    "if(!created.ok){setStatus('발행한 글의 주제를 2자 이상 적어주세요.');if(els.topic)els.topic.focus({preventScroll:true});return}",
    "if(!created.ok){const host=els.add.closest('details');if(host)host.open=true;setStatus('발행한 글의 주제를 2자 이상 적어주세요. (제목 후보나 주제를 먼저 고르면 자동으로 채워져요)');if(els.topic){els.topic.focus({preventScroll:true});els.topic.placeholder='예: 성수동 카페 방문 후기'}return}"
  );
  s = s.replace(
    "if(!write(Log.addEntry(read(),created.value))){setStatus('브라우저 저장이 차단돼 기록하지 못했어요.');return}",
    "if(!write(Log.addEntry(read(),created.value))){const host=els.add.closest('details');if(host)host.open=true;setStatus('브라우저 저장이 차단돼 기록하지 못했어요. 시크릿 모드인지 확인해 주세요.');return}"
  );
  // open details on successful render area
  s = s.replace(
    "setStatus('발행 기록을 이 브라우저에만 저장했어요. 7일 뒤 성과를 직접 입력해 주세요.');render();",
    "const host=els.add.closest('details');if(host)host.open=true;setStatus('발행 기록을 이 브라우저에만 저장했어요. 7일 뒤 성과를 직접 입력해 주세요.');render();"
  );
  fs.writeFileSync(file, s);
  console.log('postlog-ui feedback improved');
}

// 4) benchmark-ui: clearer status when draft empty; open parent details
{
  const file = path.join(root, 'benchmark-ui.js');
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(
    "function setStatus(message){els.status.textContent=message||''}",
    "function setStatus(message){els.status.textContent=message||'';els.status.hidden=false;const host=els.run.closest('details');if(host)host.open=true;try{els.status.scrollIntoView({block:'nearest'})}catch{}}"
  );
  s = s.replace(
    "if(draft.length<20){setStatus('먼저 위에서 초안을 만들어 주세요. 비교할 내 본문이 필요해요.');return}",
    "if(draft.length<20){setStatus('먼저 초안을 만들어 주세요. (위자드 3단계 초안 또는 「내 경험으로 초안 만들기」) 비교할 내 본문이 20자 이상 필요해요.');return}"
  );
  fs.writeFileSync(file, s);
  console.log('benchmark-ui status improved');
}

console.log('done');
