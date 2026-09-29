const fs=require('node:fs');
const vm=require('node:vm');

const calls=[];
const user={id:'auth-user-1',email:'client@example.com'};
const profile={id:'profile-1',name:'Client One',email:'client@example.com',role:'USER',status:'Active'};
const fakeClient={
  auth:{
    getSession:async()=>({data:{session:{access_token:'test-session'}},error:null}),
    getUser:async()=>{calls.push('getUser');return {data:{user},error:null};},
    signInWithPassword:async(credentials)=>{calls.push(['signInWithPassword',credentials]);return {data:{user},error:null};},
    resetPasswordForEmail:async(email)=>{calls.push(['resetPasswordForEmail',email]);return {data:{},error:null};},
    updateUser:async(attributes)=>{calls.push(['updateUser',attributes]);return {data:{user},error:null};},
    signOut:async()=>{calls.push('signOut');return {error:null};},
    onAuthStateChange:(callback)=>({data:{subscription:{unsubscribe:function(){}}},callback:callback})
  },
  rpc:async(name)=>{calls.push(['rpc',name]);return {data:profile,error:null};}
};
const context={window:{AegisSupabaseClient:fakeClient},Promise,Error,String,Array,Object};
vm.createContext(context);
vm.runInContext(fs.readFileSync('supabase-service.js','utf8'),context);
const service=context.window.AegisSupabaseService;

(async()=>{
  if(!service.isAvailable())throw new Error('Supabase client availability check failed');
  const session=await service.session();
  if(!session||session.access_token!=='test-session')throw new Error('Session lookup failed');
  const signedIn=await service.signIn(' Client@Example.com ','password123');
  if(signedIn.id!=='auth-user-1')throw new Error('Password sign-in failed');
  const credentials=calls.find(call=>Array.isArray(call)&&call[0]==='signInWithPassword')[1];
  if(credentials.email!=='client@example.com'||credentials.password!=='password123')throw new Error('Sign-in credentials were not normalized safely');
  const account=await service.claimAegisPayProfile();
  if(account.user.id!=='auth-user-1'||account.profile.id!=='profile-1')throw new Error('Approved profile RPC result was not returned');
  const rpc=calls.find(call=>Array.isArray(call)&&call[0]==='rpc');
  if(rpc[1]!=='claim_aegispay_profile')throw new Error('Profile claim called the wrong RPC');
  await service.sendPasswordReset(' Client@Example.com ');
  await service.updatePassword('new-password-123');
  await service.signOut();
  if(typeof service.signUp!=='undefined')throw new Error('Public sign-up must remain disabled');
  console.log('AegisPay Supabase Auth service tests passed');
})().catch(error=>{console.error(error);process.exit(1);});
