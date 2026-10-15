export const STRIPE_VERSION='2026-09-30.endive';
export function sandboxStripe(secret, fetcher=globalThis.fetch) {
  if (typeof secret!=='string'||!secret.startsWith('sk_test_')) throw new Error('SANDBOX_KEY_REQUIRED');
  return async (path,{method='GET',params,idempotencyKey}={})=>{
    if(!/^(v1|v2\/core)\/[a-z_]+(?:\/[A-Za-z0-9_]+)*(?:\?.*)?$/.test(path)) throw new Error('INVALID_STRIPE_PATH');
    const v2=path.startsWith('v2/');
    if(method==='POST'&&!idempotencyKey) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    const response=await fetcher('https://api.stripe.com/'+path,{method,
      headers:{Authorization:`Bearer ${secret}`,'Stripe-Version':STRIPE_VERSION,
        'Content-Type':v2?'application/json':'application/x-www-form-urlencoded',
        ...(idempotencyKey?{'Idempotency-Key':idempotencyKey}:{})},
      ...(params?{body:v2?JSON.stringify(params):new URLSearchParams(params).toString()}:{}),signal:AbortSignal.timeout(20000)});
    const value=await response.json();
    if(!response.ok){const error=new Error('STRIPE_REQUEST_FAILED');error.code=value?.error?.code??'stripe_error';error.status=response.status;throw error;}
    if(value.livemode===true)throw new Error('LIVE_STRIPE_RESPONSE_REJECTED');
    return value;
  };
}

export async function verifySignature(raw,header,secrets,nowSeconds=Math.floor(Date.now()/1000)) {
  if(typeof header!=='string'||typeof raw!=='string')return false;
  const parts=header.split(',').map(x=>x.trim());
  const timestamps=parts.filter(x=>x.startsWith('t='));
  if(timestamps.length!==1||!/^t=\d+$/.test(timestamps[0]))return false;
  const timestamp=timestamps[0].slice(2);
  if(!Number.isSafeInteger(Number(timestamp))||Math.abs(nowSeconds-Number(timestamp))>300)return false;
  const signatures=parts.filter(x=>/^v1=[a-fA-F0-9]{64}$/.test(x)).map(x=>Uint8Array.from(x.slice(3).match(/../g),x=>parseInt(x,16)));
  for(const secret of secrets.filter(x=>typeof x==='string'&&x.startsWith('whsec_'))){
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    for(const signature of signatures)if(await crypto.subtle.verify('HMAC',key,signature,new TextEncoder().encode(timestamp+'.'+raw)))return true;
  }
  return false;
}
