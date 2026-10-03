(function(){
'use strict';
var root=document.getElementById('app');
var service=window.AegisSupabaseService;
var state={phase:'loading',mode:(new URLSearchParams((location.hash||'').replace(/^#/, '')).get('type')==='invite'||new URLSearchParams((location.hash||'').replace(/^#/, '')).get('type')==='recovery')?'password-update':'login',profile:null,data:{deposits:[],withdrawals:[],kyc:null},catalog:[],cart:[],shopCategory:'All',referralTab:'list',message:'',messageTone:'error',appEnabled:null,runtimeUnverified:false};
var busy=false,profileRequest=null,runtimeRequest=null,runtimeTimer=null;
var detected=/^ur(?:-|$)/i.test((navigator.languages||[navigator.language||'en'])[0]||'en')?'ur':'en';
var saved=null;try{saved=localStorage.getItem('aegispay-language');}catch(e){}
var locale=saved==='ur'?'ur':saved==='en'?'en':detected;
var askLanguage=!saved;
var copy={
 en:{
  language:'Language',detected:'We detected your device language. Choose English or Urdu.',english:'English',urdu:'Urdu',continue:'Continue',
  loading:'Checking secure connection',checking:'Verifying account',wait:'Please wait while AegisPay checks your secure sign-in.',pausedTitle:'AegisPay is paused',pausedInfo:'The service is temporarily paused by the Master Admin. Please try again later.',runtimeUnknown:'Secure service status could not be checked. Reconnect and try again.',retryRuntime:'Check again',invalidCredentials:'That email and password did not match. Check them and try again.',verifyEmail:'Verify your email from the confirmation message, then sign in.',
  welcome:'Welcome to AegisPay',signInText:'Sign in or create a client account.',email:'Email',password:'Password',name:'Full name',
  signIn:'Sign in',signingIn:'Signing in…',create:'Create account',creating:'Creating account…',forgot:'Forgot password?',haveAccount:'Already have an account?',newAccount:'New to AegisPay?',
  referral:'Referral code (optional)',passwordHint:'Use at least 8 characters.',signupSent:'Account created successfully. You can sign in now.',
  resetTitle:'Reset your password',resetText:'Enter your email and we will send recovery instructions.',sendReset:'Send recovery email',back:'Back to sign in',
  updateTitle:'Choose a new password',confirmPassword:'Confirm password',savePassword:'Save password',
  hi:'Hello',balance:'Available balance',principal:'Principal',profit:'Profit',kyc:'Identity verification',kycDone:'Verified',kycNeeded:'Required before a withdrawal',
  deposits:'Deposits',deposit:'Submit deposit',tier:'Deposit tier',amount:'Amount (USDT)',txid:'TRON transaction ID',proof:'Payment screenshot (required)',submit:'Submit for verification',
  depositHelp:'Your screenshot is privately uploaded and may be reviewed by the configured AI service. Balance is credited only after evidence review and a confirmed matching on-chain transfer.',
  withdraw:'Withdrawals',wallet:'TRON wallet address',walletOwner:'Wallet owner name',linkWallet:'Link wallet',withdrawAmount:'Withdrawal amount (minimum $50)',requestWithdraw:'Request withdrawal',
  kycTitle:'Complete KYC once',documentType:'Document type',cnic:'CNIC / national ID',passport:'Passport',front:'Front image / passport photo page',backImage:'Back image (CNIC only)',consent:'I agree that AegisPay and its configured AI review provider may process these images to check readability and compare the document name with my profile.',
  submitKyc:'Submit identity images',kycHelp:'If an image is blurry or details do not match your profile, upload a clear and correct image again. Withdrawals stay locked until KYC is verified.',
  history:'Recent activity',status:'Status',date:'Date',logout:'Sign out',refCode:'Your referral code',loadingData:'Loading your account…',save:'Save language',
  pending:'Pending review',empty:'No records yet.',network:'Deposits are currently configured for TRON test network. Never send real funds to a test address.',
  ok:'Request submitted.',shopTitle:'AegisPay Shop',shopReady:'Your assigned Shop tasks are ready.',shopEmpty:'No active Shop cycle yet. A verified deposit will create your task set.',completeTask:'Complete task',taskCompleted:'Completed',cycleOpen:'Tasks open',cycleWaiting:'18-hour settlement',remaining:'Remaining',referralsTitle:'Referrals',level1:'Level 1',level2:'Level 2',referralBonus:'Referral bonus',notificationsTitle:'Notifications',aiTitle:'Aegis AI Help',aiHint:'Ask about deposit, Shop, withdrawal, KYC or referrals.',withdrawTelegramPending:'Withdrawal submitted. Telegram could not be reached, so an administrator must resend the approval request.',chooseFile:'Choose an image file.',fileTooLarge:'Each image must be smaller than 10 MB.',walletLinked:'Wallet linked.',withdrawKyc:'Complete KYC before requesting a withdrawal.',
  uploadBusy:'Uploading securely…',error:'Something went wrong. Please try again.',unavailable:'Secure sign-in is unavailable. Refresh and try again.'
 },
 ur:{
  language:'Zaban',detected:'Aapke device ki zaban detect hui hai. English ya Urdu chunein.',english:'English',urdu:'Urdu',continue:'Jaari rakhein',
  loading:'Secure connection check ho raha hai',checking:'Account verify ho raha hai',wait:'AegisPay aapka secure sign-in check kar raha hai.',pausedTitle:'AegisPay waqti tor par band hai',pausedInfo:'Master Admin ne service waqti tor par pause ki hai. Baad mein dobara koshish karein.',runtimeUnknown:'Secure service status check nahi ho saka. Connection dobara check karein.',retryRuntime:'Dobara check karein',invalidCredentials:'Email ya password match nahi hua. Dono check karke dobara koshish karein.',verifyEmail:'Pehle confirmation email se email verify karein, phir sign in karein.',
  welcome:'AegisPay mein khush aamdeed',signInText:'Sign in karein ya client account banayein.',email:'Email',password:'Password',name:'Poora naam',
  signIn:'Sign in',signingIn:'Sign in ho raha hai…',create:'Account banayein',creating:'Account ban raha hai…',forgot:'Password bhool gaye?',haveAccount:'Pehle se account hai?',newAccount:'AegisPay par naye hain?',
  referral:'Referral code (optional)',passwordHint:'Kam az kam 8 characters rakhein.',signupSent:'Account successfully ban gaya hai. Ab aap sign in kar sakte hain.',
  resetTitle:'Password reset karein',resetText:'Apni email dein, hum recovery instructions bhejenge.',sendReset:'Recovery email bhejein',back:'Sign in par wapas',
  updateTitle:'Naya password chunein',confirmPassword:'Password dobara likhein',savePassword:'Password save karein',
  hi:'Assalam-o-alaikum',balance:'Available balance',principal:'Principal',profit:'Profit',kyc:'Shanakht ki tasdeeq',kycDone:'Verified',kycNeeded:'Withdrawal se pehle zaroori',
  deposits:'Deposits',deposit:'Deposit submit karein',tier:'Deposit tier',amount:'Amount (USDT)',txid:'TRON transaction ID',proof:'Payment screenshot (zaroori)',submit:'Verification ke liye bhejein',
  depositHelp:'Aapka screenshot private upload hoga aur configured AI service usay review kar sakti hai. Evidence review aur matching confirmed on-chain transfer ke baad hi balance credit hoga.',
  withdraw:'Withdrawals',wallet:'TRON wallet address',walletOwner:'Wallet malik ka naam',linkWallet:'Wallet link karein',withdrawAmount:'Withdrawal amount (kam az kam $50)',requestWithdraw:'Withdrawal request karein',
  kycTitle:'KYC aik martaba mukammal karein',documentType:'Document ki qisam',cnic:'CNIC / national ID',passport:'Passport',front:'Front image / passport photo page',backImage:'Back image (sirf CNIC)',consent:'Main razamand hoon ke AegisPay aur uska configured AI review provider in tasveeron ko readability aur profile name se milan ke liye process karein.',
  submitKyc:'Identity images bhejein',kycHelp:'Agar image blur ho ya details profile se match na karein to saaf aur durust image dobara upload karein. KYC verify hone tak withdrawal band rahega.',
  history:'Haal ki activity',status:'Status',date:'Tareekh',logout:'Sign out',refCode:'Aapka referral code',loadingData:'Account load ho raha hai…',save:'Zaban save karein',
  pending:'Review pending',empty:'Abhi koi record nahi.',network:'Deposits abhi TRON test network par configured hain. Test address par real funds na bhejein.',
  ok:'Request submit ho gayi.',shopTitle:'AegisPay Shop',shopReady:'Aapke assigned Shop tasks ready hain.',shopEmpty:'Abhi active Shop cycle nahi hai. Verified deposit ke baad task set create hoga.',completeTask:'Task complete karein',taskCompleted:'Mukammal',cycleOpen:'Tasks open',cycleWaiting:'18 ghante ka settlement',remaining:'Baqi',referralsTitle:'Referrals',level1:'Level 1',level2:'Level 2',referralBonus:'Referral bonus',notificationsTitle:'Notifications',aiTitle:'Aegis AI Help',aiHint:'Deposit, Shop, withdrawal, KYC ya referrals ke bare mein poochein.',withdrawTelegramPending:'Withdrawal submit ho gayi. Telegram se rabta nahi ho saka, is liye Admin ko approval dobara bhejni hogi.',chooseFile:'Image file select karein.',fileTooLarge:'Har image 10 MB se chhoti honi chahiye.',walletLinked:'Wallet link ho gaya.',withdrawKyc:'Withdrawal se pehle KYC mukammal karein.',
  uploadBusy:'Secure upload ho raha hai…',error:'Masla hua. Dobara koshish karein.',unavailable:'Secure sign-in unavailable hai. Page refresh karke dobara try karein.'
 }
};
function t(k){return copy[locale][k]||copy.en[k]||k;}
function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function money(v){return Number(v||0).toLocaleString(locale==='ur'?'ur-PK':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' USDT';}
function shell(body,page){
 document.documentElement.lang=locale;document.documentElement.dir=locale==='ur'?'rtl':'ltr';
 var wide=page==='dashboard';
 return '<main class="tg-page '+(wide?'tg-page-dashboard':'')+'"><section class="tg-card '+(wide?'tg-card-dashboard':'tg-card-auth')+'">'+
 '<header class="tg-topbar"><div class="tg-brand"><img src="./aegispay-logo.svg" width="42" height="42" alt=""><span><b>Aegis<span>Pay</span></b><small>SINCE 2023 — 2026 · SECURE CLIENT PORTAL</small></span></div>'+ 
 '<label class="tg-language">'+t('language')+'<select data-action="language"><option value="en" '+(locale==='en'?'selected':'')+'>English</option><option value="ur" '+(locale==='ur'?'selected':'')+'>Urdu</option></select></label></header>'+ 
 (askLanguage&&!wide?'<div class="tg-language-hint">'+t('detected')+' <button type="button" data-action="keep-language" class="tg-button tg-button-soft">'+t('continue')+'</button></div>':'')+
 (state.message?'<div role="status" aria-live="polite" class="tg-alert '+(state.messageTone==='success'?'is-success':'is-error')+'">'+esc(state.message)+'</div>':'')+body+
 '<footer class="tg-footer">AegisPay · Secure account access</footer></section></main>';
}
function field(label,id,type,attrs){return '<div class="field"><label for="'+id+'">'+label+'</label><div class="field-wrap"><input id="'+id+'" name="'+id+'" type="'+type+'" '+(attrs||'')+(id==='signupReferral'?'':' required')+'></div></div>';}
function renderAuth(){
 if(state.phase==='loading'||busy){root.innerHTML=shell('<section class="tg-loading" role="status"><span class="tg-spinner" aria-hidden="true"></span><h1>'+esc(busy?(state.mode==='signup'?t('creating'):t('signingIn')):t('checking'))+'</h1><p>'+esc(busy?'Connecting securely to AegisPay…':t('wait'))+'</p></section>','auth');return;}
 var body='';
 if(state.mode==='signup'){
  body='<div class="auth-hero"><h1>'+t('create')+'</h1><p>'+t('signInText')+'</p></div><form id="signupForm">'+field(t('name'),'signupName','text','autocomplete="name" maxlength="100"')+field(t('email'),'signupEmail','email','autocomplete="email"')+field(t('password'),'signupPassword','password','autocomplete="new-password" minlength="8"')+
  '<small>'+t('passwordHint')+'</small>'+field(t('referral'),'signupReferral','text','autocomplete="off" maxlength="32"')+'<button class="primary" type="submit" '+(busy?'disabled':'')+'>'+(busy?t('creating'):t('create'))+'</button></form><p>'+t('haveAccount')+' <button class="ghost-dark" data-action="login">'+t('signIn')+'</button></p>';
 }else if(state.mode==='reset'){
  body='<div class="auth-hero"><h1>'+t('resetTitle')+'</h1><p>'+t('resetText')+'</p></div><form id="resetForm">'+field(t('email'),'resetEmail','email','autocomplete="email"')+'<button class="primary" type="submit">'+t('sendReset')+'</button></form><button class="ghost-dark" data-action="login">'+t('back')+'</button>';
 }else if(state.mode==='password-update'){
  body='<div class="auth-hero"><h1>'+t('updateTitle')+'</h1></div><form id="passwordForm">'+field(t('password'),'newPassword','password','autocomplete="new-password" minlength="8"')+field(t('confirmPassword'),'confirmPassword','password','autocomplete="new-password" minlength="8"')+'<button class="primary" type="submit">'+t('savePassword')+'</button></form>';
 }else{
  body='<div class="auth-hero"><span class="tg-kicker">PRIVATE · SECURE · SIMPLE</span><h1>'+t('welcome')+'</h1><p>'+t('signInText')+'</p></div><form id="loginForm">'+field(t('email'),'loginEmail','email','autocomplete="username"')+field(t('password'),'loginPassword','password','autocomplete="current-password"')+'<button class="primary" type="submit" '+(busy?'disabled':'')+'>'+(busy?t('signingIn'):t('signIn'))+'</button></form><div class="tg-auth-links"><button class="ghost-dark" data-action="reset">'+t('forgot')+'</button><button class="ghost-dark" data-action="signup">'+t('newAccount')+'</button></div>';
 }
 root.innerHTML=shell('<section class="tg-auth-content">'+body+'</section>','auth');
 var ref=new URLSearchParams(location.search).get('ref');var refInput=document.getElementById('signupReferral');if(refInput&&ref)refInput.value=ref.toUpperCase();
}
function setMessage(msg,tone){state.message=msg;state.messageTone=tone||'error';}
function authError(e){
 var message=String(e&&e.message||'');
 if(/invalid login credentials/i.test(message))return t('invalidCredentials');
 if(/email not confirmed|not confirmed/i.test(message))return t('verifyEmail');
 if(/failed to fetch|network request failed|load failed/i.test(message))return 'Connection issue. Check your internet and try again.';
 return message||t('error');
}
function rememberLanguage(next){
 locale=next==='ur'?'ur':'en';askLanguage=false;
 try{localStorage.setItem('aegispay-language',locale);}catch(e){}
 if(state.profile&&service&&service.setPreferredLanguage)service.setPreferredLanguage(locale).catch(function(){});
 render();
}
async function refreshProfile(){
 if(profileRequest)return profileRequest;
 profileRequest=(async function(){
  try{
   var result=await service.claimAegisPayProfile();
   if(result.profile.role==='MASTER ADMIN'){location.href='./master-admin.html';return;}
   if(result.profile.role!=='USER')throw new Error('This account does not have client access.');
   state.profile=result.profile;
   if(result.profile.preferred_language==='ur'||result.profile.preferred_language==='en'){
    try{if(!localStorage.getItem('aegispay-language'))locale=result.profile.preferred_language;}catch(e){}
   }
   await refreshData();state.mode='dashboard';state.phase='ready';state.message='';render();
  }catch(e){state.profile=null;state.phase='ready';state.mode='login';setMessage(authError(e));render();}
  finally{profileRequest=null;}
 })();
 return profileRequest;
}
async function refreshData(){
 var c=service.client(),p=state.profile;if(!c||!p)return;
 var results=await Promise.all([
  c.from('users').select('id,name,email,role,status,current_platform_balance,principal_balance,profit_balance,manual_credit_balance,withdrawal_held,destination_address,withdrawal_wallet_owner_name,preferred_language,referral_code,first_deposit_done,selected_tier_id,created_at').eq('id',p.id).maybeSingle(),
  c.from('deposit_submissions').select('id,tier_id,gross_amount,credited_amount,status,ai_review_status,verification_note,created_at').eq('user_id',p.id).order('created_at',{ascending:false}).limit(10),
  c.from('withdrawal_requests').select('id,amount,fee_amount,net_amount,status,created_at').eq('user_id',p.id).order('created_at',{ascending:false}).limit(10),
  c.from('kyc_verifications').select('id,document_type,status,ai_review_status,review_reason,submitted_at').eq('user_id',p.id).order('submitted_at',{ascending:false}).limit(1),
  c.from('tasks').select('id,user_id,cycle_id,title,status,progress,reward,task_value,offer_id,start_date,due_date,completion_date').eq('user_id',p.id).order('start_date',{ascending:false}).limit(100),
  c.from('cycle_runs').select('id,user_id,tier_id,cycle_base,status,task_completed_at,ready_at,settled_at,profit_amount,created_at,source_deposit_id').eq('user_id',p.id).order('created_at',{ascending:false}).limit(1),
  c.from('referrals').select('id,user_id,referred_user_id,referral_level,platform_reward,created_at').eq('user_id',p.id).order('created_at',{ascending:false}).limit(100),
  c.from('notifications').select('id,notification_type,title,body,is_read,created_at').eq('user_id',p.id).order('created_at',{ascending:false}).limit(30),
  c.from('shop_offers').select('id,title,subtitle,task_level,tier_min_id,reward_text,status,instructions,created_at,updated_at,product_id').eq('status','ACTIVE').order('created_at',{ascending:false}).limit(30),
  c.from('vip_tiers').select('id,name,deposit_amount,initial_profit,enabled,display_order,color_key').eq('enabled',true).order('display_order',{ascending:true})
 ]);
 var profileRes=results[0],depositsRes=results[1],withdrawalsRes=results[2],kycRes=results[3],tasksRes=results[4],cycleRes=results[5],refsRes=results[6],notificationsRes=results[7],offersRes=results[8],tiersRes=results[9];
 if(profileRes.error)throw profileRes.error;
 state.profile=profileRes.data||p;
 state.data={
  deposits:depositsRes&&depositsRes.data||[],
  withdrawals:withdrawalsRes&&withdrawalsRes.data||[],
  kyc:kycRes&&kycRes.data&&kycRes.data[0]||null,
  tasks:tasksRes&&tasksRes.data||[],
  cycle:cycleRes&&cycleRes.data&&cycleRes.data[0]||null,
  referrals:refsRes&&refsRes.data||[],
  notifications:notificationsRes&&notificationsRes.data||[],
  offers:offersRes&&offersRes.data||[],
  tiers:tiersRes&&tiersRes.data||[]
 };
 if(depositsRes&&depositsRes.error)state.data.deposits=[];
 if(withdrawalsRes&&withdrawalsRes.error)state.data.withdrawals=[];
 if(kycRes&&kycRes.error)state.data.kyc=null;
 if(tasksRes&&tasksRes.error)state.data.tasks=[];
 if(cycleRes&&cycleRes.error)state.data.cycle=null;
 if(refsRes&&refsRes.error)state.data.referrals=[];
 if(notificationsRes&&notificationsRes.error)state.data.notifications=[];
 if(offersRes&&offersRes.error)state.data.offers=[];
 if(tiersRes&&tiersRes.error)state.data.tiers=[];
}
function date(v){try{return new Date(v).toLocaleString(locale==='ur'?'ur-PK':'en-US');}catch(e){return v||'';}}
function statusBadge(v){return '<span style="display:inline-block;padding:4px 8px;border-radius:99px;background:#edf3fa;color:#314760;font-size:12px">'+esc(String(v||'Pending').split('_').join(' '))+'</span>';}
function historyTable(title,rows,kind){
 var cells=rows.length?rows.map(function(r){
  var amount=kind==='deposit'?r.gross_amount:r.amount;
  var status=kind==='deposit'?(r.ai_review_status==='APPROVED'&&r.status==='PENDING_VERIFICATION'?'CHAIN CHECK':r.status):r.status;
  return '<tr><td>'+esc(date(r.created_at))+'</td><td>'+money(amount)+'</td><td>'+statusBadge(status)+'</td></tr>';
 }).join(''):'<tr><td colspan="3">'+t('empty')+'</td></tr>';
 return '<section class="section" style="margin-top:18px"><h3>'+title+'</h3><div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>'+t('date')+'</th><th>'+t('amount')+'</th><th>'+t('status')+'</th></tr></thead><tbody>'+cells+'</tbody></table></div></section>';
}

function cycleCountdown(readyAt){
 var ms=new Date(readyAt||0).getTime()-Date.now();
 if(!readyAt||!Number.isFinite(ms))return '—';
 if(ms<=0)return 'Ready for settlement';
 var total=Math.floor(ms/1000),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
 return h+'h '+String(m).padStart(2,'0')+'m '+String(s).padStart(2,'0')+'s';
}
function shopSection(d){
 var cycle=d.cycle,tasks=d.tasks||[],offers=d.offers||[];
 if(!cycle)return '<section class="section" style="margin-top:18px"><h3>'+t('shopTitle')+'</h3><p>'+t('shopEmpty')+'</p></section>';
 var current=tasks.filter(function(x){return x.cycle_id===cycle.id;});
 var done=current.filter(function(x){return x.status==='Completed';}).length;
 var remaining=current.filter(function(x){return x.status!=='Completed';}).reduce(function(a,x){return a+Number(x.task_value||0);},0);
 var offerRows=offers.map(function(o){return '<article style="padding:11px;margin-top:7px;border:1px solid #e6eef3;border-radius:12px;background:#fff"><strong>'+esc(o.title)+'</strong><p style="margin:4px 0">'+esc(o.subtitle||o.instructions||'Assigned Shop task')+'</p><small>Tier '+esc(o.tier_min_id||'Any')+' · '+esc(o.reward_text||'Cycle task')+'</small></article>';}).join('');
 var taskRows=current.map(function(x){var complete=x.status==='Completed';return '<article style="padding:13px;margin-top:9px;border:1px solid #e2edf4;border-radius:14px;background:#fbfdff"><div style="display:flex;justify-content:space-between;gap:12px"><div><strong>'+esc(x.title)+'</strong><p style="margin:5px 0">'+esc(x.description||'Complete the assigned Shop step.')+'</p><small>Task value '+money(x.task_value)+' · Reward '+money(x.reward)+'</small></div><div style="text-align:right;min-width:105px"><small>'+esc(x.status)+'</small><div style="margin-top:4px;font-weight:800;color:#1c789e">'+Number(x.progress||0)+'%</div>'+(complete?'':'<button class="primary" style="margin-top:7px;min-height:38px;padding:0 10px" data-action="complete-task" data-id="'+esc(x.id)+'">'+t('completeTask')+'</button>')+'</div></div></article>';}).join('');
 return '<section class="section" style="margin-top:18px" id="shop"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><h3>'+t('shopTitle')+'</h3><p style="margin:4px 0">'+t('shopReady')+'</p></div><strong>'+done+'/'+current.length+'</strong></div><div style="margin-top:10px;padding:12px;border-radius:13px;background:#f3fbff;border:1px solid #d8edf6"><div style="display:flex;justify-content:space-between"><span>'+t('cycleOpen')+'</span><strong>'+money(cycle.cycle_base)+'</strong></div><div style="display:flex;justify-content:space-between;margin-top:5px"><span>'+t('remaining')+'</span><strong>'+money(remaining)+'</strong></div><div style="display:flex;justify-content:space-between;margin-top:5px"><span>Status</span><strong>'+esc(cycle.status)+'</strong></div>'+(cycle.status==='WAITING_18H'?'<div id="cycleCountdown" data-ready="'+esc(cycle.ready_at||'')+'" style="margin-top:7px;color:#19769c;font-weight:800">'+cycleCountdown(cycle.ready_at)+'</div>':'')+'</div><div style="margin-top:14px"><strong>'+t('shopTitle')+' Offers</strong>'+(offerRows||'<p>'+t('empty')+'</p>')+'</div>'+taskRows+'</section>';
}
function referralsSection(d){
 var refs=d.referrals||[],l1=refs.filter(function(x){return x.referral_level===1;}).length,l2=refs.filter(function(x){return x.referral_level===2;}).length,reward=refs.reduce(function(a,x){return a+Number(x.platform_reward||0);},0);
 var link=location.origin+location.pathname+'?ref='+encodeURIComponent(state.profile&&state.profile.referral_code||'');
 return '<section class="section" style="margin-top:18px"><h3>'+t('referralsTitle')+'</h3><div class="stats-grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px"><div class="stat-card"><small>'+t('level1')+'</small><strong>'+l1+'</strong></div><div class="stat-card"><small>'+t('level2')+'</small><strong>'+l2+'</strong></div><div class="stat-card"><small>'+t('referralBonus')+'</small><strong>'+money(reward)+'</strong></div></div><div style="margin-top:10px;padding:10px;border-radius:12px;background:#f7fbfd;border:1px solid #e4edf3;overflow-wrap:anywhere"><small>'+esc(link)+'</small><button class="ghost-dark" style="margin-left:8px" data-action="copy-ref">'+t('save')+'</button></div></section>';
}
function notificationsSection(d){
 var ns=d.notifications||[];
 return '<section class="section" style="margin-top:18px"><h3>'+t('notificationsTitle')+'</h3>'+(ns.length?ns.map(function(n){return '<article style="padding:10px 0;border-bottom:1px solid #edf2f6"><div style="display:flex;justify-content:space-between;gap:8px"><strong>'+esc(n.title)+'</strong><small>'+esc(date(n.created_at))+'</small></div><p style="margin:4px 0">'+esc(n.body)+'</p></article>';}).join(''):'<p>'+t('empty')+'</p>')+'</section>';
}
function aiAnswer(q){
 q=String(q||'').toLowerCase();
 if(q.indexOf('deposit')>=0)return 'Select your tier, send the configured TRON amount, then submit the screenshot and TXID. Balance is credited only after evidence review and a confirmed matching transfer.';
 if(q.indexOf('shop')>=0||q.indexOf('task')>=0)return 'A verified deposit creates your Shop cycle. Complete every assigned task. When all tasks are complete, the 18-hour settlement timer starts.';
 if(q.indexOf('withdraw')>=0)return 'KYC must be verified and a withdrawal wallet linked. Withdrawal requests require Master Admin approval plus the configured Telegram approval.';
 if(q.indexOf('referral')>=0)return 'Qualifying verified first deposits create the configured referral rewards for the eligible levels.';
 if(q.indexOf('kyc')>=0)return 'Upload clear CNIC or Passport images. Withdrawals remain locked until KYC verification is complete.';
 return 'I can help with Deposit, Shop, Tasks, Withdrawal, KYC and Referrals.';
}
function aiSection(){
 return '<section class="section" style="margin-top:18px"><h3>'+t('aiTitle')+'</h3><p>'+t('aiHint')+'</p><div id="aiReply" style="padding:10px;border-radius:12px;background:#f6fbfe;color:#45667b;font-size:13px">'+aiAnswer('')+'</div><form id="aiForm" style="display:flex;gap:8px;margin-top:10px"><input id="aiInput" type="text" placeholder="'+t('aiHint')+'" style="flex:1"><button class="primary" type="submit">Ask</button></form></section>';
}
function updateCycleCountdown(){
 var el=document.getElementById('cycleCountdown');if(el)el.textContent=cycleCountdown(el.getAttribute('data-ready')||'');
}

function renderDashboard(){
 var p=state.profile||{},d=state.data||{},tiers=d.tiers||[],refs=d.referrals||[],kyc=d.kyc;
 var balance=Number(p.current_platform_balance||0),principal=Number(p.principal_balance||0),profit=Number(p.profit_balance||0);
 var referralCode=p.referral_code||'AP-CLIENT',referralLink=location.origin+location.pathname+'?ref='+encodeURIComponent(referralCode);
 var unread=(d.notifications||[]).filter(function(n){return !n.is_read;}).length;
 var selectedTierId=p.selected_tier_id||'';
 var selectedTier=tiers.find(function(x){return x.id===selectedTierId;})||tiers[0]||null;
 var tierOptions=tiers.map(function(x){return '<option value="'+esc(x.id)+'" '+(selectedTier&&x.id===selectedTier.id?'selected':'')+'>LV '+esc(x.display_order||'')+' — '+esc(x.name||'Tier')+' · '+money(x.deposit_amount)+'</option>';}).join('');
 var products=[
  {name:'Apple iPhone 15 (128GB)',price:699,old:829,rating:'4.8',reviews:'2,341',discount:'15% OFF',image:'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&w=900&q=88',cat:'Electronics',desc:'Premium smartphone with advanced camera system and a high-resolution display.'},
  {name:'Apple AirPods Pro 2',price:199,old:259,rating:'4.7',reviews:'1,892',discount:'22% OFF',image:'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=88',cat:'Electronics',desc:'Wireless earbuds with active noise cancellation and a compact charging case.'},
  {name:'Samsung Galaxy S24',price:699,old:879,rating:'4.7',reviews:'1,120',discount:'20% OFF',image:'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=88',cat:'Electronics',desc:'Modern smartphone with a bright display and advanced everyday performance.'},
  {name:'MacBook Air M2 (13")',price:999,old:1219,rating:'4.8',reviews:'3,042',discount:'18% OFF',image:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=88',cat:'Electronics',desc:'Lightweight laptop for work, study and everyday productivity.'},
  {name:'Sony WH-1000XM5',price:349,old:469,rating:'4.8',reviews:'2,875',discount:'25% OFF',image:'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=88',cat:'Electronics',desc:'Premium wireless noise-cancelling headphones.'},
  {name:'Apple Watch Series 9',price:299,old:429,rating:'4.7',reviews:'1,754',discount:'30% OFF',image:'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=88',cat:'Electronics',desc:'Smart watch with activity tracking and notifications.'},
  {name:'Classic Sunglasses',price:15.99,old:24.99,rating:'4.6',reviews:'486',discount:'New',image:'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=88',cat:'Fashion',desc:'Classic everyday sunglasses with a lightweight frame.'},
  {name:'Travel Water Bottle',price:12.99,old:19.99,rating:'4.7',reviews:'731',discount:'Popular',image:'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=88',cat:'Sports',desc:'Insulated bottle for daily hydration and outdoor use.'},
  {name:'Everyday Backpack',price:54.99,old:79.99,rating:'4.7',reviews:'902',discount:'Featured',image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=88',cat:'Fashion',desc:'Practical everyday backpack for work and travel.'},
  {name:'Premium Sports Shoe',price:219,old:299,rating:'4.7',reviews:'1,064',discount:'Featured',image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=88',cat:'Sports',desc:'Premium athletic shoe designed for comfortable everyday movement.'}
 ];
 state.catalog=products;
 try{state.cart=JSON.parse(localStorage.getItem('aegispay-cart')||'[]');if(!Array.isArray(state.cart))state.cart=[];}catch(e){state.cart=[];}

 function icon(type){
  var m={
   bell:'<svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
   user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4"/><path d="M5 21c.7-4 3-6 7-6s6.3 2 7 6"/></svg>',
   mail:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
   calendar:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>',
   copy:'<svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
   card:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 9h18M7 14h3"/></svg>',
   cart:'<svg viewBox="0 0 24 24"><path d="M3 4h2l2 11h11l2-8H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg>',
   wallet:'<svg viewBox="0 0 24 24"><path d="M4 6h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14"/><path d="M16 13h5"/></svg>',
   btc:'<svg viewBox="0 0 24 24"><path d="M8 4v16M12 4v16M6 7h7a3 3 0 0 1 0 6H6h8a3 3 0 0 1 0 6H6"/><path d="M5 4h2M5 20h2"/></svg>',
   crown:'<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="m3 7 5 4 4-8 4 8 5-4-2 12H5L3 7Z"/></svg>',
   users:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20c.6-4 2.8-6 6-6s5.4 2 6 6M15 16c2.8.1 4.8 1.5 5.2 4"/></svg>',
   home:'<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8v9H5v-7h14"/></svg>',
   cube:'<svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>',
   ai:'<svg viewBox="0 0 24 24"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M4 13h3v5H4zM17 13h3v5h-3zM20 18c0 2-2 3-5 3"/></svg>',
   back:'<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
   heart:'<svg viewBox="0 0 24 24"><path d="M20 8.5C20 14 12 20 12 20S4 14 4 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 2.5Z"/></svg>',
   search:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>',
   pin:'<svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
   camera:'<svg viewBox="0 0 24 24"><path d="M4 7h3l2-2h6l2 2h3v12H4V7Z"/><circle cx="12" cy="13" r="3.5"/></svg>',
   grid:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
   phone:'<svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="3"/><path d="M10 18h4"/></svg>',
   fashion:'<svg viewBox="0 0 24 24"><path d="m8 5 4-2 4 2 3 4-3 2v10H8V11L5 9l3-4Z"/></svg>',
   home2:'<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8v9H5v-7h14"/></svg>',
   beauty:'<svg viewBox="0 0 24 24"><path d="M8 3h8v4l-2 2v10H10V9L8 7V3Z"/></svg>',
   game:'<svg viewBox="0 0 24 24"><path d="M7 8h10a5 5 0 0 1 4.7 6.7l-1.2 3.1a2 2 0 0 1-3.4.6L15 16H9l-2.1 2.4a2 2 0 0 1-3.4-.6l-1.2-3.1A5 5 0 0 1 7 8Z"/></svg>',
   book:'<svg viewBox="0 0 24 24"><path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2-2H4V4ZM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6V4Z"/></svg>',
   sports:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 7 4 3 4-3M7 16l5-3 5 3M12 10v3"/></svg>',
   health:'<svg viewBox="0 0 24 24"><path d="M12 20S4 15.3 4 9.2A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 8 2.2C20 15.3 12 20 12 20Z"/><path d="M9 12h6M12 9v6"/></svg>',
   car:'<svg viewBox="0 0 24 24"><path d="m5 11 2-5h10l2 5 2 1v5h-2v2h-3v-2H8v2H5v-2H3v-5l2-1Z"/></svg>',
   usdt:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M7 7h10M12 7v10M8 10h8"/></svg>',
   bitcoin:'<svg viewBox="0 0 24 24"><path d="M9 4v16M13 4v16M7 7h6a3 3 0 0 1 0 6H7h7a3 3 0 0 1 0 6H7"/></svg>',
   bank:'<svg viewBox="0 0 24 24"><path d="m3 9 9-5 9 5H3Z"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/></svg>',
   gift:'<svg viewBox="0 0 24 24"><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13"/></svg>',
   whatsapp:'<svg viewBox="0 0 24 24"><path d="M12 3a8 8 0 0 0-6.9 12.1L4 21l5.9-1.1A8 8 0 1 0 12 3Z"/><path d="M9 8.5c.3 2.3 2.2 4.3 4.5 4.8l1.3-1.2c.3-.3.8-.3 1.1-.1l1.2.6"/></svg>',
   download:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 20h14"/></svg>',
   upload:'<svg viewBox="0 0 24 24"><path d="M12 21V9M7 14l5-5 5 5M5 4h14"/></svg>',
   kyc:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="9" r="2.5"/><path d="M8 16c.7-2 2-3 4-3s3.3 1 4 3"/></svg>',
   history:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2M5 6H3v2"/></svg>',
   truck:'<svg viewBox="0 0 24 24"><path d="M3 5h11v11H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
   shield:'<svg viewBox="0 0 24 24"><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
   return:'<svg viewBox="0 0 24 24"><path d="M8 7H4l3-3M4 7c2-2 4.5-3 7-3 5 0 8 3.5 8 8s-3 8-8 8H7"/></svg>'
  };
  return '<span class="ap-icon">'+(m[type]||m.grid)+'</span>';
 }

 function bottom(type){
  if(type==='home')return '<nav class="ap-bottom" data-nav="home"><button class="active" data-action="view-home">'+icon('home')+'<small>Home</small></button><button data-action="view-account">'+icon('cube')+'<small>Assets</small></button><button data-action="view-account">'+icon('user')+'<small>My Profile</small></button><button data-action="view-ai">'+icon('ai')+'<small>AI Bot</small></button></nav>';
  return '<nav class="ap-bottom" data-nav="shop"><button data-action="view-home">'+icon('home')+'<small>Home</small></button><button class="active" data-action="view-shop">'+icon('cart')+'<small>Shop</small></button><button data-action="view-orders">'+icon('cube')+'<small>Orders</small></button><button data-action="view-account">'+icon('user')+'<small>Account</small></button></nav>';
 }
 function topbar(title,right){
  return '<div class="ap-topbar"><button data-action="view-'+(title==='Shop'||title==='Product Details'?'shop':'home')+'">'+icon('back')+'</button><h2>'+esc(title)+'</h2><div class="right">'+(right||'')+'</div></div>';
 }
 var cards=products.map(function(x,i){
  return '<article class="ap-product-card" data-product-index="'+i+'" data-category="'+esc(x.cat)+'"><div class="ap-product-media"><span class="ap-discount">'+esc(x.discount)+'</span><button type="button" class="ap-fav" data-action="favorite">♡</button><img src="'+x.image+'" alt="'+esc(x.name)+'"></div><div class="ap-product-body"><h4>'+esc(x.name)+'</h4><div class="ap-rating">★★★★★ <span>'+esc(x.rating)+'</span></div><div class="ap-reviews">'+esc(x.reviews)+' reviews</div><div class="ap-price">$'+Number(x.price).toFixed(2)+' <del class="ap-old">$'+Number(x.old).toFixed(2)+'</del></div><button type="button" class="ap-add" data-action="open-product" data-product-index="'+i+'">'+icon('cart')+' Add to Cart</button></div></article>';
 }).join('');

 var categories=[
  ['All','grid'],['Electronics','phone'],['Fashion','fashion'],['Home & Kitchen','home2'],['Beauty','beauty'],
  ['Toys & Games','game'],['Books','book'],['Sports','sports'],['Health & Care','health'],['Automotive','car']
 ];
 var catButtons=categories.map(function(x,i){return '<button class="ap-cat '+(i===0?'active':'')+'" type="button" data-action="shop-category" data-category="'+esc(x[0])+'">'+icon(x[1])+'<small>'+esc(x[0])+'</small></button>';}).join('');

 var refRows=refs.length?refs.map(function(x){
  var lv=Number(x.referral_level)===2?2:1;
  return '<div class="ap-ref-row"><span class="ap-avatar">'+icon('user')+'</span><div class="ap-ref-name"><strong>'+esc(x.referred_name||x.name||'Referral')+'</strong><small>ID: '+esc(x.referred_id||x.referred_user_id||'—')+'</small><small>'+esc(date(x.created_at))+'</small></div><span class="ap-level-pill '+(lv===2?'l2':'')+'">Level '+lv+'</span><div class="ap-ref-earn '+(lv===2?'l2':'')+'"><strong>+'+Number(x.platform_reward||0).toFixed(2)+' USDT</strong><small>Referral</small></div></div>';
 }).join(''):'<div class="ap-card ap-empty"><b>No referrals yet</b><small>Your qualifying referrals will appear here.</small></div>';

 var notifications=(d.notifications||[]).map(function(n){return '<div class="ap-list-row"><strong>'+esc(n.title||'Notification')+'</strong><small>'+esc(date(n.created_at))+'</small><div style="margin-top:5px;font-size:8px;color:#626b75">'+esc(n.body||'')+'</div></div>';}).join('');
 var accountRows=[
  ['user','Client Name',p.name||'—'],['cube','Client ID',p.client_id||'AP-CLIENT'],['mail','Email',p.email||'—'],['phone','Phone',p.phone||'—'],['calendar','Registration Date',p.created_at?date(p.created_at):'—'],['shield','Status',p.status||'Active']
 ];
 var accountInfo=accountRows.map(function(r){var ico=r[0];return '<div class="ap-info-row"><span class="ap-info-icon">'+icon(ico)+'</span><div class="ap-info-copy"><span>'+esc(r[1])+'</span><strong class="'+(r[1]==='Status'?'ap-status':'')+'">'+esc(r[2])+'</strong></div></div>';}).join('');

 var body='<div class="ap-shell">'+
  '<section class="ap-screen active" id="apScreenHome">'+
   '<header class="ap-home-head"><div class="ap-head-row"><img class="ap-logo" src="./aegispay-logo.svg" alt="AegisPay"><div class="ap-head-actions"><button class="ap-head-btn" data-action="view-notifications">'+icon('bell')+(unread?'<span class="ap-badge">'+Math.min(9,unread)+'</span>':'')+'</button><button class="ap-head-btn" data-action="view-account">'+icon('user')+'</button></div></div><div class="ap-welcome"><small>Welcome,</small><h1>'+esc(p.name||'Client')+'</h1><div class="ap-client-id">Client ID: '+esc(p.client_id||'AP-CLIENT')+' <button data-action="copy-client-id">'+icon('copy')+'</button></div></div></header>'+
   '<div class="ap-levels"><div class="ap-level"><i>'+icon('crown')+'</i><strong>LV 1</strong><span>10%</span></div><div class="ap-level"><i>'+icon('crown')+'</i><strong>LV 2</strong><span>5%</span></div><div class="ap-level"><i>'+icon('crown')+'</i><strong>LV 3</strong><span>2%</span></div></div>'+
   '<div class="ap-pad"><div class="ap-grid"><button class="ap-tile blue" data-action="view-topup"><span class="ap-tile-icon">'+icon('card')+'</span><strong>Top Up</strong><small>Deposit Amount</small></button><button class="ap-tile red" data-action="view-shop"><span class="ap-tile-icon">'+icon('cart')+'</span><strong>Shop</strong><small>Amazon-style</small></button><button class="ap-tile green" data-action="view-account"><span class="ap-tile-icon">'+icon('wallet')+'</span><strong>Account Details</strong><small>View Your Account</small></button><button class="ap-tile orange" data-action="view-crypto"><span class="ap-tile-icon">'+icon('btc')+'</span><strong>Crypto</strong><small>Buy &amp; Manage</small></button></div>'+
   '<button class="ap-ref-banner" data-action="view-referral"><span class="ap-ref-icon">'+icon('users')+'</span><div><strong>Referral</strong><small>Invite Friends &amp; Earn Rewards</small></div><em>›</em></button>'+
   '<button class="ap-promo" data-action="view-shop"><div><strong>Shop Millions<br>of Products</strong><small>Everything you need in<br>one place</small></div><div class="ap-promo-art">🛒📦</div></button></div>'+bottom('home')+
  '</section>'+
  '<section class="ap-screen" id="apScreenShop">'+topbar('Shop','<span style="position:relative">'+icon('cart')+(state.cart.length?'<span class="ap-badge">'+Math.min(9,state.cart.reduce(function(a,x){return a+Number(x.qty||1)},0))+'</span>':'')+'</span>')+
   '<div class="ap-section"><div class="ap-shop-hero"><div class="brand">amazon</div><h3>Shop Millions<br>of Products</h3><p>Everything you need in one place</p><div class="boxes">📦 📦</div></div><div class="ap-search"><span>'+icon('search')+'</span><input id="apShopSearch" placeholder="Search Amazon products..."><button type="button">'+icon('camera')+'</button></div><div class="ap-delivery">'+icon('pin')+'<span>Deliver to Pakistan</span><b>›</b></div><div class="ap-cats">'+catButtons+'</div><div class="ap-deal-head"><h3>Today&#39;s Deals</h3><button type="button">See All</button></div><div class="ap-products">'+cards+'</div></div>'+bottom('shop')+
  '</section>'+
  '<section class="ap-screen" id="apScreenProduct">'+topbar('Product Details','<span style="display:flex;gap:7px;align-items:center">'+icon('heart')+'<span style="position:relative">'+icon('cart')+(state.cart.length?'<span class="ap-badge">'+Math.min(9,state.cart.reduce(function(a,x){return a+Number(x.qty||1)},0))+'</span>':'')+'</span></span>')+'<div class="ap-section"><div id="apProductDetail"></div></div></section>'+
  '<section class="ap-screen" id="apScreenTopup">'+topbar('Top Up')+'<div class="ap-section"><section class="ap-card ap-pay"><h3>Select Payment Method</h3><button class="ap-method active" type="button" data-action="payment-method" data-method="TRC20"><span class="ap-method-icon">'+icon('usdt')+'</span><span class="ap-method-copy"><strong>USDT (TRC20)</strong><small>Fast, Low Fees</small></span><span class="ap-radio"></span></button><button class="ap-method" type="button" data-action="payment-method" data-method="ERC20"><span class="ap-method-icon">'+icon('usdt')+'</span><span class="ap-method-copy"><strong>USDT (ERC20)</strong><small>Network Fees Higher</small></span><span class="ap-radio"></span></button><button class="ap-method" type="button" data-action="payment-method" data-method="BTC"><span class="ap-method-icon">'+icon('bitcoin')+'</span><span class="ap-method-copy"><strong>Bitcoin (BTC)</strong><small>Secure &amp; Global</small></span><span class="ap-radio"></span></button><button class="ap-method" type="button" data-action="payment-method" data-method="BANK"><span class="ap-method-icon">'+icon('bank')+'</span><span class="ap-method-copy"><strong>Bank Transfer</strong><small>Local Bank Deposit</small></span><span class="ap-radio"></span></button><form id="depositForm" class="ap-form"><label class="ap-label">Deposit Tier<select id="depositTier" class="ap-field" '+(tiers.length?'':'disabled')+'>'+ (tierOptions||'<option value="">No active deposit tier configured</option>') +'</select></label><div class="ap-amount"><small>Amount (USDT)</small><strong id="depositAmountLabel">'+(selectedTier?Number(selectedTier.deposit_amount).toLocaleString():'100')+'</strong><span>USDT</span></div><input id="depositAmount" type="hidden" value="'+(selectedTier?Number(selectedTier.deposit_amount):100)+'"><div class="ap-quick"><button type="button" data-amount="50">50</button><button type="button" data-amount="100" class="active">100</button><button type="button" data-amount="500">500</button><button type="button" data-amount="1000">1,000</button></div><label class="ap-label">TRON transaction ID<input id="depositTxid" class="ap-field" type="text" minlength="64" maxlength="64" required></label><label class="ap-label">Payment screenshot<input id="depositProof" class="ap-field" type="file" accept="image/jpeg,image/png,image/webp" required></label><button class="ap-red-button" type="submit" '+(tiers.length?'':'disabled')+'>'+(tiers.length?'Generate Deposit Link →':'Awaiting Deposit Tier')+'</button></form></section></div></section>'+
  '<section class="ap-screen" id="apScreenReferral">'+topbar('Referral','<button data-action="ref-history" style="color:#fff;font-size:8px">History</button>')+'<div class="ap-section"><div class="ap-ref-hero"><h1>Invite Friends<br>Earn Rewards</h1><p>Share your unique link and earn USDT rewards when they join and make a deposit.</p><div class="gift">🎁🪙</div></div><div class="ap-ref-rewards"><div class="ap-reward"><span class="ap-icon-wrap">'+icon('users')+'</span><strong>Get 5 USDT</strong><small>When your direct referral joins<br><b>(Level 1)</b></small></div><div class="ap-reward"><span class="ap-icon-wrap">'+icon('gift')+'</span><strong>Get 2 USDT</strong><small>When your friend’s referral joins<br><b>(Level 2)</b></small></div></div><section class="ap-link-box"><strong>Your Referral Link</strong><div class="ap-ref-link"><span>'+esc(referralLink)+'</span><button data-action="copy-ref">'+icon('copy')+'</button></div><div class="ap-share"><button class="wa" data-action="share-whatsapp">'+icon('whatsapp')+' Share on WhatsApp</button><button class="link" data-action="share-ref">'+icon('users')+' Share Link</button></div></section><div class="ap-tabs"><button class="active" data-action="ref-tab" data-tab="list">My Referrals ('+refs.length+')</button><button data-action="ref-tab" data-tab="network">Network View</button></div><div class="ap-ref-list" id="apRefList">'+refRows+'</div></div></section>'+
  '<section class="ap-screen" id="apScreenAccount">'+topbar('Account Details')+'<div class="ap-section"><div class="ap-balance"><small>Total Balance</small><strong>'+money(balance)+'</strong></div><div class="ap-stat-grid"><div class="ap-stat"><span class="ap-stat-icon">'+icon('wallet')+'</span><strong>'+money(principal)+'</strong><small>Total Deposit</small></div><div class="ap-stat profit"><span class="ap-stat-icon">'+icon('btc')+'</span><strong>'+money(profit)+'</strong><small>Total Profit</small></div></div><div class="ap-actions"><button data-action="view-topup"><span class="ap-action-icon">'+icon('download')+'</span><small>Deposit</small></button><button data-action="view-crypto"><span class="ap-action-icon">'+icon('upload')+'</span><small>Withdraw</small></button><button data-action="focus-kyc"><span class="ap-action-icon">'+icon('kyc')+'</span><small>KYC</small></button><button data-action="transaction-history"><span class="ap-action-icon">'+icon('history')+'</span><small>Transaction<br>History</small></button></div><section class="ap-info"><h3>Account Information</h3>'+accountInfo+'</section><section class="ap-kyc" id="apKycBox"><h3>KYC Verification</h3><form id="kycForm"><div class="ap-form-row"><label>Document Type<select id="kycType"><option value="CNIC">CNIC</option><option value="PASSPORT">Passport</option></select></label></div><div class="ap-form-row"><label>Front Image<input id="kycFront" type="file" accept="image/jpeg,image/png,image/webp" required></label></div><div class="ap-form-row" id="kycBackWrap"><label>Back Image<input id="kycBack" type="file" accept="image/jpeg,image/png,image/webp"></label></div><label class="ap-check"><input id="kycConsent" type="checkbox" required> I agree to identity review.</label><button class="ap-red-button" type="submit">Submit KYC</button></form></section></div></section>'+
  '<section class="ap-screen" id="apScreenCrypto">'+topbar('Crypto')+'<div class="ap-section"><div class="ap-card ap-notice" style="text-align:center"><div style="font-size:42px;color:#e48a08">₿</div><strong>Crypto Wallet</strong><div>Manage your linked TRON wallet.</div><form id="cryptoLinkForm"><label class="ap-label" style="text-align:left">TRON Wallet Address<input id="walletAddress" class="ap-field" value="'+esc(p.destination_address||'')+'"></label><label class="ap-label" style="text-align:left">Wallet Owner<input id="walletOwner" class="ap-field" value="'+esc(p.name||'')+'"></label><button type="button" class="ap-red-button" data-action="link-wallet">Link Wallet</button></form></div><section class="ap-card" style="margin-top:8px"><form id="withdrawForm"><label class="ap-label">Withdrawal Amount (minimum $50)<input id="withdrawAmount" class="ap-field" type="number" min="50" step="0.01" required></label><button type="submit" class="ap-red-button">Request Withdrawal</button></form></section></div></section>'+
  '<section class="ap-screen" id="apScreenAI">'+topbar('AI Bot')+'<div class="ap-section"><section class="ap-ai-box"><div class="ap-ai-avatar">AI</div><h3>'+esc(t('aiTitle'))+'</h3><p>'+esc(t('aiHint'))+'</p><div class="ap-ai-reply" id="aiReply">'+esc(aiAnswer(''))+'</div><form id="aiForm" class="ap-ai-form"><input id="aiInput" placeholder="'+esc(t('aiHint'))+'"><button type="submit">Ask</button></form></section></div></section>'+
  '<section class="ap-screen" id="apScreenNotifications">'+topbar('Notifications')+'<div class="ap-mini-view">'+(notifications||'<div class="ap-card ap-empty"><b>No notifications</b><small>You are all caught up.</small></div>')+'</div></section>'+
  '<div id="apModals"></div></div>';

 root.innerHTML=shell(body,'dashboard');
 var type=document.getElementById('kycType'),backWrap=document.getElementById('kycBackWrap');
 if(type&&backWrap){backWrap.style.display=type.value==='CNIC'?'block':'none';type.addEventListener('change',function(){backWrap.style.display=type.value==='CNIC'?'block':'none';});}
 root.querySelectorAll('[data-amount]').forEach(function(btn){btn.addEventListener('click',function(){var amt=btn.getAttribute('data-amount'),a=document.getElementById('depositAmount'),lab=document.getElementById('depositAmountLabel');if(a)a.value=amt;if(lab)lab.textContent=Number(amt).toLocaleString();root.querySelectorAll('.ap-quick button').forEach(function(x){x.classList.remove('active');});btn.classList.add('active');});});
 var tierSelect=document.getElementById('depositTier');
 if(tierSelect){tierSelect.addEventListener('change',function(){var picked=tiers.find(function(x){return x.id===tierSelect.value;});if(picked){var a=document.getElementById('depositAmount'),lab=document.getElementById('depositAmountLabel');if(a)a.value=Number(picked.deposit_amount);if(lab)lab.textContent=Number(picked.deposit_amount).toLocaleString();}});}
 var search=document.getElementById('apShopSearch');
 if(search){search.addEventListener('input',function(){var q=search.value.toLowerCase();root.querySelectorAll('.ap-product-card').forEach(function(card){var i=Number(card.getAttribute('data-product-index')),prod=state.catalog[i]||{},match=card.textContent.toLowerCase().indexOf(q)>=0,cat=state.shopCategory||'All',catMatch=cat==='All'||prod.cat===cat;card.style.display=match&&catMatch?'':'none';});});}
 state.shopCategory='All';
}
function render(){
 if(state.appEnabled===false){
  root.innerHTML=shell('<section class="tg-paused"><span class="tg-paused-icon">⏻</span><span class="tg-kicker">SERVICE STATUS</span><h1>'+t('pausedTitle')+'</h1><p>'+t(state.runtimeUnverified?'runtimeUnknown':'pausedInfo')+'</p><button type="button" class="tg-button tg-button-primary" data-action="retry-runtime">'+t('retryRuntime')+'</button></section>','auth');
 }else if(state.profile&&state.mode==='dashboard')renderDashboard();else renderAuth();
}
async function uploadImage(file,area){
 if(!file)throw new Error(t('chooseFile'));
 if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error(t('chooseFile'));
 if(file.size>10*1024*1024)throw new Error(t('fileTooLarge'));
 var user=await service.currentUser();if(!user)throw new Error('Authentication is required.');
 var ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
 var path=user.id+'/'+area+'/'+(crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2))+'.'+ext;
 var result=await service.client().storage.from('private-verification').upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'});
 if(result.error)throw result.error;
 return path;
}
function busyStart(){
 busy=true;state.message='';
 root.querySelectorAll('form button[type="submit"]').forEach(function(button){button.disabled=true;});
 root.querySelectorAll('form').forEach(function(form){form.setAttribute('aria-busy','true');});
 if(!root.querySelector('.tg-inline-progress')){
  var progress=document.createElement('div');progress.className='tg-inline-progress';progress.setAttribute('role','status');
  progress.innerHTML='<span class="tg-spinner" aria-hidden="true"></span><span>Processing securely…</span>';
  var card=root.querySelector('.tg-card');if(card)card.insertBefore(progress,card.querySelector('.tg-footer'));
 }
}
function busyEnd(){busy=false;render();}
async function handleLogin(e){
 e.preventDefault();var email=document.getElementById('loginEmail').value,password=document.getElementById('loginPassword').value;busyStart();render();
 try{if(!await service.appRuntimeEnabled())throw new Error(t('pausedInfo'));await service.signIn(email,password);await refreshProfile();}
 catch(err){state.profile=null;state.mode='login';state.phase='ready';setMessage(authError(err));}
 finally{busy=false;render();}
}
async function handleSignup(e){
 e.preventDefault();var name=document.getElementById('signupName').value.trim(),email=document.getElementById('signupEmail').value.trim(),password=document.getElementById('signupPassword').value,referral=document.getElementById('signupReferral').value.trim();
 if(name.length<2||password.length<8){setMessage(t('passwordHint'));render();return;}
 busyStart();render();
 try{
  await service.signUp(email,password,name,referral,locale);
  await service.signIn(email,password);
  await refreshProfile();
 }catch(err){state.mode='signup';state.phase='ready';setMessage(authError(err));}
 finally{busy=false;render();}
}
async function handleReset(e){
 e.preventDefault();busyStart();
 try{await service.sendPasswordReset(document.getElementById('resetEmail').value);state.mode='login';state.phase='ready';setMessage('If this email belongs to an account, recovery instructions have been sent.','success');state.messageTone='success';}
 catch(err){state.mode='reset';state.phase='ready';setMessage(authError(err));}
 finally{busy=false;render();}
}
async function handlePassword(e){
 e.preventDefault();var pass=document.getElementById('newPassword').value,confirm=document.getElementById('confirmPassword').value;
 if(pass.length<8||pass!==confirm){setMessage(pass.length<8?t('passwordHint'):'Passwords do not match.');render();return;}
 busyStart();try{await service.updatePassword(pass);history.replaceState(null,document.title,location.pathname+location.search);await refreshProfile();}
 catch(err){state.mode='password-update';state.phase='ready';setMessage(authError(err));}
 finally{busy=false;render();}
}
async function handleDeposit(e){
 e.preventDefault();
 var tierField=document.getElementById('depositTier');
 if(!tierField||!tierField.value){setMessage('No active deposit tier is configured yet.');render();return;}
 busyStart();
 try{
  var file=document.getElementById('depositProof').files[0];
  var path=await uploadImage(file,'deposits');
  var result=await service.client().functions.invoke('submit-deposit',{body:{tierId:document.getElementById('depositTier').value,amount:Number(document.getElementById('depositAmount').value),txid:document.getElementById('depositTxid').value.trim(),screenshotPath:path}});
  if(result.error)throw result.error;
  if(result.data&&result.data.aiReviewStatus==='APPROVED'){
   var verified=await service.client().functions.invoke('verify-deposit',{body:{depositId:result.data.depositId}});
   if(verified.error)throw verified.error;
   setMessage(verified.data&&verified.data.status==='VERIFIED'?'Deposit confirmed and balance credited.':(verified.data&&verified.data.message)||t('pending'),'success');
  }else{
   setMessage((result.data&&result.data.message)||t('pending'),'success');
  }
  state.messageTone='success';await refreshData();
 }catch(err){setMessage(authError(err));}
 finally{busy=false;render();}
}
async function handleKyc(e){
 e.preventDefault();if(!document.getElementById('kycConsent').checked){setMessage(t('consent'));render();return;}
 busyStart();
 try{
  var doc=document.getElementById('kycType').value;
  var front=await uploadImage(document.getElementById('kycFront').files[0],'kyc');
  var backFile=document.getElementById('kycBack').files[0];
  var back=doc==='CNIC'?await uploadImage(backFile,'kyc'):'';
  var result=await service.client().functions.invoke('submit-kyc',{body:{documentType:doc,frontPath:front,backPath:back,processingConsent:true}});
  if(result.error)throw result.error;
  setMessage(result.data&&result.data.message||t('pending'),'success');state.messageTone='success';await refreshData();
 }catch(err){setMessage(authError(err));}
 finally{busy=false;render();}
}
async function handleWithdraw(e){
 e.preventDefault();busyStart();
 try{
  var p=state.profile,c=service.client();
  if(!p.destination_address){
   var address=document.getElementById('walletAddress').value.trim(),owner=document.getElementById('walletOwner').value.trim();
   var linked=await c.rpc('link_withdrawal_wallet',{p_address:address,p_owner_name:owner});
   if(linked.error)throw linked.error;
   await refreshData();p=state.profile;
  }
  if(!state.data.kyc||state.data.kyc.status!=='VERIFIED')throw new Error(t('withdrawKyc'));
  var result=await service.requestWithdrawal(Number(document.getElementById('withdrawAmount').value));
  if(result.error)throw result.error;
  var telegram=await c.functions.invoke('telegram-withdrawal',{body:{action:'notify',withdrawalId:result.data}});
  setMessage(telegram.error?t('withdrawTelegramPending'):t('ok'),'success');state.messageTone='success';await refreshData();
 }catch(err){setMessage(authError(err));}
 finally{busy=false;render();}
}
function cartCount(){return Array.isArray(state.cart)?state.cart.reduce(function(n,x){return n+Number(x.qty||1);},0):0;}
function saveCart(){try{localStorage.setItem('aegispay-cart',JSON.stringify(state.cart||[]));}catch(e){}}
function syncCartBadges(){
 var count=cartCount();
 root.querySelectorAll('.cart-count,#shopCartCount').forEach(function(x){x.textContent=String(count);x.style.display=count?'inline-block':'none';});
}
function addToCart(prod,qty){
 if(!prod)return;
 qty=Math.max(1,Number(qty||1));
 var found=state.cart.find(function(x){return x.name===prod.name;});
 if(found)found.qty=Number(found.qty||1)+qty;
 else state.cart.push({name:prod.name,price:Number(prod.price||0),image:prod.image||'',qty:qty});
 saveCart();syncCartBadges();
}
function showToast(message){
 var toast=document.createElement('div');toast.className='ap-toast';toast.textContent=message;document.body.appendChild(toast);setTimeout(function(){if(toast.parentNode)toast.remove();},1800);
}
function showOrdersView(){
 var rows=(state.cart||[]).map(function(x){return '<div class="order-row"><div class="order-art"><img src="'+esc(x.image||'')+'" alt=""></div><div class="order-main"><b>'+esc(x.name)+'</b><small>Qty '+Number(x.qty||1)+' · $'+Number(x.price||0).toFixed(2)+'</small></div><strong>$'+(Number(x.price||0)*Number(x.qty||1)).toFixed(2)+'</strong></div>';}).join('');
 var total=(state.cart||[]).reduce(function(a,x){return a+Number(x.price||0)*Number(x.qty||1);},0);
 var panel=document.createElement('div');panel.className='ap-order-modal';
 panel.innerHTML='<section class="ap-order-sheet"><div class="ap-order-head"><button type="button" data-action="close-orders">‹</button><b>Orders</b><span class="order-pill">'+cartCount()+' items</span></div><div class="ap-order-body">'+(rows||'<div class="order-empty"><div>🛍️</div><b>No items yet</b><small>Add a product from Shop to build your cart.</small><button type="button" data-action="view-shop">Go to Shop</button></div>')+(rows?'<div class="order-total"><span>Total</span><strong>$'+total.toFixed(2)+'</strong></div><button class="red-button" type="button" data-action="checkout-cart">Continue to Checkout</button>':'')+'</div></section>';
 root.appendChild(panel);
}
async function action(e){
 var el=e.target.closest('[data-action]');if(!el)return;
 var a=el.getAttribute('data-action');
 function show(name){
  var ids=['home','shop','product','topup','referral','account','crypto','ai','notifications'];
  ids.forEach(function(id){var v=document.getElementById('apScreen'+id.charAt(0).toUpperCase()+id.slice(1));if(v)v.classList.toggle('active',id===name);});
  window.scrollTo({top:0,behavior:'smooth'});
 }
 function modal(html){
  var holder=document.getElementById('apModals');if(!holder)return;holder.innerHTML=html;
 }
 if(a==='view-home'){show('home');return;}
 if(a==='view-shop'){show('shop');return;}
 if(a==='view-topup'){show('topup');return;}
 if(a==='view-referral'){show('referral');return;}
 if(a==='view-account'){show('account');return;}
 if(a==='view-crypto'){show('crypto');return;}
 if(a==='view-ai'){show('ai');return;}
 if(a==='view-notifications'){show('notifications');return;}
 if(a==='view-orders'){var rows=(state.cart||[]).map(function(x){return '<div class="ap-order"><img src="'+esc(x.image||'')+'" alt=""><div><strong>'+esc(x.name)+'</strong><small>Qty '+Number(x.qty||1)+' · $'+Number(x.price||0).toFixed(2)+'</small></div><strong class="ap-order-price">$'+(Number(x.price||0)*Number(x.qty||1)).toFixed(2)+'</strong></div>';}).join('');var total=(state.cart||[]).reduce(function(sum,x){return sum+Number(x.price||0)*Number(x.qty||1);},0);modal('<div class="ap-modal"><section class="ap-modal-sheet"><div class="ap-modal-head"><button data-action="close-modal">‹</button><strong>Orders</strong><span></span></div><div class="ap-modal-body">'+(rows||'<div class="ap-empty"><div style="font-size:40px">🛒</div><b>No items yet</b><small>Add a product from Shop.</small></div>')+(rows?'<div style="display:flex;justify-content:space-between;padding:14px 2px 4px;font-size:10px"><span>Total</span><strong>$'+total.toFixed(2)+'</strong></div><button class="ap-red-button" data-action="checkout">Continue to Checkout</button>':'')+'</div></section></div>');return;}
 if(a==='close-modal'){var m=el.closest('.ap-modal');if(m)m.remove();return;}
 if(a==='checkout'){showToast('Checkout is ready for order integration.');return;}
 if(a==='open-product'){
  var pi=Number(el.getAttribute('data-product-index')),prod=(state.catalog||[])[pi];if(!prod)return;
  var detail=document.getElementById('apProductDetail');if(detail){
   detail.innerHTML='<div class="ap-product-gallery"><div class="ap-thumbs"><button class="ap-thumb active" data-action="thumb-select"><img src="'+prod.image+'" alt=""></button><button class="ap-thumb" data-action="thumb-select"><img src="'+prod.image+'" alt=""></button><button class="ap-thumb" data-action="thumb-select"><img src="'+prod.image+'" alt=""></button><button class="ap-thumb" data-action="thumb-select"><img src="'+prod.image+'" alt=""></button></div><div class="ap-main-image"><img id="apMainProductImage" src="'+prod.image+'" alt="'+esc(prod.name)+'"></div></div><div class="ap-detail"><h1>'+esc(prod.name)+'</h1><div class="ap-detail-rating">★★★★★ <span>'+esc(prod.rating)+'</span> · <b>'+esc(prod.reviews)+' reviews</b></div><div class="ap-detail-price">$'+Number(prod.price).toFixed(2)+' <del>$'+Number(prod.old).toFixed(2)+'</del><span class="ap-off">'+esc(prod.discount)+'</span></div><div class="ap-choice"><label>Color:</label><button class="ap-swatch active" style="background:#17191d" data-action="product-option" data-group="color"></button><button class="ap-swatch" style="background:#f4c6cf" data-action="product-option" data-group="color"></button><button class="ap-swatch" style="background:#f3d455" data-action="product-option" data-group="color"></button><button class="ap-swatch" style="background:#63a6e9" data-action="product-option" data-group="color"></button><button class="ap-swatch" style="background:#63b99c" data-action="product-option" data-group="color"></button></div><div class="ap-choice"><label>Storage:</label><button class="ap-storage active" data-action="product-option" data-group="storage">128GB</button><button class="ap-storage" data-action="product-option" data-group="storage">256GB</button><button class="ap-storage" data-action="product-option" data-group="storage">512GB</button></div><div class="ap-qty"><b>Quantity:</b><button data-action="product-qty" data-dir="down">−</button><span>1</span><button data-action="product-qty" data-dir="up">+</button><i class="ap-stock">● In Stock</i></div><button class="ap-cart-btn" data-action="product-action" data-product-index="'+pi+'">'+icon('cart')+' Add to Cart</button><button class="ap-buy-btn" data-action="product-action" data-product-index="'+pi+'">Buy Now</button><div class="ap-trust"><div>'+icon('truck')+'<strong>Free Delivery</strong><small>in 3–5 days</small></div><div>'+icon('shield')+'<strong>Secure Payment</strong><small>100% secure</small></div><div>'+icon('return')+'<strong>Easy Returns</strong><small>7 days</small></div></div></div>';
  }
  show('product');return;
 }
 if(a==='thumb-select'){root.querySelectorAll('.ap-thumb').forEach(function(x){x.classList.remove('active');});el.classList.add('active');var img=el.querySelector('img');var main=document.getElementById('apMainProductImage');if(img&&main)main.src=img.src;return;}
 if(a==='product-option'){var g=el.getAttribute('data-group');root.querySelectorAll('[data-group="'+g+'"]').forEach(function(x){x.classList.remove('active');});el.classList.add('active');return;}
 if(a==='product-qty'){var q=root.querySelector('.ap-qty span'),cur=Math.max(1,Number(q&&q.textContent||1)+(el.getAttribute('data-dir')==='up'?1:-1));if(q)q.textContent=String(cur);return;}
 if(a==='product-action'){var idx=Number(el.getAttribute('data-product-index')),prod=(state.catalog||[])[idx];if(prod){var q=root.querySelector('.ap-qty span');var qty=Math.max(1,Number(q&&q.textContent||1));var found=state.cart.find(function(x){return x.name===prod.name;});if(found)found.qty=Number(found.qty||1)+qty;else state.cart.push({name:prod.name,price:Number(prod.price||0),image:prod.image||'',qty:qty});try{localStorage.setItem('aegispay-cart',JSON.stringify(state.cart));}catch(err){}showToast(el.textContent.indexOf('Buy')>=0?'Added to cart — ready to checkout.':'Added to cart.');}return;}
 if(a==='shop-category'){state.shopCategory=el.getAttribute('data-category')||'All';root.querySelectorAll('.ap-cat').forEach(function(x){x.classList.toggle('active',x===el);});var q=((document.getElementById('apShopSearch')||{}).value||'').toLowerCase();root.querySelectorAll('.ap-product-card').forEach(function(card){var i=Number(card.getAttribute('data-product-index')),prod=state.catalog[i]||{},match=card.textContent.toLowerCase().indexOf(q)>=0,catMatch=state.shopCategory==='All'||prod.cat===state.shopCategory;card.style.display=match&&catMatch?'':'none';});return;}
 if(a==='payment-method'){var method=el.getAttribute('data-method');root.querySelectorAll('.ap-method').forEach(function(x){x.classList.toggle('active',x===el);});if(method!=='TRC20')showToast('This payment method is displayed in the reference UI; current deposit backend is TRON testnet.');return;}
 if(a==='copy-client-id'){var id=(state.profile&&state.profile.client_id)||'AP-CLIENT';if(navigator.clipboard)navigator.clipboard.writeText(id);showToast('Client ID copied.');return;}
 if(a==='copy-ref'){var link=location.origin+location.pathname+'?ref='+encodeURIComponent((state.profile&&state.profile.referral_code)||'');if(navigator.clipboard)navigator.clipboard.writeText(link).then(function(){showToast('Referral link copied.');});return;}
 if(a==='share-ref'||a==='share-whatsapp'){var link=location.origin+location.pathname+'?ref='+encodeURIComponent((state.profile&&state.profile.referral_code)||'');if(a==='share-whatsapp'&&navigator.share){navigator.share({title:'AegisPay Referral',text:'Join using my AegisPay referral link',url:link}).catch(function(){});}else if(navigator.share&&a==='share-ref'){navigator.share({title:'AegisPay Referral',url:link}).catch(function(){});}else if(navigator.clipboard)navigator.clipboard.writeText(link).then(function(){showToast('Referral link copied.');});return;}
 if(a==='ref-history'){modal('<div class="ap-modal"><section class="ap-modal-sheet"><div class="ap-modal-head"><button data-action="close-modal">‹</button><strong>Referral History</strong><span></span></div><div class="ap-modal-body">'+(refs.length?refRows:'<div class="ap-empty"><b>No referral history</b></div>')+'</div></section></div>');return;}
 if(a==='ref-tab'){var tab=el.getAttribute('data-tab');root.querySelectorAll('.ap-tabs button').forEach(function(x){x.classList.toggle('active',x===el);});var list=document.getElementById('apRefList');if(list&&tab==='network')list.innerHTML='<div class="ap-card ap-empty"><b>Network View</b><small>Level 1 and Level 2 referral relationships are shown here when referral data is available.</small></div>';else if(list)list.innerHTML=refRows;return;}
 if(a==='focus-kyc'){show('account');setTimeout(function(){var box=document.getElementById('apKycBox');if(box)box.scrollIntoView({behavior:'smooth',block:'start'});},60);return;}
 if(a==='transaction-history'){var deps=(d.deposits||[]).map(function(x){return '<div class="ap-list-row"><strong>Deposit</strong><small>'+esc(date(x.created_at))+' · '+money(x.gross_amount)+'</small></div>';}).join(''),wds=(d.withdrawals||[]).map(function(x){return '<div class="ap-list-row"><strong>Withdrawal</strong><small>'+esc(date(x.created_at))+' · '+money(x.amount)+'</small></div>';}).join('');modal('<div class="ap-modal"><section class="ap-modal-sheet"><div class="ap-modal-head"><button data-action="close-modal">‹</button><strong>Transaction History</strong><span></span></div><div class="ap-modal-body">'+(deps+wds||'<div class="ap-empty"><b>No transactions yet</b></div>')+'</div></section></div>');return;}
 if(a==='favorite'){el.classList.toggle('active');el.textContent=el.classList.contains('active')?'♥':'♡';return;}
 if(a==='link-wallet'){try{busyStart();var r=await service.client().rpc('link_withdrawal_wallet',{p_address:(document.getElementById('walletAddress')||{}).value.trim(),p_owner_name:(document.getElementById('walletOwner')||{}).value.trim()});if(r.error)throw r.error;setMessage(t('walletLinked'),'success');state.messageTone='success';await refreshData();}catch(err){setMessage(authError(err));}finally{busy=false;render();}return;}
 if(a==='logout'){await service.signOut();state.profile=null;state.mode='login';state.phase='ready';render();return;}
 if(a==='keep-language'){askLanguage=false;try{localStorage.setItem('aegispay-language',locale);}catch(e){}render();return;}
 if(a==='retry-runtime'){checkRuntime();return;}
 if(a==='complete-task'){if(busy)return;busyStart();render();try{var taskResult=await service.client().rpc('complete_task',{p_task_id:el.getAttribute('data-id')});if(taskResult.error)throw taskResult.error;setMessage(t('taskCompleted'),'success');await refreshData();state.messageTone='success';}catch(err){setMessage(authError(err));}finally{busy=false;render();}return;}
}
root.addEventListener('submit',async function(e){
 if(e.target.id==='aiForm'){
  e.preventDefault();
  var aiInput=document.getElementById('aiInput'),aiReply=document.getElementById('aiReply'),question=aiInput&&aiInput.value.trim();
  if(!question)return;
  if(aiReply)aiReply.textContent='Thinking…';
  try{
    var aiResult=await service.client().functions.invoke('ai-support',{body:{message:question}});
    if(aiResult.error)throw aiResult.error;
    if(aiReply)aiReply.textContent=(aiResult.data&&aiResult.data.answer)||aiAnswer(question);
  }catch(err){
    if(aiReply)aiReply.textContent=aiAnswer(question);
  }
  if(aiInput)aiInput.value='';
  return;
 }
 if(e.target.id==='loginForm')handleLogin(e);
 else if(e.target.id==='signupForm')handleSignup(e);
 else if(e.target.id==='resetForm')handleReset(e);
 else if(e.target.id==='passwordForm')handlePassword(e);
 else if(e.target.id==='depositForm')handleDeposit(e);
 else if(e.target.id==='kycForm')handleKyc(e);
 else if(e.target.id==='withdrawForm')handleWithdraw(e);
});
root.addEventListener('click',action);root.addEventListener('change',function(e){if(e.target.matches('[data-action="language"]'))rememberLanguage(e.target.value);});

async function boot(){
 render();
 if(!service||!service.isAvailable()){state.phase='ready';setMessage(t('unavailable'));render();return;}
 service.onAuthStateChange(function(event,session){
  if(event==='SIGNED_OUT'){state.profile=null;state.mode='login';state.phase='ready';render();}
  if(event==='PASSWORD_RECOVERY'){state.profile=null;state.mode='password-update';state.phase='ready';render();}
 });
 try{
  state.appEnabled=await service.appRuntimeEnabled();state.runtimeUnverified=false;
  if(!state.appEnabled){state.phase='paused';render();}
  else{var session=await service.session();if(session)await refreshProfile();else{state.phase='ready';render();}}
 }catch(err){state.appEnabled=false;state.runtimeUnverified=true;state.phase='paused';setMessage(t('runtimeUnknown'));render();}
 if(!runtimeTimer)runtimeTimer=setInterval(function(){checkRuntime();updateCycleCountdown();},10000);
 updateCycleCountdown();
}
async function checkRuntime(){
 if(!service||!service.isAvailable()||runtimeRequest||busy)return runtimeRequest;
 runtimeRequest=(async function(){
  var was=state.appEnabled,wasUnverified=state.runtimeUnverified,wasPaused=state.phase==='paused';
  try{
   var enabled=await service.appRuntimeEnabled();state.runtimeUnverified=false;state.appEnabled=enabled;
   if(!enabled){var changed=was!==false||!wasPaused||wasUnverified;state.profile=null;state.phase='paused';state.mode='login';state.message='';if(changed)render();return;}
   if(was===false||wasPaused||wasUnverified){state.phase='ready';state.message='';var session=await service.session();if(session)await refreshProfile();else{state.profile=null;state.mode='login';render();}}
  }catch(err){var changed=!state.runtimeUnverified||state.phase!=='paused';state.appEnabled=false;state.runtimeUnverified=true;state.profile=null;state.phase='paused';if(changed){setMessage(t('runtimeUnknown'));render();}}
 })();
 try{return await runtimeRequest;}finally{runtimeRequest=null;}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
