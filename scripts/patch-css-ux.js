const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

// styles.css toast
{
  const file = path.join(root, 'styles.css');
  let c = fs.readFileSync(file, 'utf8');
  if (!c.includes('/* sticky toast visibility */')) {
    c += `
/* sticky toast visibility */
.toast{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%) translateY(120%);z-index:90;max-width:min(520px,calc(100% - 24px));padding:12px 16px;border-radius:14px;background:#123f2c;color:#fff;font-weight:700;font-size:13px;box-shadow:0 12px 40px rgba(8,30,18,.28);opacity:0;pointer-events:none;transition:transform .2s ease,opacity .2s ease;overflow-wrap:anywhere;word-break:keep-all}
.toast.is-visible{transform:translateX(-50%) translateY(0);opacity:1}
@media(prefers-reduced-motion:reduce){.toast{transition:none}}
`;
    fs.writeFileSync(file, c);
    console.log('styles toast ok');
  } else console.log('styles toast skip');
}

// product-v2.css chip
{
  const file = path.join(root, 'product-v2.css');
  let c = fs.readFileSync(file, 'utf8');
  const from = '.hashtag-chip button{min-width:28px;min-height:28px;border:0;background:transparent}';
  const to = '.hashtag-chip button{min-width:44px;min-height:44px;border:0;background:transparent;font-size:16px}';
  if (c.includes(from)) {
    c = c.replace(from, to);
    fs.writeFileSync(file, c);
    console.log('chip ok');
  } else if (c.includes('min-width:44px;min-height:44px')) console.log('chip skip');
  else console.log('chip needle missing');
}

// a11y
{
  const file = path.join(root, 'a11y.css');
  let c = fs.readFileSync(file, 'utf8');
  if (!c.includes('.copy-control[aria-disabled="true"]:focus-visible')) {
    c += `
.copy-control[aria-disabled="true"]:focus-visible{outline:3px solid #a23819;outline-offset:2px}
`;
    fs.writeFileSync(file, c);
    console.log('a11y ok');
  } else console.log('a11y skip');
}
