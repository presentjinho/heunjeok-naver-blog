'use strict';
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const excluded=new Set(['.git','node_modules','coverage']);const findings=[];
const patterns=[['OpenAI key',/\bsk-[A-Za-z0-9_-]{20,}\b/g],['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],['GitHub token',/\bgh[pousr]_[A-Za-z0-9]{30,}\b/g]];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(excluded.has(entry.name))continue;const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else{const relative=path.relative(root,full).replace(/\\/g,'/');if(/^\.env(?:\.|$)/.test(relative)&&relative!=='.env.example')findings.push(`${relative}: environment file must not be committed`);if(!/\.(?:js|json|md|html|css|ya?ml|txt|example)$/.test(entry.name)&&entry.name!=='Dockerfile')continue;const text=fs.readFileSync(full,'utf8');for(const [name,pattern] of patterns){pattern.lastIndex=0;if(pattern.test(text))findings.push(`${relative}: possible ${name}`)}}}}
walk(root);if(findings.length){process.stderr.write(findings.join('\n')+'\n');process.exitCode=1}else process.stdout.write('Secret scan passed.\n');

