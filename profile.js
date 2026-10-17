(function(){'use strict';let generation=0;const status=document.getElementById('profile-status'),section=document.getElementById('profile-data');
async function load(){const run=++generation;section.hidden=true;for(const id of ['business-name','services','service-areas'])document.getElementById(id).textContent='';status.textContent='Checking account access…';
 try{
  if(typeof korvoSupabase==='undefined')throw Error('Profile service is unavailable. Refresh to retry.');
  const auth=await korvoSupabase.auth.getUser();if(run!==generation)return;
  if(auth.error||!auth.data?.user){location.href='login.html';return;}
  const uid=auth.data.user.id;
  const account=await korvoSupabase.from('profiles').select('id,account_type,is_active').eq('id',uid).maybeSingle();if(run!==generation)return;
  if(account.error||account.data?.id!==uid||account.data.account_type!=='professional'||account.data.is_active!==true)throw Error('An active professional account is required.');
  // URL parameters never select another person's private account profile.
  const profile=await korvoSupabase.from('professional_profiles').select('id,business_name,services,service_areas').eq('id',uid).maybeSingle();if(run!==generation)return;
  if(profile.error||profile.data?.id!==uid)throw Error('Profile could not be loaded. Return to your dashboard or refresh to retry.');
  const p=profile.data;document.getElementById('business-name').textContent=typeof p.business_name==='string'?p.business_name:'Not provided';
  for(const [field,id] of [['services','services'],['service_areas','service-areas']])document.getElementById(id).textContent=Array.isArray(p[field])?p[field].filter(v=>typeof v==='string').join(', ')||'Not provided':'Not provided';
  section.hidden=false;status.textContent='Your current account profile. No verification status is implied.';
 }catch(error){if(run===generation)status.textContent=error.message;}
}
document.getElementById('profile-refresh').addEventListener('click',load);
if(typeof korvoSupabase!=='undefined')korvoSupabase.auth.onAuthStateChange?.((event)=>{if(event==='SIGNED_OUT'){generation++;section.hidden=true;for(const id of ['business-name','services','service-areas'])document.getElementById(id).textContent='';status.textContent='Signed out.';}});
void load();})();
