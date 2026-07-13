(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HeunjeokPostLog=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  // 지수 공백 대체: 발행 기록을 이 브라우저에만 남기고, 성과는 사용자가 직접 입력한다.
  // 조회수·유입을 대신 조회하거나 예측하지 않는다.
  const ROLES=['수익','일상','포트폴리오','기타'];
  const MAX_ENTRIES=300;
  const FOLLOWUP_DAYS=7;
  const DAY_MS=24*60*60*1000;
  function clean(value,max){return typeof value==='string'?value.replace(/\s+/g,' ').trim().slice(0,max):''}
  function cleanMultiline(value,max){return typeof value==='string'?value.replace(/\r\n?/g,'\n').trim().slice(0,max):''}
  function parseKeywords(value){if(Array.isArray(value))return value.map(v=>clean(v,40)).filter(Boolean).slice(0,10);return String(value||'').split(/[,\n]+/).map(v=>clean(v,40)).filter(Boolean).slice(0,10)}
  function toNonNegativeInt(value){if(value===''||value===null||value===undefined)return null;const number=Number(String(value).replace(/[,\s]/g,''));if(!Number.isFinite(number)||number<0)return null;return Math.trunc(number)}
  function randomId(){try{if(typeof crypto!=='undefined'&&crypto.randomUUID)return crypto.randomUUID()}catch{}return 'log-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
  function createEntry(input={},now=()=>Date.now()){
    const topic=clean(input.topic,120);
    if(topic.length<2)return{ok:false,error:'topic_required'};
    const role=ROLES.includes(input.role)?input.role:'기타';
    const at=Number.isFinite(input.publishedAt)?input.publishedAt:now();
    return{ok:true,value:{
      id:String(input.id||randomId()),
      topic,
      postType:clean(input.postType,20)||'',
      role,
      keywords:parseKeywords(input.keywords),
      url:clean(input.url,300),
      note:cleanMultiline(input.note,500),
      publishedAt:at,
      metrics:null
    }};
  }
  function normalizeEntry(raw){
    if(!raw||typeof raw!=='object')return null;
    const topic=clean(raw.topic,120);if(topic.length<2)return null;
    const publishedAt=Number.isFinite(raw.publishedAt)?raw.publishedAt:Date.parse(raw.publishedAt);
    if(!Number.isFinite(publishedAt))return null;
    let metrics=null;
    if(raw.metrics&&typeof raw.metrics==='object'){
      const views=toNonNegativeInt(raw.metrics.views);const inflow=toNonNegativeInt(raw.metrics.inflow);
      if(views!==null||inflow!==null)metrics={views,inflow,recordedAt:Number.isFinite(raw.metrics.recordedAt)?raw.metrics.recordedAt:Date.now()};
    }
    return{id:String(raw.id||randomId()),topic,postType:clean(raw.postType,20)||'',role:ROLES.includes(raw.role)?raw.role:'기타',keywords:parseKeywords(raw.keywords),url:clean(raw.url,300),note:cleanMultiline(raw.note,500),publishedAt,metrics};
  }
  function normalizeLog(raw){let list=raw;if(typeof raw==='string'){try{list=JSON.parse(raw)}catch{return[]}}if(!Array.isArray(list))return[];return list.map(normalizeEntry).filter(Boolean).sort((a,b)=>b.publishedAt-a.publishedAt).slice(0,MAX_ENTRIES)}
  function addEntry(list,entry){const normalized=normalizeLog(list);return normalizeLog([entry,...normalized])}
  function removeEntry(list,id){return normalizeLog(list).filter(entry=>entry.id!==id)}
  function updateMetrics(list,id,metrics={},now=()=>Date.now()){
    const views=toNonNegativeInt(metrics.views);const inflow=toNonNegativeInt(metrics.inflow);
    return normalizeLog(list).map(entry=>{
      if(entry.id!==id)return entry;
      if(views===null&&inflow===null)return{...entry,metrics:null};
      return{...entry,metrics:{views,inflow,recordedAt:now()}};
    });
  }
  function dueForFollowup(list,now=()=>Date.now()){const time=now();return normalizeLog(list).filter(entry=>!entry.metrics&&(time-entry.publishedAt)>=FOLLOWUP_DAYS*DAY_MS)}
  function summarize(list){
    const entries=normalizeLog(list);
    const withMetrics=entries.filter(entry=>entry.metrics&&entry.metrics.views!==null);
    const totalViews=withMetrics.reduce((sum,entry)=>sum+entry.metrics.views,0);
    const byRole={};for(const role of ROLES)byRole[role]=entries.filter(entry=>entry.role===role).length;
    return{
      total:entries.length,
      recorded:withMetrics.length,
      avgViews:withMetrics.length?Math.round(totalViews/withMetrics.length):null,
      totalViews:withMetrics.length?totalViews:null,
      byRole,
      pendingFollowup:dueForFollowup(list).length
    };
  }
  return{ROLES,FOLLOWUP_DAYS,createEntry,normalizeEntry,normalizeLog,addEntry,removeEntry,updateMetrics,dueForFollowup,summarize,parseKeywords,toNonNegativeInt};
});
