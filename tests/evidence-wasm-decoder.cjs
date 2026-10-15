const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
(async()=>{
 const entry=require.resolve('@imagemagick/magick-wasm');const pkg=path.dirname(entry);
 const magick=await import(path.join(pkg,'index.js'));
 await magick.initializeImageMagick(fs.readFileSync(path.join(pkg,'x86/magick.wasm')));
 const {makeEvidenceDecoder}=await import('../supabase/functions/verify-completion-photo/decoder.mjs');
 const {inspectCompletionPhoto}=await import('../supabase/functions/_shared/completion-evidence.mjs');const decode=makeEvidenceDecoder(magick);let checks=0;
 for(const format of ['png','jpeg','webp']){
  const bytes=await sharp({create:{width:4,height:3,channels:3,background:'#234567'}}).toFormat(format).toBuffer();
  const result=await inspectCompletionPhoto(bytes,{declared_bytes:bytes.length,declared_mime:'image/'+format},decode);assert.equal(result.mime,'image/'+format);checks++;
  const broken=bytes.subarray(0,Math.max(12,Math.floor(bytes.length/2)));
  await assert.rejects(inspectCompletionPhoto(broken,{declared_bytes:broken.length,declared_mime:'image/'+format},decode));checks++;
 }
 console.log(JSON.stringify({checks_passed:checks,decoder:'magick-wasm 0.0.44 (same adapter as Edge entrypoint)',layer:'local WASM; hosted limits not verified'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
