'use strict';
// hardened: proxy-aware rate limiting, identity key separation, prod config checks
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {validateDraftInput,createOpenAIClient,createAuxOpenAIClient}=require('./ai');
const {validateTrendRequest,createDataLabClient,createSearchAdsClient}=require('./naver-data');

const PUBLIC_FILES=new Set(['/index.html','/privacy.html','/security.html','/favicon.svg','/styles.css','/comments.css','/a11y.css','/connection.css','/benchmark.css','/improve.css','/postlog.css','/daily.css','/product-v2.css','/core.js','/history.js','/photo-vault.js','/benchmark.js','/benchmark-ui.js','/quality.js','/assemble.js','/improve-ui.js','/postlog.js','/postlog-ui.js','/daily.js','/daily-ui.js','/backup.js','/product-v2.js','/app.js']);
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const SECRET_NAMES=['OPENAI_API_KEY','NAVER_CLIENT_SECRET','NAVER_DATALAB_CLIENT_SECRET','SEARCHAD_SECRET_KEY','SESSION_SECRET'];
function configuredOrigins(env=process.env){if(env.APP_ORIGIN)return String(env.APP_ORIGIN).split(',').map(value=>value.trim()).filter(Boolean);const host=String(env.RENDER_EXTERNAL_HOSTNAME||'').trim();if(/^[a-z0-9.-]+$/i.test(host)&&!host.startsWith('.')&&!host.endsWith('.'))return[`https://${host}`];return['http://localhost:3000','http://127.0.0.1:3000']}

function validateRuntimeConfig(env=process.env){
  const errors=[];
  for(const value of configuredOrigins(env)){
    try{const url=new URL(value.trim());if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)errors.push('APP_ORIGIN must contain origins only')}
    catch{errors.push('APP_ORIGIN is invalid')}
  }
  for(const name of SECRET_NAMES){const value=String(env[name]||'');if(value&&/^(change[-_ ]?me|example|test|placeholder)$/i.test(value))errors.push(`${name} uses a placeholder value`)}
  if(env.NODE_ENV==='production'){
    if(String(env.SESSION_SECRET||'').length<32)errors.push('SESSION_SECRET must be at least 32 characters in production');
    if(!String(env.APP_ORIGIN||'').trim()&&!String(env.RENDER_EXTERNAL_HOSTNAME||'').trim())errors.push('APP_ORIGIN must be set in production');
    for(const name of ['NAVER_CLIENT_ID','NAVER_CLIENT_SECRET','NAVER_REDIRECT_URI']){if(!String(env[name]||'').trim())errors.push(`${name} is required in production`)}
  }
  return{ok:errors.length===0,errors};
}

function securityHeaders(production=false){
  const headers={'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Resource-Policy':'same-origin','Cache-Control':'no-store'};
  if(production)headers['Strict-Transport-Security']='max-age=31536000; includeSubDomains';
  return headers;
}

