const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('aegis-core.js','utf8');
function makeLocalStorage(){
  const m=new Map();
  return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
}
async function loadCore(){
  const context={window:{AEGIS_ANDROID_APP:true},localStorage:makeLocalStorage(),fetch:async()=>{throw new Error('fetch should not be used in DEMO mode')},Date,Math,JSON,String,Number,Object,Array,Error,Promise};
  vm.createContext(context);
  vm.runInContext(source,context);
  return context.window.AegisCore;
}
(async()=>{
  const core=await loadCore();
  const user=await core.authLogin('user@aegispay.demo','AP10023');
  if(user.profile.role!=='USER') throw new Error('USER role failed');
  if(!core.can('USER','withdrawals:create')) throw new Error('USER withdrawal permission failed');
  if(core.can('USER','withdrawals:approve')) throw new Error('USER approval permission leaked');
  await core.authLogout();

  const admin=await core.authLogin('admin@aegispay.demo','APADMIN');
  if(admin.profile.role!=='ADMIN') throw new Error('ADMIN role failed');
  if(!core.can('ADMIN','users:read')) throw new Error('ADMIN user read permission failed');
  if(core.can('ADMIN','withdrawals:approve')) throw new Error('ADMIN master permission leaked');
  await core.authLogout();

  const master=await core.authLogin('master@aegispay.demo','APMASTER');
  if(master.profile.role!=='MASTER ADMIN') throw new Error('MASTER role failed');
  for(const action of ['users:manage','withdrawals:approve','settings:manage','system:read','data:export','data:reset']){
    if(!core.can('MASTER ADMIN',action)) throw new Error('MASTER permission failed: '+action);
  }
  await core.authLogout();
  console.log('AegisPay core authentication/RBAC tests passed');
})().catch(err=>{console.error(err);process.exit(1);});
