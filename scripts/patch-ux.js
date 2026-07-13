const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
let s = fs.readFileSync(path.join(root, 'product-v2.js'), 'utf8');

const makeNeedle =
  "const make=(tag,attrs={},text='')=>{const el=d.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='class')el.className=v;else if(k==='dataset')Object.assign(el.dataset,v);else el.setAttribute(k,v)}if(text)el.textContent=text;return el};";

if (!s.includes('function prefersReduced') && !s.includes('const prefersReduced')) {
  if (!s.includes(makeNeedle)) throw new Error('make() needle missing');
  s = s.replace(
    makeNeedle,
    makeNeedle +
      "\n  const prefersReduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return false}};\n  const smoothScroll=el=>{if(!el)return;try{el.scrollIntoView({behavior:prefersReduced()?'auto':'smooth',block:'start'})}catch{el.scrollIntoView(true)}};\n  const focusedExperienceField=()=>{const a=d.activeElement;if(a&&a.matches&&a.matches('#experienceFields textarea,#moreExperienceFields textarea,#memo'))return a;return essentialFields()[0]};"
  );
}

s = s.replace(/\$\(([^)]+)\)\?\.scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/g, 'smoothScroll($($1))');
s = s.replace(/\$\(([^)]+)\)\.scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/g, 'smoothScroll($($1))');
s = s.replace(/\$\(targets\[i\]\)\?\.scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/g, 'smoothScroll($(targets[i]))');
s = s.replace(/\$\(id\)\?\.scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/g, 'smoothScroll($(id))');
s = s.replace(
  /\$\(ready\?'experience-tool':'topicSection'\)\.scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/g,
  "smoothScroll($(ready?'experience-tool':'topicSection'))"
);

const advancedOld =
  "function advanced(){const sections=[q('[aria-labelledby=\"comment-title\"]'),$('live-research'),q('[aria-labelledby=\"benchmark-title\"]'),q('[aria-labelledby=\"postlog-title\"]')].filter(Boolean);if(!sections.length)return;const details=make('details',{class:'advanced-tools'});const summary=make('summary',{},'발행 후·참고 도구 더 보기');const body=make('div',{class:'advanced-tools-body'});details.append(summary,body);sections[0].parentElement.insertBefore(details,sections[0]);sections.forEach(section=>body.append(section));q('.live-category-grid')?.removeAttribute('style')}";

const advancedNew =
  "function advanced(){const postlog=q('[aria-labelledby=\"postlog-title\"]');if(!postlog||postlog.closest('details')||postlog.dataset.folded)return;const details=make('details',{class:'advanced-tools'});const summary=make('summary',{},'발행 기록 더 보기');const body=make('div',{class:'advanced-tools-body'});details.append(summary,body);postlog.parentElement.insertBefore(details,postlog);body.append(postlog)}";

if (s.includes(advancedOld)) s = s.replace(advancedOld, advancedNew);
else if (!s.includes('발행 기록 더 보기')) {
  // looser match
  const m = s.match(/function advanced\(\)\{[\s\S]*?\n  function onboarding/);
  if (!m) throw new Error('advanced() block not found');
  s = s.replace(m[0], advancedNew + '\n  function onboarding');
}

s = s.replace(
  "const field=essentialFields()[0];field.value=[field.value,value].filter(Boolean).join(' ');field.dispatchEvent(new Event('input',{bubbles:true}))",
  "const field=focusedExperienceField()||essentialFields()[0];if(!field)return;field.value=[field.value,value].filter(Boolean).join(' ');field.focus();field.dispatchEvent(new Event('input',{bubbles:true}))"
);

s = s.replace(
  "if(quote){const index=draft.value.indexOf(quote.slice(0,30));if(index>=0){draft.focus();draft.setSelectionRange(index,index+quote.length);draft.classList.add('focus-flash');setTimeout(()=>draft.classList.remove('focus-flash'),1300)}}",
  "if(quote){const index=draft.value.indexOf(quote.slice(0,30));if(index>=0){draft.focus();draft.setSelectionRange(index,index+quote.length);draft.classList.add('focus-flash');setTimeout(()=>draft.classList.remove('focus-flash'),1300)}else showCopyStatus('본문에서 해당 문장을 찾지 못했어요. 이미 고쳤을 수 있어요.',false)}"
);

const benchOld =
  "run.addEventListener('click',()=>setTimeout(()=>{const gaps=$('benchmarkGaps');[...gaps.children].slice(3).forEach(item=>item.hidden=true);if(gaps.children.length)gaps.insertAdjacentElement('beforebegin',make('strong',{},'우선 고칠 3가지'))},0))}";
const benchNew =
  "run.addEventListener('click',()=>setTimeout(()=>{const gaps=$('benchmarkGaps');const extras=[...gaps.children].slice(3);extras.forEach(item=>item.hidden=true);gaps.parentElement.querySelector('.benchmark-more')?.remove();if(gaps.children.length){const prev=gaps.previousElementSibling;if(!prev||prev.tagName!=='STRONG')gaps.insertAdjacentElement('beforebegin',make('strong',{},'우선 고칠 3가지'))}if(extras.length){const more=make('button',{type:'button',class:'text-button benchmark-more'},`나머지 ${extras.length}개 보기`);more.addEventListener('click',()=>{extras.forEach(item=>item.hidden=false);more.remove()});gaps.insertAdjacentElement('afterend',more)}},0))}";
if (s.includes(benchOld)) s = s.replace(benchOld, benchNew);

if (!s.includes('function publishChecklist')) {
  s = s.replace(
    'function emptyAction(){',
    "function publishChecklist(){const fieldset=$('publish-tool');if(!fieldset||fieldset.querySelector('.optional-checks'))return;const labels=[...fieldset.querySelectorAll('label')].filter(l=>l.querySelector('input[name=\"publishCheck\"]'));if(labels.length<=4)return;const box=make('details',{class:'optional-checks'});box.append(make('summary',{},'선택 확인 · 네이버 설정'));labels.slice(4).forEach(label=>box.append(label));const progress=$('checkProgress');if(progress)fieldset.insertBefore(box,progress);else fieldset.append(box)}\n  function emptyAction(){"
  );
  s = s.replace(
    'function init(){runtimeBanner();quickRoute();simplifyFlow();wizard();mobileTabs();advanced();',
    'function init(){runtimeBanner();quickRoute();simplifyFlow();wizard();mobileTabs();advanced();publishChecklist();'
  );
}

// copy lock click feedback for disabled controls — delegated once
if (!s.includes('function copyDisabledClicks')) {
  s = s.replace(
    'function copyStatus(){',
    "function copyDisabledClicks(){d.addEventListener('click',event=>{const button=event.target.closest('.copy-control');if(!button||button.getAttribute('aria-disabled')!=='true')return;event.preventDefault();const reason=$('copyLockReason')?.textContent.trim()||'지금 결과는 복사할 수 없어요. 사유를 확인한 뒤 다시 만들어 주세요.';showCopyStatus(reason,true)})}\n  function copyStatus(){"
  );
  s = s.replace('copyStatus();resultTabs();', 'copyStatus();copyDisabledClicks();resultTabs();');
}

fs.writeFileSync(path.join(root, 'product-v2.js'), s);
console.log({
  smooth: s.includes('smoothScroll'),
  publish: s.includes('publishChecklist'),
  focused: s.includes('focusedExperienceField'),
  advanced: s.includes('발행 기록 더 보기'),
  bench: s.includes('benchmark-more'),
  copyDis: s.includes('copyDisabledClicks'),
});
