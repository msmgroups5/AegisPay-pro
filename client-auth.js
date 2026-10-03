(function(){
'use strict';
var root=document.getElementById('app');
var service=window.AegisSupabaseService;
var state={phase:'loading',mode:(new URLSearchParams((location.hash||'').replace(/^#/, '')).get('type')==='invite'||new URLSearchParams((location.hash||'').replace(/^#/, '')).get('type')==='recovery')?'password-update':'login',profile:null,data:{deposits:[],withdrawals:[],kyc:null},view:(new URLSearchParams((location.hash||'').replace(/^#/,'')).get('page')||'home'),message:'',messageTone:'error',appEnabled:null,runtimeUnverified:false};
var busy=false,profileRequest=null,runtimeRequest=null,runtimeTimer=null; var homeScreen=true;
var AP_UI_SETTINGS=Object.freeze({
 palette:{
  primaryRed:'#E50914',lightRed:'#FF4D6D',darkRed:'#C81E3A',
  background:'#F6F8FC',navy:'#102033',card:'#FFFFFF',softPink:'#FFF4F6',
  textPrimary:'#1A1A1A',textSecondary:'#6B7280',border:'#E5E7EB',
  success:'#22C55E',warning:'#F59E0B',blue:'#3B82F6'
 },
 typography:{family:'Poppins,Inter,Roboto,Arial,sans-serif',nameSize:'28px',cardTitleSize:'18px'},
 layout:{maxWidth:'430px',radius:'20px',gap:'9px',bottomNavHeight:'70px'},
 features:{showScan:false,showAmazonPromo:true,showReferral:true}
});

var PREMIUM_SHOP=window.AegisShopCatalog||[];var SHOP_CATEGORIES=['All','Electronics','Fashion','Home & Kitchen','Beauty','Sports','Gaming','Office','Books','Outdoor'];var shopSearch='',shopCategory='All';
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
   await refreshData();state.mode='dashboard';state.view=pageRoute(state.view);homeScreen=state.view==='home';state.phase='ready';state.message='';render();
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
  c.from('kyc_verifications').select('id,document_type,status,ai_review_status,review_reason,submitted_at').eq('user_id',p.id).order('submitted_at',{ascending:false}).limit(1),
  c.from('tasks').select('id,user_id,cycle_id,title,description,status,progress,reward,task_value,offer_id,start_date,due_date,completion_date').eq('user_id',p.id).order('start_date',{ascending:false}).limit(100),
  c.from('cycle_runs').select('id,user_id,tier_id,cycle_base,status,task_completed_at,ready_at,settled_at,profit_amount,created_at,source_deposit_id').eq('user_id',p.id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
  c.from('referrals').select('id,user_id,referred_user_id,referral_level,platform_reward,created_at').eq('user_id',p.id).order('created_at',{ascending:false}).limit(100),
  c.from('notifications').select('id,user_id,notification_type,title,body,is_read,created_at').eq('user_id',p.id).order('created_at',{ascending:false}).limit(50),
  c.from('shop_offers').select('id,title,subtitle,task_level,tier_min_id,product_id,reward_text,status,instructions,created_at,updated_at').eq('status','ACTIVE').order('created_at',{ascending:false})
 ]);
 if(profileRes.error)throw profileRes.error;
 state.profile=profileRes.data||p;
 state.data={deposits:depositsRes.data||[],withdrawals:withdrawalsRes.data||[],kyc:(kycRes.data||[])[0]||null,tasks:tasksRes.data||[],cycle:(cycleRes.data||[])[0]||null,referrals:refsRes.data||[],notifications:notificationsRes.data||[],offers:offersRes.data||[]};
 if(depositsRes.error)state.data.deposits=[];
 if(withdrawalsRes.error)state.data.withdrawals=[];
 if(kycRes.error)state.data.kyc=null;
 if(tasksRes.error)state.data.tasks=[];if(cycleRes.error)state.data.cycle=null;if(refsRes.error)state.data.referrals=[];if(notificationsRes.error)state.data.notifications=[];if(offersRes.error)state.data.offers=[];
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
function shopCartKey(){return 'aegispay-premium-cart:'+((state.profile&&state.profile.id)||'guest');}
function loadShopCart(){try{var v=JSON.parse(localStorage.getItem(shopCartKey())||'[]');return Array.isArray(v)?v:[]}catch(e){return [];}}
function saveShopCart(v){try{localStorage.setItem(shopCartKey(),JSON.stringify(v));}catch(e){}}
function currentShopTasks(d){return d&&d.cycle?(d.tasks||[]).filter(function(x){return x.cycle_id===d.cycle.id;}):[];}
function shopTaskForProduct(d,id){
  var tasks=currentShopTasks(d),offers=(d&&d.offers)||[];
  for(var i=0;i<tasks.length;i++){
   var task=tasks[i],offer=offers.find(function(x){return String(x.id)===String(task.offer_id);});
   if(offer&&String(offer.product_id||'')===String(id))return task;
  }
  return null;
}
function shopProductList(){var q=shopSearch.trim().toLowerCase(),cat=shopCategory.toLowerCase();return PREMIUM_SHOP.filter(function(p){return (cat==='all'||p.category.toLowerCase()===cat)&&(!q||p.title.toLowerCase().indexOf(q)>=0||p.brand.toLowerCase().indexOf(q)>=0||p.category.toLowerCase().indexOf(q)>=0||p.subcategory.toLowerCase().indexOf(q)>=0);});}
async function completeShopPurchase(productId){
 var d=state.data||{},task=shopTaskForProduct(d,productId);
 if(!task){setMessage('This Shop item is not assigned to your current cycle.','error');render();return;}
 if(task.status==='Completed'){saveShopCart(loadShopCart().filter(function(x){return x!==productId;}));render();return;}
 if(busy)return;
 busyStart();render();
 try{
  var result=await service.client().rpc('complete_task',{p_task_id:task.id});
  if(result.error)throw result.error;
  saveShopCart(loadShopCart().filter(function(x){return x!==productId;}));
  await refreshData();
  if(result.data&&result.data.status==='WAITING_18H'){
   setMessage('All assigned Shop tasks are complete. The 18-hour settlement timer has started.','success');
  }else{
   setMessage('Shop task completed successfully.','success');
  }
  state.messageTone='success';
 }catch(err){setMessage(authError(err));}
 finally{busy=false;render();}
}
function shopSection(d){
 var cart=loadShopCart(),filtered=shopProductList(),tasks=currentShopTasks(d),hasCycle=!!(d&&d.cycle),assignedCount=Math.min(tasks.length,PREMIUM_SHOP.length);
 var chips=SHOP_CATEGORIES.map(function(cat){return '<button type="button" class="aegis-shop-chip '+(shopCategory===cat?'active':'')+'" data-action="shop-category" data-category="'+esc(cat)+'">'+esc(cat)+'</button>';}).join('');
 var products=filtered.map(function(p){var inCart=cart.indexOf(p.id)>=0,task=shopTaskForProduct(d,p.id),pending=task&&task.status!=='Completed';return '<article class="aegis-product"><div class="aegis-product-media"><span class="fallback">'+esc(p.emoji)+'</span><img src="'+esc(p.image)+'" alt="'+esc(p.title)+'" onerror="this.classList.add(\'broken\')" loading="lazy"><span class="aegis-product-badge">'+esc(p.badge)+'</span>'+(pending?'<span class="aegis-task-badge">TASK</span>':'')+'</div><div class="aegis-product-body"><div class="aegis-product-brand">'+esc(p.brand)+'</div><div class="aegis-product-title">'+esc(p.title)+'</div><div class="aegis-stars">★★★★★ <span>'+Number(p.rating||4.5).toFixed(1)+'</span></div><div class="aegis-product-price"><strong>$'+Number(p.marketPrice).toFixed(2)+'</strong><small>display</small></div><div class="aegis-task-value '+(pending?'':'browse')+'">'+(pending?'Task '+money(task.task_value)+' assigned':'Browse only · no task')+'</div><button type="button" class="aegis-product-action '+(inCart?'added':(pending?'task':''))+'" data-action="shop-add" data-id="'+esc(p.id)+'">'+(inCart?'✓ Added to Cart':(pending?'Add to Cart':'Preview Item'))+'</button></div></article>';}).join('');
 var cartProducts=cart.map(function(id){for(var i=0;i<PREMIUM_SHOP.length;i++){if(PREMIUM_SHOP[i].id===id)return PREMIUM_SHOP[i];}return null;}).filter(Boolean);
 var cartRows=cartProducts.map(function(p){var task=shopTaskForProduct(d,p.id),pending=task&&task.status!=='Completed';return '<div class="aegis-cart-item"><img class="aegis-cart-thumb" src="'+esc(p.image)+'" alt="" onerror="this.style.display=\'none\'"><div class="aegis-cart-copy"><b>'+esc(p.title)+'</b><small>'+esc(p.category)+' · $'+Number(p.marketPrice).toFixed(2)+' display</small><strong>'+(task?'Task: '+esc(task.title):'Preview item only')+'</strong></div><div class="aegis-cart-actions"><button type="button" class="remove" data-action="shop-remove" data-id="'+esc(p.id)+'">Remove</button>'+(pending?'<button type="button" class="buy" data-action="shop-buy" data-id="'+esc(p.id)+'">Buy</button>':'')+'</div></div>';}).join('');
 var total=cartProducts.reduce(function(a,p){return a+Number(p.marketPrice||0);},0);
 return '<section class="section aegis-shop" id="shop"><div class="aegis-shop-head"><div class="aegis-shop-brand"><span class="aegis-shop-logo">A</span><div><h3>'+t('shopTitle')+'</h3><small>Marketplace-style task center · '+PREMIUM_SHOP.length+' products</small></div></div><button type="button" class="aegis-shop-cart-top" data-action="shop-cart-focus" aria-label="Open cart">🛒<span class="aegis-shop-cart-count">'+cart.length+'</span></button></div><div class="aegis-shop-hero"><span class="kicker">AegisPay Marketplace</span><h4>Browse • Add to Cart • Buy • Complete</h4><p>Familiar shopping-style browsing from $2 to $999. Market prices are display-only; only TASK items are linked to assigned AegisPay tasks.</p><div class="aegis-shop-hero-meta"><span>'+PREMIUM_SHOP.length+' products</span><span>'+assignedCount+' assigned tasks</span><span>'+(hasCycle?'Cycle active':'Activate after verified deposit')+'</span></div></div><div class="aegis-shop-controls"><form id="shopSearchForm" class="aegis-shop-search"><input id="shopSearchInput" value="'+esc(shopSearch)+'" placeholder="Search products, brands or categories"><button type="submit" aria-label="Search">⌕</button></form><div class="aegis-shop-chips">'+chips+'</div></div>'+(products?'<div class="aegis-shop-grid">'+products+'</div>':'<div class="aegis-shop-empty"><b>No matching products</b>Try another search or category.</div>')+'<div class="aegis-cart" id="shop-cart"><div class="aegis-cart-head"><div><h4>Shopping Cart</h4><small>'+cart.length+' item'+(cart.length===1?'':'s')+' · simulated display</small></div><button type="button" class="aegis-shop-chip" data-action="shop-clear">Clear</button></div><div class="aegis-cart-list">'+(cartRows||'<div class="aegis-cart-empty">Your cart is empty. Add a TASK item to continue.</div>')+'</div><div class="aegis-cart-footer"><div><span>Cart display total</span><strong>$'+total.toFixed(2)+'</strong></div><div><span>Task rule</span><strong style="font-size:11px">'+(hasCycle?'Buy mapped tasks to complete them':'Verify deposit to activate tasks')+'</strong></div></div></div><div class="aegis-shop-notice"><div>🛡️</div><div><strong>TESTNET / DEMO SAFEGUARD</strong>This is an AegisPay task interface, not a real marketplace checkout. “Buy” completes the mapped assigned task through the existing secure backend function; no real product order is submitted.</div></div></section>';
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

function pageRoute(v){
 v=String(v||'home').toLowerCase();
 return ['home','assets','account','deposit','shop','crypto','referrals','kyc','notifications','ai'].indexOf(v)>=0?v:'home';
}
function navigateView(v,replace){
 state.view=pageRoute(v);homeScreen=state.view==='home';
 var hash=state.view==='home'?'':'#page='+encodeURIComponent(state.view);
 try{var url=location.pathname+location.search+hash;(replace?history.replaceState:history.pushState).call(history,null,document.title,url);}catch(e){}
 render();
}
function clientPageNav(active){
 var tabs=[['home','home','Home'],['assets','check','Assets'],['account','user','My Profile'],['ai','robot','AI Bot']];
 return '<nav class="ap-bottom-nav">'+tabs.map(function(x){
   return '<button class="ap-nav-item '+(active===x[0]?'active':'')+'" data-action="'+(x[0]==='home'?'home-dashboard':x[0]==='account'?'profile':x[0]==='assets'?'next-assets':'next-ai')+'">'+icon(x[1])+'<span class="ap-nav-label">'+x[2]+'</span></button>';
 }).join('')+'</nav>';
}
function clientPageFrame(title,subtitle,body,active,backView){
 return '<div class="ap-shell ap-subpage-shell"><header class="ap-subpage-header"><button class="ap-subpage-back" type="button" data-action="'+(backView==='home'?'home-dashboard':'next-'+backView)+'" aria-label="Back">‹</button><div class="ap-subpage-brand"><img src="./aegispay-logo.svg" alt=""><span class="ap-brand-word">Aegis<span>Pay</span></span></div><button class="ap-circle-btn profile" type="button" data-action="profile" aria-label="Profile">'+icon('user')+'</button></header><section class="ap-subpage-title"><span class="ap-page-kicker">AEGISPAY CLIENT PORTAL</span><h1>'+esc(title)+'</h1><p>'+esc(subtitle||'')+'</p></section><main class="ap-subpage-content">'+body+'</main>'+clientPageNav(active)+'</div>';
}
function compactSection(title,body,extra){
 return '<section class="ap-page-card '+(extra||'')+'"><div class="ap-page-card-head"><h2>'+esc(title)+'</h2></div>'+body+'</section>';
}
function kycPageBody(d){
 var kyc=d.kyc;
 if(kyc&&kyc.status==='VERIFIED')return compactSection(t('kyc'),'<div class="ap-status-success">'+statusBadge(t('kycDone'))+'</div><p>'+esc(t('kycHelp'))+'</p>','is-success');
 if(kyc&&(kyc.status==='PENDING_REVIEW'||kyc.status==='MANUAL_REVIEW'))return compactSection(t('kycTitle'),'<p>'+esc(t('kycHelp'))+'</p>'+statusBadge(kyc.status)+'<p>'+esc(kyc.review_reason||t('pending'))+'</p>');
 return compactSection(t('kycTitle'),'<p>'+esc(t('kycHelp'))+'</p><form id="kycForm"><div class="field"><label>'+t('documentType')+'</label><select id="kycType"><option value="CNIC">'+t('cnic')+'</option><option value="PASSPORT">'+t('passport')+'</option></select></div><div class="field"><label>'+t('front')+'</label><input id="kycFront" type="file" accept="image/jpeg,image/png,image/webp" required></div><div class="field" id="kycBackWrap"><label>'+t('backImage')+'</label><input id="kycBack" type="file" accept="image/jpeg,image/png,image/webp"></div><label class="ap-check-row"><input id="kycConsent" type="checkbox" required><span>'+t('consent')+'</span></label><button class="primary" type="submit" '+(busy?'disabled':'')+'>'+t('submitKyc')+'</button></form>');
}
function renderClientView(){
 var d=state.data||{},p=state.profile||{},v=pageRoute(state.view);
 state.view=v;homeScreen=v==='home';
 if(v==='home'){homeView();return;}
 if(v==='shop'){root.innerHTML=clientPageFrame(t('shopTitle'),'Browse and complete only the Shop tasks assigned to your current cycle.',shopSection(d),'home','home');return;}
 if(v==='deposit'){
  var tiers=[['T1',30],['T2',50],['T3',100],['V1',250],['V2',500],['V3',1000]];
  var tierOptions=tiers.map(function(x){return '<option value="'+x[0]+'">'+x[0]+' — $'+x[1]+'</option>';}).join('');
  var body=compactSection(t('deposit'),'<p>'+esc(t('depositHelp'))+'</p><div class="notice">'+esc(t('network'))+'</div><form id="depositForm"><div class="field"><label>'+t('tier')+'</label><select id="depositTier">'+tierOptions+'</select></div><div class="field"><label>'+t('amount')+'</label><input id="depositAmount" type="number" min="1" step="0.01" value="30" required></div><div class="field"><label>'+t('txid')+'</label><input id="depositTxid" type="text" minlength="64" maxlength="64" pattern="[A-Fa-f0-9]{64}" required></div><div class="field"><label>'+t('proof')+'</label><input id="depositProof" type="file" accept="image/jpeg,image/png,image/webp" required></div><button class="primary" type="submit" '+(busy?'disabled':'')+'>'+t('submit')+'</button></form>')+historyTable(t('deposits'),d.deposits||[],'deposit');
  root.innerHTML=clientPageFrame(t('deposit'),'Submit a deposit and track your verification status.',body,'assets','home');
  var tier=document.getElementById('depositTier'),amount=document.getElementById('depositAmount');if(tier&&amount)tier.addEventListener('change',function(){var opt=tier.options[tier.selectedIndex];amount.value=opt.text.match(/\$(\d+(?:\.\d+)?)/)?.[1]||30;});return;
 }
 if(v==='assets'){
  var body=compactSection('Assets','<div class="ap-balance-big">'+money(p.current_platform_balance)+'</div><p class="ap-muted">Available platform balance</p><div class="ap-asset-grid"><div><small>'+t('principal')+'</small><strong>'+money(p.principal_balance)+'</strong></div><div><small>'+t('profit')+'</small><strong>'+money(p.profit_balance)+'</strong></div><div><small>Manual credit</small><strong>'+money(p.manual_credit_balance)+'</strong></div></div>')+historyTable(t('deposits'),d.deposits||[],'deposit')+historyTable(t('withdraw'),d.withdrawals||[],'withdrawal');
  root.innerHTML=clientPageFrame('Assets','Balances and recent account activity.',body,'assets','home');return;
 }
 if(v==='account'){
  var account=compactSection('Account Details','<div class="ap-detail-grid"><div><small>Name</small><strong>'+esc(p.name||'')+'</strong></div><div><small>Email</small><strong>'+esc(p.email||'')+'</strong></div><div><small>Client ID</small><strong>'+esc(p.client_id||'AP-CLIENT')+'</strong></div><div><small>Account Status</small><strong>'+esc(p.status||'Active')+'</strong></div><div><small>Referral Code</small><strong>'+esc(p.referral_code||'')+'</strong></div></div>')+compactSection('Identity Verification','<p>'+esc(d.kyc&&d.kyc.status?d.kyc.status:t('kycNeeded'))+'</p><button class="tg-button-soft" type="button" data-action="next-kyc">Manage KYC</button>')+'<button class="tg-button-soft ap-wide-btn" type="button" data-action="logout">'+t('logout')+'</button>';
  root.innerHTML=clientPageFrame('My Profile','Your account details, identity status and secure sign-out.',account,'account','home');return;
 }
 if(v==='crypto'){
  var walletForm=p.destination_address?'<div class="ap-wallet-linked"><small>'+t('wallet')+'</small><code>'+esc(p.destination_address)+'</code></div>':'<div class="field"><label>'+t('wallet')+'</label><input id="walletAddress" autocomplete="off" required></div><div class="field"><label>'+t('walletOwner')+'</label><input id="walletOwner" value="'+esc(p.name||'')+'" required></div><button type="button" class="primary" data-action="link-wallet">'+t('linkWallet')+'</button>';
  var body=compactSection('Crypto & Withdrawals','<div class="notice">'+esc(!d.kyc||d.kyc.status!=='VERIFIED'?t('withdrawKyc'):'KYC verified — withdrawals available.')+'</div><form id="withdrawForm">'+walletForm+'<div class="field"><label>'+t('withdrawAmount')+'</label><input id="withdrawAmount" type="number" min="50" step="0.01" required></div><button class="primary" type="submit">'+t('requestWithdraw')+'</button></form>')+compactSection('Withdrawal History',historyTable(t('withdraw'),d.withdrawals||[],'withdrawal'));
  root.innerHTML=clientPageFrame('Crypto','Manage your linked TRON wallet and withdrawal requests.',body,'assets','home');return;
 }
 if(v==='referrals'){root.innerHTML=clientPageFrame(t('referralsTitle'),'Invite friends and view your referral rewards.',referralsSection(d),'account','home');return;}
 if(v==='kyc'){
  var body=kycPageBody(d);root.innerHTML=clientPageFrame(t('kycTitle'),'Submit identity verification documents securely.',body,'account','account');
  var type=document.getElementById('kycType'),backWrap=document.getElementById('kycBackWrap');if(type&&backWrap)type.addEventListener('change',function(){backWrap.style.display=type.value==='CNIC'?'block':'none';});return;
 }
 if(v==='notifications'){root.innerHTML=clientPageFrame(t('notificationsTitle'),'Your account notifications and recent updates.',notificationsSection(d),'home','home');return;}
 if(v==='ai'){root.innerHTML=clientPageFrame(t('aiTitle'),'Ask about deposits, Shop, withdrawals, KYC or referrals.',aiSection(),'ai','home');return;}
 state.view='home';homeScreen=true;navigateView('home',true);
}

function renderWorkspace(){
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
 var body='<section class="aegis-dashboard-hero"><div class="aegis-dashboard-hero-row"><div><span class="aegis-kicker">PRIVATE CLIENT WORKSPACE · TESTNET DEMO</span><h1>'+t('hi')+', '+esc(p.name||'')+'</h1><div class="aegis-balance">'+money(p.current_platform_balance)+'</div><p class="aegis-sub">Available platform balance · secure client session</p></div><div class="aegis-dash-actions"><a class="aegis-shop-cta" href="#shop">Open Shop</a><button class="aegis-logout" data-action="logout">'+t('logout')+'</button></div></div><nav class="aegis-dash-nav"><a href="#overview">Overview</a><a href="#shop">Shop</a><a href="#deposit-area">Deposit</a><a href="#kyc-area">KYC</a><a href="#withdraw-area">Withdraw</a></nav></section>'+
  '<div id="overview" class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:0 18px 15px"><div class="stat-card"><small>'+t('balance')+'</small><strong>'+money(p.current_platform_balance)+'</strong></div><div class="stat-card"><small>'+t('principal')+'</small><strong>'+money(p.principal_balance)+'</strong></div><div class="stat-card"><small>'+t('profit')+'</small><strong>'+money(p.profit_balance)+'</strong></div><div class="stat-card"><small>'+t('kyc')+'</small><strong style="font-size:15px">'+esc(kycLabel)+'</strong></div></div>'+
  '<div class="notice" style="margin:14px 0">'+t('network')+'</div>'+
  '<section class="section" id="deposit-area"><h3>'+t('deposit')+'</h3><p>'+t('depositHelp')+'</p><form id="depositForm"><div class="field"><label>'+t('tier')+'</label><select id="depositTier">'+tierOptions+'</select></div><div class="field"><label>'+t('amount')+'</label><input id="depositAmount" type="number" min="1" step="0.01" value="30" required></div><div class="field"><label>'+t('txid')+'</label><input id="depositTxid" type="text" minlength="64" maxlength="64" pattern="[A-Fa-f0-9]{64}" required></div><div class="field"><label>'+t('proof')+'</label><input id="depositProof" type="file" accept="image/jpeg,image/png,image/webp" required></div><button class="primary" type="submit" '+(busy?'disabled':'')+'>'+t('submit')+'</button></form></section>'+
  '<div id="kyc-area">'+kycSection+'</div>'+
  '<section class="section" id="withdraw-area" style="margin-top:18px"><h3>'+t('withdraw')+'</h3><form id="withdrawForm">'+walletForm+'<div class="field"><label>'+t('withdrawAmount')+'</label><input id="withdrawAmount" type="number" min="50" step="0.01" required></div><button class="primary" type="submit">'+t('requestWithdraw')+'</button></form></section>'+
  '<section class="section" style="margin-top:18px"><h3>'+t('refCode')+'</h3><code>'+esc(p.referral_code||'')+'</code></section>'+
  profileSection(p)+historyTable(t('deposits'),d.deposits||[],'deposit')+historyTable(t('withdraw'),d.withdrawals||[],'withdrawal')+shopSection(d)+referralsSection(d).replace('<section class="section" style="margin-top:18px">','<section class="section" id="referrals-area" style="margin-top:18px">')+notificationsSection(d).replace('<section class="section" style="margin-top:18px">','<section class="section" id="notifications-area" style="margin-top:18px">')+aiSection().replace('<section class="section" style="margin-top:18px">','<section class="section" id="ai-area" style="margin-top:18px">');
 root.innerHTML=shell(body,'dashboard');
 var type=document.getElementById('kycType'),backWrap=document.getElementById('kycBackWrap');
 if(type&&backWrap)type.addEventListener('change',function(){backWrap.style.display=type.value==='CNIC'?'block':'none';});
 var tier=document.getElementById('depositTier'),amount=document.getElementById('depositAmount');
 if(tier&&amount)tier.addEventListener('change',function(){var opt=tier.options[tier.selectedIndex];amount.value=opt.text.match(/\$(\d+(?:\.\d+)?)/)?.[1]||30;});
}




function profileSection(p){p=p||{};return '<section class="section" id="profile-area" style="margin-top:18px"><h3>Account Details</h3><div class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px"><div class="stat-card"><small>Name</small><strong style="font-size:15px">'+esc(p.name||'')+'</strong></div><div class="stat-card"><small>Email</small><strong style="font-size:13px;word-break:break-word">'+esc(p.email||'')+'</strong></div><div class="stat-card"><small>Client ID</small><strong style="font-size:13px;word-break:break-word">'+esc(p.client_id||'AP-CLIENT')+'</strong></div><div class="stat-card"><small>Account Status</small><strong style="font-size:15px">'+esc(p.status||'Active')+'</strong></div></div></section>';}

function icon(type){
 var m={
  bell:'<svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" fill="currentColor" opacity=".96"/><path d="M10 21h4" stroke="currentColor" stroke-width="1.8"/></svg>',
  user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6" fill="currentColor"/><path d="M5 21c.7-4.2 3.1-6.5 7-6.5s6.3 2.3 7 6.5" fill="currentColor"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><rect x="8" y="7" width="12" height="13" rx="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 16H4.6A2.6 2.6 0 0 1 2 13.4V5.6A2.6 2.6 0 0 1 4.6 3h9.8A2.6 2.6 0 0 1 17 5.6V6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  wallet:'<svg viewBox="0 0 24 24"><rect x="2.8" y="5.1" width="18.4" height="14.2" rx="3.1" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M15 11.1h6v4.5h-6.1a2.2 2.2 0 0 1 0-4.4Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.7" cy="13.4" r=".9" fill="currentColor"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  cart:'<svg viewBox="0 0 24 24"><path d="M3 4h2.3l2.1 10.8h10.7l2.2-7.5H6.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.2" cy="19" r="1.6" fill="currentColor"/><circle cx="17.3" cy="19" r="1.6" fill="currentColor"/><path d="M8.2 8.2h11.1" stroke="currentColor" stroke-width="1.2" opacity=".55"/></svg>',
  card:'<svg viewBox="0 0 24 24"><rect x="2.7" y="4.2" width="18.6" height="15.6" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="8.2" cy="11" r="2.4" fill="currentColor"/><path d="M12.5 9h5M12.5 12h5M6 15.6h11.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  doc:'<svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 8h6M9 12h6M9 16h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  btc:'<svg viewBox="0 0 24 24"><path d="M8.7 5.1v13.8M11.8 5.1h2.4c1.8 0 3 1.1 3 2.6s-1.2 2.6-3 2.6H8.7m3.1 0h2.8c2.1 0 3.5 1.1 3.5 2.9s-1.4 3.1-3.5 3.1H8.7M7.2 3.8l1.5 1.3M14.2 3.8l-1.2 1.3" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  crown:'<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="m3 7 5 4 4-8 4 8 5-4-2 12H5L3 7Z"/></svg>',
  gift:'<svg viewBox="0 0 24 24"><path d="M3.5 10h17v10.5H3.5zM2.8 7.2h18.4v3H2.8zM12 7.2v13.3M12 7.2H7.7c-1.6 0-2.7-.8-2.7-2s1.1-2.2 2.4-2.2c2.1 0 4.6 3.4 4.6 4.2ZM12 7.2h4.3c1.6 0 2.7-.8 2.7-2s-1.1-2.2-2.4-2.2c-2.1 0-4.6 3.4-4.6 4.2Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  users:'<svg viewBox="0 0 24 24"><circle cx="8.3" cy="9" r="3" fill="currentColor"/><circle cx="16.7" cy="10" r="2.4" fill="currentColor" opacity=".72"/><path d="M2.8 20c.7-4 2.7-6 5.7-6s5 2 5.7 6M14.1 15.8c2.9.2 4.9 1.6 5.5 4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  arrow:'<svg viewBox="0 0 24 24"><path d="m8.5 5.5 6.5 6.5-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  home:'<svg viewBox="0 0 24 24"><path d="m3 10.5 9-7.5 9 7.5v8.2a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 18.7Z" fill="currentColor" stroke="none"/><path d="M9.2 20.5v-5.8h5.6v5.8" fill="#0F1218" stroke="none"/></svg>',
  check:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.1" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m8 12 2.6 2.6L16.5 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  robot:'<svg viewBox="0 0 24 24"><rect x="4.4" y="7.1" width="15.2" height="12.1" rx="3.3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 3.2v3.4M8.1 12h.01M15.9 12h.01M8.6 15.7h6.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M6.9 8.9h10.2" stroke="currentColor" stroke-width="1.2" opacity=".5"/></svg>'
 };
 return '<span class="ap-icon">'+(m[type]||m.user)+'</span>';
}


function actionCard(theme,action,iconHtml,title,subtitle){
 var tone=['blue','red','green','orange'].indexOf(theme)>=0?theme:'blue';
 return '<button type="button" class="ap-action-card '+tone+'" data-action="'+esc(action)+'" aria-label="'+esc(title)+'">'+
   '<span class="ap-action-icon">'+iconHtml+'</span>'+
   '<span class="ap-action-copy"><span class="ap-action-title">'+esc(title)+'</span><span class="ap-action-subtitle">'+esc(subtitle)+'</span></span>'+
   '<span class="ap-action-arrow">'+icon('arrow')+'</span>'+
 '</button>';
}

function homeView(){
 var p=state.profile||{};
 var userName=String(p.name||'Client');
 var clientId=String(p.client_id||'');
 var dot=state.data&&Array.isArray(state.data.notifications)&&state.data.notifications.some(function(n){return n&&!n.is_read;});
 function useIconRef(id){return '<svg class="i" aria-hidden="true"><use href="#ap-'+id+'"></use></svg>';}
 root.innerHTML='<div class="ap-reference-ui"><svg width="0" height="0" style="position:absolute"><defs>'+
 '<symbol id="ap-wallet" viewBox="0 0 24 24"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 1 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></symbol>'+
 '<symbol id="ap-cart" viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 7H5"/></symbol>'+
 '<symbol id="ap-file" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/></symbol>'+
 '<symbol id="ap-users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></symbol>'+
 '<symbol id="ap-bell" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></symbol>'+
 '<symbol id="ap-home" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></symbol>'+
 '<symbol id="ap-user" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></symbol>'+
 '<symbol id="ap-pie" viewBox="0 0 24 24"><path d="M21.2 15.9A10 10 0 1 1 8 2.8"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></symbol>'+
 '<symbol id="ap-bot" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V5M9 14v2M15 14v2"/><circle cx="12" cy="4" r="1"/></symbol>'+
 '<symbol id="ap-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></symbol>'+
 '<symbol id="ap-chevron" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol>'+
 '<symbol id="ap-arrow" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></symbol>'+
 '<symbol id="ap-gift" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></symbol>'+
 '<symbol id="ap-crown" viewBox="0 0 24 24"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7z"/><path d="M5 20h14"/></symbol>'+
 '</defs></svg><div class="app">'+
 '<div class="top"><div class="logo"><img src="./aegispay-logo.svg" alt="AegisPay"></div><div class="r">'+
 '<button type="button" class="bell" data-action="notice" aria-label="Notifications">'+useIconRef('bell')+(dot?'<span class="ap-reference-dot"></span>':'')+'</button>'+
 '<button type="button" class="av" data-action="profile" aria-label="My Profile">'+useIconRef('user')+'</button></div></div>'+
 '<div class="card welcome"><p>Welcome,</p><h1>'+esc(userName)+'</h1><div class="cid">Client ID: '+esc(clientId||'—')+'<button type="button" class="copy-reference" data-action="copy-client-id" aria-label="Copy Client ID">'+useIconRef('copy')+'</button></div></div>'+
 '<div class="card lv"><div><span class="crown lv1">'+useIconRef('crown')+'</span><small>LV 1</small><span class="lv-line lv1-line"></span></div><div><span class="crown lv2">'+useIconRef('crown')+'</span><small>LV 2</small><span class="lv-line lv2-line"></span></div><div><span class="crown lv3">'+useIconRef('crown')+'</span><small>LV 3</small><span class="lv-line lv3-line"></span></div></div>'+
 '<div class="grid">'+
 '<button type="button" class="card tile" data-action="next-topup"><div class="ico blue">'+useIconRef('wallet')+'</div><div><h3>Top Up</h3><p>Deposit Amount</p></div><span class="chev">'+useIconRef('chevron')+'</span></button>'+
 '<button type="button" class="card tile" data-action="next-shop"><div class="ico red">'+useIconRef('cart')+'</div><div><h3>Shop</h3><p>Amazon-style</p></div><span class="chev">'+useIconRef('chevron')+'</span></button>'+
 '<button type="button" class="card tile" data-action="next-account"><div class="ico green">'+useIconRef('file')+'</div><div><h3>Account Details</h3><p>View Your Account</p></div><span class="chev">'+useIconRef('chevron')+'</span></button>'+
 '<button type="button" class="card tile" data-action="next-crypto"><div class="ico orange crypto-ico">₿</div><div><h3>Crypto</h3><p>Buy &amp; Manage</p></div><span class="chev">'+useIconRef('chevron')+'</span></button>'+
 '</div>'+
 '<button type="button" class="card ref" data-action="next-referral"><div class="ico red">'+useIconRef('users')+'</div><div><h3>Referral</h3><p>Invite Friends &amp; Earn Rewards</p></div><span class="ref-art">'+useIconRef('gift')+'</span><span class="chev">'+useIconRef('chevron')+'</span></button>'+
 '<button type="button" class="card amz" data-action="next-shop"><div class="lg"><span class="amazon-word">amazon</span><span class="amazon-smile"></span></div><h2>Shop Millions<br>of <span>Products</span></h2><p>Everything you need in one place.</p><span class="btn">Start Shopping '+useIconRef('arrow')+'</span><div class="amazon-art"><div class="amazon-phone"><b>amazon</b><span></span><i></i><i></i><i></i><i></i></div><div class="amazon-box box-a">amazon</div><div class="amazon-box box-b"></div><div class="amazon-cart"><span></span><i></i><i></i></div></div></button>'+
 '<div class="card nav"><button type="button" class="on" data-action="home-dashboard"><span class="b">'+useIconRef('home')+'</span><span>Home</span></button><button type="button" data-action="next-assets"><span class="b">'+useIconRef('pie')+'</span><span>Assets</span></button><button type="button" data-action="profile"><span class="b">'+useIconRef('user')+'</span><span>My Profile</span></button><button type="button" data-action="next-ai"><span class="b">'+useIconRef('bot')+'</span><span>AI Bot</span></button></div>'+
 '</div></div>';
}
function profileSection(p){p=p||{};return '<section class="section" id="profile-area" style="margin-top:18px"><h3>Account Details</h3><div class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px"><div class="stat-card"><small>Name</small><strong style="font-size:15px">'+esc(p.name||'')+'</strong></div><div class="stat-card"><small>Email</small><strong style="font-size:13px;word-break:break-word">'+esc(p.email||'')+'</strong></div><div class="stat-card"><small>Client ID</small><strong style="font-size:13px;word-break:break-word">'+esc(p.client_id||'AP-CLIENT')+'</strong></div><div class="stat-card"><small>Account Status</small><strong style="font-size:15px">'+esc(p.status||'Active')+'</strong></div></div></section>';}

function render(){
 if(state.appEnabled===false){
  root.innerHTML=shell('<section class="tg-paused"><span class="tg-paused-icon">⏻</span><span class="tg-kicker">SERVICE STATUS</span><h1>'+t('pausedTitle')+'</h1><p>'+t(state.runtimeUnverified?'runtimeUnknown':'pausedInfo')+'</p><button type="button" class="tg-button tg-button-primary" data-action="retry-runtime">'+t('retryRuntime')+'</button></section>','auth');
 }else if(state.profile&&state.mode==='dashboard'){
  renderClientView();
 }else{
  renderAuth();
 }
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
  var result=await service.invokeFunction('submit-deposit',{body:{tierId:document.getElementById('depositTier').value,amount:Number(document.getElementById('depositAmount').value),txid:document.getElementById('depositTxid').value.trim(),screenshotPath:path}});
  if(result.error)throw result.error;
  if(result.data&&result.data.aiReviewStatus==='APPROVED'){
   var verified=await service.invokeFunction('verify-deposit',{body:{depositId:result.data.depositId}});
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
  var result=await service.invokeFunction('submit-kyc',{body:{documentType:doc,frontPath:front,backPath:back,processingConsent:true}});
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
 if(a==='home-dashboard'||a==='home'){navigateView('home');return;}
 if(a==='next-topup'){navigateView('deposit');return;}
 if(a==='next-shop'){navigateView('shop');return;}
 if(a==='next-account'||a==='profile'){navigateView('account');return;}
 if(a==='next-crypto'){navigateView('crypto');return;}
 if(a==='next-referral'){navigateView('referrals');return;}
 if(a==='next-assets'){navigateView('assets');return;}
 if(a==='next-ai'){navigateView('ai');return;}
 if(a==='next-kyc'){navigateView('kyc');return;}

 if(a==='copy-client-id'){var idValue=String(state.profile&&state.profile.client_id||'AP-CLIENT');if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(idValue).catch(function(){});return;} if(a==='notice'){navigateView('notifications');return;}
 if(a==='language')return;
 if(a==='retry-runtime'){checkRuntime();return;}
  if(a==='complete-task'){
   if(busy)return;busyStart();render();
   try{var taskResult=await service.client().rpc('complete_task',{p_task_id:el.getAttribute('data-id')});if(taskResult.error)throw taskResult.error;setMessage(t('taskCompleted'),'success');await refreshData();state.messageTone='success';}
   catch(err){setMessage(authError(err));}
   finally{busy=false;render();} return;
  }
  if(a==='shop-category'){shopCategory=el.getAttribute('data-category')||'All';render();return;}
  if(a==='shop-cart-focus'){var cartNode=document.getElementById('shop-cart');if(cartNode)cartNode.scrollIntoView({behavior:'smooth',block:'start'});return;}
  if(a==='shop-add'){var sid=el.getAttribute('data-id'),cart=loadShopCart();if(cart.indexOf(sid)<0){cart.push(sid);saveShopCart(cart);}render();return;}
  if(a==='shop-remove'){saveShopCart(loadShopCart().filter(function(x){return x!==el.getAttribute('data-id');}));render();return;}
  if(a==='shop-clear'){saveShopCart([]);render();return;}
  if(a==='shop-buy'){await completeShopPurchase(el.getAttribute('data-id'));return;}
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
 if(e.target.id==='shopSearchForm'){e.preventDefault();shopSearch=document.getElementById('shopSearchInput').value||'';render();return;}
 if(e.target.id==='aiForm'){
  e.preventDefault();
  var aiInput=document.getElementById('aiInput'),aiReply=document.getElementById('aiReply'),question=aiInput&&aiInput.value.trim();
  if(!question)return;
  if(aiReply)aiReply.textContent='Thinking…';
  try{
    var aiResult=await service.invokeFunction('ai-support',{body:{message:question}});
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
root.addEventListener('click',action);window.addEventListener('popstate',function(){state.view=pageRoute((new URLSearchParams((location.hash||'').replace(/^#/,'')).get('page')||'home'));homeScreen=state.view==='home';render();});root.addEventListener('change',function(e){if(e.target.matches('[data-action="language"]'))rememberLanguage(e.target.value);});

async function boot(){
 render();
 if(!service||!service.isAvailable()){state.phase='ready';setMessage(t('unavailable'));render();return;}
 service.onAuthStateChange(function(event,session){
  if(event==='SIGNED_OUT'){state.profile=null;homeScreen=true;state.mode='login';state.phase='ready';render();}
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

