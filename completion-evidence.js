(function(global){
 'use strict';
 const MAX=10*1024*1024,types=['image/jpeg','image/png','image/webp'];
 const element=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 global.KorvoEvidence={attach({container,client,activeJobId,role,enabled=global.KORVO_COMPLETION_EVIDENCE_ENABLED===true}){
  if(!enabled)return {ready:Promise.resolve(),beforeComplete:async()=>{},dispose(){}};
  const panel=element('section');panel.className='completion-evidence';panel.setAttribute('aria-label','Completion photos');
  panel.style.cssText='padding:12px;border:1px solid #d5dbe4;border-radius:12px;margin:12px 0;max-width:100%';
  const heading=element('strong','Completion photos'),status=element('p','Loading photos…'),photos=element('div'),controls=element('div');
  status.setAttribute('role','status');photos.style.cssText='display:flex;gap:8px;flex-wrap:wrap';panel.append(heading,status,photos,controls);container.append(panel);
  let summary=null,busy=false,generation=0,disposed=false;const urls=[],keys=new Map();let accepted=false,viewed=false;
  const clearURLs=()=>{for(const url of urls)URL.revokeObjectURL(url);urls.length=0;};
  const setError=message=>{status.textContent=message;};
  const storage=()=>client.storage.from('project-completion-evidence');
  async function refresh(){
   const run=++generation;summary=null;accepted=false;viewed=false;clearURLs();photos.replaceChildren();controls.replaceChildren();
   const response=await client.rpc('completion_evidence_summary',{p_active_job_id:activeJobId});
   if(disposed||run!==generation)return;
   if(response.error||response.data?.active_job_id!==activeJobId||response.data.role!==role||typeof response.data.required!=='boolean'||!Array.isArray(response.data.photos))throw Error('Photos could not be loaded. Refresh and try again.');
   summary=response.data;
   if(!summary.required){status.textContent='This existing job follows its original completion process.';return;}
   status.textContent=summary.photos.length?'Review the completion photos before confirming the work.':'A validated completion photo is required.';
   let allViewed=true;
   for(const photo of summary.photos){
    const card=element('div');card.style.cssText='max-width:160px;overflow-wrap:anywhere';card.append(element('p',photo.file_name));photos.append(card);
    if(photo.file_status==='validated'){
     const file=await storage().download(photo.storage_path);
     if(disposed||run!==generation)return;
     if(file.error||!file.data){allViewed=false;card.append(element('p','Photo unavailable. Refresh to retry.'));continue;}
     const url=URL.createObjectURL(file.data);urls.push(url);const img=element('img');img.alt='Completion photo: '+photo.file_name;img.style.cssText='max-width:100%;height:auto';
     const loaded=new Promise(resolve=>{img.onload=()=>resolve(true);img.onerror=()=>resolve(false);});img.src=url;card.append(img);if(!await loaded)allViewed=false;
    }else{
     allViewed=false;card.append(element('p','Upload not yet verified. Retry the same file or remove this reservation.'));
     if(role==='professional'&&summary.status==='active'){
      const remove=element('button','Remove unused photo');remove.type='button';remove.onclick=async()=>{
       if(busy)return;busy=true;remove.disabled=true;
       try{const r=await client.rpc('completion_abandon_photo',{p_photo_id:photo.id});if(r.error)throw Error();await refresh();}
       catch{setError('Photo could not be removed. Refresh and try again.');}finally{busy=false;remove.disabled=false;}
      };card.append(remove);
     }
    }
   }
   viewed=allViewed&&summary.photos.some(p=>p.file_status==='validated');
   if(role==='customer'&&summary.status==='pending_confirmation'){
    const label=element('label'),checkbox=element('input');checkbox.type='checkbox';checkbox.disabled=!viewed;
    checkbox.onchange=()=>{accepted=checkbox.checked;};label.append(checkbox,document.createTextNode(' I reviewed these photos. Confirming the job also confirms the work was completed.'));controls.append(label);
   }
   if(role==='professional'&&summary.status==='active'){
    const input=element('input');input.type='file';input.accept=types.join(',');input.setAttribute('aria-label','Choose completion photo');
    input.onchange=()=>{const file=input.files[0];if(file)upload(file).catch(error=>setError(error.message));};controls.append(input);
   }
   const again=element('button','Refresh photos');again.type='button';again.onclick=()=>{if(!busy)refresh().catch(e=>setError(e.message));};controls.append(again);
  }
  async function upload(file){
   if(busy)return;if(!types.includes(file.type)||!file.size||file.size>MAX)throw Error('Choose a JPG, PNG or WEBP photo up to 10 MB.');
   busy=true;panel.querySelectorAll('input,button').forEach(e=>e.disabled=true);status.textContent='Uploading and validating photo…';
   try{
    const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()));const hash=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
    const journal='korvoEvidence:'+activeJobId+':'+hash+':'+file.name;let key=keys.get(journal);
    try{key=key||sessionStorage.getItem(journal);}catch{}
    if(!key){key=crypto.randomUUID();keys.set(journal,key);try{sessionStorage.setItem(journal,key);}catch{}}
    const reservation=await client.rpc('completion_reserve_photo',{p_active_job_id:activeJobId,p_file_name:file.name,p_mime:file.type,p_bytes:file.size,p_request_key:key});
    const p=reservation.data;
    if(reservation.error||!p?.id||p.bucket!=='project-completion-evidence'||!p.storage_path?.endsWith('/'+p.id)||!['reserved','validated'].includes(p.file_status))throw Error('Photo reservation was not confirmed. Retry the same file.');
    if(p.file_status==='reserved'){
     // Upload errors can mean the first write succeeded; verify the immutable path.
     await storage().upload(p.storage_path,file,{upsert:false,contentType:file.type}).catch(()=>{});
    }
    const verification=await client.functions.invoke('verify-completion-photo',{body:{photo_id:p.id}});
    if(verification.error||verification.data?.id!==p.id||verification.data.file_status!=='validated'||verification.data.sha256!==hash)throw Error('Photo was not verified. Retry the same file or remove its reservation.');
    await refresh();status.textContent='Photo uploaded and verified.';
   }finally{busy=false;panel.querySelectorAll('input,button').forEach(e=>{if(e.type!=='checkbox')e.disabled=false;});}
  }
  return {ready:refresh().catch(e=>setError(e.message)),upload,refresh,
   async beforeComplete(){
    if(busy||!summary)throw Error('Wait for photos to finish loading or uploading.');
    if(!summary.required)return;
    if(!summary.photos.some(p=>p.file_status==='validated')||summary.photos.some(p=>p.file_status!=='validated'))throw Error('Validate or remove all pending photos before completing this job.');
    if(role==='customer'){
     if(!viewed||!accepted)throw Error('View and acknowledge the completion photos before confirming.');
     const response=await client.rpc('completion_acknowledge_photos',{p_active_job_id:activeJobId});
     if(response.error||response.data?.active_job_id!==activeJobId||response.data.customer_reviewed!==true)throw Error('Photo review was not confirmed. Refresh and try again.');
    }
   },dispose(){disposed=true;generation++;clearURLs();panel.remove();}};
 }};
})(window);
