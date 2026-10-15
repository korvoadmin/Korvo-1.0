// Actual image decoding integration for the runtime-neutral verifier core.
// sharp is a test adapter only; a compatible Edge adapter remains a deployment gate.
const sharp=require('sharp');
const assert=require('node:assert/strict');
(async()=>{
 const {inspectCompletionPhoto}=await import('../supabase/functions/_shared/completion-evidence.mjs');let checks=0;
 const decode=async(bytes,limits)=>{
  const options={limitInputPixels:limits.maximum_pixels,failOn:'warning',animated:true};
  const metadata=await sharp(bytes,options).metadata();
  if((metadata.pages||1)>limits.maximum_frames)throw Error('Animated photo');
  await sharp(bytes,options).raw().toBuffer();
  return {fully_decoded:true,mime:'image/'+(metadata.format==='jpg'?'jpeg':metadata.format),frames:metadata.pages||1,width:metadata.width,height:metadata.height};
 };
 for(const format of ['png','jpeg','webp']){
  const bytes=await sharp({create:{width:3,height:2,channels:3,background:'#224466'}}).toFormat(format).toBuffer();
  const d={declared_bytes:bytes.length,declared_mime:'image/'+format};
  assert.equal((await inspectCompletionPhoto(bytes,d,decode)).mime,d.declared_mime);checks++;
  const broken=bytes.subarray(0,Math.max(12,Math.floor(bytes.length/2)));
  await assert.rejects(inspectCompletionPhoto(broken,{...d,declared_bytes:broken.length},decode));checks++;
 }
 const fake=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
 await assert.rejects(inspectCompletionPhoto(fake,{declared_bytes:fake.length,declared_mime:'image/png'},decode));checks++;
 console.log(JSON.stringify({checks_passed:checks,decoder:'sharp '+sharp.versions.sharp,environment:'local full image decode',edge_adapter_tested:false}));
})().catch(e=>{console.error(e);process.exitCode=1;});
