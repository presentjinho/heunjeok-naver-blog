(function(){
  'use strict';
  // 부가 도구 스크립트는 이미 defer로 뒤쪽에 두되, 첫 상호작용 전 idle에 실행 부담을 줄이기 위해
  // 네트워크 로드는 유지하고 무거운 초기 UI는 도구 탭/품질 버튼에서 깨운다.
  const ready=()=>window.dispatchEvent(new CustomEvent('heunjeok:tools-ready'));
  if('requestIdleCallback'in window)requestIdleCallback(()=>ready(),{timeout:2500});
  else setTimeout(ready,1200);
  document.addEventListener('click',function once(e){
    if(e.target.closest('#quality-tool,.mobile-tabs,.wizard-nav,.advanced-tools,.folded-tool')){
      ready();document.removeEventListener('click',once);
    }
  },true);
})();
