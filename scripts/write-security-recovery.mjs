// CLI consumes protected catalog JSON snapshots; never connects to or mutates a database.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {restoreSQL} from './security-snapshot.mjs';
const [beforePath,afterPath,output]=process.argv.slice(2);
if(!beforePath||!afterPath||!output)throw Error('Usage: node scripts/write-security-recovery.mjs /private/before.json /private/after.json /private/inverse.sql');
const root=fs.realpathSync(fileURLToPath(new URL('../',import.meta.url))),requested=path.resolve(output);
const parent=fs.realpathSync(path.dirname(requested)),target=path.join(parent,path.basename(requested));
if(target===root||target.startsWith(root+path.sep))throw Error('Operational snapshots and inverse scripts must stay outside Git');
const parentStat=fs.statSync(parent);
if((parentStat.mode&0o077)!==0||parentStat.uid!==process.getuid())throw Error('Use an owner-only private output directory');
const sql=restoreSQL(JSON.parse(fs.readFileSync(beforePath,'utf8')),JSON.parse(fs.readFileSync(afterPath,'utf8')));
fs.writeFileSync(target,sql,{mode:0o600,flag:'wx'});console.log('Drift-guarded inverse written; explicit approval and hosted rehearsal still required.');
