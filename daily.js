(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HeunjeokDaily=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  // 매일 바뀌는 "오늘의 글감" — 날짜를 시드로 로컬에서 결정론적으로 회전한다.
  // 네이버 조회수 순위를 가져오지 않는다(약관·저작권). 경험 기반 글감 제안일 뿐이다.
  const DOW=['일','월','화','수','목','금','토'];
  const POOL=[
    {topic:'요즘 자주 가는 동네 카페의 조용한 자리',category:'local',postType:'visit',keyword:'동네 카페'},
    {topic:'최근에 산 물건 중 진짜 자주 쓰는 것',category:'tech',postType:'product',keyword:'실사용 후기'},
    {topic:'이번 주말에 다녀온 곳과 실제 동선',category:'travel',postType:'visit',keyword:'주말 나들이'},
    {topic:'직접 해보고 시간을 줄인 집안일 방법',category:'life',postType:'howto',keyword:'생활 꿀팁'},
    {topic:'비슷한 제품 둘을 써보고 고른 기준',category:'beauty',postType:'compare',keyword:'제품 비교'},
    {topic:'아이와 해보고 반응이 좋았던 활동',category:'parenting',postType:'product',keyword:'육아 활동'},
    {topic:'단골집에서 늘 시키는 메뉴와 이유',category:'local',postType:'visit',keyword:'맛집 단골'},
    {topic:'실패했다가 다시 성공한 나만의 방법',category:'life',postType:'howto',keyword:'시행착오'},
    {topic:'가격 대비 만족했던 최근 소비',category:'tech',postType:'product',keyword:'가성비'},
    {topic:'혼자 시간을 보내기 좋았던 장소',category:'local',postType:'daily',keyword:'혼자 시간'},
    {topic:'계절이 바뀌며 달라진 내 루틴',category:'life',postType:'daily',keyword:'요즘 루틴'},
    {topic:'예상과 달랐던 방문·구매 경험',category:'travel',postType:'visit',keyword:'솔직 후기'}
  ];
  function toDate(value){const d=value instanceof Date?value:new Date(value||Date.now());return isNaN(d)?new Date():d}
  function dateKey(now){const d=toDate(now);return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()}
  function todayLabel(now){const d=toDate(now);return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${DOW[d.getDay()]}요일`}
  function dailySeed(now){return dateKey(now)}
  function rotate(list,now){const arr=Array.isArray(list)?list.slice():[];if(!arr.length)return[];const start=dailySeed(now)%arr.length;return arr.slice(start).concat(arr.slice(0,start))}
  function dailyPrompts(now,count=3){return rotate(POOL,now).slice(0,Math.max(1,Math.min(count,POOL.length)))}
  function dailyKeywords(now,count=6){const seen=new Set();const out=[];for(const item of rotate(POOL,now)){if(!seen.has(item.keyword)){seen.add(item.keyword);out.push(item.keyword)}if(out.length>=count)break}return out}
  return{POOL,DOW,dateKey,todayLabel,dailySeed,rotate,dailyPrompts,dailyKeywords};
});
