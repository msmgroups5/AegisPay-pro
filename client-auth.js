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
  referral:'Referral code (optional)',passwordHint:'Use at least 8 characters.',signupSent:'Check your email to verify your account. After verification, sign in to continue.',
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
  ok:'Request submitted.',chooseFile:'Choose an image file.',fileTooLarge:'Each image must be smaller than 10 MB.',walletLinked:'Wallet linked.',withdrawKyc:'Complete KYC before requesting a withdrawal.',
  uploadBusy:'Uploading securely…',error:'Something went wrong. Please try again.',unavailable:'Secure sign-in is unavailable. Refresh and try again.'
 },
 ur:{
  language:'Zaban',detected:'Aapke device ki zaban detect hui hai. English ya Urdu chunein.',english:'English',urdu:'Urdu',continue:'Jaari rakhein',
  loading:'Secure connection check ho raha hai',checking:'Account verify ho raha hai',wait:'AegisPay aapka secure sign-in check kar raha hai.',pausedTitle:'AegisPay waqti tor par band hai',pausedInfo:'Master Admin ne service waqti tor par pause ki hai. Baad mein dobara koshish karein.',runtimeUnknown:'Secure service status check nahi ho saka. Connection dobara check karein.',retryRuntime:'Dobara check karein',invalidCredentials:'Email ya password match nahi hua. Dono check karke dobara koshish karein.',verifyEmail:'Pehle confirmation email se email verify karein, phir sign in karein.',
  welcome:'AegisPay mein khush aamdeed',signInText:'Sign in karein ya client account banayein.',email:'Email',password:'Password',name:'Poora naam',
  signIn:'Sign in',signingIn:'Sign in ho raha hai…',create:'Account banayein',creating:'Account ban raha hai…',forgot:'Password bhool gaye?',haveAccount:'Pehle se account hai?',newAccount:'AegisPay par naye hain?',
  referral:'Referral code (optional)',passwordHint:'Kam az kam 8 characters rakhein.',signupSent:'Account verify karne ke liye apni email check karein. Verify hone ke baad sign in karein.',
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
  ok:'Request submit ho gayi.',chooseFile:'Image file select karein.',fileTooLarge:'Har image 10 MB se chhoti honi chahiye.',walletLinked:'Wallet link ho gaya.',withdrawKyc:'Withdrawal se pehle KYC mukammal karein.',
  uploadBusy:'Secure upload ho raha hai…',error:'Masla hua. Dobara koshish karein.',unavailable:'Secure sign-in unavailable hai. Page refresh karke dobara try karein.'
 }
};
function t(k){return copy[locale][k]||copy.en[k]||k;}
function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function money(v){return '$'+Number(v||0).toLocaleString(locale==='ur'?'ur-PK':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
function shell(body,page){
 document.documentElement.lang=locale;document.documentElement.dir=locale==='ur'?'rtl':'ltr';
 var wide=page==='dashboard';
 return '<main class="tg-page '+(wide?'tg-page-dashboard':'')+'"><section class="tg-card '+(wide?'tg-card-dashboard':'tg-card-auth')+'">'+
 '<header class="tg-topbar"><div class="tg-brand"><img src="./aegispay-logo.svg" width="42" height="42" alt=""><span><b>Aegis<span>Pay</span></b><small>SECURE CLIENT PORTAL</small></span></div>'+ 
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
 var [profileRes,depositsRes,withdrawalsRes,kycRes]=await Promise.all([
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
function statusBadge(v){return '<span style="display:inline-block;padding:4px 8px;border-radius:99px;background:#edf3fa;color:#314760;font-size:12px">'+esc(String(v||'Pending').replaceAll('_',' '))+'</span>';}
function historyTable(title,rows,kind){
 var cells=rows.length?rows.map(function(r){
  var amount=kind==='deposit'?r.gross_amount:r.amount;
  var status=kind==='deposit'?(r.ai_review_status==='APPROVED'&&r.status==='PENDING_VERIFICATION'?'CHAIN CHECK':r.status):r.status;
  return '<tr><td>'+esc(date(r.created_at))+'</td><td>'+money(amount)+'</td><td>'+statusBadge(status)+'</td></tr>';
 }).join(''):'<tr><td colspan="3">'+t('empty')+'</td></tr>';
 return '<section class="section" style="margin-top:18px"><h3>'+title+'</h3><div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>'+t('date')+'</th><th>'+t('amount')+'</th><th>'+t('status')+'</th></tr></thead><tbody>'+cells+'</tbody></table></div></section>';
}
function renderDashboard(){
 var p=state.profile||{},d=state.data||{},kyc=d.kyc;
 var kycLabel=kyc?kyc.status:(t('kycNeeded'));
 var kycSection=kyc&&kyc.status==='VERIFIED'
  ?'<section class="section"><h3>'+t('kyc')+'</h3>'+statusBadge(t('kycDone'))+'</section>'
  :(kyc&&(kyc.status==='PENDING_REVIEW'||kyc.status==='MANUAL_REVIEW')
   ?'<section class="section" style="margin-top:18px"><h3>'+t('kycTitle')+'</h3><p>'+t('kycHelp')+'</p>'+statusBadge(kyc.status)+'<p>'+esc(kyc.review_reason||t('pending'))+'</p></section>'
   :'<section class="section" style="margin-top:18px"><h3>'+t('kycTitle')+'</h3><p>'+t('kycHelp')+'</p><form id="kycForm">'+
   '<div class="field"><label>'+t('documentType')+'</label><select id="kycType"><option value="CNIC">'+t('cnic')+'</option><option value="PASSPORT">'+t('passport')+'</option></select></div>'+
   '<div class="field"><label>'+t('front')+'</label><input id="kycFront" type="file" accept="image/jpeg,image/png,image/webp" required></div>'+
   '<div class="field" id="kycBackWrap"><label>'+t('backImage')+'</label><input id="kycBack" type="file" accept="image/jpeg,image/png,image/webp"></div>'+
   '<label style="display:flex;gap:8px;align-items:flex-start;margin:12px 0"><input id="kycConsent" type="checkbox" required><span>'+t('consent')+'</span></label>'+
   '<button class="primary" type="submit" '+(busy?'disabled':'')+'>'+t('submitKyc')+'</button></form><p>'+t('kyc')+': '+statusBadge(kycLabel)+'</p></section>');
 var walletForm=p.destination_address
  ?'<p>'+t('wallet')+': <code>'+esc(p.destination_address)+'</code></p>'
  :'<div class="field"><label>'+t('wallet')+'</label><input id="walletAddress" autocomplete="off" required></div><div class="field"><label>'+t('walletOwner')+'</label><input id="walletOwner" value="'+esc(p.name||'')+'" required></div><button type="button" class="primary" data-action="link-wallet">'+t('linkWallet')+'</button>';
 var tiers=[['T1',30],['T2',50],['T3',100],['V1',250],['V2',500],['V3',1000]];
 var tierOptions=tiers.map(function(x){return '<option value="'+x[0]+'">'+x[0]+' — $'+x[1]+'</option>';}).join('');
 var body='<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><h1>'+t('hi')+', '+esc(p.name||'')+'</h1><button class="ghost-dark" data-action="logout">'+t('logout')+'</button></div>'+
  '<div class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:15px 0"><div class="stat-card"><small>'+t('balance')+'</small><strong>'+money(p.current_platform_balance)+'</strong></div><div class="stat-card"><small>'+t('principal')+'</small><strong>'+money(p.principal_balance)+'</strong></div><div class="stat-card"><small>'+t('profit')+'</small><strong>'+money(p.profit_balance)+'</strong></div><div class="stat-card"><small>'+t('kyc')+'</small><strong style="font-size:15px">'+esc(kycLabel)+'</strong></div></div>'+
  '<div class="notice" style="margin:14px 0">'+t('network')+'</div>'+
  '<section class="section"><h3>'+t('deposit')+'</h3><p>'+t('depositHelp')+'</p><form id="depositForm"><div class="field"><label>'+t('tier')+'</label><select id="depositTier">'+tierOptions+'</select></div><div class="field"><label>'+t('amount')+'</label><input id="depositAmount" type="number" min="1" step="0.01" value="30" required></div><div class="field"><label>'+t('txid')+'</label><input id="depositTxid" type="text" minlength="64" maxlength="64" pattern="[A-Fa-f0-9]{64}" required></div><div class="field"><label>'+t('proof')+'</label><input id="depositProof" type="file" accept="image/jpeg,image/png,image/webp" required></div><button class="primary" type="submit" '+(busy?'disabled':'')+'>'+t('submit')+'</button></form></section>'+
  kycSection+
  '<section class="section" style="margin-top:18px"><h3>'+t('withdraw')+'</h3><form id="withdrawForm">'+walletForm+'<div class="field"><label>'+t('withdrawAmount')+'</label><input id="withdrawAmount" type="number" min="50" step="0.01" required></div><button class="primary" type="submit">'+t('requestWithdraw')+'</button></form></section>'+
  '<section class="section" style="margin-top:18px"><h3>'+t('refCode')+'</h3><code>'+esc(p.referral_code||'')+'</code></section>'+
  historyTable(t('deposits'),d.deposits||[],'deposit')+historyTable(t('withdraw'),d.withdrawals||[],'withdrawal');
 root.innerHTML=shell(body,'dashboard');
 var type=document.getElementById('kycType'),backWrap=document.getElementById('kycBackWrap');
 if(type&&backWrap)type.addEventListener('change',function(){backWrap.style.display=type.value==='CNIC'?'block':'none';});
 var tier=document.getElementById('depositTier'),amount=document.getElementById('depositAmount');
 if(tier&&amount)tier.addEventListener('change',function(){var opt=tier.options[tier.selectedIndex];amount.value=opt.text.match(/\$(\d+(?:\.\d+)?)/)?.[1]||30;});
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
  var result=await service.signUp(email,password,name,referral,locale);
  if(result.session){await refreshProfile();}
  else{state.mode='login';state.phase='ready';state.messageTone='success';setMessage(t('signupSent'),'success');}
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
  setMessage(t('ok'),'success');await refreshData();
 }catch(err){setMessage(authError(err));}
 finally{busy=false;render();}
}
async function action(e){
 var el=e.target.closest('[data-action]');if(!el)return;
 var a=el.getAttribute('data-action');
 if(a==='language')return;
 if(a==='retry-runtime'){checkRuntime();return;}
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
root.addEventListener('submit',function(e){
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
 if(!runtimeTimer)runtimeTimer=setInterval(checkRuntime,10000);
}
async function checkRuntime(){
 if(!service||!service.isAvailable()||runtimeRequest)return runtimeRequest;
 runtimeRequest=(async function(){
  var was=state.appEnabled,wasUnverified=state.runtimeUnverified;
  try{
   var enabled=await service.appRuntimeEnabled();state.runtimeUnverified=false;state.appEnabled=enabled;
   if(!enabled){state.profile=null;state.phase='paused';state.mode='login';state.message='';render();return;}
  if(was===false||state.phase==='loading'||wasUnverified){state.phase='ready';var session=await service.session();if(session)await refreshProfile();else{state.profile=null;state.mode='login';render();}}
   else render();
  }catch(err){state.appEnabled=false;state.runtimeUnverified=true;state.profile=null;state.phase='paused';setMessage(t('runtimeUnknown'));render();}
 })();
 try{return await runtimeRequest;}finally{runtimeRequest=null;}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
