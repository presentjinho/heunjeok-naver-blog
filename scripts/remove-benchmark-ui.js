const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

// index.html: remove section + assets
{
  let buf = fs.readFileSync(path.join(root, 'index.html'));
  let h = Buffer.from(buf).filter((b) => b !== 0).toString('utf8');
  const marker = 'aria-labelledby="benchmark-title"';
  const i = h.indexOf(marker);
  if (i < 0) {
    console.log('index: section already gone');
  } else {
    const start = h.lastIndexOf('<section', i);
    let depth = 0;
    let end = -1;
    for (let p = start; p < h.length; p++) {
      if (h.startsWith('<section', p)) {
        depth++;
        p += 7;
        continue;
      }
      if (h.startsWith('</section>', p)) {
        depth--;
        if (depth === 0) {
          end = p + '</section>'.length;
          break;
        }
        p += 9;
      }
    }
    if (start < 0 || end < 0) throw new Error('could not find section bounds');
    h = h.slice(0, start) + h.slice(end);
    console.log('index: removed section', start, end);
  }
  h = h.replace(/\s*<script src="\.\/benchmark\.js[^>]*><\/script>/g, '');
  h = h.replace(/\s*<script src="\.\/benchmark-ui\.js[^>]*><\/script>/g, '');
  h = h.replace(/\s*<link rel="stylesheet" href="\.\/benchmark\.css[^>]*>/g, '');
  fs.writeFileSync(path.join(root, 'index.html'), h, 'utf8');
  console.log({
    title: h.includes('benchmark-title'),
    js: h.includes('benchmark.js'),
    css: h.includes('benchmark.css'),
  });
}

// fold-ui: drop benchmark targets
{
  const file = path.join(root, 'fold-ui.js');
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/\s*\['\[aria-labelledby="benchmark-title"\]'[^\]]*\],?/g, '');
  s = s.replace(/\s*\['\[aria-labelledby="benchmark-title"\]'[\s\S]*?\],/g, '');
  // line-based cleanup
  s = s
    .split('\n')
    .filter((line) => !line.includes('benchmark-title') && !line.includes('구조 비교'))
    .join('\n');
  fs.writeFileSync(file, s);
  console.log('fold-ui cleaned', !s.includes('benchmark'));
}

// product-v2: remove benchmarkGuard call and function if possible
{
  const file = path.join(root, 'product-v2.js');
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/benchmarkGuard\(\);?/g, '');
  // remove function benchmarkGuard... up to next function
  s = s.replace(/function benchmarkGuard\(\)\{[\s\S]*?\n  function /m, 'function ');
  // also remove cross-links text if any
  fs.writeFileSync(file, s);
  console.log('product-v2', !s.includes('benchmarkGuard'), !s.includes('benchmarkRun'));
}

// server + pages: keep files for tests/server optional - can leave on disk for unit tests
// remove from pages deploy list and server PUBLIC if present
{
  let pages = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
  pages = pages.replace(' benchmark.js', '');
  pages = pages.replace(' benchmark-ui.js', '');
  // css is in *.css so still copied - fine
  fs.writeFileSync(path.join(root, '.github/workflows/pages.yml'), pages);

  let server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  // keep serving files for local tests - no need to remove from PUBLIC_FILES
  console.log('pages cleaned of explicit benchmark js names', !pages.includes('benchmark-ui'));
}

// improve-ui may link to benchmark - check
{
  const improve = fs.readFileSync(path.join(root, 'improve-ui.js'), 'utf8');
  if (improve.includes('benchmark')) {
    console.log('note: improve-ui still mentions benchmark');
  }
}

// fold test: remove benchmark section from boot HTML
{
  const file = path.join(root, 'tests/fold.test.js');
  let t = fs.readFileSync(file, 'utf8');
  t = t.replace(
    /'<section aria-labelledby="benchmark-title"><h2 id="benchmark-title">인기 글 구조 비교<\\\/h2><textarea><\\\/textarea><\\\/section>'\\+/,
    ''
  );
  t = t.replace(
    /'<section aria-labelledby="benchmark-title"><h2 id="benchmark-title">인기 글 구조 비교<\/h2><textarea><\/textarea><\/section>'\\+\\n\\s*/,
    ''
  );
  // simpler
  t = t.replace(/.*benchmark-title.*\\n/g, '');
  // fix folded length expectation - was >=3, now may be 2 (live, comment) + assemble/postlog only in real page
  t = t.replace("assert.ok(folded.length>=3,'최소 3개 접힘');", "assert.ok(folded.length>=2,'최소 2개 접힘');");
  fs.writeFileSync(file, t);
  console.log('fold test updated');
}

// product-v2 test DOM file list can keep benchmark for optional - no change required if not in index
// app-contract may not care

// connections.test and improve may reference quality cross to benchmark - leave unit tests for benchmark.js itself
console.log('done');
