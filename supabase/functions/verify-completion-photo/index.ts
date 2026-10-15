import {createClient} from 'npm:@supabase/supabase-js@2.117.3';
import * as magick from 'npm:@imagemagick/magick-wasm@0.0.44';
import {makeEvidenceDecoder} from './decoder.mjs';
import {createEvidenceHandler} from './handler.mjs';
// Fixed public dependency, integrity checked before execution. No user-provided URL.
let ready: Promise<ReturnType<typeof makeEvidenceDecoder>>|undefined;
async function loadDecoder(){
  const response=await fetch('https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.44/dist/x86/magick.wasm');
  if(!response.ok)throw Error('DECODER_UNAVAILABLE');
  const binary=new Uint8Array(await response.arrayBuffer());
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',binary)),b=>b.toString(16).padStart(2,'0')).join('');
  if(digest!=='b7d6710436b150dc5bd1ca04d80b6b7614c54854d7470f888f7e69a2a41b00e4')throw Error('DECODER_INTEGRITY');
  await magick.initializeImageMagick(binary);return makeEvidenceDecoder(magick);
}
async function decode(bytes:Uint8Array,limits:{maximum_pixels:number;maximum_frames:number}){
 ready??=loadDecoder().catch(error=>{ready=undefined;throw error;});
 return (await ready)(bytes,limits);
}
Deno.serve(createEvidenceHandler({createClient,decode,env:(name:string)=>Deno.env.get(name)}));
