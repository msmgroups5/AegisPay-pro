(function(){
'use strict';

window.AegisSupabaseService={
  client:function(){return window.AegisSupabaseClient;},

  async session(){
    var c=this.client();
    if(!c) throw new Error('Supabase client unavailable');
    var r=await c.auth.getSession();
    return r.data.session||null;
  },

  async signUp(email,password,metadata){
    var c=this.client();
    if(!c) throw new Error('Supabase client unavailable');
    return c.auth.signUp({email:email,password:password,options:{data:metadata||{}}});
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
