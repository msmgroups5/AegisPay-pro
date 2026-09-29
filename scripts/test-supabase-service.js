const fs=require('node:fs');
const vm=require('node:vm');

const calls=[];
const user={id:'auth-user-1',email:'client@example.com'};
const profile={id:'profile-1',name:'Client One',email:'client@example.com',role:'USER',status:'Active'};
const fakeClient={
  auth:{
    getSession:async()=>({data:{session:{access_token:'test-session'}},error:null}),
    getUser:async()=>{calls.push('getUser');return {data:{user},error:null};},
    signUp:async(request)=>{calls.push(['signUp',request]);return {data:{user,session:null},error:null};},
    signInWithPassword:async(credentials)=>{calls.push(['signInWithPassword',credentials]);return {data:{user},error:null};},
    resetPasswordForEmail:async(email)=>{calls.push(['resetPasswordForEmail',email]);return {data:{},error:null};},
    updateUser:async(attributes)=>{calls.push(['updateUser',attributes]);return {data:{user},error:null};},
    signOut:async()=>{calls.push('signOut');return {error:null};},
    onAuthStateChange:(callback)=>({data:{subscription:{unsubscribe:function(){}}},callback:callback})
  },
  rpc:async(name,args)=>{calls.push(['rpc',name,args]);return {data:name==='set_my_language'?args.p_language:name==='request_withdrawal'?'withdrawal-1':profile,error:null};}
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
  const signup=await service.signUp(' New@Example.com ','password123','New Client',' ab123 ','ur');
  if(!signup.user||signup.session!==null)throw new Error('Supabase public signup response was not returned');
  const signUpRequest=calls.find(call=>Array.isArray(call)&&call[0]==='signUp')[1];
  if(signUpRequest.email!=='new@example.com'||signUpRequest.options.data.full_name!=='New Client'||signUpRequest.options.data.preferred_language!=='ur'||Object.hasOwn(signUpRequest.options.data,'role'))throw new Error('Signup metadata was not safely constrained');
  const account=await service.claimAegisPayProfile();
  if(account.user.id!=='auth-user-1'||account.profile.id!=='profile-1')throw new Error('Approved profile RPC result was not returned');
  const rpc=calls.find(call=>Array.isArray(call)&&call[0]==='rpc');
  if(rpc[1]!=='claim_aegispay_profile')throw new Error('Profile claim called the wrong RPC');
  await service.sendPasswordReset(' Client@Example.com ');
  await service.updatePassword('new-password-123');
  await service.setPreferredLanguage('ur');
  const withdrawal=await service.requestWithdrawal(75);
  if(withdrawal.error||withdrawal.data!=='withdrawal-1')throw new Error('Withdrawal RPC was not called');
  await service.signOut();
  const names=calls.filter(call=>Array.isArray(call)&&call[0]==='rpc').map(call=>call[1]);
  if(!names.includes('set_my_language')||!names.includes('request_withdrawal'))throw new Error('Operational RPC integration is missing');
  console.log('AegisPay Supabase Auth and operational service tests passed');
})().catch(error=>{console.error(error);process.exit(1);});
