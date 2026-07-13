const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'app.js');
let app = fs.readFileSync(file, 'utf8');

if (!app.includes('function isPublicRuntime')) {
  const needle = 'const Photos=globalThis.HeunjeokPhotos;';
  if (!app.includes(needle)) throw new Error('Photos needle missing');
  app = app.replace(
    needle,
    needle +
      "\n  function isPublicRuntime(){return location.protocol==='file:'||/\\.github\\.io$/i.test(location.hostname)||globalThis.__HEUNJEOK_RUNTIME__==='pages'}\n  function publicApiBlocked(){if(!isPublicRuntime())return false;toast('이 공개판에서는 서버 기능을 쓰지 않아요. 로컬 초안만 사용합니다.');return true}"
  );
}

app = app.replace(
  "async function ensureSession(){if(location.protocol==='file:')throw new Error('server_required');",
  "async function ensureSession(){if(isPublicRuntime())throw new Error('server_required');"
);

if (!app.includes('if(publicApiBlocked())return;')) {
  app = app.replace(
    "async function loadTrend(){const keyword=String(state.topic||els.customTopic.value||'').trim();if(keyword.length<2){toast('먼저 확인할 주제를 골라주세요.');return}",
    "async function loadTrend(){const keyword=String(state.topic||els.customTopic.value||'').trim();if(keyword.length<2){toast('먼저 확인할 주제를 골라주세요.');return}if(publicApiBlocked())return;"
  );
  app = app.replace(
    "async function loadKeywords(){const keyword=String(state.topic||els.customTopic.value||'').trim();if(keyword.length<2){toast('먼저 확인할 주제를 골라주세요.');return}",
    "async function loadKeywords(){const keyword=String(state.topic||els.customTopic.value||'').trim();if(keyword.length<2){toast('먼저 확인할 주제를 골라주세요.');return}if(publicApiBlocked())return;"
  );
}

app = app.replace(
  "async function refreshSearchAdsStatus(){if(location.protocol==='file:'||!state.csrfToken)return;",
  "async function refreshSearchAdsStatus(){if(isPublicRuntime()||!state.csrfToken)return;"
);

app = app.replace(
  "function toast(message){clearTimeout(state.toastTimer);els.toast.textContent=message;els.toast.classList.add('is-visible');state.toastTimer=setTimeout(()=>els.toast.classList.remove('is-visible'),2600)}",
  "function toast(message){clearTimeout(state.toastTimer);els.toast.textContent=message;els.toast.classList.add('is-visible');els.toast.setAttribute('role','status');state.toastTimer=setTimeout(()=>els.toast.classList.remove('is-visible'),3400)}"
);

fs.writeFileSync(file, app);
console.log({
  public: app.includes('isPublicRuntime'),
  blocked: app.includes('publicApiBlocked'),
  toast: app.includes('3400'),
});
