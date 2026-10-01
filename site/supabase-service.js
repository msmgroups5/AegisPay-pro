(function(){
'use strict';

var WEB_AUTH_CALLBACK='https://aegispay-pro.netlify.app/app/auth/callback';
var MOBILE_CLIENT_AUTH_CALLBACK='com.aegispay.app.client://auth/callback';
var MOBILE_ADMIN_AUTH_CALLBACK='com.aegispay.app.admin://auth/callback';
function authRedirectUri(){
  if(!window.AEGIS_ANDROID_APP)return WEB_AUTH_CALLBACK;
  return window.AEGIS_ADMIN_PORTAL ? MOBILE_ADMIN_AUTH_CALLBACK : MOBILE_CLIENT_AUTH_CALLBACK;
}

window.AegisSupabaseService={
 client:function(){return window.AegisSupabaseClient;},
 isAvailable:function(){return !!(this.client()&&this.client().auth);},
 authRedirectUri:authRedirectUri,

 async currentUser(){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  var result=await c.auth.getUser();
  if(result.error)throw result.error;
  return result.data&&result.data.user||null;
 },
 async session(){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  var result=await c.auth.getSession();
  if(result.error)throw result.error;
  return result.data&&result.data.session||null;
 },

 async appRuntimeEnabled(){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  var result=await c.rpc('app_runtime_enabled');
  if(result.error)throw result.error;
  if(typeof result.data!=='boolean')throw new Error('AegisPay runtime status is unavailable.');
  return result.data;
 },

 async setAppRuntimeEnabled(enabled){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  if(typeof enabled!=='boolean')throw new Error('Choose whether AegisPay should be ON or OFF.');
  var result=await c.rpc('set_app_runtime_enabled',{p_enabled:enabled});
  if(result.error)throw result.error;
  return result.data;
 },

 async signIn(email,password){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  var result=await c.auth.signInWithPassword({
   email:String(email||'').trim().toLowerCase(),
   password:String(password||'')
  });
  if(result.error)throw result.error;
  var user=result.data&&result.data.user;
  if(!user)throw new Error('Supabase Auth did not return a signed-in user.');
  return user;
 },

 async signUp(email,password,name,referralCode,preferredLanguage){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  var result=await c.auth.signUp({
   email:String(email||'').trim().toLowerCase(),
   password:String(password||''),
   options:{data:{full_name:String(name||'').trim(),referral_code:String(referralCode||'').trim().toUpperCase(),preferred_language:preferredLanguage==='ur'?'ur':'en'},emailRedirectTo:authRedirectUri()}
  });
  if(result.error)throw result.error;
  if(!result.data||!result.data.user)throw new Error('Supabase Auth did not create an account.');
  return result.data;
 },

 async claimAegisPayProfile(){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  var authResult=await c.auth.getUser();
  if(authResult.error)throw authResult.error;
  var user=authResult.data&&authResult.data.user;
  if(!user)throw new Error('Authentication is required.');
  var profileResult=await c.rpc('claim_aegispay_profile');
  if(profileResult.error)throw profileResult.error;
  var profile=Array.isArray(profileResult.data)?profileResult.data[0]:profileResult.data;
  if(!profile||!profile.id)throw new Error('No approved AegisPay profile is linked to this account.');
  return {user:user,profile:profile};
 },

 async sendPasswordReset(email){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  var result=await c.auth.resetPasswordForEmail(String(email||'').trim().toLowerCase(),{redirectTo:authRedirectUri()});
  if(result.error)throw result.error;
  return true;
 },

 async updatePassword(password){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  var result=await c.auth.updateUser({password:String(password||'')});
  if(result.error)throw result.error;
  return result.data&&result.data.user||true;
 },

 async setPreferredLanguage(language){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  var result=await c.rpc('set_my_language',{p_language:language==='ur'?'ur':'en'});
  if(result.error)throw result.error;
  return result.data;
 },

 async requestWithdrawal(amount){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  var result=await c.rpc('request_withdrawal',{p_amount:amount});
  if(result.error)throw result.error;
  return result;
 },

 async signOut(){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  var result=await c.auth.signOut();
  if(result.error)throw result.error;
  return true;
 },

 onAuthStateChange:function(callback){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  var result=c.auth.onAuthStateChange(callback);
  return result.data&&result.data.subscription||null;
 }
};
})();
