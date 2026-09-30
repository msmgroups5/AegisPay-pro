(function(){
'use strict';
var root=document.getElementById('app'),service=window.AegisSupabaseService;
var state={profile:null,queues:{deposits:[],kyc:[],withdrawals:[],stats:{}},users:[],offers:[],tiers:[],tasks:[],settings:{},error:'',tab:'overview',busy:false,enabled:true,telegram:null};
var pollTimer=null;
function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function date(v){try{return new Date(v).toLocaleString();}catch(e){return v||'';}}
function shell(body){
 return '<main class="tg-admin-page"><section class="tg-admin-card"><header class="tg-admin-topbar"><div class="tg-admin-brand"><img src="./aegispay-logo.svg" width="42" height="42" alt=""><span><b>AegisPay <em>Master Admin</em></b><small>PROTECTED OPERATIONS</small></span></div>'+(state.profile?'<span class="tg-admin-session">Secure session active</span>':'')+'</header>'+
 (state.error?'<div class="tg-admin-content"><div role="alert">'+esc(state.error)+'</div></div>':'')+body+'<footer class="tg-footer">AegisPay · Master Admin</footer></section></main>';
}
function renderLogin(){
 var content=state.busy
  ?'<section class="tg-admin-content tg-loading"><span class="tg-spinner" aria-hidden="true"></span><h1>Signing in securely</h1><p>Checking your Master Admin access…</p></section>'
  :'<section class="tg-admin-content tg-admin-login"><span class="tg-kicker">OWNER ACCESS</span><h1>Welcome back</h1><p>Sign in with the Master Admin account provisioned for this project.</p><form id="adminLogin"><label>Email<input id="adminEmail" type="email" autocomplete="username" required></label><label>Password<input id="adminPassword" type="password" autocomplete="current-password" required></label><button type="submit">Sign in securely</button></form><small>Access is checked against the protected AegisPay role.</small></section>';
 root.innerHTML=shell(content);
}
function powerPanel(){
 return '<section class="tg-power-panel"><div class="tg-power-copy"><span class="tg-power-icon" aria-hidden="true">⏻</span><span><strong>'+(state.enabled?'App is ON':'App is OFF')+'</strong><small>'+(state.enabled?'Users can sign in and use enabled features.':'All user activity is paused; Master Admin can resume it here.')+'</small></span></div><button type="button" class="tg-power-switch '+(state.enabled?'is-on':'')+'" role="switch" aria-checked="'+String(state.enabled)+'" aria-pressed="'+String(state.enabled)+'" data-action="runtime" '+(state.busy?'disabled':'')+'>'+(state.enabled?'Pause app':'Resume app')+'</button></section>';
}
function actionButtons(kind,id,status,item){
 if(kind==='withdrawal'){
  var buttons=[];
  if(status==='PENDING_APPROVAL'&&item.panelDecision==='PENDING')buttons.push('<button data-action="review" data-kind="withdrawal" data-id="'+esc(id)+'" data-decision="approve">Panel approve</button><button class="tg-admin-danger" data-action="review" data-kind="withdrawal" data-id="'+esc(id)+'" data-decision="reject">Reject</button>');
  if(item.telegramDecision==='PENDING')buttons.push('<button class="tg-button-soft" data-action="telegram-resend" data-id="'+esc(id)+'">Send / resend Telegram</button>');
  if(status==='APPROVED'&&item.panelDecision==='APPROVED'&&item.telegramDecision==='APPROVED'&&!item.payoutTxid)buttons.push('<button data-action="payout" data-id="'+esc(id)+'">Send testnet payout</button>');
  if(status==='APPROVED'&&item.payoutTxid)buttons.push('<small>TXID exists · payout requires reconciliation</small>');
  if(status==='PENDING_APPROVAL'&&item.panelDecision==='APPROVED'&&item.telegramDecision==='PENDING')buttons.push('<small>Panel approved · waiting for Telegram</small>');
  if(status==='PENDING_APPROVAL'&&item.panelDecision==='PENDING'&&item.telegramDecision==='APPROVED')buttons.push('<small>Telegram approved · waiting for panel</small>');
  return '<div class="tg-admin-actions">'+(buttons.join('')||'<small>Waiting for both approvals</small>')+'</div>';
 }
 return '<div class="tg-admin-actions"><button data-action="review" data-kind="'+kind+'" data-id="'+esc(id)+'" data-decision="approve">Approve</button><button class="tg-admin-danger" data-action="review" data-kind="'+kind+'" data-id="'+esc(id)+'" data-decision="reject">Reject</button></div>';
}
function card(title,sub,detail,kind,id,media,status,item){
 return '<article class="tg-review-card"><div><h3>'+esc(title)+'</h3><p>'+esc(sub)+'</p>'+detail+'</div>'+media+actionButtons(kind,id,status,item||{})+'</article>';
}
function statCards(){
 var totals=state.queues.stats||{};
 function usdt(v){return Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
 return '<div class="tg-admin-stats"><article><small>Confirmed deposits</small><strong>'+usdt(totals.confirmedDepositsUsdt)+' USDT</strong></article><article><small>Credited to client balances</small><strong>'+usdt(totals.creditedDepositsUsdt)+' USDT</strong></article><article><small>Completed withdrawals</small><strong>'+Number(totals.completedWithdrawalsCount||0)+'</strong></article><article><small>USDT paid out</small><strong>'+usdt(totals.completedWithdrawalsUsdt)+' USDT</strong></article></div>';
}
function renderPaused(){
 root.innerHTML=shell('<section class="tg-admin-content">'+adminNav()+powerPanel()+statCards()+'<div class="tg-paused-admin"><span class="tg-kicker">MAINTENANCE MODE</span><h2>Client activity is paused</h2><p>Sign-in, deposits, identity uploads, withdrawals, and other user actions are frozen at the backend. Switch the app ON here to resume normal use.</p></div><button class="tg-button-soft" data-action="logout">Sign out</button></section>');
}
function adminNav(){
 var tabs=[
  ['overview','Overview'],['users','Users'],['shop','Shop & Tasks'],
  ['deposits','Deposits'],['kyc','KYC'],['withdrawals','Withdrawals'],
  ['settings','Settings'],['telegram','Telegram']
 ];
 return '<nav class="tg-admin-nav">'+tabs.map(function(x){return '<button data-action="tab" data-tab="'+x[0]+'" aria-pressed="'+String(state.tab===x[0])+'">'+x[1]+'</button>';}).join('')+'</nav>';
}
function renderQueues(){
 if(!state.enabled){renderPaused();return;}
 var q=state.queues,items=q[state.tab]||[];
 var tabs=[['deposits','Deposits',q.deposits.length],['kyc','KYC',q.kyc.length],['withdrawals','Withdrawals',q.withdrawals.length]];
 var nav='<nav class="tg-admin-nav">'+tabs.map(function(x){return '<button data-action="tab" data-tab="'+x[0]+'" aria-pressed="'+String(state.tab===x[0])+'">'+x[1]+' <span>'+x[2]+'</span></button>';}).join('')+'</nav>';
 var list=items.map(function(x){
  var who=x.user?x.user.name+' · '+x.user.email:'Unknown account';
  if(state.tab==='deposits'){
   var media=x.screenshotUrl?'<a class="tg-review-link" href="'+esc(x.screenshotUrl)+'" target="_blank" rel="noopener">Open private screenshot</a>':'<small>Evidence unavailable</small>';
   return card('$'+x.grossAmount+' · '+x.tierId,who,'<p>TXID: <code>'+esc(x.txid)+'</code></p><p>AI: '+esc(x.aiReviewStatus)+' · '+esc(x.aiReviewReason||'No issue')+'</p><p>'+esc(x.note||'')+'</p>','deposit',x.id,media,x.status,x);
  }
  if(state.tab==='kyc'){
   var images='<div class="tg-review-files">'+(x.frontUrl?'<a href="'+esc(x.frontUrl)+'" target="_blank" rel="noopener">Front / passport image</a>':'')+(x.backUrl?'<a href="'+esc(x.backUrl)+'" target="_blank" rel="noopener">Back image</a>':'')+'</div>';
   return card(x.documentType,who,'<p>AI: '+esc(x.aiReviewStatus)+' · Confidence: '+esc(x.confidence||'n/a')+'</p><p>Review reason: '+esc(x.reason||'No issue')+'</p>','kyc',x.id,images,x.status,x);
  }
  return card('$'+x.amount+' request · '+esc(x.status),who,'<p>Fee: '+esc(x.feeAmount)+' USDT · Net: '+esc(x.netAmount)+' USDT</p><p>Panel: '+esc(x.panelDecision||'PENDING')+' · Telegram: '+esc(x.telegramDecision||'PENDING')+' ('+esc(x.telegramStatus||'NOT SENT')+')</p><p>Destination: <code>'+esc(x.destinationAddress)+'</code></p><p>'+esc(x.payoutError||'')+(x.payoutTxid?' · TXID '+esc(x.payoutTxid):'')+'</p>','withdrawal',x.id,'<small>Submitted '+esc(date(x.submittedAt))+'</small>',x.status,x);
 }).join('');
 var telegramButton='<button class="tg-button-soft" data-action="telegram-check" '+(state.busy?'disabled':'')+'>Check Telegram</button>';
 var telegramStatus=state.telegram?'<p class="tg-telegram-status">'+(state.telegram.configured?'Telegram connected: @'+esc(state.telegram.botUsername||'bot')+' · '+esc(state.telegram.chatTitle||'review chat'):'Telegram setup incomplete. Check the Supabase bot, chat, and approver configuration.')+'</p>':'';
 root.innerHTML=shell('<section class="tg-admin-content"><div class="tg-admin-heading"><div><span class="tg-kicker">OPERATIONS CONTROL</span><h1>Review queues</h1><p>Private evidence links expire after 10 minutes.</p></div><div>'+telegramButton+' <button class="tg-button-soft" data-action="refresh" '+(state.busy?'disabled':'')+'>Refresh</button></div></div>'+powerPanel()+statCards()+telegramStatus+adminNav()+(items.length?list:'<div class="tg-empty">No items waiting in this queue.</div>')+'<button class="tg-button-soft" data-action="logout">Sign out</button></section>');
}
function renderOverview(){
 var q=state.queues.stats||{};
 root.innerHTML=shell('<section class="tg-admin-content">'+adminNav()+powerPanel()+statCards()+
  '<div class="tg-admin-stats"><article><small>Total client accounts</small><strong>'+state.users.length+'</strong></article><article><small>Active Shop offers</small><strong>'+state.offers.filter(function(x){return x.status==='ACTIVE';}).length+'</strong></article><article><small>Assigned tasks</small><strong>'+state.tasks.length+'</strong></article><article><small>Pending tasks</small><strong>'+state.tasks.filter(function(x){return x.status==='Pending';}).length+'</strong></article></div>'+
  '<div class="tg-paused-admin"><span class="tg-kicker">MASTER ADMIN CONTROL</span><h2>Full operational control</h2><p>Use Users for account controls and balance adjustments, Shop & Tasks for offer/task operations, and Settings for platform rules.</p></div><button class="tg-button-soft" data-action="logout">Sign out</button></section>');
}
function renderUsers(){
 var rows=state.users.filter(function(u){return u.role==='USER';}).map(function(u){
   var status=String(u.status||'NORMAL').toUpperCase();
   return '<article style="padding:15px;margin-top:10px;border:1px solid #e2edf4;border-radius:15px;background:#fff"><div style="display:flex;justify-content:space-between;gap:12px"><div><h3 style="margin:0">'+esc(u.name||'Unnamed')+'</h3><p style="margin:5px 0">'+esc(u.email||'')+' · '+esc(status)+'</p><small>Balance: '+Number(u.current_platform_balance||0).toFixed(2)+' USDT · Principal: '+Number(u.principal_balance||0).toFixed(2)+' · Profit: '+Number(u.profit_balance||0).toFixed(2)+'</small></div><div class="tg-admin-actions">'+
    (status==='FROZEN'?'<button data-action="user-status" data-id="'+esc(u.id)+'" data-status="NORMAL">Unfreeze</button>':'<button data-action="user-status" data-id="'+esc(u.id)+'" data-status="FROZEN">Freeze</button>')+
    '<button data-action="user-status" data-id="'+esc(u.id)+'" data-status="BLOCKED" class="tg-admin-danger">Block</button>'+
    '<button class="tg-button-soft" data-action="balance-adjust" data-id="'+esc(u.id)+'">Adjust balance</button></div></div></article>';
 }).join('');
 root.innerHTML=shell('<section class="tg-admin-content">'+adminNav()+'<div class="tg-admin-heading"><div><span class="tg-kicker">ACCOUNT CONTROL</span><h1>Client users</h1><p>Account status and manual balance changes are recorded server-side.</p></div><button class="tg-button-soft" data-action="refresh">Refresh</button></div>'+(rows||'<div class="tg-empty">No client accounts found.</div>')+'<button class="tg-button-soft" data-action="logout">Sign out</button></section>');
}
function renderShop(){
 var offers=state.offers.map(function(o){
   return '<article style="padding:15px;margin-top:10px;border:1px solid #e2edf4;border-radius:15px;background:#fff"><div style="display:flex;justify-content:space-between;gap:12px"><div><h3 style="margin:0">'+esc(o.title)+'</h3><p style="margin:5px 0">'+esc(o.subtitle||'')+'</p><small>Tier: '+esc(o.tier_min_id||'Any')+' · '+esc(o.status)+'</small></div><button data-action="toggle-offer" data-id="'+esc(o.id)+'" data-status="'+esc(o.status==='ACTIVE'?'INACTIVE':'ACTIVE')+'">'+(o.status==='ACTIVE'?'Deactivate':'Activate')+'</button></div></article>';
 }).join('');
 var tasks=state.tasks.slice(0,80).map(function(t){
   return '<article style="padding:12px;margin-top:8px;border:1px solid #edf2f6;border-radius:13px"><strong>'+esc(t.title)+'</strong><p style="margin:4px 0">'+esc(t.status)+' · '+Number(t.task_value||0).toFixed(2)+' USDT value · '+Number(t.reward||0).toFixed(2)+' USDT reward</p><small>User '+esc(t.user_id)+' · Cycle '+esc(t.cycle_id||'—')+'</small></article>';
 }).join('');
 root.innerHTML=shell('<section class="tg-admin-content">'+adminNav()+'<div class="tg-admin-heading"><div><span class="tg-kicker">SHOP OPERATIONS</span><h1>Shop offers & tasks</h1><p>Offers control what tasks are generated for newly verified deposits.</p></div><button class="tg-button-soft" data-action="refresh">Refresh</button></div>'+
 '<form id="offerForm" style="margin-top:16px"><label>Offer title<input id="offerTitle" required></label><label>Subtitle<input id="offerSubtitle"></label><label>Minimum tier<select id="offerTier">'+state.tiers.map(function(t){return '<option value="'+esc(t.id)+'">'+esc(t.name)+'</option>';}).join('')+'</select></label><label>Instructions<textarea id="offerInstructions" style="width:100%;min-height:80px;padding:10px;border:1px solid #dce7ee;border-radius:12px"></textarea></label><button type="submit">Create offer</button></form>'+
 '<h2 style="margin-top:22px">Active configuration</h2>'+(offers||'<div class="tg-empty">No Shop offers.</div>')+
 '<h2 style="margin-top:22px">Assigned tasks</h2>'+(tasks||'<div class="tg-empty">No tasks assigned yet.</div>')+
 '<button class="tg-button-soft" data-action="logout">Sign out</button></section>');
}
function renderSettings(){
 var s=state.settings||{},dr=s.deposit_rules||{},cr=s.cycle_rules||{},rr=s.referral_rules||{},sm=s.system_mode||{};
 root.innerHTML=shell('<section class="tg-admin-content">'+adminNav()+'<div class="tg-admin-heading"><div><span class="tg-kicker">PLATFORM SETTINGS</span><h1>Rules & runtime</h1><p>These changes affect future client workflows.</p></div></div>'+
 '<form id="settingsForm"><label>Deposit network<input id="setNetwork" value="'+esc(dr.network||'TRON TESTNET')+'"></label><label>Receiving address<input id="setReceiving" value="'+esc(dr.receiving_address||'')+'"></label><label>Deposit fee<input id="setDepositFee" type="number" step="0.01" value="'+Number(dr.fee||2)+'"></label><label>Withdrawal minimum<input id="setWithdrawMin" type="number" step="0.01" value="'+Number((s.withdrawal_rules||{}).minimum||50)+'"></label><label>Withdrawal fee rate<input id="setWithdrawFee" type="number" step="0.01" value="'+Number((s.withdrawal_rules||{}).fee_rate||0.10)+'"></label><label>Cycle hours<input id="setCycleHours" type="number" step="1" value="'+Number(cr.hours||18)+'"></label><label>Level 1 referral reward<input id="setRef1" type="number" step="0.01" value="'+Number(rr.level_1||5)+'"></label><label>Level 2 referral reward<input id="setRef2" type="number" step="0.01" value="'+Number(rr.level_2||2)+'"></label><button type="submit">Save platform rules</button></form>'+
 '<div class="tg-paused-admin"><span class="tg-kicker">CURRENT MODE</span><h2>'+esc(sm.mode||'TESTNET_DEMO')+'</h2><p>Mainnet real payouts remain disabled unless explicitly configured server-side.</p></div><button class="tg-button-soft" data-action="logout">Sign out</button></section>');
}
async function loadOperations(){
 var c=service.client();
 var [users,offers,tiers,tasks,settings]=await Promise.all([
   c.from('users').select('id,name,email,role,status,current_platform_balance,principal_balance,profit_balance,destination_address,created_at').order('created_at',{ascending:false}).limit(200),
   c.from('shop_offers').select('id,title,subtitle,task_level,tier_min_id,reward_text,status,instructions,created_at,updated_at').order('created_at',{ascending:false}),
   c.from('vip_tiers').select('id,name,deposit_amount,initial_profit,enabled,display_order,color_key').order('display_order'),
   c.from('tasks').select('id,user_id,cycle_id,title,status,progress,reward,task_value,offer_id,start_date,due_date,completion_date').order('start_date',{ascending:false}).limit(200),
   c.from('platform_settings').select('key,value_json')
 ]);
 state.users=users.data||[];state.offers=offers.data||[];state.tiers=tiers.data||[];state.tasks=tasks.data||[];
 state.settings={};(settings.data||[]).forEach(function(x){state.settings[x.key]=x.value_json||{};});
 if(users.error)throw users.error;
 if(offers.error)throw offers.error;
 if(tiers.error)throw tiers.error;
 if(tasks.error)throw tasks.error;
 if(settings.error)throw settings.error;
}
async function changeUserStatus(el){
 var id=el.getAttribute('data-id'),status=el.getAttribute('data-status');
 state.busy=true;render();
 try{var r=await service.client().rpc('set_user_account_status',{p_user_id:id,p_status:status});if(r.error)throw r.error;await loadOperations();state.error='';}
 catch(e){state.error=e.message||'Account status update failed.';}
 finally{state.busy=false;render();}
}
async function adjustBalance(el){
 var id=el.getAttribute('data-id');
 var type=window.prompt('Enter adjustment type: CREDIT or REVERSAL','CREDIT');if(!type)return;
 type=String(type).toUpperCase();if(type!=='CREDIT'&&type!=='REVERSAL'){state.error='Invalid adjustment type.';render();return;}
 var amount=Number(window.prompt('Amount in USDT','5'));if(!Number.isFinite(amount)||amount<=0){state.error='Enter a positive amount.';render();return;}
 var reason=window.prompt('Reason','Master Admin balance adjustment')||'Master Admin balance adjustment';
 state.busy=true;render();
 try{var r=await service.client().rpc('master_admin_adjust_balance',{p_user_id:id,p_amount:amount,p_type:type,p_reason:reason});if(r.error)throw r.error;await loadOperations();}
 catch(e){state.error=e.message||'Balance adjustment failed.';}
 finally{state.busy=false;render();}
}
async function toggleOffer(el){
 state.busy=true;render();
 try{var r=await service.client().from('shop_offers').update({status:el.getAttribute('data-status'),updated_at:new Date().toISOString()}).eq('id',el.getAttribute('data-id'));if(r.error)throw r.error;await loadOperations();}
 catch(e){state.error=e.message||'Offer update failed.';}
 finally{state.busy=false;render();}
}
async function createOffer(e){
 e.preventDefault();state.busy=true;render();
 try{
  var r=await service.client().from('shop_offers').insert({title:document.getElementById('offerTitle').value.trim(),subtitle:document.getElementById('offerSubtitle').value.trim(),tier_min_id:document.getElementById('offerTier').value,task_level:'CLIENT',instructions:document.getElementById('offerInstructions').value.trim(),reward_text:'Cycle task',status:'ACTIVE'});
  if(r.error)throw r.error;await loadOperations();
 }catch(err){state.error=err.message||'Offer creation failed.';}finally{state.busy=false;render();}
}
async function saveSettings(e){
 e.preventDefault();state.busy=true;render();
 try{
  var c=service.client(),dr=Object.assign({},state.settings.deposit_rules||{});
  dr.network=document.getElementById('setNetwork').value.trim();dr.receiving_address=document.getElementById('setReceiving').value.trim();dr.fee=Number(document.getElementById('setDepositFee').value);
  var cr=Object.assign({},state.settings.cycle_rules||{}, {hours:Number(document.getElementById('setCycleHours').value)});
  var rr=Object.assign({},state.settings.referral_rules||{}, {level_1:Number(document.getElementById('setRef1').value),level_2:Number(document.getElementById('setRef2').value)});
  var wr={minimum:Number(document.getElementById('setWithdrawMin').value),fee_rate:Number(document.getElementById('setWithdrawFee').value)};
  var rows=[{key:'deposit_rules',value_json:dr,updated_at:new Date().toISOString()},{key:'cycle_rules',value_json:cr,updated_at:new Date().toISOString()},{key:'referral_rules',value_json:rr,updated_at:new Date().toISOString()},{key:'withdrawal_rules',value_json:wr,updated_at:new Date().toISOString()}];
  var r=await c.from('platform_settings').upsert(rows,{onConflict:'key'});if(r.error)throw r.error;await loadOperations();
 }catch(err){state.error=err.message||'Settings save failed.';}finally{state.busy=false;render();}
}

function render(){if(!state.profile)return renderLogin();if(state.tab==='overview')return renderOverview();if(state.tab==='users')return renderUsers();if(state.tab==='shop')return renderShop();if(state.tab==='settings')return renderSettings();if(state.tab==='deposits'||state.tab==='kyc'||state.tab==='withdrawals')return renderQueues();if(state.tab==='telegram'){state.tab='withdrawals';return renderQueues();}return renderOverview();}
async function login(e){
 e.preventDefault();var email=document.getElementById('adminEmail').value,password=document.getElementById('adminPassword').value;
 state.busy=true;state.error='';render();
 try{
  await service.signIn(email,password);
  var result=await service.claimAegisPayProfile();
  if(!result.profile||result.profile.role!=='MASTER ADMIN')throw new Error('This account does not have Master Admin access.');
  state.profile=result.profile;await syncRuntime();
 }catch(err){await service.signOut().catch(function(){});state.profile=null;state.error=err.message||'Sign-in failed.';}
 finally{state.busy=false;render();}
}
async function loadQueues(force){
 if(!state.enabled&&!force){state.queues={deposits:[],kyc:[],withdrawals:[],stats:state.queues.stats||{}};return;}
 var response=await service.client().functions.invoke('admin-queues',{body:{}});
 if(response.error)throw response.error;
 var data=response.data||{};
 if(typeof data.appEnabled==='boolean')state.enabled=data.appEnabled;
 state.queues={deposits:data.deposits||[],kyc:data.kyc||[],withdrawals:data.withdrawals||[],stats:data.stats||state.queues.stats||{}};
}
async function syncRuntime(){
 var was=state.enabled;
 state.enabled=await service.appRuntimeEnabled();
 if(!state.enabled){await loadQueues(true).catch(function(){state.queues={deposits:[],kyc:[],withdrawals:[],stats:state.queues.stats||{}};});render();return;}
 if(was!==state.enabled||state.profile)await loadQueues();
 render();
}
async function toggleRuntime(){
 if(state.busy)return;
 var next=!state.enabled;
 if(!next&&window.confirm&&!window.confirm('Pause all client access and operations now?'))return;
 state.busy=true;state.error='';render();
 try{await service.setAppRuntimeEnabled(next);state.enabled=next;state.queues={deposits:[],kyc:[],withdrawals:[],stats:state.queues.stats||{}};if(next)await loadQueues();}
 catch(err){state.error=err.message||'App status update failed.';await service.appRuntimeEnabled().then(function(v){state.enabled=v;}).catch(function(){});}
 finally{state.busy=false;render();}
}
async function review(el){
 if(state.busy||!state.enabled)return;state.busy=true;state.error='';render();
 try{
  var result=await service.client().functions.invoke('admin-review',{body:{action:el.getAttribute('data-kind'),id:el.getAttribute('data-id'),decision:el.getAttribute('data-decision')}});
  if(result.error)throw result.error;
  if(el.getAttribute('data-kind')==='withdrawal'&&el.getAttribute('data-decision')==='approve'&&result.data&&result.data.status==='APPROVED'){
   var payout=await service.client().functions.invoke('execute-payout',{body:{withdrawalId:el.getAttribute('data-id')}});
   if(payout.error)throw new Error('Both approvals are saved. Testnet payout needs configuration or review: '+(payout.error.message||'payout service failed'));
   if(!payout.data||payout.data.status!=='PAID')throw new Error((payout.data&&payout.data.error)||'Payout needs manual reconciliation.');
  }
  if(el.getAttribute('data-kind')==='deposit'&&el.getAttribute('data-decision')==='approve'){
   var check=await service.client().functions.invoke('verify-deposit',{body:{depositId:el.getAttribute('data-id')}});
   if(check.error)throw check.error;
   if(check.data&&check.data.status==='PENDING_VERIFICATION')state.error=check.data.message||'On-chain transfer is not confirmed yet.';
  }
  await loadQueues();
 }catch(err){state.error=err.message||'The review could not be completed.';await loadQueues().catch(function(){});}
 finally{state.busy=false;render();}
}
async function retryPayout(el){
 if(state.busy||!state.enabled)return;state.busy=true;state.error='';render();
 try{
  var result=await service.client().functions.invoke('execute-payout',{body:{withdrawalId:el.getAttribute('data-id')}});
  if(result.error)throw result.error;
  if(!result.data||result.data.status!=='PAID')throw new Error((result.data&&result.data.error)||'Payout needs manual reconciliation.');
  await loadQueues();
 }catch(err){state.error=err.message||'The payout could not be completed.';await loadQueues().catch(function(){});}
 finally{state.busy=false;render();}
}
async function checkTelegram(){
 if(state.busy||!state.enabled)return;state.busy=true;state.error='';render();
 try{var result=await service.client().functions.invoke('telegram-withdrawal',{body:{action:'diagnostics'}});if(result.error)throw result.error;state.telegram=result.data||{};if(!state.telegram.configured)state.error='Telegram token, chat ID, and approver IDs must be configured as Supabase secrets.';}
 catch(err){state.telegram={configured:false};state.error=err.message||'Telegram connection check failed.';}
 finally{state.busy=false;render();}
}
async function resendTelegram(el){
 if(state.busy||!state.enabled)return;state.busy=true;state.error='';render();
 try{var result=await service.client().functions.invoke('telegram-withdrawal',{body:{action:'resend',withdrawalId:el.getAttribute('data-id')}});if(result.error)throw result.error;await loadQueues();}
 catch(err){state.error=err.message||'Telegram approval could not be sent.';await loadQueues().catch(function(){});}
 finally{state.busy=false;render();}
}
root.addEventListener('submit',function(e){if(e.target.id==='adminLogin')login(e);else if(e.target.id==='offerForm')createOffer(e);else if(e.target.id==='settingsForm')saveSettings(e);});
root.addEventListener('click',function(e){
 var el=e.target.closest('[data-action]');if(!el)return;var a=el.getAttribute('data-action');
 if(a==='tab'){state.tab=el.getAttribute('data-tab');render();}
 if(a==='runtime')toggleRuntime();
 if(a==='refresh'){state.busy=true;loadQueues().catch(function(err){state.error=err.message||'Queue load failed.';}).finally(function(){state.busy=false;render();});}
 if(a==='logout'){service.signOut().finally(function(){state.profile=null;state.queues={deposits:[],kyc:[],withdrawals:[]};state.enabled=true;render();});}
 if(a==='review')review(el);
 if(a==='payout')retryPayout(el);
 if(a==='telegram-check')checkTelegram();
 if(a==='telegram-resend')resendTelegram(el);
  if(a==='user-status')changeUserStatus(el);
  if(a==='balance-adjust')adjustBalance(el);
  if(a==='toggle-offer')toggleOffer(el);
});
async function boot(){
 render();if(!service||!service.isAvailable()){state.error='Secure sign-in is unavailable.';render();return;}
 try{
  var session=await service.session();
  if(session){var result=await service.claimAegisPayProfile();if(result.profile.role==='MASTER ADMIN'){state.profile=result.profile;await syncRuntime();}else await service.signOut();}
 }catch(e){state.profile=null;}
 render();
 if(!pollTimer)pollTimer=setInterval(function(){if(state.profile&&!state.busy)syncRuntime().catch(function(err){state.error=err.message||'Runtime status is unavailable.';render();});},10000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

