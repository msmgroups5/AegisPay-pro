(function(){
'use strict';
var root=document.getElementById('app'),service=window.AegisSupabaseService;
var state={profile:null,queues:{deposits:[],kyc:[],withdrawals:[],stats:{}},error:'',tab:'deposits',busy:false,enabled:true,telegram:null};
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
 root.innerHTML=shell('<section class="tg-admin-content">'+powerPanel()+statCards()+'<div class="tg-paused-admin"><span class="tg-kicker">MAINTENANCE MODE</span><h2>Client activity is paused</h2><p>Sign-in, deposits, identity uploads, withdrawals, and other user actions are frozen at the backend. Switch the app ON here to resume normal use.</p></div><button class="tg-button-soft" data-action="logout">Sign out</button></section>');
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
 root.innerHTML=shell('<section class="tg-admin-content"><div class="tg-admin-heading"><div><span class="tg-kicker">OPERATIONS CONTROL</span><h1>Review queues</h1><p>Private evidence links expire after 10 minutes.</p></div><div>'+telegramButton+' <button class="tg-button-soft" data-action="refresh" '+(state.busy?'disabled':'')+'>Refresh</button></div></div>'+powerPanel()+statCards()+telegramStatus+nav+(items.length?list:'<div class="tg-empty">No items waiting in this queue.</div>')+'<button class="tg-button-soft" data-action="logout">Sign out</button></section>');
}
function render(){if(state.profile)renderQueues();else renderLogin();}
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
root.addEventListener('submit',function(e){if(e.target.id==='adminLogin')login(e);});
root.addEventListener('click',function(e){
 var el=e.target.closest('[data-action]');if(!el)return;var a=el.getAttribute('data-action');
 if(a==='tab'&&state.enabled){state.tab=el.getAttribute('data-tab');render();}
 if(a==='runtime')toggleRuntime();
 if(a==='refresh'){state.busy=true;loadQueues().catch(function(err){state.error=err.message||'Queue load failed.';}).finally(function(){state.busy=false;render();});}
 if(a==='logout'){service.signOut().finally(function(){state.profile=null;state.queues={deposits:[],kyc:[],withdrawals:[]};state.enabled=true;render();});}
 if(a==='review')review(el);
 if(a==='payout')retryPayout(el);
 if(a==='telegram-check')checkTelegram();
 if(a==='telegram-resend')resendTelegram(el);
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

