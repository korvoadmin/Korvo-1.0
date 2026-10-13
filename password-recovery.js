(() => {
 'use strict';
 const client=typeof korvoSupabase==='undefined'?null:korvoSupabase;
 const status=document.getElementById('recoveryStatus'),request=document.getElementById('recoveryRequestForm'),reset=document.getElementById('recoveryResetForm');
 if(!client){status.textContent='Account recovery is temporarily unavailable. Please try again.';return;}
 let busy=false,ready=false;
 request?.addEventListener('submit',async event=>{
  event.preventDefault();if(busy || !request.reportValidity())return;
  busy=true;const button=request.querySelector('button');button.disabled=true;
  try{
   const {error}=await client.auth.resetPasswordForEmail(document.getElementById('recoveryEmail').value.trim().toLowerCase(),{
    redirectTo:'https://korvoadmin.github.io/Korvo-1.0/reset-password.html'});
   if(error)throw new Error('REQUEST_FAILED');
   status.textContent='If an account exists for this email, you will receive a password reset link. Check your inbox and spam folder.';
  }catch{status.textContent='The reset link could not be requested. Please wait and try again.';}
  finally{busy=false;button.disabled=false;}
 });
 if(!reset)return;
 // Supabase consumes its recovery callback. A normal existing session does not open this form.
 const recoveryCallback=new URLSearchParams(location.hash.slice(1)).get('type')==='recovery';
 async function enable(){
  try{
   const {data,error}=await client.auth.getUser();
   if(error || !data?.user)throw new Error('INVALID_RECOVERY');
   ready=true;document.getElementById('recoveryFields').disabled=false;
   history.replaceState(null,'',location.pathname);status.textContent='Choose a password with at least 12 characters.';
  }catch{status.textContent='This reset link is invalid or expired. Request a new link.';}
 }
 const subscription=client.auth.onAuthStateChange((event,session)=>{
  // Defer SDK calls outside Auth's locked callback, and never log the session or URL.
  if(session && (event==='PASSWORD_RECOVERY' || (event==='INITIAL_SESSION' && recoveryCallback)))setTimeout(enable,0);
 });
 reset.addEventListener('submit',async event=>{
  event.preventDefault();if(busy || !ready || !reset.reportValidity())return;
  const password=document.getElementById('newPassword'),confirmation=document.getElementById('confirmNewPassword');
  if(password.value!==confirmation.value){status.textContent='The passwords do not match.';return;}
  busy=true;const button=reset.querySelector('button');button.disabled=true;
  try{
   const {error}=await client.auth.updateUser({password:password.value});if(error)throw new Error('RESET_FAILED');
   password.value='';confirmation.value='';ready=false;document.getElementById('recoveryFields').disabled=true;
   const signedOut=await client.auth.signOut({scope:'global'});
   status.textContent=signedOut.error?'Password saved. Session sign-out could not be confirmed; sign out before logging in again.':'Password saved. Log in with your new password.';
   subscription.data?.subscription?.unsubscribe();
  }catch{status.textContent='The password could not be saved. Request a new reset link if this one has expired.';}
  finally{busy=false;button.disabled=false;}
 });
})();
