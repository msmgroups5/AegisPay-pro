(function(){
'use strict';

var root=document.getElementById('app');
if(!root)return;

var service=window.AegisSupabaseService||null;
var state={profile:null,unread:0,busy:false,mode:'login',message:'',balanceHidden:false};

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
  btc:'<svg viewBox="0 0 24 24"><path d="M8.7 5.1v13.8M11.8 5.1h2.4c1.8 0 3 1.1 3 2.6s-1.2 2.6-3 2.6H8.7m3.1 0h2.8c2.1 0 3.5 1.1 3.5 2.9s-1.4 3.1-3.5 3.1H8.7M7.2 3.8l1.5 1.3M14.2 3.8l-1.2 1.3" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  crown:'<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="m3 7 5 4 4-8 4 8 5-4-2 12H5L3 7Z"/></svg>',
  users:'<svg viewBox="0 0 24 24"><circle cx="8.3" cy="9" r="3" fill="currentColor"/><circle cx="16.7" cy="10" r="2.4" fill="currentColor" opacity=".72"/><path d="M2.8 20c.7-4 2.7-6 5.7-6s5 2 5.7 6M14.1 15.8c2.9.2 4.9 1.6 5.5 4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  arrow:'<svg viewBox="0 0 24 24"><path d="m8.5 5.5 6.5 6.5-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  home:'<svg viewBox="0 0 24 24"><path d="m3 10.5 9-7.5 9 7.5v8.2a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 18.7Z" fill="currentColor" stroke="none"/><path d="M9.2 20.5v-5.8h5.6v5.8" fill="#0F1218" stroke="none"/></svg>',
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
 var userName=String(p.name||'Ali Shahid');
 var clientId=String(p.client_id||'AP-CLIENT');
 var dot=true;

 root.innerHTML='<div class="ap-shell">'+
 '<header class="ap-home-header">'+
   '<div class="ap-header-row">'+
     '<div class="ap-brand"><img src="./aegispay-logo.svg" alt="AegisPay"></div>'+
     '<div class="ap-head-actions">'+
       '<button class="ap-circle-btn ap-notice-btn" data-action="notice" aria-label="Notifications">'+icon('bell')+'<span class="ap-notification-dot"></span></button>'+
       '<button class="ap-circle-btn profile" data-action="profile" aria-label="My Profile">'+icon('user')+'</button>'+
     '</div>'+
   '</div>'+
   '<section class="ap-welcome-card">'+
     '<div class="ap-welcome-copy">'+
       '<div class="ap-welcome-kicker">Welcome,</div>'+
       '<div class="ap-welcome-name">'+esc(userName)+'</div>'+
       '<div class="ap-client-row">Client ID: '+esc(clientId)+'<button class="ap-copy-btn" data-action="copy-client-id" aria-label="Copy Client ID">'+icon('copy')+'</button></div>'+
     '</div>'+
     '<div class="ap-building" aria-hidden="true">'+
       '<svg viewBox="0 0 260 150" focusable="false">'+
         '<rect x="6" y="52" width="46" height="98" rx="1" fill="#240307" stroke="#7A0A0F" stroke-width="1"/>'+
         '<rect x="48" y="18" width="56" height="132" rx="1" fill="#120205" stroke="#7A0A0F" stroke-width="1"/>'+
         '<rect x="99" y="43" width="50" height="107" rx="1" fill="#1A0305" stroke="#7A0A0F" stroke-width="1"/>'+
         '<rect x="145" y="8" width="67" height="142" rx="1" fill="#0F0103" stroke="#7A0A0F" stroke-width="1"/>'+
         '<rect x="207" y="37" width="47" height="113" rx="1" fill="#170205" stroke="#7A0A0F" stroke-width="1"/>'+
         '<g fill="#E5141B">'+
           '<rect x="15" y="67" width="10" height="8"/><rect x="31" y="67" width="10" height="8"/><rect x="15" y="83" width="10" height="8"/><rect x="31" y="83" width="10" height="8"/><rect x="15" y="99" width="10" height="8"/><rect x="31" y="99" width="10" height="8"/><rect x="15" y="115" width="10" height="8"/><rect x="31" y="115" width="10" height="8"/>'+
           '<rect x="58" y="32" width="12" height="9"/><rect x="76" y="32" width="12" height="9"/><rect x="58" y="49" width="12" height="9"/><rect x="76" y="49" width="12" height="9"/><rect x="58" y="66" width="12" height="9"/><rect x="76" y="66" width="12" height="9"/><rect x="58" y="83" width="12" height="9"/><rect x="76" y="83" width="12" height="9"/><rect x="58" y="100" width="12" height="9"/><rect x="76" y="100" width="12" height="9"/><rect x="58" y="117" width="12" height="9"/><rect x="76" y="117" width="12" height="9"/>'+
           '<rect x="110" y="57" width="11" height="8"/><rect x="127" y="57" width="11" height="8"/><rect x="110" y="73" width="11" height="8"/><rect x="127" y="73" width="11" height="8"/><rect x="110" y="89" width="11" height="8"/><rect x="127" y="89" width="11" height="8"/><rect x="110" y="105" width="11" height="8"/><rect x="127" y="105" width="11" height="8"/><rect x="110" y="121" width="11" height="8"/><rect x="127" y="121" width="11" height="8"/>'+
           '<rect x="157" y="22" width="14" height="9"/><rect x="178" y="22" width="14" height="9"/><rect x="157" y="40" width="14" height="9"/><rect x="178" y="40" width="14" height="9"/><rect x="157" y="58" width="14" height="9"/><rect x="178" y="58" width="14" height="9"/><rect x="157" y="76" width="14" height="9"/><rect x="178" y="76" width="14" height="9"/><rect x="157" y="94" width="14" height="9"/><rect x="178" y="94" width="14" height="9"/><rect x="157" y="112" width="14" height="9"/><rect x="178" y="112" width="14" height="9"/>'+
           '<rect x="217" y="51" width="10" height="8"/><rect x="234" y="51" width="10" height="8"/><rect x="217" y="67" width="10" height="8"/><rect x="234" y="67" width="10" height="8"/><rect x="217" y="83" width="10" height="8"/><rect x="234" y="83" width="10" height="8"/><rect x="217" y="99" width="10" height="8"/><rect x="234" y="99" width="10" height="8"/><rect x="217" y="115" width="10" height="8"/><rect x="234" y="115" width="10" height="8"/>'+
         '</g>'+
         '<text x="151" y="139" fill="#FFFFFF" font-family="Inter,Arial,sans-serif" font-size="7" font-weight="700">Aegis</text><text x="173" y="139" fill="#F01920" font-family="Inter,Arial,sans-serif" font-size="7" font-weight="700">Pay</text>'+
       '</svg>'+
     '</div>'+
   '</section>'+
 '</header>'+
 '<section class="ap-vip">'+
   '<div class="ap-vip-col"><span class="ap-crown">'+icon('crown')+'</span><span class="ap-vip-label">LV 1</span><span class="ap-vip-value">10%</span></div>'+
   '<div class="ap-vip-col"><span class="ap-crown">'+icon('crown')+'</span><span class="ap-vip-label">LV 2</span><span class="ap-vip-value">5%</span></div>'+
   '<div class="ap-vip-col"><span class="ap-crown">'+icon('crown')+'</span><span class="ap-vip-label">LV 3</span><span class="ap-vip-value">2%</span></div>'+
 '</section>'+
 '<main class="ap-content">'+
   '<div class="ap-actions-grid">'+
     actionCard('blue','next-topup',icon('wallet')+'<span class="ap-plus-badge">'+icon('plus')+'</span>','Top Up','Deposit Amount')+
     actionCard('red','next-shop',icon('cart'),'Shop','Amazon-style')+
     actionCard('green','next-account',icon('card'),'Account Details','View Your Account')+
     actionCard('orange','next-crypto',icon('btc'),'Crypto','Buy & Manage')+
   '</div>'+
   '<button class="ap-referral-card" data-action="next-referral"><span class="ap-ref-icon">'+icon('users')+'</span><span class="ap-ref-copy"><strong>Referral</strong><small>Invite Friends &amp; Earn Rewards</small></span><span class="ap-arrow">'+icon('arrow')+'</span></button>'+
   '<button class="ap-promo-card" data-action="next-shop">'+
     '<span class="ap-promo-copy"><span class="ap-amazon-official"><span class="ap-amazon-a">a</span><span class="ap-amazon-smile"></span></span><strong>Shop Millions<br>of Products</strong><small>Everything you need in one place.</small></span>'+
     '<span class="ap-cart-official"><span class="ap-cart-shape" aria-hidden="true"><span class="ap-cart-handle"></span><span class="ap-cart-basket"></span><span class="ap-box bx1">amazon</span><span class="ap-box bx2">amazon</span><span class="ap-box bx3">amazon</span><span class="ap-cart-wheel w1"></span><span class="ap-cart-wheel w2"></span></span></span>'+
   '</button>'+
 '</main>'+
 '<nav class="ap-bottom-nav">'+
   '<button class="ap-nav-item active" data-action="home">'+icon('home')+'<span class="ap-nav-label">Home</span></button>'+
   '<button class="ap-nav-item" data-action="next-assets">'+icon('check')+'<span class="ap-nav-label">Assets</span></button>'+
   '<button class="ap-nav-item" data-action="profile">'+icon('user')+'<span class="ap-nav-label">My Profile</span></button>'+
   '<button class="ap-nav-item" data-action="next-ai">'+icon('robot')+'<span class="ap-nav-label">AI Bot</span></button>'+
 '</nav>'+
 '</div>';
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
 if(a==='toggle-balance'){
   state.balanceHidden=!state.balanceHidden;
   var bv=document.getElementById('apBalanceValue');
   if(bv){
     var p=state.profile||{},b=p.usdt_balance!=null?p.usdt_balance:(p.available_balance!=null?p.available_balance:(p.total_balance!=null?p.total_balance:(p.balance!=null?p.balance:null)));
     var txt=b==null?'—':Number(b).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
     bv.innerHTML=(state.balanceHidden?'••••••':txt)+' <em>USDT</em>';
   }
   el.textContent=state.balanceHidden?'○':'●';
   return;
 }
 if(a==='profile'||a==='notice'||a.indexOf('next-')===0){toast('This screen will be built after Home Dashboard approval.');return;}
});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();