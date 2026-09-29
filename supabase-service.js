(function(){
'use strict';

window.AegisSupabaseService={
 client:function(){return window.AegisSupabaseClient;},
 isAvailable:function(){return !!(this.client()&&this.client().auth);},

 async session(){
  var c=this.client();
  if(!c)throw new Error('Supabase client unavailable');
  var result=await c.auth.getSession();
  if(result.error)throw result.error;
  return result.data&&result.data.session||null;
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
  var result=await c.auth.resetPasswordForEmail(String(email||'').trim().toLowerCase());
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