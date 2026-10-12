import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const files=execFileSync('git',['ls-files','-co','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
test('repository source has no embedded Stripe secret keys or webhook secrets',()=>{
 const matches=[];
 for(const path of files.filter(p=>!p.startsWith('tests/') && /\.(?:js|mjs|ts|html|sql|json|md|yml)$/.test(p))){
  if(/\b(?:[sr]k_(?:test|live)_[a-zA-Z0-9]{20,}|whsec_[a-zA-Z0-9]{20,})\b/.test(readFileSync(path,'utf8')))matches.push(path);
 }
 assert.deepEqual(matches,[],'Embedded secret found; paths only are reported.');
});
test('frontend source contains no service-role JWT credentials',()=>{
 const matches=[];
 for(const path of files.filter(p=>!p.includes('/') && /\.(?:js|html)$/.test(p))){
  const source=readFileSync(path,'utf8');
  for(const token of source.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)){
   try{if(JSON.parse(Buffer.from(token[1],'base64url')).role==='service_role')matches.push(path);}catch{}
  }
 }
 assert.deepEqual(matches,[],'Service-role credential found; paths only are reported.');
});
