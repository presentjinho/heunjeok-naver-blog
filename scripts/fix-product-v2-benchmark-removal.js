const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const file = path.resolve(__dirname, '..', 'product-v2.js');
let s = fs.readFileSync(file, 'utf8');

// Remove entire broken leftover function starting with "function {const reference=$('benchmarkReference')"
const broken = /function \{const reference=\$\('benchmarkReference'\)[\s\S]*?(?=\n  function )/;
if (broken.test(s)) {
  s = s.replace(broken, '');
  console.log('removed broken function block');
} else {
  // try removing from function { to next function name
  const i = s.indexOf("function {const reference=$('benchmarkReference')");
  if (i >= 0) {
    const next = s.indexOf('\n  function ', i + 10);
    if (next > i) {
      s = s.slice(0, i) + s.slice(next + 1);
      console.log('sliced broken block');
    }
  }
}

s = s.replace(/benchmarkGuard\(\);?/g, '');
// drop more-button logic leftovers if any orphaned
fs.writeFileSync(file, s);
execSync('node --check product-v2.js', { stdio: 'inherit' });
console.log({
  hasBroken: s.includes('function {const reference'),
  hasBenchmarkRef: s.includes('benchmarkReference'),
  hasGuardCall: s.includes('benchmarkGuard'),
});
