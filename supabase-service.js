(function(){
'use strict';

var WEB_AUTH_CALLBACK='https://aegispay-pro.netlify.app/auth/callback';
var MOBILE_AUTH_CALLBACK='com.aegispay.app://auth/callback';

function authRedirectUri(){
  return window.AEGIS_ANDROID_APP ? MOBILE_AUTH_CALLBACK : WEB_AUTH_CALLBACK;
}

window.AegisSupabaseService={
  client:function(){return window.AegisSupabaseClient;},
  authRedirectUri:authRedirectUri,

  async session(){
    var c=this.client();
    if(!c) throw new Error('Supabase client unavailable');
    var r=await c.auth.getSession();
    return r.data.session||null;
  },

  async signUp(email,password,metadata,redirectTo){
    var c=this.client();
    if(!c) throw new Error('Supabase client unavailable');
    return c.auth.signUp({
      email:email,
      password:password,
      options:{
        data:metadata||{},
        emailRedirectTo:String(redirectTo||authRedirectUri())
      }
    });
  },

  async resetPasswordForEmail(email,redirectTo){
    var c=this.client();
    if(!c) throw new Error('Supabase client unavailable');
    return c.auth.resetPasswordForEmail(email,{
      redirectTo:String(redirectTo||authRedirectUri())
    });
  },

  async signIn(email,password){
    var c=this.client();
    if(!c) throw new Error('Supabase client unavailable');
    return c.auth.signInWithPassword({email:email,password:password});
  },

  async signOut(){
    var c=this.client();
    if(c) return c.auth.signOut();
    return true;
  },

  async currentUser(){
    var c=this.client();
    if(!c) return null;
    var r=await c.auth.getUser();
    return r.data.user||null;
  }
};
})();
