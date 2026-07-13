const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

// improve-ui: remove structure compare cross button
{
  let s = fs.readFileSync(path.join(root, 'improve-ui.js'), 'utf8');
  s = s.replace(
    /const cmp=document\.createElement\('button'\);cmp\.type='button';cmp\.className='secondary';cmp\.textContent='잘 나온 글과 구조 비교';cmp\.addEventListener\('click',\(\)=>\{goto\('benchmark-title'\);const b=\$\('benchmarkReference'\);if\(b\)b\.focus\(\{preventScroll:true\}\)\)\};/,
    ''
  );
  s = s.replace('row.append(cmp,log);', 'row.append(log);');
  fs.writeFileSync(path.join(root, 'improve-ui.js'), s);
  console.log('improve-ui', !s.includes('구조 비교'), s.includes('발행 기록에 저장'));
}

// integration.test.js
{
  const file = path.join(root, 'tests/integration.test.js');
  let t = fs.readFileSync(file, 'utf8');
  t = t.replace(
    /itDom\('구조 비교: 기준 글과 초안을 대조하고 점수·크로스링크를 낸다',[\s\S]*?\n\}\);/,
    `itDom('구조 비교 UI는 메인에서 제거되었다',()=>{
  const html=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
  assert.ok(!html.includes('benchmark-title'));
  assert.ok(!html.includes('benchmarkRun'));
});`
  );
  t = t.replace(
    /itDom\('긴 글\(2500자\)에서 검수·교정·구조비교가 정상 동작한다',[\s\S]*?\n\}\);/,
    `itDom('긴 글(2500자)에서 검수·교정이 정상 동작한다',()=>{
  const d=boot();
  const draft=d.getElementById('draft');
  draft.value=('경험 문장입니다. ').repeat(200);
  d.getElementById('runQuality').click();
  assert.equal(d.getElementById('qualityResult').hidden,false);
});`
  );
  // boot may still load benchmark scripts - ok
  fs.writeFileSync(file, t);
  console.log('integration.test updated');
}

// connections.test.js if any UI benchmark
{
  const file = path.join(root, 'tests/connections.test.js');
  let t = fs.readFileSync(file, 'utf8');
  if (t.includes('구조 비교')) {
    t = t.replace(/test\('검수 결과에서 구조 비교·발행 기록으로 이어지는 크로스링크가 있다'[\s\S]*?\n\}\);/, 
      `test('검수 결과에서 발행 기록으로 이어지는 크로스링크가 있다',()=>{
  const ui=require('fs').readFileSync(require('path').join(__dirname,'..','improve-ui.js'),'utf8');
  assert.match(ui,/발행 기록에 저장/);
  assert.doesNotMatch(ui,/잘 나온 글과 구조 비교/);
});`);
    fs.writeFileSync(file, t);
    console.log('connections.test updated');
  }
}

// fold.test - ensure boot html still has 2+ foldable sections
{
  const file = path.join(root, 'tests/fold.test.js');
  let t = fs.readFileSync(file, 'utf8');
  if (!t.includes('live-research-title')) {
    console.log('fold test unexpected');
  }
  t = t.replace("assert.ok(folded.length>=3,'최소 3개 접힘');", "assert.ok(folded.length>=2,'최소 2개 접힘');");
  fs.writeFileSync(file, t);
}

// product-v2 DOM test file list can still include benchmark - no crash if not in HTML
// a11y loads benchmark files - fine without DOM section

console.log('finish done');
