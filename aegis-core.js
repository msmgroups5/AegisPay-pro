/* AegisPay Core Frame
 * Shared application rules/services for demo mode and Supabase connected mode.
 * No real payments, custody, blockchain settlement or payout execution.
 */
(function(){
  'use strict';

  const CONFIG = {
    version: 'core-1.0.0',
    mode: window.AEGIS_ANDROID_APP ? 'DEMO' : 'CONNECTED',
    roles: { USER:'USER', ADMIN:'ADMIN', MASTER_ADMIN:'MASTER ADMIN' },
    taskStatuses: ['Pending','In Progress','Completed','Expired'],
    withdrawalStatuses: ['PENDING_APPROVAL','APPROVED','REJECTED']
  };

  const DEMO_KEY='aegispay_core_state_v1';
  const SESSION_KEY='aegispay_core_session_v1';

  const seed = {
    users: [
      {id:'USR-001',email:'user@aegispay.demo',clientId:'AP10023',name:'Client Name',role:'USER',balance:12480,status:'Active',referralCode:'AP10023'},
      {id:'USR-002',email:'jamie@example.demo',clientId:'AP10024',name:'Jamie Chen',role:'USER',balance:8200,status:'Active',referralCode:'AP10024'},
      {id:'USR-003',email:'priya@example.demo',clientId:'AP10025',name:'Priya Nair',role:'USER',balance:6400,status:'Active',referralCode:'AP10025'},
      {id:'ADM-001',email:'admin@aegispay.demo',clientId:'APADMIN',name:'Operations Admin',role:'ADMIN',balance:0,status:'Active',referralCode:null},
      {id:'MAS-001',email:'master@aegispay.demo',clientId:'APMASTER',name:'Master Administrator',role:'MASTER ADMIN',balance:0,status:'Active',referralCode:null}
    ],
    tasks: [
      {id:'TASK-1001',userId:'USR-001',title:'Node Activity Review',description:'Review current node activity.',level:'L1',status:'In Progress',progress:70,reward:25,startDate:'2026-09-20',dueDate:'2026-09-30'},
      {id:'TASK-1002',userId:'USR-001',title:'Referral Profile Check',description:'Review referral profile information.',level:'L1',status:'Pending',progress:0,reward:15,startDate:'2026-09-25',dueDate:'2026-10-02'}
    ],
    referrals: [
      {id:'REF-1001',userId:'USR-001',referredUserId:'USR-002',level:1,reward:5,status:'Active',createdAt:'2026-09-12'},
      {id:'REF-1002',userId:'USR-001',referredUserId:'USR-003',level:2,reward:2,status:'Active',createdAt:'2026-09-08'}
    ],
    withdrawals: [],
    notifications: [
      {id:'NTF-1001',userId:'USR-001',type:'SYSTEM',title:'Welcome to AegisPay',body:'Your client workspace is ready.',read:false,createdAt:new Date().toISOString()}
    ],
    activity: [],
    settings: {
      systemMode:'DEMO',
      notificationsEnabled:true,
      securityAlertsEnabled:true,
      demoDataEnabled:true
    }
  };

  function clone(v){ return JSON.parse(JSON.stringify(v)); }
  function uid(prefix){ return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8).toUpperCase(); }
  function now(){ return new Date().toISOString(); }
  function normRole(r){ return String(r||'').toUpperCase()==='MASTER ADMIN'?'MASTER ADMIN':String(r||'').toUpperCase()==='ADMIN'?'ADMIN':'USER'; }
  function can(role, action){
    role=normRole(role);
    const matrix={
      USER:['dashboard:read','tasks:read','tasks:update','referrals:read','withdrawals:create','withdrawals:read','activity:read','notifications:read','notifications:update','ai:read','profile:read'],
      ADMIN:['dashboard:read','tasks:read','tasks:manage','referrals:read','referrals:manage','withdrawals:read','users:read','activity:read','notifications:read','notifications:manage'],
      'MASTER ADMIN':['dashboard:read','tasks:read','tasks:manage','referrals:read','referrals:manage','withdrawals:read','withdrawals:approve','users:read','users:manage','activity:read','audit:read','notifications:read','notifications:manage','settings:manage','system:read','data:export','data:reset']
    };
    return (matrix[role]||[]).includes(action);
  }

  function localState(){
    try {
      const raw=localStorage.getItem(DEMO_KEY);
      if(raw) return JSON.parse(raw);
    } catch(e){}
    const s=clone(seed); persistLocal(s); return s;
  }
  function persistLocal(s){ try{localStorage.setItem(DEMO_KEY,JSON.stringify(s));}catch(e){} }

  async function supaFetch(path, options){
    const cfg=window.AegisSupabaseConfig||{};
    if(!cfg.url||!cfg.publishableKey) throw new Error('Supabase configuration unavailable');
    const token=options&&options.accessToken ? options.accessToken : session().accessToken;
    const headers=Object.assign({
      apikey:cfg.publishableKey,
      Authorization:'Bearer '+(token||cfg.publishableKey),
      'Content-Type':'application/json'
    },(options&&options.headers)||{});
    const res=await fetch(cfg.url+path,{method:(options&&options.method)||'GET',headers,body:options&&options.body?JSON.stringify(options.body):undefined});
    const text=await res.text();
    let data=null; try{data=text?JSON.parse(text):null}catch(e){data=text}
    if(!res.ok) throw new Error((data&&data.message)|| (data&&data.error_description)||('Supabase request failed: '+res.status));
    return data;
  }

  function session(){
    try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')||{accessToken:null,refreshToken:null,profile:null};}
    catch(e){return {accessToken:null,refreshToken:null,profile:null};}
  }
  function saveSession(s){localStorage.setItem(SESSION_KEY,JSON.stringify(s));return s;}
  function clearSession(){localStorage.removeItem(SESSION_KEY);}

  async function authLogin(email,password){
    if(CONFIG.mode==='DEMO'){
      const s=localState(), u=s.users.find(x=>x.email.toLowerCase()===String(email).toLowerCase());
      if(!u || String(password)!==String(u.clientId)) throw new Error('Invalid AegisPay demo credentials');
      return saveSession({accessToken:null,refreshToken:null,profile:clone(u)});
    }
    const cfg=window.AegisSupabaseConfig||{};
    const auth=await fetch(cfg.url+'/auth/v1/token?grant_type=password',{
      method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},
      body:JSON.stringify({email,password})
    });
    const data=await auth.json();
    if(!auth.ok) throw new Error(data.error_description||data.msg||'Authentication failed');
    const profile=await supaFetch('/rest/v1/rpc/claim_aegispay_profile',{method:'POST',accessToken:data.access_token,body:{}});
    return saveSession({accessToken:data.access_token,refreshToken:data.refresh_token,profile});
  }

  async function authLogout(){
    const s=session();
    if(CONFIG.mode!=='DEMO'&&s.accessToken){
      try{await supaFetch('/auth/v1/logout',{method:'POST',accessToken:s.accessToken,body:{}});}catch(e){}
    }
    clearSession();
  }

  async function currentProfile(){
    const s=session();
    if(s.profile) return s.profile;
    return null;
  }

  function assert(role,action){
    if(!can(role,action)) throw new Error('Permission denied: '+action);
  }

  async function getData(resource, filters){
    const p=await currentProfile(), role=p&&p.role||'USER';
    assert(role,resource+':read');
    if(CONFIG.mode==='DEMO'){
      const s=localState();
      const map={users:'users',tasks:'tasks',referrals:'referrals',withdrawals:'withdrawals',activity:'activity',notifications:'notifications'};
      let rows=clone(s[map[resource]]||[]);
      if(filters&&filters.userId) rows=rows.filter(x=>x.userId===filters.userId);
      if(filters&&filters.status) rows=rows.filter(x=>x.status===filters.status);
      return rows;
    }
    const table={users:'users',tasks:'tasks',referrals:'referrals',withdrawals:'withdrawal_requests',activity:'activity_logs',notifications:'notifications'}[resource];
    const q=filters&&filters.userId?'?user_id=eq.'+encodeURIComponent(filters.userId):'';
    return supaFetch('/rest/v1/'+table+q,{});
  }

  async function updateTask(taskId, patch){
    const p=await currentProfile(); assert(p.role,'tasks:update');
    if(CONFIG.mode==='DEMO'){
      const s=localState(), t=s.tasks.find(x=>x.id===taskId);
      if(!t) throw new Error('Task not found');
      if(p.role==='USER'&&t.userId!==p.id) throw new Error('Permission denied');
      Object.assign(t,patch);
      if(Number(t.progress)>=100){t.progress=100;t.status='Completed';t.completionDate=now();}
      s.activity.unshift({id:uid('ACT'),actorUserId:p.id,type:'TASK',description:'Task '+t.id+' updated',createdAt:now()});
      persistLocal(s); return clone(t);
    }
    const data=await supaFetch('/rest/v1/tasks?id=eq.'+encodeURIComponent(taskId),{method:'PATCH',body:patch,headers:{Prefer:'return=representation'}});
    return data[0];
  }

  async function createWithdrawal(amount,destinationAddress){
    const p=await currentProfile(); assert(p.role,'withdrawals:create');
    amount=Number(amount); destinationAddress=String(destinationAddress||'').trim();
    if(!Number.isFinite(amount)||amount<=0) throw new Error('Amount must be greater than zero');
    if(!destinationAddress) throw new Error('Destination address is required');
    if(CONFIG.mode==='DEMO'){
      const s=localState(), u=s.users.find(x=>x.id===p.id);
      const pending=s.withdrawals.filter(x=>x.userId===p.id&&x.status==='PENDING_APPROVAL').reduce((a,x)=>a+Number(x.amount),0);
      if(amount>Number(u.balance)-pending) throw new Error('Withdrawal exceeds available platform balance');
      const risk=Math.round(Math.min(.35,Math.max(.02,amount/5000))*10000)/10000;
      const item={id:uid('WD'),userId:p.id,amount,destinationAddress,riskScore:risk,status:'PENDING_APPROVAL',createdAt:now(),approvalDate:null,approvedBy:null};
      s.withdrawals.unshift(item);
      s.activity.unshift({id:uid('ACT'),actorUserId:p.id,type:'WITHDRAWAL',description:item.id+' entered approval queue',createdAt:now()});
      s.notifications.unshift({id:uid('NTF'),userId:p.id,type:'WITHDRAWAL',title:'Withdrawal submitted',body:item.id+' is pending approval.',read:false,createdAt:now()});
      persistLocal(s); return clone(item);
    }
    return supaFetch('/rest/v1/rpc/request_withdrawal',{method:'POST',body:{p_amount:amount,p_destination_address:destinationAddress,p_ai_risk_score:0}});
  }

  async function finalizeWithdrawal(requestId,approve){
    const p=await currentProfile(); assert(p.role,'withdrawals:approve');
    if(CONFIG.mode==='DEMO'){
      const s=localState(), item=s.withdrawals.find(x=>x.id===requestId);
      if(!item) throw new Error('Withdrawal request not found');
      if(item.status!=='PENDING_APPROVAL') throw new Error('Withdrawal request is already finalized');
      item.status=approve?'APPROVED':'REJECTED'; item.approvalDate=now(); item.approvedBy=p.id;
      s.activity.unshift({id:uid('ACT'),actorUserId:p.id,type:'WITHDRAWAL_DECISION',description:item.id+' → '+item.status,createdAt:now()});
      s.notifications.unshift({id:uid('NTF'),userId:item.userId,type:'WITHDRAWAL',title:'Withdrawal decision',body:item.id+' was '+item.status+'.',read:false,createdAt:now()});
      persistLocal(s); return clone(item);
    }
    return supaFetch('/rest/v1/rpc/finalize_withdrawal',{method:'POST',body:{p_request_id:requestId,p_approve:!!approve}});
  }

  async function markNotification(id,read){
    const p=await currentProfile(); assert(p.role,'notifications:update');
    if(CONFIG.mode==='DEMO'){
      const s=localState(), n=s.notifications.find(x=>x.id===id);
      if(!n||n.userId!==p.id) throw new Error('Notification not found');
      n.read=!!read; persistLocal(s); return clone(n);
    }
    const data=await supaFetch('/rest/v1/notifications?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{is_read:!!read},headers:{Prefer:'return=representation'}});
    return data[0];
  }

  async function adminSummary(){
    const p=await currentProfile(); assert(p.role,'dashboard:read');
    if(p.role==='USER') return {role:p.role,scope:'USER'};
    const [users,tasks,withdrawals,referrals]=await Promise.all([
      getData('users'),getData('tasks'),getData('withdrawals'),getData('referrals')
    ]);
    return {
      role:p.role,totalUsers:users.length,activeUsers:users.filter(x=>x.status==='Active').length,
      pendingWithdrawals:withdrawals.filter(x=>x.status==='PENDING_APPROVAL').length,
      approvedWithdrawals:withdrawals.filter(x=>x.status==='APPROVED').length,
      rejectedWithdrawals:withdrawals.filter(x=>x.status==='REJECTED').length,
      referralRecords:referrals.length,
      completedTasks:tasks.filter(x=>x.status==='Completed').length
    };
  }

  async function exportData(){
    const p=await currentProfile(); assert(p.role,'data:export');
    if(CONFIG.mode==='DEMO') return clone(localState());
    const resources=['users','nodes','tasks','referrals','withdrawals','activity','notifications'];
    const out={}; for(const r of resources) out[r]=await getData(r); return out;
  }

  async function resetDemo(){
    const p=await currentProfile(); assert(p.role,'data:reset');
    if(CONFIG.mode!=='DEMO') throw new Error('Demo reset is only available in demo mode');
    const s=clone(seed); persistLocal(s); clearSession(); return true;
  }

  window.AegisCore={
    config:CONFIG,can,session,saveSession,clearSession,currentProfile,authLogin,authLogout,
    getData,updateTask,createWithdrawal,finalizeWithdrawal,markNotification,adminSummary,exportData,resetDemo
  };
})();
