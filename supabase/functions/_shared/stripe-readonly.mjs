import {STRIPE_VERSION} from './stripe.mjs';
export function readOnlySandboxStripe(secret,fetcher=globalThis.fetch){
 if(typeof secret!=='string'||! /^(sk|rk)_test_/.test(secret))throw Error('SANDBOX_KEY_REQUIRED');
 return async path=>{
  if(!/^v1\/(payment_intents\/pi_[A-Za-z0-9]+|charges\/ch_[A-Za-z0-9]+|(?:refunds|transfers)\?[A-Za-z0-9_%=&-]+)$/.test(path))throw Error('READ_ONLY_PATH_REQUIRED');
  const response=await fetcher('https://api.stripe.com/'+path,{method:'GET',headers:{Authorization:'Bearer '+secret,'Stripe-Version':STRIPE_VERSION},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('PROVIDER_READ_FAILED');
  const reader=response.body?.getReader();if(!reader)throw Error('PROVIDER_READ_FAILED');const chunks=[];let total=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>2097152){await reader.cancel();throw Error('PROVIDER_RESPONSE_TOO_LARGE');}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const result=JSON.parse(new TextDecoder().decode(bytes));if(result.livemode===true)throw Error('LIVE_PROVIDER_RESPONSE_REJECTED');return result;
 };
}
