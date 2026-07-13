const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

// Clean index.html + clearer benchmark copy + buttons
{
  let buf = fs.readFileSync(path.join(root, 'index.html'));
  let t = Buffer.from(buf).filter((b) => b !== 0).toString('utf8');

  t = t.replace(
    '잘 나온 글과 내 초안의 구조를 맞춰봐요.',
    '잘 나온 글과 구조를 비교해요.'
  );
  t = t.replace(
    '기준으로 삼을 글(내가 쓴 인기 글 등 사용할 권리가 있는 글)을 붙여넣으면 분량·문단·소제목·질문·마무리 유도 같은 구조를 내 초안과 대조합니다. 기준 글 원문은 저장·전송하지 않고 지표만 계산하며, 남의 글을 그대로 옮겨오는 기능이 아닙니다.',
    '<strong>글을 자동으로 불러오지 않습니다.</strong> 네이버에서 본문 텍스트를 직접 복사해 붙여넣으세요. 분량·문단·소제목 같은 구조만 대조하고, 원문은 저장·전송하지 않습니다. 사용할 권리가 있는 글만 넣어 주세요.'
  );
  t = t.replace(
    '기준 글 붙여넣기 <small>최소 40자</small>',
    '기준 글 붙여넣기 <small>최소 40자 · URL 자동 불러오기 없음</small>'
  );
  t = t.replace(
    'placeholder="조회수가 잘 나온 글을 붙여넣어 주세요. 원문은 저장하지 않습니다."',
    'placeholder="네이버 글 본문을 여기에 붙여넣기 (Ctrl+V). 링크만 넣으면 동작하지 않습니다."'
  );
  if (!t.includes('id="benchmarkPaste"')) {
    t = t.replace(
      '<div class="action-row stack-mobile"><button id="benchmarkRun" class="primary" type="button">내 초안과 구조 비교</button></div>',
      '<div class="action-row stack-mobile"><button id="benchmarkPaste" class="secondary" type="button">클립보드에서 붙여넣기</button><button id="benchmarkOpenSearch" class="secondary" type="button">네이버에서 참고 글 찾기</button><button id="benchmarkRun" class="primary" type="button">내 초안과 구조 비교</button></div>'
    );
  }
  fs.writeFileSync(path.join(root, 'index.html'), t, 'utf8');
  console.log('index', t.includes('benchmarkPaste'), t.includes('자동으로 불러오지'));
}

// benchmark-ui.js helpers
{
  const file = path.join(root, 'benchmark-ui.js');
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes('pasteFromClipboard')) {
    s = s.replace(
      "els.run.addEventListener('click',run);\n})();",
      `async function pasteFromClipboard(){
    try{
      if(!navigator.clipboard||!navigator.clipboard.readText){setStatus('이 브라우저에서는 클립보드 읽기를 지원하지 않아요. 칸을 길게 눌러 붙여넣기 해 주세요.');els.reference.focus({preventScroll:true});return}
      const text=(await navigator.clipboard.readText()).trim();
      if(!text){setStatus('클립보드가 비어 있어요. 네이버 글 본문을 먼저 복사해 주세요.');return}
      if(/^https?:\\/\\//i.test(text)&&text.length<120&&!/\\s/.test(text)){setStatus('링크만으로는 불러올 수 없어요. 네이버에서 본문 전체를 복사해 붙여넣어 주세요.');return}
      els.reference.value=text;els.reference.dispatchEvent(new Event('input',{bubbles:true}));
      setStatus('클립보드 내용을 붙여넣었어요. 초안이 있으면 구조 비교를 눌러 주세요. (원문 저장 안 함)');
    }catch{setStatus('클립보드 권한이 막혔어요. 칸을 길게 눌러 직접 붙여넣기 해 주세요.');els.reference.focus({preventScroll:true})}
  }
  function openSearch(){
    const topic=currentTopic()||'블로그 후기';
    const url='https://search.naver.com/search.naver?where=blog&query='+encodeURIComponent(topic)+'&sort=date';
    window.open(url,'_blank','noopener,noreferrer');
    setStatus('네이버 검색을 열었어요. 본문을 복사한 뒤 돌아와 붙여넣기 하세요. URL만 넣으면 동작하지 않아요.');
  }
  const pasteBtn=$('benchmarkPaste');if(pasteBtn)pasteBtn.addEventListener('click',pasteFromClipboard);
  const openBtn=$('benchmarkOpenSearch');if(openBtn)openBtn.addEventListener('click',openSearch);
  els.run.addEventListener('click',run);
})();`
    );
    fs.writeFileSync(file, s);
    console.log('benchmark-ui patched');
  } else console.log('benchmark-ui already has paste');
}
