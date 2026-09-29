(function(){
'use strict';
var root=document.getElementById('app'),service=window.AegisSupabaseService;
var state={phase:'login',profile:null,queues:{deposits:[],kyc:[],withdrawals:[]},error:'',tab:'deposits',busy:false};
function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function date(v){try{return new Date(v).toLocaleString();}catch(e){return v||'';}}
function shell(body){return '<main style="max-width:1100px;margin:24px auto;padding:18px;background:#fff;border-radius:18px;box-shadow:0 16px 48px #11233d18"><header style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><b style="font-size:22px">AegisPay <span style="color:#168963">Master Admin</span></b><p>Protected operations and review queues</p></div>'+(state.profile?'<button data-action="refresh">Refresh queues</button>':'')+'</header>'+
(state.error?'<div role="alert" style="padding:10px;background:#fff0f2;color:#a63d52;border-radius:9px">'+esc(state.error)+'</div>':'')+body+'</main>';}
function renderLogin(){
 root.innerHTML=shell('<section style="max-width:420px;margin:40px auto"><h1>Master Admin sign in</h1><p>Use an account provisioned by the AegisPay project owner.</p><form id="adminLogin"><label>Email<input id="adminEmail" type="email" autocomplete="username" required></label><label>Password<input id="adminPassword" type="password" autocomplete="current-password" required></label><button type="submit">Sign in securely</button></form><small>Admin access is verified by Supabase Auth and the server-side role check.</small></section>');
}
function itemButtons(kind,id,status){
 if(kind==='withdrawal'&&status==='APPROVED')return '<div style="display:flex;gap:8px;margin-top:12px"><button data-action="payout" data-id="'+esc(id)+'">Retry payout</button></div>';
 return '<div style="display:flex;gap:8px;margin-top:12px"><button data-action="review" data-kind="'+kind+'" data-id="'+esc(id)+'" data-decision="approve">Approve</button><button data-action="review" data-kind="'+kind+'" data-id="'+esc(id)+'" data-decision="reject">Reject</button></div>';
}
function card(title,sub,detail,kind,id,media,status){
 return '<article style="border:1px solid #dce5ef;border-radius:14px;padding:16px;margin:12px 0"><div style="display:flex;justify-content:space-between;gap:14px"><div><h3>'+esc(title)+'</h3><p>'+esc(sub)+'</p>'+detail+'</div></div>'+media+itemButtons(kind,id,status)+'</article>';
}
function renderQueues(){
 var q=state.queues,items=q[state.tab]||[];
 var tabs=[['deposits','Deposits',q.deposits.length],['kyc','KYC',q.kyc.length],['withdrawals','Withdrawals',q.withdrawals.length]];
 var nav='<nav style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0">'+tabs.map(function(x){return '<button data-action="tab" data-tab="'+x[0]+'" aria-pressed="'+(state.tab===x[0])+'">'+x[1]+' ('+x[2]+')</button>';}).join('')+'</nav>';
 var list=items.map(function(x){
  var who=x.user?x.user.name+' · '+x.user.email:'Unknown account';
  if(state.tab==='deposits'){
   var media=x.screenshotUrl?'<a href="'+esc(x.screenshotUrl)+'" target="_blank" rel="noopener">Open private screenshot</a>':'Evidence unavailable';
   return card('$'+x.grossAmount+' · '+x.tierId,who,'<p>TXID: <code>'+esc(x.txid)+'</code></p><p>AI: '+esc(x.aiReviewStatus)+' · '+esc(x.aiReviewReason||'No issue')+'</p><p>'+esc(x.note||'')+'</p>', 'deposit',x.id,media);
  }
  if(state.tab==='kyc'){
   var images='<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">'+(x.frontUrl?'<a href="'+esc(x.frontUrl)+'" target="_blank" rel="noopener">Front / passport image</a>':'')+(x.backUrl?'<a href="'+esc(x.backUrl)+'" target="_blank" rel="noopener">Back image</a>':'')+'</div>';
   return card(x.documentType,who,'<p>AI: '+esc(x.aiReviewStatus)+' · Confidence: '+esc(x.confidence||'n/a')+'</p><p>Review reason: '+esc(x.reason||'No issue')+'</p>', 'kyc',x.id,images);
  }
  return card('$'+x.amount+' request · '+esc(x.status),who,'<p>Fee: $'+esc(x.feeAmount)+' · Net: $'+esc(x.netAmount)+'</p><p>Destination: <code>'+esc(x.destinationAddress)+'</code></p><p>'+esc(x.payoutError||'')+(x.payoutTxid?' · TXID '+esc(x.payoutTxid):'')+'</p>', 'withdrawal',x.id,'<small>Submitted '+esc(date(x.submittedAt))+'</small>',x.status);
 }).join('');
 root.innerHTML=shell('<section><h1>Operations queues</h1><p>Identity images are private and temporary review links expire after 10 minutes.</p>'+nav+(items.length?list:'<p>No items are waiting in this queue.</p>')+'<button data-action="logout">Sign out</button></section>');
}
function render(){if(state.profile)renderQueues();else renderLogin();}
async function login(e){
 e.preventDefault();var email=document.getElementById('adminEmail').value,password=document.getElementById('adminPassword').value;state.busy=true;state.error='';render();
 try{
  await service.signIn(email,password);
  var result=await service.claimAegisPayProfile();
  if(!result.profile||result.profile.role!=='MASTER ADMIN')throw new Error('Master Admin role is required.');
  state.profile=result.profile;await loadQueues();
 }catch(err){await service.signOut().catch(function(){});state.profile=null;state.error=err.message||'Sign-in failed.';}
 finally{state.busy=false;render();}
}
async function loadQueues(){
 var response=await service.client().functions.invoke('admin-queues',{body:{}});
 if(response.error)throw response.error;
 state.queues=response.data||{deposits:[],kyc:[],withdrawals:[]};
}
async function review(el){
 if(state.busy)return;state.busy=true;state.error='';render();
 try{
  var result=await service.client().functions.invoke('admin-review',{body:{action:el.getAttribute('data-kind'),id:el.getAttribute('data-id'),decision:el.getAttribute('data-decision')}});
  if(result.error)throw result.error;
  if(el.getAttribute('data-kind')==='withdrawal'&&el.getAttribute('data-decision')==='approve'){
   var payout=await service.client().functions.invoke('execute-payout',{body:{withdrawalId:el.getAttribute('data-id')}});
   if(payout.error)throw new Error('Approval saved, but payout needs attention: '+(payout.error.message||'payout service failed'));
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
 if(state.busy)return;state.busy=true;state.error='';render();
 try{
  var result=await service.client().functions.invoke('execute-payout',{body:{withdrawalId:el.getAttribute('data-id')}});
  if(result.error)throw result.error;
  if(!result.data||result.data.status!=='PAID')throw new Error((result.data&&result.data.error)||'Payout needs manual reconciliation.');
  await loadQueues();
 }catch(err){state.error=err.message||'The payout could not be completed.';await loadQueues().catch(function(){});}
 finally{state.busy=false;render();}
}
root.addEventListener('submit',function(e){if(e.target.id==='adminLogin')login(e);});
root.addEventListener('click',function(e){
 var el=e.target.closest('[data-action]');if(!el)return;var a=el.getAttribute('data-action');
 if(a==='tab'){state.tab=el.getAttribute('data-tab');render();}
 if(a==='refresh'){state.busy=true;loadQueues().catch(function(err){state.error=err.message||'Queue load failed.';}).finally(function(){state.busy=false;render();});}
 if(a==='logout'){service.signOut().finally(function(){state.profile=null;state.queues={deposits:[],kyc:[],withdrawals:[]};render();});}
 if(a==='review')review(el);
 if(a==='payout')retryPayout(el);
});
async function boot(){
 render();if(!service||!service.isAvailable()){state.error='Secure sign-in is unavailable.';render();return;}
 try{var session=await service.session();if(session){var result=await service.claimAegisPayProfile();if(result.profile.role==='MASTER ADMIN'){state.profile=result.profile;await loadQueues();}else await service.signOut();}}
 catch(e){state.profile=null;}
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
