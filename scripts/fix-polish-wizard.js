const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

let core = fs.readFileSync(path.join(root, 'core.js'), 'utf8');
const oldPros =
  "if(key==='pros'&&!/(어요|아요|습니다|죠|네요)$/.test(text))text+=' 편했어요';\n    if(key==='consAudience'&&/(추천|맞|어울)/.test(text)&&!/(어요|아요|습니다|요)$/.test(text))text+='요';";
const newPros =
  "if(key==='pros'){if(/(좋았|편했|괜찮|아쉬웠)$/.test(text))text+='어요';else if(text.length<18&&!/(어요|아요|습니다|죠|네요|음|함)$/.test(text))text+=' 좋았어요'}\n    if(key==='consAudience'){if(/추천$/.test(text))text+='해요';else if(/(맞|어울)$/.test(text))text+='아요'}";
if (core.includes(oldPros)) core = core.replace(oldPros, newPros);
else console.log('pros block already changed or missing');

core = core.replace(
  'if(cleaned.some(saved=>evidenceOverlap(text,saved)>=.82))continue;',
  'if(cleaned.some(saved=>saved===text||evidenceOverlap(text,saved)>=.82))continue;'
);
fs.writeFileSync(path.join(root, 'core.js'), core);

const Core = require(path.join(root, 'core.js'));
const pkg = Core.createPackage({
  topic: '테스트 카페',
  memo: '',
  postType: 'visit',
  experienceFields: {
    context: '토요일 오후에 성수동',
    reason: '노트북 작업 해야해서',
    process: '창가에 앉음',
    costTime: '아메리카노 5000원',
    pros: '조용해서 좋았',
    consAudience: '저녁은 붐벼 오전 추천',
  },
});
console.log('body sample:\n' + pkg.body);
console.log('dedupe', Core.polishParagraphs(['창가.', '창가.', '소음.']));

let s = fs.readFileSync(path.join(root, 'product-v2.js'), 'utf8');
const oldNext =
  "if(n===1)$('generate')?.disabled?showStep(1):($('generate')?.click(),showStep(2));else if(n>=4)smoothScroll($('copyAll'));else showStep(n+1)}";
const newNext =
  "if(n===1){if($('generate')?.disabled){showStep(1);return}if($('resultContent')?.hidden!==false)$('generate')?.click();showStep(2)}else if(n>=4)smoothScroll($('copyAll'));else showStep(n+1)}";
if (s.includes(oldNext)) {
  s = s.replace(oldNext, newNext);
  console.log('wizard next replaced');
} else if (s.includes("resultContent')?.hidden")) {
  console.log('wizard next already fixed');
} else {
  // looser
  s = s.replace(
    /if\(n===1\)\$\('generate'\)\?\.disabled\?showStep\(1\):\(\$\('generate'\)\?\.click\(\),showStep\(2\)\);else if\(n>=4\)smoothScroll\(\$\('copyAll'\)\);else showStep\(n\+1\)\}/,
    newNext
  );
  console.log('wizard next regex', s.includes("resultContent')?.hidden"));
}
fs.writeFileSync(path.join(root, 'product-v2.js'), s);
