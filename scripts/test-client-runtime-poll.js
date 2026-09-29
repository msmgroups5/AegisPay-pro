const fs=require('node:fs');
const vm=require('node:vm');

let timer=null,enabled=true,pollError=false;
const root={writes:0,formValues:null,listeners:{},addEventListener(name,fn){this.listeners[name]=fn;}};
Object.defineProperty(root,'innerHTML',{get(){return this._html||'';},set(value){this._html=value;this.writes++;this.formValues=null;}});
const document={
  readyState:'loading',documentElement:{lang:'en',dir:'ltr'},
  getElementById:()=>root,
  addEventListener(name,fn){if(name==='DOMContentLoaded')this.boot=fn;}
};
const service={
  isAvailable:()=>true,
  appRuntimeEnabled:async()=>{if(pollError)throw new Error('temporarily unavailable');return enabled;},
  session:async()=>null,
  onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
};
const context={
  window:{AegisSupabaseService:service},document,location:{hash:''},navigator:{languages:['en'],language:'en'},
  localStorage:{getItem:()=> 'en',setItem(){}},URLSearchParams,Promise,Error,String,Array,Object,
  setInterval(fn){timer=fn;return 1;},clearInterval(){},setTimeout
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('client-auth.js','utf8'),context);

(async()=>{
  await document.boot();
  if(!timer||!root.innerHTML.includes('loginForm'))throw new Error('Client login screen did not finish booting');
  root.formValues={email:'typing@example.com',password:'in-progress'};
  const initialWrites=root.writes;
  await timer();
  if(root.writes!==initialWrites||root.formValues?.email!=='typing@example.com')throw new Error('A healthy 10-second runtime poll replaced the active form');
  enabled=false;await timer();
  if(!root.innerHTML.includes('paused'))throw new Error('Runtime OFF did not update the client screen');
  const pausedWrites=root.writes;await timer();
  if(root.writes!==pausedWrites)throw new Error('An unchanged paused state repeatedly replaced the screen');
  enabled=true;await timer();
  if(!root.innerHTML.includes('loginForm'))throw new Error('Runtime ON did not restore sign-in');
  pollError=true;await timer();
  const errorWrites=root.writes;await timer();
  if(root.writes!==errorWrites)throw new Error('A repeated runtime error repeatedly replaced the screen');
  console.log('Client runtime polling preserves active form state: PASS');
})().catch(error=>{console.error(error);process.exit(1);});