function createRateLimiter({limit=30,windowMs=60000,maxKeys=10000,now=()=>Date.now()}={}){const clients=new Map();return key=>{const time=now();const current=clients.get(key);if(!current||current.resetAt<=time){if(clients.size>=maxKeys){for(const [stored,item] of clients){if(item.resetAt<=time)clients.delete(stored)}while(clients.size>=maxKeys)clients.delete(clients.keys().next().value)}clients.set(key,{count:1,resetAt:time+windowMs});return true}current.count+=1;return current.count<=limit}}
function clientIdentifier(req,trustProxyHops=0){const socket=String(req.socket?.remoteAddress||'unknown');if(trustProxyHops>0){const chain=String(req.headers['x-forwarded-for']||'').split(',').map(part=>part.trim()).filter(Boolean);if(chain.length){const index=chain.length-trustProxyHops;return chain[index>=0?index:0]||socket}}return socket}
function deriveIdentityKey(options={},env=process.env){if(options.identityKey)return options.identityKey;if(env.IDENTITY_SECRET)return String(env.IDENTITY_SECRET);if(env.SESSION_SECRET)return Buffer.from(crypto.hkdfSync('sha256',Buffer.from(String(env.SESSION_SECRET)),Buffer.alloc(0),Buffer.from('heunjeok-identity-pseudonymization'),32));return crypto.randomBytes(32)}
function json(res,status,body,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...headers});res.end(JSON.stringify(body))}
function readJson(req,maxBytes=4096){return new Promise((resolve,reject)=>{let size=0;let settled=false;const chunks=[];const fail=error=>{if(settled)return;settled=true;reject(error)};req.on('data',chunk=>{if(settled)return;size+=chunk.length;if(size>maxBytes){fail(Object.assign(new Error('too_large'),{status:413}));return}chunks.push(chunk)});req.on('end',()=>{if(settled)return;try{settled=true;resolve(chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{})}catch{settled=true;reject(Object.assign(new Error('invalid_json'),{status:400}))}});req.on('error',fail)})}
function parseCookies(value=''){const result={};for(const part of String(value).split(';')){const index=part.indexOf('=');if(index<1)continue;const key=part.slice(0,index).trim();const raw=part.slice(index+1);if(!key)continue;try{result[key]=decodeURIComponent(raw)}catch{continue}}return result}
function safeEqual(left,right){const a=Buffer.from(String(left));const b=Buffer.from(String(right));return a.length===b.length&&crypto.timingSafeEqual(a,b)}
function requestAllowed(req,origins,production=false){const origin=req.headers.origin;if(origin)return origins.has(origin);const host=String(req.headers.host||'');if(!host)return false;if(!production&&/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host))return true;const protocol=production?'https:':'http:';return origins.has(`${protocol}//${host}`)}
function createAuditLogger(sink=()=>{}){const allowed=new Set(['rate_limited','origin_rejected','unknown_api_route','oauth_started','oauth_rejected']);return entry=>{if(!entry||!allowed.has(entry.event))return;sink({at:new Date().toISOString(),event:entry.event,requestId:String(entry.requestId||''),outcome:String(entry.outcome||'')})}}
function createOAuthStateManager({ttlMs=5*60*1000,maxEntries=5000,now=()=>Date.now()}={}){
  const states=new Map();
  function issue(sessionId){const time=now();if(states.size>=maxEntries){for(const [key,item] of states){if(item.expiresAt<=time)states.delete(key)}while(states.size>=maxEntries)states.delete(states.keys().next().value)}const state=crypto.randomBytes(32).toString('base64url');states.set(crypto.createHash('sha256').update(state).digest('hex'),{sessionId,expiresAt:time+ttlMs});return state}
  function consume(sessionId,state){if(typeof state!=='string'||state.length<32)return false;const key=crypto.createHash('sha256').update(state).digest('hex');const record=states.get(key);states.delete(key);return Boolean(record&&record.expiresAt>now()&&safeEqual(record.sessionId,sessionId))}
  return{issue,consume};
}
function createSessionManager({ttlMs=30*60*1000,maxEntries=10000,now=()=>Date.now()}={}){
  const sessions=new Map();
  function create(){const time=now();if(sessions.size>=maxEntries){for(const [key,item] of sessions){if(item.expiresAt<=time)sessions.delete(key)}while(sessions.size>=maxEntries)sessions.delete(sessions.keys().next().value)}const id=crypto.randomBytes(32).toString('base64url');const csrf=crypto.randomBytes(32).toString('base64url');sessions.set(id,{csrf,expiresAt:time+ttlMs});return{id,csrf,ttlMs}}
  function get(id){const session=sessions.get(id);if(!session)return null;if(session.expiresAt<=now()){sessions.delete(id);return null}return session}
  function remove(id){sessions.delete(id)}
  return{create,get,remove};
}
function sessionId(req){const cookies=parseCookies(req.headers.cookie);return cookies['__Host-heunjeok_session']||cookies.heunjeok_session||''}
function sessionCookie(id,{production=false,maxAge=1800,clear=false}={}){const name=production?'__Host-heunjeok_session':'heunjeok_session';return `${name}=${clear?'':encodeURIComponent(id)}; Path=/; HttpOnly; SameSite=Strict${production?'; Secure':''}; Max-Age=${clear?0:maxAge}`}
async function limitedJson(response,maxBytes=32768){const length=Number(response.headers.get('content-length')||0);if(length>maxBytes)throw new Error('upstream_response_too_large');const text=await response.text();if(Buffer.byteLength(text)>maxBytes)throw new Error('upstream_response_too_large');try{return JSON.parse(text)}catch{throw new Error('upstream_invalid_json')}}
function createNaverOAuthClient({clientId,clientSecret,redirectUri,fetchImpl=fetch}={}){
  async function request(url,options){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);try{return await fetchImpl(url,{...options,signal:controller.signal,redirect:'error'})}finally{clearTimeout(timer)}}
  return{
    async identify(code,state){
      if(!clientId||!clientSecret||!redirectUri)throw new Error('naver_login_not_configured');
      const tokenUrl=new URL('https://nid.naver.com/oauth2.0/token');tokenUrl.search=new URLSearchParams({grant_type:'authorization_code',client_id:clientId,client_secret:clientSecret,code,state}).toString();
      const tokenResponse=await request(tokenUrl,{headers:{accept:'application/json'}});const token=await limitedJson(tokenResponse);if(!tokenResponse.ok||typeof token.access_token!=='string'||token.token_type?.toLowerCase()!=='bearer')throw new Error('naver_token_exchange_failed');
      const profileResponse=await request('https://openapi.naver.com/v1/nid/me',{headers:{accept:'application/json',authorization:`Bearer ${token.access_token}`}});const profile=await limitedJson(profileResponse);if(!profileResponse.ok||profile.resultcode!=='00'||typeof profile.response?.id!=='string'||!profile.response.id)throw new Error('naver_profile_failed');
      return profile.response.id;
    }
  };
}

