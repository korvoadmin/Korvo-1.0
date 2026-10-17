(() => {
 'use strict';
 const form=document.getElementById('verificationForm'),status=document.getElementById('verificationStatus');
 const client=typeof korvoSupabase==='undefined'?null:korvoSupabase;
 if(!form||!status)return;
 let busy=false;
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!form.reportValidity())return;
  if(!client){status.textContent='Confirmation is temporarily unavailable. Please try again later.';return;}
  busy=true;const button=form.querySelector('button');button.disabled=true;
  try{
   const {error}=await client.auth.resend({type:'signup',email:document.getElementById('verificationEmail').value.trim().toLowerCase(),options:{emailRedirectTo:'https://korvoadmin.github.io/Korvo-1.0/login.html'}});
   if(error)throw Error('CONFIRMATION_NOT_SENT');
   status.textContent='If this address has a pending signup, a confirmation link will be sent. Check your inbox and spam folder. If you already confirmed, sign in.';
  }catch{status.textContent='The request could not be confirmed. Please wait before retrying. You can also try signing in or recovering your password.';}
  finally{busy=false;button.disabled=false;}
 });
})();
