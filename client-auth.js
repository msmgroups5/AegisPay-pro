(function(){
'use strict';
var root=document.getElementById('app');
var service=window.AegisSupabaseService;
var state={phase:'loading',mode:(new URLSearchParams((location.hash||'').replace(/^#/, '')).get('type')==='invite'||new URLSearchParams((location.hash||'').replace(/^#/, '')).get('type')==='recovery')?'password-update':'login',profile:null,data:{deposits:[],withdrawals:[],kyc:null},message:'',messageTone:'error',appEnabled:null,runtimeUnverified:false};
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
 '<header class="tg-topbar"><div class="tg-brand"><img src="/aegispay-logo.svg" width="42" height="42" alt=""><span><b>Aegis<span>Pay</span></b><small>SINCE 2023 — 2026 · SECURE CLIENT PORTAL</small></span></div>'+ 
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
 var [profileRes,depositsRes,withdrawalsRes,kycRes,tasksRes,cycleRes,refsRes,notificationsRes,offersRes]=await Promise.all([
  c.from('users').select('id,name,email,role,status,current_platform_balance,principal_balance,profit_balance,manual_credit_balance,withdrawal_held,destination_address,withdrawal_wallet_owner_name,preferred_language,referral_code,first_deposit_done').eq('id',p.id).maybeSingle(),
  c.from('deposit_submissions').select('id,tier_id,gross_amount,credited_amount,status,ai_review_status,verification_note,created_at').eq('user_id',p.id).order('created_at',{ascending:false}).limit(10),
  c.from('withdrawal_requests').select('id,amount,fee_amount,net_amount,status,created_at').eq('user_id',p.id).order('created_at',{ascending:false}).limit(10),
  c.from('kyc_verifications').select('id,document_type,status,ai_review_status,review_reason,submitted_at').eq('user_id',p.id).order('submitted_at',{ascending:false}).limit(1)
 ]);
 if(profileRes.error)throw profileRes.error;
 state.profile=profileRes.data||p;
 state.data={deposits:depositsRes.data||[],withdrawals:withdrawalsRes.data||[],kyc:(kycRes.data||[])[0]||null};
 if(depositsRes.error)state.data.deposits=[];
 if(withdrawalsRes.error)state.data.withdrawals=[];
 if(kycRes.error)state.data.kyc=null;
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
 var p=state.profile||{},d=state.data||{},kyc=d.kyc,refs=d.referrals||[],cycle=d.cycle,tasks=d.tasks||[];
 var balance=Number(p.current_platform_balance||0),principal=Number(p.principal_balance||0),profit=Number(p.profit_balance||0);
 var referralCode=p.referral_code||'AP-CLIENT',referralLink=location.origin+location.pathname+'?ref='+encodeURIComponent(referralCode);
 var l1=refs.filter(function(x){return x.referral_level===1;}).length,l2=refs.filter(function(x){return x.referral_level===2;}).length;
 var reward=refs.reduce(function(a,x){return a+Number(x.platform_reward||0);},0),current=cycle?tasks.filter(function(x){return x.cycle_id===cycle.id;}):[],done=current.filter(function(x){return x.status==='Completed';}).length;
 var products=[
  {name:'Travel Water Bottle',brand:'Aegis Active',cat:'Outdoor',price:12.99,rating:'4.7',badge:'Popular',desc:'Insulated travel water bottle designed for daily hydration and outdoor use.',image:'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=82'},
  {name:'Classic Sunglasses',brand:'Aegis Style',cat:'Fashion',price:15.99,rating:'4.6',badge:'New',desc:'Classic everyday sunglasses with a clean lightweight frame.',image:'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=82'},
  {name:'LED Desk Light',brand:'Aegis Home',cat:'Office',price:18.99,rating:'4.6',badge:'Deal',desc:'Modern adjustable LED desk light for focused workspace illumination.',image:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=82'},
  {name:'Wireless Mouse',brand:'Aegis Tech',cat:'Electronics',price:21.99,rating:'4.7',badge:'Top Rated',desc:'Compact wireless mouse with a comfortable shape for everyday computer use.',image:'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=82'},
  {name:'Beauty Vanity Kit',brand:'Aegis Beauty',cat:'Beauty',price:169,rating:'4.7',badge:'Featured',desc:'Complete beauty vanity kit for organized everyday personal care.',image:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=82'},
  {name:'Air Fryer Compact',brand:'Aegis Home',cat:'Home & Kitchen',price:179,rating:'4.8',badge:'Best Seller',desc:'Compact air fryer for quick, convenient cooking with less oil.',image:'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=900&q=82'},
  {name:'Smart Home Camera',brand:'Aegis Tech',cat:'Electronics',price:199,rating:'4.5',badge:'New',desc:'Smart indoor security camera for monitoring your home environment.',image:'https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=900&q=82'},
  {name:'Premium Sports Shoe',brand:'Aegis Active',cat:'Sports',price:219,rating:'4.7',badge:'Featured',desc:'Premium athletic shoe designed for comfortable everyday movement and training.',image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=82'},
  {name:'Cable Organizer Kit',brand:'Aegis Office',cat:'Office',price:4.99,rating:'4.5',badge:'New',desc:'Cable organizer set for keeping charging and desk cables neat and separated.',image:'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=900&q=82'},
  {name:'Everyday Backpack',brand:'Aegis Style',cat:'Fashion',price:54.99,rating:'4.7',badge:'Featured',desc:'Everyday backpack with practical storage for work, travel and daily carry.',image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=82'},
  {name:'Noise Cancel Earbuds',brand:'Aegis Audio',cat:'Electronics',price:139,rating:'4.7',badge:'Featured',desc:'Wireless earbuds with a compact design for music, calls and travel.',image:'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=82'},
  {name:'Fitness Smart Band',brand:'Aegis Active',cat:'Sports',price:119,rating:'4.6',badge:'New',desc:'Smart fitness band for everyday activity and wellness tracking.',image:'https://images.unsplash.com/photo-1557935728-e6d1eaabe558?auto=format&fit=crop&w=900&q=82'}
 ];
 var cards=products.map(function(x,i){return '<article class="ap-product" data-action="open-product" data-product-index="'+i+'"><div class="ap-product-image"><span class="ap-product-badge">'+esc(x.badge)+'</span><img src="'+x.image+'" alt="'+esc(x.name)+'" loading="lazy"></div><div class="ap-product-body"><small>'+esc(x.brand)+' · '+esc(x.cat)+'</small><h4>'+esc(x.name)+'</h4><div class="ap-stars">★★★★★ <span>'+esc(x.rating)+'</span></div><strong>$'+Number(x.price).toFixed(2)+'</strong><button type="button" data-action="open-product" data-product-index="'+i+'">View Product</button></div></article>';}).join('');
 var refRows=refs.length?refs.map(function(x){return '<div><span class="ap-avatar">●</span><section><b>'+esc(x.referred_name||x.name||'Referral')+'</b><small>ID: '+esc(x.referred_id||'')+'</small></section><strong>+'+money(x.platform_reward||0)+'</strong></div>';}).join(''):'<p>'+t('empty')+'</p>';
 var body='<div class="ap-app">'+
 '<header class="ap-header"><div class="ap-brand"><img src="/aegispay-logo.svg" alt=""><b>Aegis<span>Pay</span></b></div><div class="ap-head-actions"><button class="ap-icon" data-action="notifications">♧</button><button class="ap-icon" data-action="profile-view">●</button></div></header>'+
 '<section class="ap-hero"><div><small>WELCOME,</small><h1>'+esc(p.name||'Client Name')+'</h1><p>Client ID: '+esc(p.client_id||'AP-CLIENT')+' <button data-action="copy-client-id">▣</button></p></div><div class="ap-building">◆</div></section>'+
 '<section class="ap-tier-row"><div><b>♛</b><span>LV 1</span><strong>10%</strong></div><div><b>♛</b><span>LV 2</span><strong>5%</strong></div><div><b>♛</b><span>LV 3</span><strong>2%</strong></div></section>'+
 '<div class="ap-view" id="apViewHome"><section class="ap-ref-card"><div class="ap-ref-icon">♟+</div><div><h2>Referral</h2><p>Invite Friends &amp; Earn Rewards</p><small>Your Unique Referral ID</small><b>'+esc(referralCode)+'</b></div><button data-action="view-referral">›</button></section>'+
 '<section class="ap-grid2"><button class="ap-tile" data-action="view-topup"><i>＄</i><b>Top Up</b><small>Deposit Amount</small></button><button class="ap-tile" data-action="view-shop"><i>🛒</i><b>Shop</b><small>Browse &amp; Buy</small></button><button class="ap-tile" data-action="view-assets"><i>▣</i><b>Account Details</b><small>View Your Account</small></button><button class="ap-tile" data-action="view-crypto"><i>₿</i><b>Crypto</b><small>Buy &amp; Manage</small></button></section>'+
 '<section class="ap-balance-strip"><div><small>Available</small><b>'+money(balance)+'</b></div><div><small>Principal</small><b>'+money(principal)+'</b></div><div><small>Profit</small><b>'+money(profit)+'</b></div></section>'+
 (cycle?'<section class="ap-cycle"><div><div><small>Current Shop Cycle</small><b>'+done+'/'+current.length+' tasks</b></div><span>'+esc(cycle.status||'OPEN')+'</span></div><div class="ap-progress"><span style="width:'+Math.min(100,current.length?done/current.length*100:0)+'%"></span></div></section>':'')+'</div>'+
 '<div class="ap-view hidden" id="apViewReferral"><div class="ap-page-title"><button data-action="view-home">‹</button><h2>Referral</h2><button>◷</button></div><section class="ap-ref-banner"><h2>Invite Friends<br>Earn Rewards</h2><p>Share your unique link and earn USDT rewards when they join and make a deposit.</p></section><section class="ap-reward-grid"><div><b>♟</b><strong>5 USDT</strong><small>When your direct referral joins<br><b>(Level 1)</b></small></div><div><b>♟♟</b><strong>2 USDT</strong><small>When your friend’s referral joins<br><b>(Level 2)</b></small></div></section><section class="ap-link-card"><h3>Your Referral Link</h3><div>'+esc(referralLink)+' <button data-action="copy-ref">▣</button></div><div class="ap-share"><button data-action="share-ref">Share on WhatsApp</button><button data-action="copy-ref">Share Link</button></div><small>Your Referral ID</small><b>'+esc(referralCode)+'</b></section><section class="ap-ref-stats"><div><strong>'+refs.length+'</strong><small>Total Referrals</small></div><div><strong>'+l1+'</strong><small>Level 1</small></div><div><strong>'+l2+'</strong><small>Level 2</small></div><div><strong>'+money(reward)+'</strong><small>Total Earned</small></div></section><div class="ap-list">'+refRows+'</div></div>'+
 '<div class="ap-view hidden" id="apViewTopup"><div class="ap-page-title"><button data-action="view-home">‹</button><h2>Top Up</h2><button>⌁</button></div><section class="ap-card"><h3>Select Payment Method</h3><div class="ap-method selected"><b>🔴</b><span><strong>USDT (TRC20)</strong><small>Fast, Low Fees</small></span>✓</div><div class="ap-method"><b>◉</b><span><strong>USDT (ERC20)</strong><small>Network Fees Higher</small></span>›</div><div class="ap-method"><b>₿</b><span><strong>Bitcoin (BTC)</strong><small>Secure &amp; Global</small></span>›</div><div class="ap-method"><b>▣</b><span><strong>Bank Transfer</strong><small>Local Bank Deposit</small></span>›</div><form id="depositForm" class="ap-form"><label>Enter Deposit Amount<input id="depositAmount" type="number" min="1" step="0.01" value="100" required></label><div class="ap-amounts"><button type="button" data-amount="50">50</button><button type="button" data-amount="100">100</button><button type="button" data-amount="500">500</button><button type="button" data-amount="1000">1,000</button></div><label>TRON transaction ID<input id="depositTxid" type="text" minlength="64" maxlength="64" required></label><label>Payment screenshot<input id="depositProof" type="file" accept="image/jpeg,image/png,image/webp" required></label><button class="ap-primary" type="submit">Submit Deposit →</button></form></section></div>'+
 '<div class="ap-view hidden" id="apViewShop"><div class="ap-page-title"><button data-action="view-home">‹</button><h2>Shop</h2><button>🛒</button></div><section class="ap-shop-banner"><div><small>AEGIS SHOP</small><h2>Amazon-style Shop</h2><p>Har product ke saath usi product ki correct picture, category aur description.</p></div><span>🛍️</span></section><div class="ap-shop-search">⌕ <input id="apShopSearch" placeholder="Search products..."></div><div class="ap-cats"><button class="active">All</button><button>Electronics</button><button>Fashion</button><button>Home &amp; Kitchen</button><button>Beauty</button><button>Sports</button></div><div class="ap-products">'+cards+'</div></div>'+
 '<div class="ap-view hidden" id="apViewProduct"><div class="ap-page-title"><button data-action="view-shop">‹</button><h2>Product</h2><button data-action="view-shop">×</button></div><section id="apProductDetail" class="ap-product-detail"></section></div>'+
 '<div class="ap-view hidden" id="apViewAssets"><div class="ap-page-title"><button data-action="view-home">‹</button><h2>Account Details</h2><button>⋮</button></div><section class="ap-account-card"><small>Available Balance</small><strong>'+money(balance)+'</strong><p>Principal: '+money(principal)+'</p><p>Profit: '+money(profit)+'</p><p>KYC Status: '+esc(kyc?kyc.status:t('kycNeeded'))+'</p><p>Referral ID: '+esc(referralCode)+'</p></section><section class="ap-card"><h3>Recent Deposits</h3>'+historyTable(t('deposits'),d.deposits||[],'deposit')+'</section><section class="ap-card"><h3>KYC</h3><form id="kycForm"><label>Document Type<select id="kycType"><option value="CNIC">CNIC</option><option value="PASSPORT">Passport</option></select></label><label>Front Image<input id="kycFront" type="file" accept="image/jpeg,image/png,image/webp" required></label><label id="kycBackWrap">Back Image<input id="kycBack" type="file" accept="image/jpeg,image/png,image/webp"></label><label class="ap-check"><input id="kycConsent" type="checkbox" required> I agree to the identity review.</label><button class="ap-primary" type="submit">Submit KYC</button></form></section></div>'+
 '<div class="ap-view hidden" id="apViewCrypto"><div class="ap-page-title"><button data-action="view-home">‹</button><h2>Crypto</h2><button>⋮</button></div><section class="ap-card ap-crypto"><div>₿</div><h2>Crypto Wallet</h2><p>Manage your linked TRON wallet.</p><label>TRON Wallet Address<input id="walletAddress" value="'+esc(p.destination_address||'')+'"></label><label>Wallet Owner<input id="walletOwner" value="'+esc(p.name||'')+'"></label><button class="ap-primary" data-action="link-wallet">Link Wallet</button></section><section class="ap-card"><h3>Withdrawal</h3><form id="withdrawForm"><label>Withdrawal Amount (minimum $50)<input id="withdrawAmount" type="number" min="50" step="0.01" required></label><button class="ap-primary" type="submit">Request Withdrawal</button></form></section></div>'+
 '<nav class="ap-bottom"><button class="active" data-action="view-home">⌂<span>Home</span></button><button data-action="view-assets">◇<span>Assets</span></button><button data-action="profile-view">●<span>My Profile</span></button><button data-action="ai-view">◉<span>AI Bot</span></button></nav></div>';
 root.innerHTML=shell(body,'dashboard');
 var type=document.getElementById('kycType'),backWrap=document.getElementById('kycBackWrap');if(type&&backWrap)type.addEventListener('change',function(){backWrap.style.display=type.value==='CNIC'?'block':'none';});
 root.querySelectorAll('[data-amount]').forEach(function(b){b.addEventListener('click',function(){var a=document.getElementById('depositAmount');if(a)a.value=b.getAttribute('data-amount');});});
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
 e.preventDefault();busyStart();
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
async function action(e){
 var el=e.target.closest('[data-action]');if(!el)return;
 var a=el.getAttribute('data-action');
 if(a.indexOf('view-')===0 || a==='ai-view' || a==='profile-view' || a==='notifications'){
  var target=a==='profile-view'||a==='notifications'||a==='ai-view'?'assets':a.replace(/^view-/,'');
  var ids=['home','referral','topup','shop','assets','crypto'];
  ids.forEach(function(id){var v=document.getElementById('apView'+id.charAt(0).toUpperCase()+id.slice(1));if(v)v.classList.toggle('hidden',id!==target);});
  root.querySelectorAll('.ap-bottom button').forEach(function(b){b.classList.remove('active');});
  var active=target==='home'?root.querySelector('.ap-bottom button[data-action="view-home"]'):root.querySelector('.ap-bottom button[data-action="view-assets"]');if(active)active.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});return;
 }
 if(a==='open-product'){var pi=Number(el.getAttribute('data-product-index'));var prod=products[pi];var detail=document.getElementById('apProductDetail');if(prod&&detail){detail.innerHTML='<div class="ap-detail-image"><span class="ap-product-badge">'+esc(prod.badge)+'</span><img src="'+prod.image+'" alt="'+esc(prod.name)+'"></div><div class="ap-detail-body"><small>'+esc(prod.brand)+' · '+esc(prod.cat)+'</small><h1>'+esc(prod.name)+'</h1><div class="ap-stars">★★★★★ <span>'+esc(prod.rating)+'</span></div><strong class="ap-detail-price">$'+Number(prod.price).toFixed(2)+'</strong><p>'+esc(prod.desc)+'</p><div class="ap-detail-info"><span>✓ Correct product image</span><span>✓ Product description</span><span>✓ Category matched</span></div><button class="ap-primary" data-action="product-action" data-name="'+esc(prod.name)+'">Add to Cart / Task</button></div>';}var ids=['home','referral','topup','shop','product','assets','crypto'];ids.forEach(function(id){var v=document.getElementById('apView'+id.charAt(0).toUpperCase()+id.slice(1));if(v)v.classList.toggle('hidden',id!=='product');});window.scrollTo({top:0,behavior:'smooth'});return;}
 if(a==='product-action'){var toast=document.createElement('div');toast.className='ap-toast';toast.textContent=(el.getAttribute('data-name')||'Product')+' selected';document.body.appendChild(toast);setTimeout(function(){toast.remove();},1800);return;}
 if(a==='preview-product'){var n=el.getAttribute('data-name')||'Item';var toast=document.createElement('div');toast.className='ap-toast';toast.textContent=n+' — preview only';document.body.appendChild(toast);setTimeout(function(){toast.remove();},1800);return;}
 if(a==='copy-client-id'){var id=(state.profile&&state.profile.client_id)||'AP-CLIENT';if(navigator.clipboard)navigator.clipboard.writeText(id);return;}
 if(a==='share-ref'){var link=location.origin+location.pathname+'?ref='+encodeURIComponent((state.profile&&state.profile.referral_code)||'');if(navigator.share)navigator.share({title:'AegisPay Referral',text:'Join AegisPay using my referral link',url:link}).catch(function(){});else if(navigator.clipboard)navigator.clipboard.writeText(link);return;}
 if(a==='language')return;
 if(a==='retry-runtime'){checkRuntime();return;}
  if(a==='complete-task'){
   if(busy)return;busyStart();render();
   try{var taskResult=await service.client().rpc('complete_task',{p_task_id:el.getAttribute('data-id')});if(taskResult.error)throw taskResult.error;setMessage(t('taskCompleted'),'success');await refreshData();state.messageTone='success';}
   catch(err){setMessage(authError(err));}
   finally{busy=false;render();} return;
  }
  if(a==='copy-ref'){
   var refCode=state.profile&&state.profile.referral_code||'';
   if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(refCode).then(function(){setMessage('Referral code copied.','success');state.messageTone='success';render();}).catch(function(){setMessage(t('error'));render();});
   else{setMessage(t('error'));render();}
   return;
  }
 if(a==='keep-language'){askLanguage=false;try{localStorage.setItem('aegispay-language',locale);}catch(e){}render();return;}
 if(a==='login'){state.mode='login';state.message='';render();}
 else if(a==='signup'){state.mode='signup';state.message='';render();}
 else if(a==='reset'){state.mode='reset';state.message='';render();}
 else if(a==='logout'){await service.signOut();state.profile=null;state.mode='login';state.phase='ready';render();}
 else if(a==='link-wallet'){
  try{busyStart();var r=await service.client().rpc('link_withdrawal_wallet',{p_address:document.getElementById('walletAddress').value.trim(),p_owner_name:document.getElementById('walletOwner').value.trim()});if(r.error)throw r.error;setMessage(t('walletLinked'),'success');state.messageTone='success';await refreshData();}
  catch(err){setMessage(authError(err));}finally{busy=false;render();}
 }
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