function createAppServer(options={}){
  const root=path.resolve(options.root||__dirname);
  const production=options.production??process.env.NODE_ENV==='production';
  const origins=new Set(options.allowedOrigins||configuredOrigins(process.env));
  const rate=options.rateLimiter||createRateLimiter();
  const aiRate=options.aiRateLimiter||createRateLimiter({limit:5,windowMs:60000});
  const dataRate=options.dataRateLimiter||createRateLimiter({limit:10,windowMs:60000});
  const sessions=options.sessions||createSessionManager();
  const oauthStates=options.oauthStates||createOAuthStateManager();
  const identityKey=deriveIdentityKey(options,process.env);
  const trustProxyHops=Number.isFinite(options.trustProxyHops)?options.trustProxyHops:(Number.parseInt(process.env.TRUST_PROXY_HOPS,10)||(production?1:0));
  const naverClient=options.naverClient||createNaverOAuthClient({clientId:options.naverClientId||process.env.NAVER_CLIENT_ID,clientSecret:options.naverClientSecret||process.env.NAVER_CLIENT_SECRET,redirectUri:options.naverRedirectUri||process.env.NAVER_REDIRECT_URI,fetchImpl:options.fetchImpl});
  const aiClient=options.aiClient||createOpenAIClient({apiKey:options.openaiApiKey||process.env.OPENAI_API_KEY,model:options.openaiModel||process.env.OPENAI_MODEL||'gpt-5.4-mini',fetchImpl:options.fetchImpl});
  const auxAiClient=options.auxAiClient||createAuxOpenAIClient({apiKey:options.openaiApiKey||process.env.OPENAI_API_KEY,model:options.openaiModel||process.env.OPENAI_MODEL||'gpt-5.4-mini',fetchImpl:options.fetchImpl});
  const dataLabClient=options.dataLabClient||createDataLabClient({clientId:options.dataLabClientId||process.env.NAVER_DATALAB_CLIENT_ID||process.env.NAVER_CLIENT_ID,clientSecret:options.dataLabClientSecret||process.env.NAVER_DATALAB_CLIENT_SECRET||process.env.NAVER_CLIENT_SECRET,fetchImpl:options.fetchImpl});
  const searchAdsEnabled=options.searchAdsEnabled??process.env.SEARCHAD_ENABLED==='true';const searchAdsClient=options.searchAdsClient||createSearchAdsClient({enabled:searchAdsEnabled,apiKey:options.searchAdsApiKey||process.env.SEARCHAD_API_KEY,secretKey:options.searchAdsSecretKey||process.env.SEARCHAD_SECRET_KEY,customerId:options.searchAdsCustomerId||process.env.SEARCHAD_CUSTOMER_ID,fetchImpl:options.fetchImpl});
  const log=createAuditLogger(options.logger);
  return http.createServer(async(req,res)=>{
    const requestId=crypto.randomUUID();
    Object.entries(securityHeaders(production)).forEach(([key,value])=>res.setHeader(key,value));
    res.setHeader('X-Request-Id',requestId);
    const pathname=(()=>{try{return new URL(req.url,'http://local').pathname}catch{return''}})();
    const client=clientIdentifier(req,trustProxyHops);
    if(pathname.startsWith('/api/')&&!rate(client)){log({event:'rate_limited',requestId});return json(res,429,{error:'too_many_requests',requestId},{'Retry-After':'60'})}
    if(req.method==='GET'&&pathname==='/healthz')return json(res,200,{status:'ok'});
    if(req.method==='GET'&&pathname==='/api/v1/session'){
      if(!requestAllowed(req,origins,production))return json(res,403,{error:'origin_rejected',requestId});
      const oldId=sessionId(req);const existing=sessions.get(oldId);if(existing)return json(res,200,{csrfToken:existing.csrf,expiresInSeconds:Math.max(0,Math.floor((existing.expiresAt-Date.now())/1000)),requestId});
      const session=sessions.create();res.setHeader('Set-Cookie',sessionCookie(session.id,{production,maxAge:Math.floor(session.ttlMs/1000)}));
      return json(res,200,{csrfToken:session.csrf,expiresInSeconds:Math.floor(session.ttlMs/1000),requestId});
    }
    if(req.method==='GET'&&pathname==='/api/v1/auth/naver/start'){
      if(!requestAllowed(req,origins,production)){log({event:'origin_rejected',requestId,outcome:'naver_start'});return json(res,403,{error:'origin_rejected',requestId})}
      const id=sessionId(req);if(!sessions.get(id))return json(res,401,{error:'session_required',requestId});
      const clientId=String(options.naverClientId||process.env.NAVER_CLIENT_ID||'');const redirectUri=String(options.naverRedirectUri||process.env.NAVER_REDIRECT_URI||'');
      if(!clientId||!redirectUri)return json(res,503,{error:'naver_login_not_configured',requestId});
      let callback;try{callback=new URL(redirectUri);if(callback.protocol!=='https:'&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(callback.href))throw new Error('unsafe')}catch{return json(res,500,{error:'unsafe_redirect_configuration',requestId})}
      const state=oauthStates.issue(id);const authorization=new URL('https://nid.naver.com/oauth2.0/authorize');authorization.search=new URLSearchParams({response_type:'code',client_id:clientId,redirect_uri:callback.href,state}).toString();
      log({event:'oauth_started',requestId,outcome:'naver'});return json(res,200,{authorizationUrl:authorization.href,requestId});
    }
    if(req.method==='GET'&&pathname==='/api/v1/auth/naver/callback'){
      const id=sessionId(req);const current=sessions.get(id);const query=new URL(req.url,'http://local').searchParams;const state=query.get('state')||'';const code=query.get('code')||'';
      if(!current||!oauthStates.consume(id,state)||!code||code.length>2048){log({event:'oauth_rejected',requestId,outcome:'invalid_callback'});return json(res,400,{error:'oauth_callback_rejected',requestId})}
      try{const naverId=await naverClient.identify(code,state);const userHash=crypto.createHmac('sha256',identityKey).update(naverId).digest('hex');sessions.remove(id);const rotated=sessions.create();const rotatedData=sessions.get(rotated.id);rotatedData.auth={provider:'naver',userHash,authenticatedAt:Date.now()};res.setHeader('Set-Cookie',sessionCookie(rotated.id,{production,maxAge:Math.floor(rotated.ttlMs/1000)}));res.writeHead(303,{Location:'/?naverLogin=success'});return res.end()}
      catch{log({event:'oauth_rejected',requestId,outcome:'upstream_failure'});return json(res,502,{error:'naver_login_failed',requestId})}
    }
    if(req.method==='GET'&&pathname==='/api/v1/auth/status'){
      if(!requestAllowed(req,origins,production))return json(res,403,{error:'origin_rejected',requestId});const id=sessionId(req);const session=sessions.get(id);if(!session)return json(res,401,{error:'session_required',requestId});return json(res,200,{loggedIn:Boolean(session.auth?.provider==='naver'),provider:session.auth?.provider||null,requestId});
    }
    if(req.method==='DELETE'&&pathname==='/api/v1/session'){
      const origin=req.headers.origin||'';if(!origins.has(origin))return json(res,403,{error:'origin_rejected',requestId});
      const id=sessionId(req);const session=sessions.get(id);if(!session)return json(res,401,{error:'session_required',requestId});
      if(!safeEqual(req.headers['x-csrf-token']||'',session.csrf))return json(res,403,{error:'csrf_rejected',requestId});
      sessions.remove(id);res.setHeader('Set-Cookie',sessionCookie('',{production,clear:true}));res.writeHead(204);return res.end();
    }
    if(req.method==='POST'&&pathname==='/api/v1/security/status'){
      const origin=req.headers.origin||'';if(!origins.has(origin)){log({event:'origin_rejected',requestId});return json(res,403,{error:'origin_rejected',requestId})}
      const id=sessionId(req);const session=sessions.get(id);if(!session)return json(res,401,{error:'session_required',requestId});
      if(!safeEqual(req.headers['x-csrf-token']||'',session.csrf))return json(res,403,{error:'csrf_rejected',requestId});
      if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return json(res,415,{error:'json_required',requestId});
      try{await readJson(req,4096);return json(res,200,{status:'ready',storesSecretsInBrowser:false,acceptsNaverPassword:false,requestId})}catch(error){return json(res,error.status||400,{error:error.message,requestId})}
    }
    if(req.method==='POST'&&pathname==='/api/v1/ai/draft'){
      const origin=req.headers.origin||'';if(!origins.has(origin))return json(res,403,{error:'origin_rejected',requestId});const id=sessionId(req);const session=sessions.get(id);if(!session)return json(res,401,{error:'session_required',requestId});if(!session.auth||session.auth.provider!=='naver')return json(res,401,{error:'naver_login_required',requestId});if(!safeEqual(req.headers['x-csrf-token']||'',session.csrf))return json(res,403,{error:'csrf_rejected',requestId});if(!aiRate(id))return json(res,429,{error:'ai_rate_limited',requestId},{'Retry-After':'60'});if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return json(res,415,{error:'json_required',requestId});
      try{const body=await readJson(req,16384);const validated=validateDraftInput(body);if(!validated.ok)return json(res,400,{error:validated.error,requestId});const draft=await aiClient.draft(validated.value);return json(res,200,{draft,requestId})}catch(error){if(error.status)return json(res,error.status,{error:error.message,requestId});if(error.message==='openai_not_configured')return json(res,503,{error:'ai_not_configured',requestId});return json(res,502,{error:'ai_generation_failed',requestId})}
    }
    if(req.method==='POST'&&(pathname==='/api/v1/ai/tone'||pathname==='/api/v1/ai/replies')){
      const origin=req.headers.origin||'';if(!origins.has(origin))return json(res,403,{error:'origin_rejected',requestId});const id=sessionId(req);const session=sessions.get(id);if(!session||session.auth?.provider!=='naver')return json(res,401,{error:'naver_login_required',requestId});if(!safeEqual(req.headers['x-csrf-token']||'',session.csrf))return json(res,403,{error:'csrf_rejected',requestId});if(!aiRate(id))return json(res,429,{error:'ai_rate_limited',requestId},{'Retry-After':'60'});if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return json(res,415,{error:'json_required',requestId});try{const body=await readJson(req,8192);const result=pathname.endsWith('/tone')?await auxAiClient.tone(body.text):await auxAiClient.replies(body.comment,body.tone);return json(res,200,{result,requestId})}catch(error){if(['tone_text_too_short','comment_required'].includes(error.message))return json(res,400,{error:error.message,requestId});if(error.message==='openai_not_configured')return json(res,503,{error:'ai_not_configured',requestId});return json(res,502,{error:'ai_generation_failed',requestId})}
    }
    if(req.method==='POST'&&pathname==='/api/v1/ai/benchmark'){
      const origin=req.headers.origin||'';if(!origins.has(origin))return json(res,403,{error:'origin_rejected',requestId});const id=sessionId(req);const session=sessions.get(id);if(!session||session.auth?.provider!=='naver')return json(res,401,{error:'naver_login_required',requestId});if(!safeEqual(req.headers['x-csrf-token']||'',session.csrf))return json(res,403,{error:'csrf_rejected',requestId});if(!aiRate(id))return json(res,429,{error:'ai_rate_limited',requestId},{'Retry-After':'60'});if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return json(res,415,{error:'json_required',requestId});try{const body=await readJson(req,16384);const result=await auxAiClient.coach(body);return json(res,200,{result,requestId})}catch(error){if(error.message==='draft_too_short')return json(res,400,{error:error.message,requestId});if(error.message==='openai_not_configured')return json(res,503,{error:'ai_not_configured',requestId});return json(res,502,{error:'ai_generation_failed',requestId})}
    }
    if(req.method==='POST'&&pathname==='/api/v1/naver/trend'){
      const origin=req.headers.origin||'';if(!origins.has(origin))return json(res,403,{error:'origin_rejected',requestId});const id=sessionId(req);const session=sessions.get(id);if(!session||session.auth?.provider!=='naver')return json(res,401,{error:'naver_login_required',requestId});if(!safeEqual(req.headers['x-csrf-token']||'',session.csrf))return json(res,403,{error:'csrf_rejected',requestId});if(!dataRate(id))return json(res,429,{error:'trend_rate_limited',requestId},{'Retry-After':'60'});if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return json(res,415,{error:'json_required',requestId});try{const body=await readJson(req,2048);const validated=validateTrendRequest(body);if(!validated.ok)return json(res,400,{error:validated.error,requestId});const trend=await dataLabClient.trend(validated.value);return json(res,200,{trend,requestId})}catch(error){if(error.message==='datalab_not_configured')return json(res,503,{error:'trend_not_configured',requestId});return json(res,502,{error:'trend_unavailable',requestId})}
    }
    if(req.method==='GET'&&pathname==='/api/v1/naver/searchads/status'){
      if(!requestAllowed(req,origins,production))return json(res,403,{error:'origin_rejected',requestId});const id=sessionId(req);const session=sessions.get(id);if(!session)return json(res,401,{error:'session_required',requestId});return json(res,200,{enabled:Boolean(searchAdsEnabled),cpcProvided:false,requestId});
    }
    if(req.method==='POST'&&pathname==='/api/v1/naver/searchads/keywords'){
      const origin=req.headers.origin||'';if(!origins.has(origin))return json(res,403,{error:'origin_rejected',requestId});const id=sessionId(req);const session=sessions.get(id);if(!session||session.auth?.provider!=='naver')return json(res,401,{error:'naver_login_required',requestId});if(!safeEqual(req.headers['x-csrf-token']||'',session.csrf))return json(res,403,{error:'csrf_rejected',requestId});if(!searchAdsEnabled)return json(res,404,{error:'not_available',requestId});if(!dataRate(id))return json(res,429,{error:'keyword_rate_limited',requestId},{'Retry-After':'60'});if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return json(res,415,{error:'json_required',requestId});try{const body=await readJson(req,2048);const validated=validateTrendRequest(body);if(!validated.ok)return json(res,400,{error:validated.error,requestId});const result=await searchAdsClient.keywords(validated.value.keyword);return json(res,200,{result,requestId})}catch(error){if(error.message==='searchads_not_configured')return json(res,503,{error:'searchads_not_configured',requestId});return json(res,502,{error:'searchads_unavailable',requestId})}
    }
    if((req.method==='GET'||req.method==='HEAD')&&!pathname.startsWith('/api/')){
      const filePath=pathname==='/'?'/index.html':pathname;if(!PUBLIC_FILES.has(filePath))return json(res,404,{error:'not_found',requestId});
      const absolute=path.join(root,filePath.slice(1));try{const data=fs.readFileSync(absolute);res.writeHead(200,{'Content-Type':MIME[path.extname(absolute)]||'application/octet-stream'});return res.end(req.method==='HEAD'?undefined:data)}catch{return json(res,404,{error:'not_found',requestId})}
    }
    if(pathname.startsWith('/api/'))log({event:'unknown_api_route',requestId});return json(res,404,{error:'not_found',requestId});
  });
}

if(require.main===module){const config=validateRuntimeConfig();if(!config.ok){process.stderr.write(`안전하지 않은 서버 설정: ${config.errors.join('; ')}\n`);process.exitCode=1}else{const port=Number(process.env.PORT||3000);const host=String(process.env.HOST||'127.0.0.1');createAppServer().listen(port,host,()=>process.stdout.write(`흔적 서버가 ${host}:${port} 에서 실행 중입니다.\n`))}}
module.exports={PUBLIC_FILES,SECRET_NAMES,configuredOrigins,validateRuntimeConfig,securityHeaders,createRateLimiter,clientIdentifier,deriveIdentityKey,readJson,parseCookies,safeEqual,requestAllowed,createAuditLogger,createOAuthStateManager,createSessionManager,sessionId,sessionCookie,limitedJson,createNaverOAuthClient,createAppServer};
