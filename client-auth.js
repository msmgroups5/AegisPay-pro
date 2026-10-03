(function(){
'use strict';

var root=document.getElementById('app');
var service=window.AegisSupabaseService;
var state={phase:'loading',mode:'login',profile:null,unread:0,message:'',busy:false};

function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function setMessage(message){state.message=message||'';}
function authError(err){
 var m=String(err&&err.message||'');
 if(/invalid login credentials/i.test(m))return 'Invalid email or password.';
 if(/email not confirmed|not confirmed/i.test(m))return 'Please confirm your email before signing in.';
 if(/failed to fetch|network request failed|load failed/i.test(m))return 'Connection issue. Check your internet and try again.';
 return m||'Something went wrong. Please try again.';
}

function icon(type){
 var svg={
  bell:'<svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
  user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4"/><path d="M5 21c.7-4 3-6 7-6s6.3 2 7 6"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  wallet:'<svg viewBox="0 0 24 24"><path d="M4 6h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14"/><path d="M16 13h5"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  cart:'<svg viewBox="0 0 24 24"><path d="M3 4h2l2 11h11l2-8H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg>',
  card:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 14h3M7 9h10"/></svg>',
  btc:'<svg viewBox="0 0 24 24"><path d="M9 4v16M13 4v16M7 7h6a3 3 0 0 1 0 6H7h7a3 3 0 0 1 0 6H7"/></svg>',
  crown:'<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="m3 7 5 4 4-8 4 8 5-4-2 12H5L3 7Z"/></svg>',
  users:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20c.6-4 2.8-6 6-6s5.4 2 6 6M15 16c2.8.1 4.8 1.5 5.2 4"/></svg>',
  arrow:'<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
  home:'<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8v9H5v-7h14"/></svg>',
  checkCircle:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
  robot:'<svg viewBox="0 0 24 24"><rect x="5" y="7" width="14" height="12" rx="3"/><path d="M12 3v4M8 12h.01M16 12h.01M9 16h6"/></svg>',
  eye:'<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
  ref:'<svg viewBox="0 0 24 24"><circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.3"/><path d="M3 20c.6-4 2.4-6 5.5-6s5 2 5.5 6M14 15c2.7.2 4.6 1.7 5 5"/></svg>'
 };
 return '<span class="ap-icon">'+(svg[type]||svg.user)+'</span>';
}

function authShell(content){
 return '<div class="ap-login-wrap"><section class="ap-login">'+
   '<div class="ap-login-logo"><img src="./aegispay-logo.svg" alt="AegisPay"><strong>Aegis<span>Pay</span></strong></div>'+
   content+
 '</section></div>';
}

function renderAuth(){
 var body='';
 if(state.busy){
   body='<div class="ap-login-loading"><span class="ap-spinner"></span><h1>Secure sign-in</h1><p>Please wait while AegisPay connects.</p></div>';
 }else if(state.mode==='signup'){
   body='<h1>Create account</h1><p>Create your AegisPay client account.</p><form id="signupForm">'+
    '<div class="ap-field"><label>Full Name</label><input id="signupName" autocomplete="name" required></div>'+
    '<div class="ap-field"><label>Email</label><input id="signupEmail" type="email" autocomplete="email" required></div>'+
    '<div class="ap-field"><label>Password</label><input id="signupPassword" type="password" autocomplete="new-password" minlength="8" required></div>'+
    '<div class="ap-field"><label>Referral Code (optional)</label><input id="signupReferral" autocomplete="off" maxlength="32"></div>'+
    '<button class="ap-login-btn" type="submit">Create Account</button></form>'+
    '<p><button class="ap-link-btn" data-action="login">Already have an account? Sign in</button></p>';
 }else if(state.mode==='reset'){
   body='<h1>Reset password</h1><p>Enter your email and we will send recovery instructions.</p><form id="resetForm">'+
    '<div class="ap-field"><label>Email</label><input id="resetEmail" type="email" autocomplete="email" required></div>'+
    '<button class="ap-login-btn" type="submit">Send Reset Link</button></form>'+
    '<p><button class="ap-link-btn" data-action="login">Back to sign in</button></p>';
 }else{
   body='<h1>Welcome back</h1><p>Sign in to continue to your AegisPay dashboard.</p><form id="loginForm">'+
    '<div class="ap-field"><label>Email</label><input id="loginEmail" type="email" autocomplete="username" required></div>'+
    '<div class="ap-field"><label>Password</label><input id="loginPassword" type="password" autocomplete="current-password" required></div>'+
    '<button class="ap-login-btn" type="submit">Sign In</button></form>'+
    '<div class="ap-auth-links"><button class="ap-link-btn" data-action="reset">Forgot password?</button><button class="ap-link-btn" data-action="signup">Create account</button></div>';
 }
 if(state.message)body+='<div class="ap-login-message">'+esc(state.message)+'</div>';
 root.innerHTML=authShell(body);
}

async function loadHomeData(){
 try{
  var user=await service.currentUser();
  if(!user)return;
  var r=await service.client().from('notifications').select('id,is_read').eq('user_id',user.id).eq('is_read',false).limit(20);
  state.unread=(r&&r.data)?r.data.length:0;
 }catch(e){state.unread=0;}
}

function actionCard(cls,action,ico,title,subtitle){
 return '<button class="ap-action-card '+cls+'" data-action="'+action+'">'+
   '<span class="ap-action-icon">'+ico+'</span>'+
   '<span><strong>'+title+'</strong><small>'+subtitle+'</small></span>'+
 '</button>';
}

function renderHome(){
 var p=state.profile||{};
 var userName=String(p.name||'');
 var clientId=String(p.client_id||'');
 var unread=Number(state.unread||0);

 root.innerHTML='<div class="ap-shell">'+
   '<header class="ap-home-header">'+
     '<div class="ap-header-row">'+
       '<div class="ap-brand"><img src="./aegispay-logo.svg" alt="AegisPay"><span class="ap-brand-word">Aegis<span>Pay</span></span></div>'+
       '<div class="ap-head-actions">'+
         '<button class="ap-circle-btn" data-action="notifications" aria-label="Notifications">'+icon('bell')+(unread?'<span class="ap-notification-dot"></span>':'')+'</button>'+
         '<button class="ap-circle-btn profile" data-action="profile">'+icon('user')+'</button>'+
       '</div>'+
     '</div>'+
     '<section class="ap-welcome-card">'+
       '<div class="ap-welcome-copy">'+
         '<div class="ap-welcome-kicker">Welcome,</div>'+
         '<div class="ap-welcome-name">'+esc(userName)+'</div>'+
         '<div class="ap-client-row">Client ID: '+esc(clientId)+'<button class="ap-copy-btn" data-action="copy-client-id" aria-label="Copy Client ID">'+icon('copy')+'</button></div>'+
       '</div>'+
       '<div class="ap-building" aria-hidden="true"><div class="b1"></div><div class="b2"></div><div class="b3"></div></div>'+
     '</section>'+
   '</header>'+
   '<section class="ap-vip">'+
     '<div class="ap-vip-col"><span class="ap-crown">'+icon('crown')+'</span><span class="ap-vip-label">LV 1</span><span class="ap-vip-value">10%</span></div>'+
     '<div class="ap-vip-col"><span class="ap-crown">'+icon('crown')+'</span><span class="ap-vip-label">LV 2</span><span class="ap-vip-value">5%</span></div>'+
     '<div class="ap-vip-col"><span class="ap-crown">'+icon('crown')+'</span><span class="ap-vip-label">LV 3</span><span class="ap-vip-value">2%</span></div>'+
   '</section>'+
   '<main class="ap-content">'+
     '<div class="ap-actions-grid">'+
       actionCard('blue','next-topup','', 'Top Up','Deposit Amount').replace('<span class="ap-action-icon"></span>','<span class="ap-action-icon">'+icon('wallet')+'<span class="ap-plus-badge">'+icon('plus')+'</span></span>')+
       actionCard('red','next-shop',icon('cart'),'Shop','Amazon-style')+
       actionCard('green','next-account',icon('card'),'Account Details','View Your Account')+
       actionCard('orange','next-crypto',icon('btc'),'Crypto','Buy & Manage')+
     '</div>'+
     '<button class="ap-referral-card" data-action="next-referral">'+
       '<span class="ap-ref-icon">'+icon('users')+'</span>'+
       '<span class="ap-ref-copy"><strong>Referral</strong><small>Invite Friends &amp; Earn Rewards</small></span>'+
       '<span class="ap-arrow">'+icon('arrow')+'</span>'+
     '</button>'+
     '<button class="ap-promo-card" data-action="next-shop">'+
       '<span class="ap-promo-copy"><span class="ap-amazon-a">a</span><span class="ap-amazon-smile"></span><strong>Shop Millions<br>of Products</strong><small>Everything you need in<br>one place.</small></span>'+
       '<span class="ap-cart-art" aria-hidden="true"><span class="ap-cart-handle"></span><span class="ap-cart-basket"></span><span class="ap-cart-wheel w1"></span><span class="ap-cart-wheel w2"></span><span class="ap-box bx1">A</span><span class="ap-box bx2">A</span><span class="ap-box bx3">A</span></span>'+
     '</button>'+
   '</main>'+
   '<nav class="ap-bottom-nav">'+
     '<button class="ap-nav-item active" data-action="home">'+icon('home')+'<span class="ap-nav-label">Home</span></button>'+
     '<button class="ap-nav-item" data-action="next-assets">'+icon('checkCircle')+'<span class="ap-nav-label">Assets</span></button>'+
     '<button class="ap-nav-item" data-action="profile">'+icon('user')+'<span class="ap-nav-label">My Profile</span></button>'+
     '<button class="ap-nav-item" data-action="next-ai">'+icon('robot')+'<span class="ap-nav-label">AI Bot</span></button>'+
   '</nav>'+
 '</div>';
}

function toast(text){
 var t=document.createElement('div');t.className='ap-toast';t.textContent=text;document.body.appendChild(t);
 setTimeout(function(){if(t.parentNode)t.remove();},1600);
}

async function loginSubmit(e){
 e.preventDefault();
 state.busy=true;setMessage('');renderAuth();
 try{
  if(!await service.appRuntimeEnabled())throw new Error('AegisPay client service is currently unavailable.');
  await service.signIn(document.getElementById('loginEmail').value.trim(),document.getElementById('loginPassword').value);
  var r=await service.claimAegisPayProfile();
  if(!r||!r.profile)throw new Error('Client profile could not be loaded.');
  if(r.profile.role==='MASTER ADMIN'){location.href='./master-admin.html';return;}
  if(r.profile.role!=='USER')throw new Error('This account does not have client access.');
  state.profile=r.profile;state.phase='ready';await loadHomeData();
 }catch(err){setMessage(authError(err));}
 finally{state.busy=false;if(!state.profile)renderAuth();else renderHome();}
}

async function signupSubmit(e){
 e.preventDefault();
 state.busy=true;setMessage('');renderAuth();
 try{
  var name=document.getElementById('signupName').value.trim();
  var email=document.getElementById('signupEmail').value.trim();
  var pass=document.getElementById('signupPassword').value;
  var ref=document.getElementById('signupReferral').value.trim();
  await service.signUp(email,pass,name,ref,'en');
  await service.signIn(email,pass);
  var r=await service.claimAegisPayProfile();
  if(r&&r.profile){state.profile=r.profile;state.phase='ready';await loadHomeData();}
  else throw new Error('Client profile could not be loaded.');
 }catch(err){setMessage(authError(err));state.mode='signup';}
 finally{state.busy=false;if(!state.profile)renderAuth();else renderHome();}
}

async function resetSubmit(e){
 e.preventDefault();
 state.busy=true;setMessage('');renderAuth();
 try{
  await service.sendPasswordReset(document.getElementById('resetEmail').value.trim());
  state.mode='login';setMessage('Recovery instructions have been sent if the account exists.'); 
 }catch(err){setMessage(authError(err));}
 finally{state.busy=false;renderAuth();}
}

root.addEventListener('submit',function(e){
 if(e.target.id==='loginForm')return loginSubmit(e);
 if(e.target.id==='signupForm')return signupSubmit(e);
 if(e.target.id==='resetForm')return resetSubmit(e);
});

root.addEventListener('click',async function(e){
 var el=e.target.closest('[data-action]');if(!el)return;
 var a=el.getAttribute('data-action');

 if(a==='login'){state.mode='login';setMessage('');renderAuth();return;}
 if(a==='signup'){state.mode='signup';setMessage('');renderAuth();return;}
 if(a==='reset'){state.mode='reset';setMessage('');renderAuth();return;}
 if(a==='copy-client-id'){
  var id=String((state.profile&&state.profile.client_id)||'');
  if(navigator.clipboard&&id)navigator.clipboard.writeText(id).then(function(){toast('Client ID copied');});
  return;
 }
 if(a==='notifications'){toast('Notifications screen will be added in the next UI chunk.');return;}
 if(a==='profile'){toast('Profile screen will be added in the next UI chunk.');return;}
 if(a==='home')return;
 if(a.indexOf('next-')===0){toast('This screen will be built after Home Dashboard approval.');return;}
});

async function boot(){
 if(!service||!service.isAvailable()){state.phase='ready';setMessage('AegisPay service is unavailable.');renderAuth();return;}
 try{
  var enabled=await service.appRuntimeEnabled();
  if(!enabled){setMessage('AegisPay client service is currently unavailable.');renderAuth();return;}
  var session=await service.session();
  if(session){
   var r=await service.claimAegisPayProfile();
   if(r&&r.profile&&r.profile.role==='USER'){
    state.profile=r.profile;state.phase='ready';await loadHomeData();renderHome();return;
   }
   if(r&&r.profile&&r.profile.role==='MASTER ADMIN'){location.href='./master-admin.html';return;}
  }
 }catch(err){setMessage(authError(err));}
 state.phase='ready';renderAuth();
 service.onAuthStateChange(function(event,session){
  if(event==='SIGNED_OUT'){state.profile=null;state.mode='login';renderAuth();}
  else if(session&&event==='SIGNED_IN'){setTimeout(boot,0);}
 });
}
boot();
})();