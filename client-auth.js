(function(){
'use strict';

var root=document.getElementById('app');
if(!root)return;

var service=window.AegisSupabaseService||null;
var state={profile:null,unread:0,busy:false,mode:'login',message:''};

function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

function logoMark(){return '<span class="ap-logo-mark"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5 60 54c2 4-1 7-5 7H9c-4 0-7-4-5-7L32 5Z" fill="#ff2034"/><path d="M32 25 18 50h9l5-9 5 9h9L32 25Z" fill="#8e0712"/></svg></span>';}

function icon(type){
 var m={
  bell:'<svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" fill="currentColor" opacity=".96"/><path d="M10 21h4" stroke="currentColor" stroke-width="1.8"/></svg>',
  user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6" fill="currentColor"/><path d="M5 21c.7-4.2 3.1-6.5 7-6.5s6.3 2.3 7 6.5" fill="currentColor"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><rect x="8" y="7" width="12" height="13" rx="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 16H4.6A2.6 2.6 0 0 1 2 13.4V5.6A2.6 2.6 0 0 1 4.6 3h9.8A2.6 2.6 0 0 1 17 5.6V6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  wallet:'<svg viewBox="0 0 24 24"><rect x="2.8" y="5.1" width="18.4" height="14.2" rx="3.1" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M15 11.1h6v4.5h-6.1a2.2 2.2 0 0 1 0-4.4Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.7" cy="13.4" r=".9" fill="currentColor"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  cart:'<svg viewBox="0 0 24 24"><path d="M3 4h2.3l2.1 10.8h10.7l2.2-7.5H6.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.2" cy="19" r="1.6" fill="currentColor"/><circle cx="17.3" cy="19" r="1.6" fill="currentColor"/><path d="M8.2 8.2h11.1" stroke="currentColor" stroke-width="1.2" opacity=".55"/></svg>',
  card:'<svg viewBox="0 0 24 24"><rect x="2.7" y="4.2" width="18.6" height="15.6" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="8.2" cy="11" r="2.4" fill="currentColor"/><path d="M12.5 9h5M12.5 12h5M6 15.6h11.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  btc:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.6 6.7v10.6M13 6.7v10.6M8 8.1h5.1a2.5 2.5 0 0 1 0 5H8h5.7a2.5 2.5 0 0 1 0 5H8M8.1 5.6l.9 1.1M14.7 5.6l-1.2 1.1" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  crown:'<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="m3 7 5 4 4-8 4 8 5-4-2 12H5L3 7Z"/></svg>',
  users:'<svg viewBox="0 0 24 24"><circle cx="8.3" cy="9" r="3" fill="currentColor"/><circle cx="16.7" cy="10" r="2.4" fill="currentColor" opacity=".72"/><path d="M2.8 20c.7-4 2.7-6 5.7-6s5 2 5.7 6M14.1 15.8c2.9.2 4.9 1.6 5.5 4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  arrow:'<svg viewBox="0 0 24 24"><path d="m8.5 5.5 6.5 6.5-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  home:'<svg viewBox="0 0 24 24"><path d="m3.3 10.8 8.7-7.3 8.7 7.3v8.4a1.8 1.8 0 0 1-1.8 1.8H5.1a1.8 1.8 0 0 1-1.8-1.8Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.2 20.5v-6.2h5.6v6.2" fill="currentColor" opacity=".84"/></svg>',
  check:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.1" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m8 12 2.6 2.6L16.5 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  robot:'<svg viewBox="0 0 24 24"><rect x="4.4" y="7.1" width="15.2" height="12.1" rx="3.3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 3.2v3.4M8.1 12h.01M15.9 12h.01M8.6 15.7h6.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M6.9 8.9h10.2" stroke="currentColor" stroke-width="1.2" opacity=".5"/></svg>'
 };
 return '<span class="ap-icon">'+(m[type]||m.user)+'</span>';
}

function authView(){
 root.innerHTML='<div class="ap-login-wrap"><section class="ap-login"><div class="ap-login-logo"><img src="./aegispay-logo.svg" alt="AegisPay"></div><h1>Welcome back</h1><p>Sign in to continue to AegisPay.</p><form id="loginForm"><div class="ap-field"><label>Email</label><input id="loginEmail" type="email" autocomplete="username" required></div><div class="ap-field"><label>Password</label><input id="loginPassword" type="password" autocomplete="current-password" required></div><button class="ap-login-btn" type="submit">Sign In</button></form>'+(state.message?'<div class="ap-login-message">'+esc(state.message)+'</div>':'')+'</section></div>';
}

function actionCard(cls,action,ico,title,sub){
 return '<button class="ap-action-card '+cls+'" data-action="'+action+'"><span class="ap-action-icon">'+ico+'</span><span><strong>'+title+'</strong><small>'+sub+'</small></span></button>';
}

function homeView(){
 var p=state.profile||{};
 var userName=String(p.name||'');
 var clientId=String(p.client_id||'');
 var balance=p.usdt_balance!=null?p.usdt_balance:(p.available_balance!=null?p.available_balance:(p.total_balance!=null?p.total_balance:(p.balance!=null?p.balance:null)));
 var balanceText=balance==null?'—':Number(balance).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
 var dot=state.unread>0;

 root.innerHTML='<div class="ap-shell">'+
 '<header class="ap-home-header"><div class="ap-header-row"><div class="ap-brand"><img src="./aegispay-logo.svg" alt="AegisPay"></div><div class="ap-head-actions"><button class="ap-circle-btn" data-action="notice">'+icon('bell')+(dot?'<span class="ap-notification-dot"></span>':'')+'</button><button class="ap-circle-btn profile" data-action="profile">'+icon('user')+'</button></div></div>'+
 '<section class="ap-welcome-card"><div class="ap-welcome-copy"><div class="ap-welcome-kicker">Welcome,</div><div class="ap-welcome-name">'+esc(userName||'Client')+'</div><div class="ap-client-row">Client ID: '+esc(clientId||'—')+'<button class="ap-copy-btn" data-action="copy-client-id">'+icon('copy')+'</button></div><div class="ap-balance-row"><div><span>Total Balance</span><strong id="apBalanceValue">'+esc(balanceText)+' <em>USDT</em></strong></div><button class="ap-balance-eye" data-action="toggle-balance" aria-label="Show or hide balance">●</button></div></div><div class="ap-building" aria-hidden="true"><svg viewBox="0 0 260 180" preserveAspectRatio="none" focusable="false"><defs><linearGradient id="bldgRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5361"/><stop offset=".55" stop-color="#bd1526"/><stop offset="1" stop-color="#4a050d"/></linearGradient><linearGradient id="bldgGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd3d7" stop-opacity=".9"/><stop offset="1" stop-color="#ff4a5a" stop-opacity=".28"/></linearGradient></defs><path d="M14 180V76L55 45V180Z" fill="url(#bldgRed)" stroke="#ff7883" stroke-width="1.5"/><path d="M55 180V18L101 0V180Z" fill="url(#bldgRed)" stroke="#ff9aa2" stroke-width="1.5"/><path d="M101 180V57L142 36V180Z" fill="#8e0d1b" stroke="#ff727e" stroke-width="1.5"/><path d="M142 180V31L198 10V180Z" fill="url(#bldgRed)" stroke="#ff8c96" stroke-width="1.5"/><path d="M198 180V68L246 42V180Z" fill="#670710" stroke="#ff626f" stroke-width="1.5"/><g fill="url(#bldgGlass)" opacity=".96"><path d="M29 87h16v10H29zM29 109h16v10H29zM29 131h16v10H29zM29 153h16v10H29z"/><path d="M68 36h19v11H68zM68 59h19v11H68zM68 82h19v11H68zM68 105h19v11H68zM68 128h19v11H68zM68 151h19v11H68z"/><path d="M111 75h18v11h-18zM111 99h18v11h-18zM111 123h18v11h-18zM111 147h18v11h-18z"/><path d="M153 49h22v11h-22zM153 73h22v11h-22zM153 97h22v11h-22zM153 121h22v11h-22zM153 145h22v11h-22z"/><path d="M210 83h18v11h-18zM210 107h18v11h-18zM210 131h18v11h-18zM210 155h18v11h-18z"/></g><path d="M49 180h185" stroke="#ff3446" stroke-width="3" opacity=".9"/></svg></div></section></header>'+
 '<section class="ap-vip"><div class="ap-vip-col"><span class="ap-crown">'+icon('crown')+'</span><span class="ap-vip-label">LV 1</span></div><div class="ap-vip-col"><span class="ap-crown">'+icon('crown')+'</span><span class="ap-vip-label">LV 2</span></div><div class="ap-vip-col"><span class="ap-crown">'+icon('crown')+'</span><span class="ap-vip-label">LV 3</span></div></section>'+
 '<main class="ap-content"><div class="ap-actions-grid">'+
 actionCard('blue','next-topup',icon('wallet')+'<span class="ap-plus-badge">'+icon('plus')+'</span>','Top Up','Deposit Amount')+
 actionCard('red','next-shop',icon('cart'),'Shop','Amazon-style')+
 actionCard('green','next-account',icon('card'),'Account Details','View Your Account')+
 actionCard('orange','next-crypto',icon('btc'),'Crypto','Buy & Manage')+
 '</div>'+
 '<button class="ap-referral-card" data-action="next-referral"><span class="ap-ref-icon">'+icon('users')+'</span><span class="ap-ref-copy"><strong>Referral</strong><small>Invite Friends &amp; Earn Rewards</small></span><span class="ap-arrow">'+icon('arrow')+'</span></button>'+
 '<button class="ap-promo-card" data-action="next-shop"><span class="ap-promo-copy"><span class="ap-amazon-official"><img src="https://m.media-amazon.com/images/G/01/authportal/tiv/amazon_logo_RGB._CB424887820_.png" alt="Amazon"></span><strong>Shop Millions<br>of Products</strong><small>Everything you need in<br>one place.</small><em>Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.</em></span><span class="ap-cart-official"><span class="ap-cart-badge-icon"><img src="https://m.media-amazon.com/images/G/01/support_images/GUID-04D75C28-8DEF-436D-93AD-18419392FB09=1=en-US=Normal.png" alt="Amazon shopping cart"></span><span class="ap-box bx1">A</span><span class="ap-box bx2">A</span><span class="ap-box bx3">A</span></span></button></main>'+
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