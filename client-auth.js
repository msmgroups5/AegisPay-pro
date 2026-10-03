(function(){
'use strict';

var root=document.getElementById('app');
if(!root)return;

var service=window.AegisSupabaseService||null;
var state={profile:null,unread:0,busy:false,mode:'login',message:''};

function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

function logoMark(){return '<span class="ap-logo-mark"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5 60 54c2 4-1 7-5 7H9c-4 0-7-4-5-7L32 5Z" fill="#ff2034"/><path d="M32 25 18 50h9l5-9 5 9h9L32 25Z" fill="#8e0712"/></svg></span>\n}\n\nfunction icon(type){
 var m={
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
  check:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
  robot:'<svg viewBox="0 0 24 24"><rect x="5" y="7" width="14" height="12" rx="3"/><path d="M12 3v4M8 12h.01M16 12h.01M9 16h6"/></svg>'
 };
 return '<span class="ap-icon">'+(m[type]||m.user)+'</span>';
}

function authView(){
 root.innerHTML='<div class="ap-login-wrap"><section class="ap-login"><div class="ap-login-logo">'+logoMark()+'<strong>Aegis<span>Pay</span></strong></div><h1>Welcome back</h1><p>Sign in to continue to AegisPay.</p><form id="loginForm"><div class="ap-field"><label>Email</label><input id="loginEmail" type="email" autocomplete="username" required></div><div class="ap-field"><label>Password</label><input id="loginPassword" type="password" autocomplete="current-password" required></div><button class="ap-login-btn" type="submit">Sign In</button></form>'+(state.message?'<div class="ap-login-message">'+esc(state.message)+'</div>':'')+'</section></div>';
}

function actionCard(cls,action,ico,title,sub){
 return '<button class="ap-action-card '+cls+'" data-action="'+action+'"><span class="ap-action-icon">'+ico+'</span><span><strong>'+title+'</strong><small>'+sub+'</small></span></button>';
}

function homeView(){
 var p=state.profile||{};
 var userName=String(p.name||'');
 var clientId=String(p.client_id||'');
 var dot=state.unread>0;

 root.innerHTML='<div class="ap-shell">'+
 '<header class="ap-home-header"><div class="ap-header-row"><div class="ap-brand">'+logoMark()+'<span class="ap-brand-word">Aegis<span>Pay</span></span></div><div class="ap-head-actions"><button class="ap-circle-btn" data-action="notice">'+icon('bell')+(dot?'<span class="ap-notification-dot"></span>':'')+'</button><button class="ap-circle-btn profile" data-action="profile">'+icon('user')+'</button></div></div>'+
 '<section class="ap-welcome-card"><div class="ap-welcome-copy"><div class="ap-welcome-kicker">Welcome,</div><div class="ap-welcome-name">'+esc(userName||'Client')+'</div><div class="ap-client-row">Client ID: '+esc(clientId||'—')+'<button class="ap-copy-btn" data-action="copy-client-id">'+icon('copy')+'</button></div></div><div class="ap-building"><div class="b1"></div><div class="b2"></div><div class="b3"></div></div></section></header>'+
 '<section class="ap-vip"><div class="ap-vip-col"><span class="ap-crown">'+icon('crown')+'</span><span class="ap-vip-label">LV 1</span><span class="ap-vip-value">10%</span></div><div class="ap-vip-col"><span class="ap-crown">'+icon('crown')+'</span><span class="ap-vip-label">LV 2</span><span class="ap-vip-value">5%</span></div><div class="ap-vip-col"><span class="ap-crown">'+icon('crown')+'</span><span class="ap-vip-label">LV 3</span><span class="ap-vip-value">2%</span></div></section>'+
 '<main class="ap-content"><div class="ap-actions-grid">'+
 actionCard('blue','next-topup',icon('wallet')+'<span class="ap-plus-badge">'+icon('plus')+'</span>','Top Up','Deposit Amount')+
 actionCard('red','next-shop',icon('cart'),'Shop','Amazon-style')+
 actionCard('green','next-account',icon('card'),'Account Details','View Your Account')+
 actionCard('orange','next-crypto',icon('btc'),'Crypto','Buy & Manage')+
 '</div>'+
 '<button class="ap-referral-card" data-action="next-referral"><span class="ap-ref-icon">'+icon('users')+'</span><span class="ap-ref-copy"><strong>Referral</strong><small>Invite Friends &amp; Earn Rewards</small></span><span class="ap-arrow">'+icon('arrow')+'</span></button>'+
 '<button class="ap-promo-card" data-action="next-shop"><span class="ap-promo-copy"><span class="ap-amazon-a">a</span><span class="ap-amazon-smile"></span><strong>Shop Millions<br>of Products</strong><small>Everything you need in<br>one place.</small></span><span class="ap-cart-art"><span class="ap-cart-handle"></span><span class="ap-cart-basket"></span><span class="ap-cart-wheel w1"></span><span class="ap-cart-wheel w2"></span><span class="ap-box bx1">A</span><span class="ap-box bx2">A</span><span class="ap-box bx3">A</span></span></button></main>'+
 '<nav class="ap-bottom-nav"><button class="ap-nav-item active" data-action="home">'+icon('home')+'<span class="ap-nav-label">Home</span></button><button class="ap-nav-item" data-action="next-assets">'+icon('check')+'<span class="ap-nav-label">Assets</span></button><button class="ap-nav-item" data-action="profile">'+icon('user')+'<span class="ap-nav-label">My Profile</span></button><button class="ap-nav-item" data-action="next-ai">'+icon('robot')+'<span class="ap-nav-label">AI Bot</span></button></nav></div>';
}

function toast(msg){
 var el=document.createElement('div');el.className='ap-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(function(){el.remove();},1500);
}

async function signIn(e){
 e.preventDefault();
 var emailInput=document.getElementById('loginEmail'),passwordInput=document.getElementById('loginPassword');
 var email=emailInput?emailInput.value.trim():'',password=passwordInput?passwordInput.value:'';
 state.busy=true;state.message='';authView();
 try{
  if(!service||!service.signIn)throw new Error('AegisPay sign-in service is not ready.');
  await service.signIn(email,password);
  var r=await service.claimAegisPayProfile();
  state.profile=r&&r.profile?r.profile:null;
  if(!state.profile)throw new Error('Client profile is not available.');
  if(state.profile.role==='MASTER ADMIN'){location.href='./master-admin.html';return;}
  if(state.profile.role!=='USER')throw new Error('This account does not have client access.');
  await loadNotifications();
  homeView();
 }catch(err){state.message=String(err&&err.message||'Unable to sign in.');authView();}
 finally{state.busy=false;}
}

async function loadNotifications(){
 try{
  var u=await service.currentUser();
  if(!u)return;
  var r=await service.client().from('notifications').select('id').eq('user_id',u.id).eq('is_read',false).limit(20);
  state.unread=r&&Array.isArray(r.data)?r.data.length:0;
 }catch(e){state.unread=0;}
}

async function boot(){
 root.innerHTML='<div style="min-height:100vh;background:#05070a;color:#fff;display:grid;place-items:center;font:700 12px Arial,sans-serif">Loading AegisPay…</div>';
 try{
  if(!service||!service.isAvailable||!service.isAvailable()){authView();return;}
  var session=await service.session();
  if(session){
   var r=await service.claimAegisPayProfile();
   if(r&&r.profile&&r.profile.role==='MASTER ADMIN'){location.href='./master-admin.html';return;}
   if(r&&r.profile&&r.profile.role==='USER'){state.profile=r.profile;await loadNotifications();homeView();return;}
  }
 }catch(e){}
 authView();
}

root.addEventListener('submit',function(e){if(e.target.id==='loginForm')signIn(e);});
root.addEventListener('click',function(e){
 var el=e.target.closest('[data-action]');if(!el)return;
 var a=el.getAttribute('data-action');
 if(a==='home'){homeView();return;}
 if(a==='copy-client-id'){var id=String((state.profile&&state.profile.client_id)||'');if(navigator.clipboard&&id)navigator.clipboard.writeText(id);toast('Client ID copied');return;}
 if(a==='profile'||a==='notice'||a.indexOf('next-')===0){toast('This screen will be built after Home Dashboard approval.');return;}
});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();