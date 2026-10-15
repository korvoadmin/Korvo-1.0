// Server-only verification core. A trusted, fully decoding image adapter is required.
// No HTTP endpoint is installed and no client can supply the decoder or attestation.
const MAX_BYTES=10*1024*1024,MAX_PIXELS=24_000_000;
export async function inspectCompletionPhoto(bytes,declared,decode) {
  if(!(bytes instanceof Uint8Array) || bytes.length<12 || bytes.length>MAX_BYTES
    || !Number.isSafeInteger(declared?.declared_bytes) || bytes.length!==declared.declared_bytes) throw new Error('Photo size mismatch');
  const png=[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
  const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const ascii=(start,end)=>String.fromCharCode(...bytes.subarray(start,end));
  const webp=ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP';
  const mime=png?'image/png':jpeg?'image/jpeg':webp?'image/webp':null;
  if(!mime||mime!==declared.declared_mime)throw new Error('Photo type mismatch');
  if(typeof decode!=='function')throw new Error('Trusted image decoder required');
  // Adapter MUST fully decode all pixels under these limits, not just inspect headers.
  const image=await decode(bytes,{maximum_pixels:MAX_PIXELS,maximum_frames:1});
  if(image?.fully_decoded!==true || image.mime!==mime || image.frames!==1
    || !Number.isSafeInteger(image.width)||!Number.isSafeInteger(image.height)
    || image.width<1||image.height<1||image.width*image.height>MAX_PIXELS)throw new Error('Invalid or excessive photo');
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
  return {sha256:Array.from(digest,b=>b.toString(16).padStart(2,'0')).join(''),bytes:bytes.length,mime};
}

export async function verifyStoredCompletionPhoto({photoId,actorClient,serverClient,decode}) {
  if(typeof photoId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photoId))throw new Error('Invalid photo identifier');
  // actorClient must carry the verified caller JWT, never service_role credentials.
  const authorization=await actorClient.rpc('completion_authorize_verification',{p_photo_id:photoId});
  if(authorization.error || authorization.data?.id!==photoId)throw new Error('Photo verification denied');
  const photo=authorization.data;
  if(!Number.isSafeInteger(photo.declared_bytes)||photo.declared_bytes<1||photo.declared_bytes>MAX_BYTES
    || typeof photo.storage_path!=='string'||!photo.storage_path.endsWith('/'+photoId))throw new Error('Invalid photo reservation');
  const stored=await serverClient.storage.from('project-completion-evidence').download(photo.storage_path);
  if(stored.error||!stored.data||stored.data.size!==photo.declared_bytes)throw new Error('Stored photo unavailable or mismatched');
  const checked=await inspectCompletionPhoto(new Uint8Array(await stored.data.arrayBuffer()),photo,decode);
  const saved=await serverClient.rpc('completion_validate_file',{p_photo_id:photoId,p_sha256:checked.sha256,p_bytes:checked.bytes,p_mime:checked.mime});
  if(saved.error||saved.data?.id!==photoId||saved.data?.file_status!=='validated')throw new Error('Photo attestation was not confirmed');
  return {id:photoId,file_status:'validated',sha256:checked.sha256};
}
