(function(){
'use strict';

var core=window.AegisCore;
var app=document.getElementById('app');
var view='dashboard';
var authPage='login';
var authMode='client';
var isAdminPortal=window.AEGIS_ADMIN_PORTAL===true;
var loginError='';
var toastTimer=null;
var modal=null;
var shopCategory='All';
var shopSearch='';
var shopSelectedId=null;
var shopFeedLoading=false;
var shopFeedLoaded=false;
var depositDraft={tierId:'T1',amount:30,screenshotName:'',txid:''};
var aiMessages=[{who:'bot',text:'Assalam-o-Alaikum! Main Aegis AI Assistant hun. Deposit, withdrawal, referral, Shop tasks aur account help mein guide kar sakta hun.'}];

function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function money(n){return '$'+Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
function icon(name){
 var p={
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  wallet:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M16 10h4v4h-4a2 2 0 1 1 0-4Z"/>',
  shop:'<path d="M4 7h16l-1 13H5L4 7Z"/><path d="M8 7a4 4 0 0 1 8 0"/><path d="M8 11h0M12 11h0M16 11h0"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  bot:'<rect x="4" y="7" width="16" height="13" rx="3"/><path d="M9 7V4h6v3"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M9 17h6"/>',
  activity:'<path d="M3 12h4l2-6 4 12 2-6h6"/>',
  profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  logout:'<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  copy:'<rect x="9" y="9" width="10" height="10" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  settings:'<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06-1.9 1.9-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.66V22h-2.68v-.88a1.8 1.8 0 0 0-1.1-1.66 1.8 1.8 0 0 0-1.98.36l-.06.06-1.9-1.9.06-.06A1.8 1.8 0 0 0 7.4 15a1.8 1.8 0 0 0-1.66-1.1H5V11.2h.74A1.8 1.8 0 0 0 7.4 10.1a1.8 1.8 0 0 0-.36-1.98l-.06-.06 1.9-1.9.06.06a1.8 1.8 0 0 0 1.98.36A1.8 1.8 0 0 0 13.08 4h2.68v.88a1.8 1.8 0 0 0 1.1 1.66 1.8 1.8 0 0 0 1.98-.36l.06-.06 1.9 1.9-.06.06a1.8 1.8 0 0 0-.36 1.98A1.8 1.8 0 0 0 19.98 11H21v2.7h-.88A1.8 1.8 0 0 0 19.4 15Z"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  shield:'<path d="m12 3 7 3v5c0 5-3.2 8.2-7 10-3.8-1.8-7-5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  x:'<path d="m6 6 12 12M18 6 6 18"/>',
  refresh:'<path d="M20 11a8 8 0 1 0 1 4"/><path d="M20 4v7h-7"/>',
  qr:'<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM17 14h4M14 20h4"/>'
 };
 return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(p[name]||p.home)+'</svg>';
}
function notify(msg){var t=document.querySelector('.toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.classList.remove('show');},2400);}
function go(v){view=v;render();}
function formatCountdown(isoDate){
 if(!isoDate)return '--:--:--';
 var d=Math.max(0,new Date(isoDate).getTime()-Date.now()),sec=Math.floor(d/1000);
 var h=Math.floor(sec/3600);sec%=3600;var m=Math.floor(sec/60);sec%=60;
 return [String(h).padStart(2,'0'),String(m).padStart(2,'0'),String(sec).padStart(2,'0')].join(':');
}
function current(){return core.currentProfile();}
function render(){
 try{core.settleReadyCycles();}catch(e){}
 var p=current();
 if(!p){renderAuth();return;}
 if(isAdminPortal){
  if(p.role!=='MASTER ADMIN'){core.authLogout();renderAuth();return;}
  renderAdmin();return;
 }
 if(p.role!=='USER'){core.authLogout();renderAuth();return;}
 renderClient();
}
function renderAuth(){
 if(isAdminPortal){
  app.innerHTML='<div class="auth-wrap admin-auth-wrap"><div class="auth-card admin-auth-card">'+
   '<div class="auth-top"><div class="brand"><img src="./aegispay-logo.svg" alt="AegisPay"><b>Aegis<span>Pay</span></b></div><span class="prototype admin-badge">MASTER ADMIN</span></div>'+
   '<div class="auth-hero admin-auth-hero"><div class="logo-badge">'+icon('shield')+' Control Center</div><h1>Master Admin Access</h1><p>Private operational workspace for authorized AegisPay administration.</p></div>'+
   '<form id="loginForm"><div class="field"><label>Master Admin Email</label><div class="field-wrap"><input id="loginEmail" type="email" autocomplete="username" required placeholder="admin@example.com"></div></div>'+
   '<div class="field"><label>Password</label><div class="field-wrap"><input id="loginPassword" type="password" autocomplete="current-password" required placeholder="••••••••"></div></div>'+
   '<div style="min-height:18px;color:#ff9ab0;font-size:9px;margin-top:8px">'+esc(loginError)+'</div>'+
   '<button class="primary" type="submit">Enter Control Center</button></form>'+
   '<div class="demo-row"><div class="demo-box"><b>Authorized workspace</b>Master Admin controls are isolated from the client interface.</div></div>'+
   '<div class="small-note">Private admin portal. This login is not presented anywhere in the client application.</div>'+
   '</div></div><div class="toast"></div>';
  bindAuth();
  return;
 }
 app.innerHTML='<div class="auth-wrap"><div class="auth-card">'+
 '<div class="auth-top"><div class="brand"><img src="./aegispay-logo.svg" alt="AegisPay"><b>Aegis<span>Pay</span></b></div><span class="prototype">AEGISPAY</span></div>'+
 (authPage==='login'?loginView():signupView())+
 '</div></div><div class="toast"></div>';
 bindAuth();
}
function bindAuth(){
 var lf=document.getElementById('loginForm');if(lf)lf.addEventListener('submit',handleLogin);
 var sf=document.getElementById('signupForm');if(sf)sf.addEventListener('submit',handleSignup);
}
function loginView(){
 return '<div class="auth-hero"><div class="logo-badge">'+icon('shield')+' Secure Access</div><h1>Welcome Back</h1><p>Sign in to your AegisPay Client account.</p></div>'+
 '<form id="loginForm"><div class="field"><label>Email</label><div class="field-wrap"><input id="loginEmail" type="email" autocomplete="username" required placeholder="you@example.com"></div></div>'+
 '<div class="field"><label>Password</label><div class="field-wrap"><input id="loginPassword" type="password" autocomplete="current-password" required placeholder="••••••••"></div></div>'+
 '<div style="min-height:18px;color:#ff9ab0;font-size:9px;margin-top:8px">'+esc(loginError)+'</div>'+
 '<button class="primary" type="submit">Sign In Securely</button></form>'+
 '<div style="display:flex;justify-content:space-between;gap:8px;margin-top:10px"><button class="ghost-dark" style="flex:1" data-action="signup-page">Create Client Account</button><button class="ghost-dark" style="flex:1" data-action="forgot">Forgot Password?</button></div>'+
 '<div class="small-note">Secure AegisPay client access.</div>';
}
function signupView(){
 var ref=new URLSearchParams(location.search).get('ref')||'';
 return '<div class="auth-hero"><div class="logo-badge">'+icon('users')+' Client Registration</div><h1>Create your account</h1><p>Use your real signup name carefully because the withdrawal wallet owner name must match it.</p></div>'+
 '<form id="signupForm"><div class="field"><label>Full Name</label><div class="field-wrap"><input id="signupName" required placeholder="Full name"></div></div>'+
 '<div class="field"><label>Email</label><div class="field-wrap"><input id="signupEmail" type="email" required placeholder="you@example.com"></div></div>'+
 '<div class="form-row"><div class="field"><label>Password</label><div class="field-wrap"><input id="signupPassword" type="password" required placeholder="Minimum 6"></div></div><div class="field"><label>Referral Code</label><div class="field-wrap"><input id="signupRef" value="'+esc(ref.toUpperCase())+'" placeholder="Optional"></div></div></div>'+
 '<div id="signupErr" style="min-height:18px;color:#ff9ab0;font-size:9px;margin-top:8px"></div>'+
 '<button class="primary" type="submit">Create Client Account</button></form>'+
 '<button class="ghost-dark" style="width:100%;margin-top:9px" data-action="login-page">Back to Login</button>';
}
function handleLogin(e){
 e.preventDefault();loginError='';
 try{
  var r=core.authLogin(document.getElementById('loginEmail').value,document.getElementById('loginPassword').value);
  if(isAdminPortal){
   if(r.profile.role!=='MASTER ADMIN'){core.authLogout();throw new Error('This portal is restricted to Master Admin accounts.');}
   view='admin';
  }else{
   if(r.profile.role!=='USER'){core.authLogout();throw new Error('Invalid client account credentials.');}
   view='dashboard';
  }
  render();
 }catch(err){loginError=err.message;render();}
}
function handleSignup(e){
 e.preventDefault();
 var err=document.getElementById('signupErr');
 try{
  core.signup({name:document.getElementById('signupName').value,email:document.getElementById('signupEmail').value,password:document.getElementById('signupPassword').value,referralCode:document.getElementById('signupRef').value});
  view='dashboard';render();notify('Account created');
 }catch(ex){if(err)err.textContent=ex.message;}
}
function clientHeader(p){
 return '<div class="header"><div class="header-row"><div class="brand"><img src="./aegispay-logo.svg" alt="AegisPay"><b>Aegis<span>Pay</span></b></div><div class="header-actions"><button class="icon-btn" data-action="go" data-view="notifications">'+icon('bell')+'</button><button class="icon-btn" data-action="go" data-view="profile">'+icon('profile')+'</button></div></div></div>';
}
function bottom(active){
 var items=[['dashboard','home','Home'],['deposit','wallet','Deposit'],['shop','shop','Shop'],['referrals','users','Referrals'],['withdraw','send','Withdraw']];
 return '<div class="bottom">'+items.map(function(x){return '<button class="'+(active===x[0]?'active':'')+'" data-action="go" data-view="'+x[0]+'">'+icon(x[1])+x[2]+'</button>';}).join('')+'</div>';
}
function renderClient(){
 var p=current(),d=core.getDashboard();
 app.innerHTML='<div class="app-shell">'+clientHeader(p)+'<main class="container">'+clientPage(d)+'</main>'+bottom(view)+'<div class="toast"></div></div>';
 bindClient();
}
function clientPage(d){
 if(view==='dashboard')return dashboardPage(d);
 if(view==='deposit')return depositPage(d);
 if(view==='shop')return shopPage(d);
 if(view==='shop-detail')return shopDetailPage(d);
 if(view==='shop-cart')return shopCartPage(d);
 if(view==='referrals')return referralsPage(d);
 if(view==='withdraw')return withdrawPage(d);
 if(view==='activity')return activityPage(d);
 if(view==='notifications')return notificationsPage(d);
 if(view==='ai')return aiPage(d);
 return profilePage(d);
}
function dashboardPage(d){
 var p=d.profile,c=d.activeCycle;
 var cycleBlock=c?'<div class="cycle-card"><div class="cycle-row"><div><small>Current cycle</small><strong>'+esc(c.status==='WAITING_18H'?'18h Settlement':'Tasks Open')+'</strong></div><div style="text-align:right"><small>Cycle base</small><strong>'+money(c.cycleBase)+'</strong></div></div><div class="progress"><span style="width:'+(c.shopItemIds&&c.shopItemIds.length?Math.round((c.completedItemIds.length/c.shopItemIds.length)*100):0)+'%"></span></div><div class="cycle-row"><small>'+(c.status==='WAITING_18H'?'Next settlement in '+formatCountdown(c.readyAt):'Complete all Shop tasks to start the 18-hour timer.')+'</small><small>'+c.completedItemIds.length+'/'+c.shopItemIds.length+' tasks</small></div></div>':'<div class="banner"><h3>Start your first cycle</h3><p>Choose a tier, complete your deposit verification steps, then your Shop tasks will appear here.</p></div>';
 return '<div class="hero"><div class="hero-row"><div><div class="tiny">Welcome back, '+esc(p.name)+'</div><h2>'+money(p.balance)+'</h2><p>Total dashboard balance</p></div><span class="prototype">CLIENT</span></div><div class="hero-meta"><span class="tag">UID '+esc(p.id)+'</span><span class="tag">'+(d.tier?esc(d.tier.name):'No Tier Selected')+'</span><span class="tag">'+esc(p.status)+'</span></div></div>'+
 '<div class="ticker"><div class="ticker-item"><span class="ticker-icon in">'+icon('wallet')+'</span><div><b>Deposits</b><small>Account funding workflow</small></div></div><div class="ticker-item"><span class="ticker-icon out">'+icon('send')+'</span><div><b>Withdrawals</b><small>Master Admin approval</small></div></div></div>'+
 '<div class="section"><div class="section-head"><h3>Account Overview</h3><button class="view-all" data-action="go" data-view="activity">View activity</button></div><div class="metric-grid">'+
 metric('wallet','blue-bg','Balance',money(p.balance),'Total')+metric('activity','green-bg','Profit',money(p.profit),'Earned')+metric('users','purple-bg','Referrals',d.directReferrals+d.level2Referrals,'Network')+metric('send','amber-bg','Withdrawable',money(d.withdrawable),'Available')+'</div></div>'+
 '<div class="section"><div class="section-head"><h3>Quick Actions</h3><small>Everything in one place</small></div><div class="quick-grid">'+
 quick('wallet','Deposit','Add funds')+quick('shop','Shop','Complete tasks')+quick('send','Withdraw','Apply')+quick('bot','AI Bot','Get help')+'</div></div>'+
 '<div class="section">'+cycleBlock+'</div>'+
 '<div class="section"><div class="section-head"><h3>Security reminders</h3></div><div class="notice">Your withdrawal wallet is locked after linking. Never share your password or recovery information.</div></div>';
}
function metric(ic,bg,title,val,sub){return '<div class="metric"><div class="micon '+bg+'">'+icon(ic)+'</div><strong>'+esc(val)+'</strong><small>'+esc(title)+' · '+esc(sub)+'</small></div>';}
function quick(ic,title,sub){var v=title==='Deposit'?'deposit':title==='Shop'?'shop':title==='Withdraw'?'withdraw':'ai';return '<button class="quick" data-action="go" data-view="'+v+'"><div class="qicon">'+icon(ic)+'</div><b>'+title+'</b><small>'+sub+'</small></button>';}
function depositPage(d){
 var p=d.profile,tier=d.tier;
 return '<div class="page-head"><h2>Deposit</h2><small>USDT • '+esc(d.settings.network)+'</small></div>'+
 '<div class="section"><div class="banner"><h3>How to deposit</h3><p>Select your VIP tier, send the configured USDT network amount, upload your transaction proof and enter the TXID.</p></div></div>'+
 '<div class="section"><div class="section-head"><h3>Choose VIP tier</h3><small>Configured tier pricing</small></div><div class="tier-grid">'+core.tiers.map(function(t){return '<button class="tier '+(depositDraft.tierId===t.id?'selected':'')+'" data-action="tier" data-id="'+t.id+'"><h4>'+esc(t.name)+'</h4><div class="price">'+money(t.deposit)+'</div><div class="profit">'+money(t.profit)+' cycle profit</div><p>'+((t.rate||0)*100).toFixed(2)+'% configured cycle rate.</p></button>';}).join('')+'</div></div>'+
 '<div class="section"><div class="section-head"><h3>Receiving address</h3><small>Configured network</small></div><div class="wallet-card"><div class="wallet-address">'+esc(d.settings.receivingAddress)+'</div><div style="display:flex;gap:7px;margin-top:8px"><button class="secondary" style="flex:1" data-action="copy" data-copy="'+esc(d.settings.receivingAddress)+'">'+icon('copy')+' Copy address</button><button class="secondary" style="flex:1" data-action="native-scan">'+icon('qr')+' Scan QR</button></div></div></div>'+
 '<div class="section"><div class="section-head"><h3>Deposit verification</h3><small>Proof + TXID</small></div><div class="upload"><label><input id="depositScreenshot" type="file" accept="image/*"><div>'+icon('qr')+'</div><strong>'+(depositDraft.screenshotName?'✓ '+esc(depositDraft.screenshotName):'Upload transaction screenshot')+'</strong><small>TXID should be visible and readable.</small></label></div>'+
 '<div class="field"><span class="label">Transaction ID / TXID</span><div style="display:flex;gap:7px"><input id="depositTxid" value="'+esc(depositDraft.txid)+'" placeholder="Paste or scan TXID" style="flex:1;min-height:46px;border:1px solid #dbe5f2;border-radius:13px;padding:0 10px;font-size:10px"><button class="secondary" data-action="native-scan">'+icon('qr')+'</button></div></div>'+
 '<div class="calc"><div class="calc-row"><span>Selected tier</span><b>'+esc((tier&&tier.name)||'—')+'</b></div><div class="calc-row"><span>Gross deposit</span><b>'+money(tier?Number(tier.deposit):0)+'</b></div><div class="calc-row"><span>Deposit fee</span><b>-'+money(d.settings.depositFee)+'</b></div><div class="calc-row total"><span>Dashboard credited</span><b>'+money(tier?Number(tier.deposit-d.settings.depositFee):0)+'</b></div></div>'+
 '<button class="primary" style="margin-top:10px" data-action="deposit-submit">Submit for verification</button></div>'+
 (p.wallet?'<div class="section"><div class="section-head"><h3>Withdrawal wallet</h3><small>Locked</small></div><div class="wallet-card"><div class="wallet-address">'+esc(p.wallet)+'</div><div class="wallet-lock">'+icon('lock')+' Linked to '+esc(p.name)+'.</div></div></div>':'');
}
function productArt(item,large){
 var artMap={pods:'🎧',phone:'📱',laptop:'💻',watch:'⌚',shoe:'👟',hoodie:'🧥',timepiece:'⌚',bag:'👜',coffee:'☕',fryer:'🍳',beauty:'💄',vacuum:'🧹',dress:'👗'};
 if(item.image)return '<div class="product-art '+(large?'large':'')+'"><img src="'+esc(item.image)+'" alt="'+esc(item.title||'Product')+'"><i></i></div>';
 return '<div class="product-art '+(large?'large':'')+' art-'+esc(item.art||'phone')+'"><span>'+esc(artMap[item.art]||'🛍️')+'</span><i></i></div>';
}
function productCard(item,state){
 var inCart=state.cart.indexOf(item.id)>=0;
 return '<button class="product-card '+(inCart?'in-cart':'')+'" data-action="shop-open" data-id="'+esc(item.id)+'">'+productArt(item,false)+
 '<div class="product-badge">'+esc(item.badge||'Popular')+'</div><div class="product-card-body"><div class="stars">★★★★★ <span>('+Number(item.rating||4.5).toFixed(1)+')</span></div><h4>'+esc(item.title)+'</h4>'+
 '<div class="market-price">'+(item.marketPrice?'$'+Number(item.marketPrice).toFixed(2):'—')+' <span>Live market</span></div>'+
 '<div class="product-price">'+money(item.amount)+' <span>AegisPay task value</span></div>'+
 '<div class="product-profit">+ '+money(item.profit)+' Task Profit</div>'+
 '<div class="stock-line">● '+(Number(item.stock||0)>0?'In Stock':'Limited availability')+'</div>'+
 '<div class="product-action">'+(inCart?'✓ Added to Cart':'Add to Cart')+'</div></div></button>';
}
function ensureLiveShopFeed(){
 if(shopFeedLoaded||shopFeedLoading)return;
 shopFeedLoading=true;
 core.refreshLiveCatalog(false).then(function(){shopFeedLoaded=true;shopFeedLoading=false;if(view==='shop'||view==='shop-detail')render();}).catch(function(){shopFeedLoaded=true;shopFeedLoading=false;});
}
function shopHeader(state){
 return '<div class="shop-brandbar"><div><span class="shop-mark">A</span><strong>AegisPay Shop</strong><small>Internal shopping task center</small></div><button class="shop-cart-btn" data-action="shop-cart">'+icon('shop')+'<b>'+state.cart.length+'</b></button></div>';
}
function shopHomePage(d,state){
 ensureLiveShopFeed();
 var cats=['All','Electronics','Fashion','Home & Kitchen','Beauty','Fragrances','Furniture'];
 var filtered=state.available.filter(function(x){
  var ok=shopCategory==='All'||x.category.toLowerCase()===shopCategory.toLowerCase();
  var q=shopSearch.trim().toLowerCase();
  return ok&&(!q||x.title.toLowerCase().indexOf(q)>=0||x.category.toLowerCase().indexOf(q)>=0||x.brand.toLowerCase().indexOf(q)>=0);
 });
 var featured=filtered.slice(0,6),live=state.liveMarket||{};
 return '<div class="shop-shell">'+shopHeader(state)+
 '<div class="market-live-row"><span class="live-dot"></span><b>'+(live.lastStatus==='LIVE'?'LIVE MARKET':'CONNECTING')+'</b><span>Products, prices & availability refresh automatically</span><button data-action="shop-refresh">Refresh</button></div>'+
 '<form id="shopSearchForm" class="shop-search"><input id="shopSearch" value="'+esc(shopSearch)+'" placeholder="Search products, brands, categories..."><button type="submit">'+icon('search')+'</button></form>'+
 '<div class="shop-cats">'+cats.map(function(c){return '<button class="'+(shopCategory===c?'active':'')+'" data-action="shop-category" data-category="'+esc(c)+'">'+esc(c)+'</button>';}).join('')+'</div>'+
 '<div class="shop-banner"><div><span class="eyebrow">AEGISPAY SHOP</span><h2>Shop & Complete Tasks</h2><p>Browse live marketplace-style products with current market data while your task value is matched to your tier balance.</p><button data-action="shop-smartfill">Build My Task Set →</button></div><div class="shopping-visual">🛍️<span>+</span>📦</div></div>'+
 '<div class="shop-balance-row"><div><small>Current cycle balance</small><strong>'+money(state.cycle?state.cycle.cycleBase:0)+'</strong></div><div><small>Cart total</small><strong>'+money(state.total)+'</strong></div><div><small>Remaining</small><strong class="'+(state.remaining===0?'good-text':'')+'">'+money(state.remaining)+'</strong></div></div>'+
 '<div class="shop-section-head"><div><h3>Featured for Your Tier</h3><small>'+esc(d.tier?d.tier.name:'No tier')+' · '+state.available.length+' eligible tasks</small></div><button data-action="shop-cart" class="text-link">Cart '+state.cart.length+'</button></div>'+
 (featured.length?'<div class="product-grid">'+featured.map(function(x){return productCard(x,state);}).join('')+'</div>':'<div class="shop-empty">No eligible products fit the current remaining task balance.</div>')+
 '<div class="shop-category-row">'+cats.slice(1).map(function(c){return '<button data-action="shop-category" data-category="'+esc(c)+'">'+esc(c)+'</button>';}).join('')+'</div>'+
 '<div class="shop-rule"><span>'+icon('shield')+'</span><div><b>Zero balance is mandatory</b><small>Your task cart must consume the full cycle balance before task completion. Market data is displayed separately from the AegisPay task value.</small></div></div>'+
 '</div>';
}
function shopDetailPage(d){
 var state=core.getShopState(),item=state.items.find(function(x){return x.id===shopSelectedId;})||state.items[0];
 if(!item)return shopHomePage(d,state);
 var inCart=state.cart.indexOf(item.id)>=0;
 return '<div class="shop-shell"><div class="shop-detail-head"><button class="back-btn" data-action="go" data-view="shop">←</button><strong>Product Details</strong><button class="shop-cart-btn" data-action="shop-cart">'+icon('shop')+'<b>'+state.cart.length+'</b></button></div>'+
 '<div class="detail-art-wrap">'+productArt(item,true)+'<span class="detail-badge">'+esc(item.badge||'Popular')+'</span></div>'+
 '<div class="detail-content"><div class="stars">★★★★★ <span>('+Number(item.rating||4.5).toFixed(1)+')</span></div><h2>'+esc(item.title)+'</h2><p class="detail-sub">'+esc(item.brand)+' · '+esc(item.category)+' · '+esc(item.subcategory)+'</p>'+
 '<div class="detail-price"><strong>'+(item.marketPrice?'$'+Number(item.marketPrice).toFixed(2):'—')+'</strong><span class="good-text">'+money(item.profit)+' task profit</span></div>'+
 '<div class="detail-box"><div><span>Live market price</span><b>'+(item.marketPrice?'$'+Number(item.marketPrice).toFixed(2):'—')+'</b></div><div><span>AegisPay task value</span><b>'+money(item.amount)+'</b></div><div><span>Remaining after add</span><b>'+money(Math.max(0,state.remaining-(inCart?0:item.amount)))+'</b></div></div>'+
 '<div class="stock-detail"><span>● '+(Number(item.stock||0)>0?'In Stock':'Limited availability')+'</span><span>Marketplace data refreshes automatically</span></div>'+
 '<div class="detail-note">'+icon('shield')+' This is an AegisPay internal task-shopping experience. It is not directly linked to Amazon checkout. Live market data and the AegisPay task value are shown separately.</div>'+
 '<div class="detail-actions"><button class="primary" data-action="shop-add" data-id="'+esc(item.id)+'">'+(inCart?'✓ In Cart':'Add to Cart')+'</button><button class="secondary" data-action="shop-buy" data-id="'+esc(item.id)+'">Buy Now</button></div></div></div>';
}
function shopCartPage(){
 var state=core.getShopState();
 return '<div class="shop-shell"><div class="shop-detail-head"><button class="back-btn" data-action="go" data-view="shop">←</button><strong>My Cart</strong><button class="shop-cart-btn" data-action="shop-cart">'+icon('shop')+'<b>'+state.cart.length+'</b></button></div>'+
 '<div class="cart-progress"><div><small>Cycle balance</small><strong>'+money(state.cycle?state.cycle.cycleBase:0)+'</strong></div><div><small>Remaining</small><strong class="'+(state.remaining===0?'good-text':'')+'">'+money(state.remaining)+'</strong></div></div>'+
 '<div class="cart-list">'+(state.cartItems.length?state.cartItems.map(function(x){return '<div class="cart-item">'+productArt(x,false)+'<div class="cart-item-main"><b>'+esc(x.title)+'</b><small>'+esc(x.category)+' · '+esc(x.brand)+'</small><strong>'+money(x.amount)+'</strong><span>+ '+money(x.profit)+' profit</span></div><button class="remove-cart" data-action="shop-remove" data-id="'+esc(x.id)+'">×</button></div>';}).join(''):'<div class="shop-empty">Your cart is empty. Select task items for your current balance.</div>')+'</div>'+
 '<div class="cart-summary"><div><span>Total Task Amount</span><b>'+money(state.total)+'</b></div><div><span>Task Profit</span><b class="good-text">+ '+money(state.profit)+'</b></div><div><span>Remaining Balance</span><b class="'+(state.remaining===0?'good-text':'')+'">'+money(state.remaining)+'</b></div>'+
 '<div class="cart-buttons"><button class="secondary" data-action="shop-clear">Clear</button><button class="secondary" data-action="shop-smartfill">Build Exact Task Set</button></div>'+
 '<button class="primary wide" '+(state.canCheckout?'':'disabled')+' data-action="shop-checkout">'+(state.canCheckout?'Proceed to Complete Tasks →':'Add items until balance reaches $0.00')+'</button></div>'+
 '<div class="shop-rule"><span>'+icon('shield')+'</span><div><b>Mandatory completion rule</b><small>The cycle cannot complete until the full assigned task amount is in the cart and Remaining Balance is exactly $0.00.</small></div></div></div>';
}
function shopPage(d){
 var state=core.getShopState();
 if(!state.cycle)return '<div class="shop-shell">'+shopHeader(state)+'<div class="shop-empty"><b>No active Shop cycle</b><small>Verify a deposit first. Your tier will then create a matched task set.</small><button class="primary" data-action="go" data-view="deposit">Go to Deposit</button></div></div>';
 if(view==='shop-detail')return shopDetailPage(d);
 if(view==='shop-cart')return shopCartPage();
 return shopHomePage(d,state);
}
function referralsPage(d){
 var p=d.profile,users=core.getData('users'),refs=users.filter(function(u){return u.referredBy===p.id||u.referredBy&&users.some(function(x){return x.id===u.referredBy&&x.referredBy===p.id;});});
 var st=core.getData('settings');
 return '<div class="page-head"><h2>Referrals</h2><small>2-level bonus structure</small></div>'+
 '<div class="section"><div class="ref-mini"><div class="ref-stat"><strong>'+money(st.referralL1)+'</strong><small>Level 1 bonus</small></div><div class="ref-stat"><strong>'+money(st.referralL2)+'</strong><small>Level 2 bonus</small></div></div>'+
 '<div class="ref-link"><span>'+esc(location.origin+location.pathname+'?ref='+p.referralCode)+'</span><button data-action="copy" data-copy="'+esc(location.origin+location.pathname+'?ref='+p.referralCode)+'">'+icon('copy')+' Copy</button></div></div>'+
 '<div class="section"><div class="section-head"><h3>Referral network</h3><small>'+refs.length+' tracked profiles</small></div><div class="list">'+refs.map(function(u){var level=u.referredBy===p.id?1:2;return '<div class="list-row"><div class="list-icon purple-bg">'+icon('users')+'</div><div><b>'+esc(u.name)+'</b><small>Level '+level+' · '+esc(u.email)+'</small></div><div class="amount green">+'+money(level===1?st.referralL1:st.referralL2)+'</div></div>';}).join('')+'</div></div>'+
 '<div class="section"><div class="notice">Referral bonus is triggered by a verified qualifying first deposit.</div></div>';
}
function withdrawPage(d){
 var p=d.profile,amount=50,fee=amount*d.settings.withdrawalFeeRate,net=amount-fee;
 return '<div class="page-head"><h2>Withdraw</h2><small>Master Admin approval required</small></div>'+
 '<div class="section"><div class="hero"><div class="hero-row"><div><div class="tiny">Withdrawable balance</div><h2>'+money(d.withdrawable)+'</h2><p>Minimum '+money(d.settings.withdrawalMinimum)+' · fee '+(d.settings.withdrawalFeeRate*100).toFixed(0)+'%</p></div><span class="prototype">LOCKED WALLET</span></div></div></div>'+
 '<div class="section"><div class="form-card"><div class="field"><span class="label">Withdrawal amount</span><input id="withdrawAmount" type="number" min="'+d.settings.withdrawalMinimum+'" step="0.01" value="'+amount+'" style="width:100%;min-height:47px;border:1px solid #dbe5f2;border-radius:13px;padding:0 10px"></div>'+
 '<div class="calc"><div class="calc-row"><span>Requested amount</span><b id="withdrawGross">'+money(amount)+'</b></div><div class="calc-row"><span>Transfer fee</span><b id="withdrawFee">-'+money(fee)+'</b></div><div class="calc-row total"><span>Net payout</span><b id="withdrawNet">'+money(net)+'</b></div></div>'+
 '<div class="field"><span class="label">Linked destination wallet</span><div class="wallet-address">'+esc(p.wallet||'Not linked')+'</div></div>'+
 '<div class="notice">Your request is reviewed by Master Admin before payout processing.</div>'+
 '<button class="primary" style="margin-top:10px" data-action="withdraw-submit">Apply for withdrawal</button></div></div>'+
 '<div class="section"><div class="section-head"><h3>Recent withdrawals</h3></div><div class="list">'+core.getData('withdrawals').slice(0,5).map(function(w){return '<div class="list-row"><div class="list-icon amber-bg">'+icon('send')+'</div><div><b>'+esc(w.id)+'</b><small>'+esc(w.status)+' · '+new Date(w.createdAt).toLocaleString()+'</small></div><div class="amount neutral">'+money(w.netAmount)+'</div></div>';}).join('')+'</div></div>';
}
function activityPage(){
 return '<div class="page-head"><h2>Activity</h2><small>Account events</small></div><div class="section"><div class="list">'+core.getData('activity').slice(0,20).map(function(x){return '<div class="list-row"><div class="list-icon blue-bg">'+icon('activity')+'</div><div><b>'+esc(x.type)+'</b><small>'+esc(x.text)+' · '+new Date(x.time).toLocaleString()+'</small></div></div>';}).join('')+'</div></div>';
}
function notificationsPage(){
 return '<div class="page-head"><h2>Notifications</h2><small>Account alerts and status</small></div><div class="section"><div class="list">'+core.getData('notifications').slice(0,20).map(function(n){return '<button class="list-row" style="width:100%;text-align:left" data-action="read-notification" data-id="'+n.id+'"><div class="list-icon '+(n.read?'blue-bg':'green-bg')+'">'+icon('bell')+'</div><div><b>'+esc(n.title)+'</b><small>'+esc(n.body)+'</small></div><div class="amount neutral">'+(n.read?'Read':'New')+'</div></button>';}).join('')+'</div></div>';
}
function aiPage(){
 return '<div class="page-head"><h2>AI Assistant</h2><small>Client help and guidance</small></div><div class="chat"><div class="chat-head"><div class="bot-avatar">'+icon('bot')+'</div><div><b>Aegis AI Support</b><small>Informational assistance</small></div></div><div class="chat-list">'+aiMessages.map(function(m){return '<div class="bubble '+(m.who==='user'?'user':'')+'">'+esc(m.text)+'</div>';}).join('')+'</div><div class="chips">'+['How do I deposit?','How do I shop?','How do I withdraw?','How does referral work?'].map(function(q){return '<button class="chip" data-action="ai-chip" data-q="'+esc(q)+'">'+esc(q)+'</button>';}).join('')+'</div><form id="aiForm" class="chat-form"><input id="aiInput" placeholder="Ask Aegis AI..."><button type="submit">'+icon('send')+'</button></form></div>';
}
function profilePage(d){
 var p=d.profile;
 return '<div class="page-head"><h2>My Profile</h2><small>Account security and wallet</small></div><div class="profile"><div class="avatar-lg">'+esc(p.name.charAt(0).toUpperCase())+'</div><div><h2>'+esc(p.name)+'</h2><p>'+esc(p.email)+' · '+esc(p.id)+'</p></div></div>'+
 '<div class="section"><div class="section-head"><h3>Withdrawal wallet</h3><small>'+(p.wallet?'LOCKED':'NOT LINKED')+'</small></div>'+(p.wallet?'<div class="wallet-card"><div class="wallet-address">'+esc(p.wallet)+'</div><div class="wallet-lock">'+icon('lock')+' Linked to '+esc(p.walletOwnerName||p.name)+'.</div></div>':'<button class="secondary" style="width:100%" data-action="wallet-modal">Link withdrawal wallet</button>')+'</div>'+
 '<div class="section"><div class="section-head"><h3>Security</h3></div><div class="list"><button class="list-row" data-action="forgot"><div class="list-icon blue-bg">'+icon('lock')+'</div><div><b>Reset password</b><small>Password reset applies the configured security freeze.</small></div><div class="amount neutral">›</div></button><button class="list-row" data-action="go" data-view="ai"><div class="list-icon purple-bg">'+icon('bot')+'</div><div><b>Ask AI Assistant</b><small>Guidance on app processes.</small></div><div class="amount neutral">›</div></button><button class="list-row" data-action="logout"><div class="list-icon red-bg">'+icon('logout')+'</div><div><b>Log out</b><small>End this session.</small></div></button></div></div>';
}
function bindClient(){
 var shot=document.getElementById('depositScreenshot');if(shot)shot.addEventListener('change',function(){depositDraft.screenshotName=shot.files&&shot.files[0]?shot.files[0].name:'';render();});
 var w=document.getElementById('withdrawAmount');if(w)w.addEventListener('input',function(){var a=Math.max(0,Number(w.value||0)),f=a*core.getDashboard().settings.withdrawalFeeRate,n=a-f;document.getElementById('withdrawGross').textContent=money(a);document.getElementById('withdrawFee').textContent='-'+money(f);document.getElementById('withdrawNet').textContent=money(n);});
 var sf=document.getElementById('shopSearchForm');if(sf)sf.addEventListener('submit',function(e){e.preventDefault();shopSearch=document.getElementById('shopSearch').value||'';render();});
 var af=document.getElementById('aiForm');if(af)af.addEventListener('submit',function(e){e.preventDefault();sendAi(document.getElementById('aiInput').value);});
}
function aiAnswer(q){
 q=String(q||'').toLowerCase();
 if(q.indexOf('deposit')>=0)return 'Select your tier, follow the configured deposit instructions, upload your proof and submit the TXID for verification.';
 if(q.indexOf('withdraw')>=0)return 'Link your withdrawal wallet, request at least the configured minimum, review the fee and submit. The request then moves to Master Admin approval.';
 if(q.indexOf('referral')>=0)return 'Referral bonuses are recorded after a referred client completes a verified qualifying first deposit.';
 if(q.indexOf('shop')>=0||q.indexOf('task')>=0)return 'Open AegisPay Shop. Your tier and cycle balance determine eligible task items. Add items until Remaining Balance is exactly $0.00, then complete checkout to start the 18-hour settlement timer.';
 return 'I can guide you through Deposit, Shop, Withdrawals, Referrals, Wallet linking, Password Reset and account status.';
}
function sendAi(q){q=String(q||'').trim();if(!q)return;aiMessages.push({who:'user',text:q});aiMessages.push({who:'bot',text:aiAnswer(q)});render();}
function showWalletModal(){
 modal='<div class="modal"><div class="sheet"><div class="sheet-head"><h3>Link withdrawal wallet</h3><button class="close" data-action="close-modal">'+icon('x')+'</button></div><p style="font-size:9px;color:#71829f">Wallet linking is one-time for the client. The owner name must match your signup name.</p><div class="field"><span class="label">TRON wallet address</span><input id="walletAddress" style="width:100%;min-height:47px;border:1px solid #dbe5f2;border-radius:13px;padding:0 10px"></div><div class="field"><span class="label">Wallet owner name</span><input id="walletOwnerName" value="'+esc(current().name)+'" style="width:100%;min-height:47px;border:1px solid #dbe5f2;border-radius:13px;padding:0 10px"></div><button class="primary" style="margin-top:10px" data-action="wallet-link">Link wallet</button></div></div>';renderModal();
}
function renderModal(){var old=document.querySelector('.modal');if(old)old.remove();if(modal)document.body.insertAdjacentHTML('beforeend',modal);}
function renderModalThen(){renderModal();}
function adminSummary(s){
 return {totalUsers:s.users.filter(function(u){return u.role==='USER';}).length,activeUsers:s.users.filter(function(u){return u.role==='USER'&&u.status==='NORMAL';}).length,pendingWithdrawals:s.withdrawals.filter(function(w){return w.status==='PENDING_APPROVAL';}).length,approvedWithdrawals:s.withdrawals.filter(function(w){return w.status==='APPROVED';}).length,totalDeposits:s.deposits.filter(function(d){return d.status==='VERIFIED';}).reduce(function(a,d){return a+d.creditedAmount;},0),ledgerEvents:s.ledger.length};
}
function adminPage(tab){
 var s=core.getSystemState(),sum=adminSummary(s);
 if(tab==='users')return adminUsers(s);
 if(tab==='withdrawals')return adminWithdrawals(s);
 if(tab==='adjustments')return adminAdjustments(s);
 if(tab==='settings')return adminSettings(s);
 if(tab==='telegram')return adminTelegram(s);
 return '<div class="admin-hero"><div class="prototype">MASTER ADMIN</div><h2>Operations Control Center</h2><p>Private AegisPay administration workspace.</p></div>'+
 '<div class="admin-grid">'+[['Users',sum.totalUsers],['Active',sum.activeUsers],['Pending Withdrawals',sum.pendingWithdrawals],['Approved',sum.approvedWithdrawals],['Verified Deposits',money(sum.totalDeposits)],['Ledger Events',sum.ledgerEvents]].map(function(x){return '<div class="admin-stat"><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>';}).join('')+'</div>'+
 '<div class="admin-card"><h3>Operating controls</h3><div class="admin-list"><div class="admin-row"><div>'+icon('shield')+'</div><div><b>Master Admin approval</b><small>Required for withdrawal requests.</small></div><span class="status good">ON</span></div><div class="admin-row"><div>'+icon('wallet')+'</div><div><b>Wallet lock</b><small>Client cannot change linked wallet.</small></div><span class="status good">ON</span></div><div class="admin-row"><div>'+icon('bot')+'</div><div><b>AI authority</b><small>AI cannot approve withdrawals or edit balances.</small></div><span class="status good">LIMITED</span></div></div></div>';
}
function adminUsers(s){
 var q=(document.getElementById('adminSearch')||{}).value||'';q=q.toLowerCase();
 var users=s.users.filter(function(u){return u.role==='USER'&&(!q||u.id.toLowerCase().indexOf(q)>=0||u.name.toLowerCase().indexOf(q)>=0||u.email.toLowerCase().indexOf(q)>=0);});
 return '<div class="admin-card"><h3>User Management</h3><div style="margin-top:10px"><input id="adminSearch" class="admin-input" placeholder="Search Unique ID, name or email" value="'+esc(q)+'"></div><div class="admin-list">'+users.map(function(u){return '<div class="admin-row"><div class="list-icon blue-bg">'+icon('profile')+'</div><div><b>'+esc(u.name)+' · '+esc(u.id)+'</b><small>'+esc(u.email)+' · Balance '+money(u.balance)+' · '+esc(u.status)+'</small><div class="admin-btns"><button class="admin-btn green" data-admin-action="credit" data-id="'+u.id+'">Credit</button><button class="admin-btn red" data-admin-action="reverse" data-id="'+u.id+'">Reverse</button><button class="admin-btn gold" data-admin-action="status" data-status="NORMAL" data-id="'+u.id+'">Restore</button><button class="admin-btn red" data-admin-action="status" data-status="FROZEN" data-id="'+u.id+'">Freeze</button><button class="admin-btn red" data-admin-action="status" data-status="BLOCKED" data-id="'+u.id+'">Block</button></div></div></div>';}).join('')+'</div></div>';
}
function adminWithdrawals(s){
 return '<div class="admin-card"><h3>Withdrawal Approval Center</h3><div class="admin-list">'+(s.withdrawals.length?s.withdrawals.map(function(w){var u=s.users.find(function(x){return x.id===w.userId;})||{};return '<div class="admin-row"><div class="list-icon amber-bg">'+icon('send')+'</div><div><b>'+esc(w.id)+' · '+esc(u.name||w.userId)+'</b><small>Gross '+money(w.amount)+' · Fee '+money(w.fee)+' · Net '+money(w.netAmount)+' · '+esc(w.status)+'</small><small>Wallet: '+esc(w.destination)+'</small></div><div class="right">'+(w.status==='PENDING_APPROVAL'?'<button class="admin-btn green" data-admin-action="approve" data-id="'+w.id+'">Approve</button><button class="admin-btn red" data-admin-action="reject" data-id="'+w.id+'">Reject</button>':'<span class="status '+(w.status==='APPROVED'?'good':'bad')+'">'+w.status+'</span>')+'</div></div>';}).join(''):'<div class="notice">No withdrawal requests yet.</div>')+'</div></div>';
}
function adminAdjustments(s){
 return '<div class="admin-card"><h3>Manual Credits & Reversals</h3><p style="font-size:8px;color:#8fa7ca">All manual adjustments are recorded in the account ledger.</p><div class="admin-list">'+s.users.filter(function(u){return u.role==='USER';}).map(function(u){return '<div class="admin-row"><div><b>'+esc(u.name)+'</b><small>'+esc(u.id)+' · Balance '+money(u.balance)+'</small></div><div class="right"><div class="admin-btns"><button class="admin-btn green" data-admin-action="credit" data-id="'+u.id+'">Credit</button><button class="admin-btn red" data-admin-action="reverse" data-id="'+u.id+'">Reverse</button></div></div></div>';}).join('')+'</div></div>';
}
function adminSettings(s){
 var st=s.settings;
 return '<div class="admin-card"><h3>Platform Rules</h3><div class="admin-list"><div class="admin-row"><div><b>Network</b><small>Receiving network</small></div><div class="right"><input id="settingNetwork" class="admin-input" value="'+esc(st.network)+'"></div></div><div class="admin-row"><div><b>Receiving address</b><small>Deposit address</small></div><div class="right"><input id="settingAddress" class="admin-input" value="'+esc(st.receivingAddress)+'"></div></div><div class="admin-row"><div><b>Deposit fee</b><small>Applied per deposit</small></div><div class="right"><input id="settingDepositFee" class="admin-input" type="number" value="'+st.depositFee+'"></div></div><div class="admin-row"><div><b>Withdrawal minimum</b><small>Client request minimum</small></div><div class="right"><input id="settingWithdrawMin" class="admin-input" type="number" value="'+st.withdrawalMinimum+'"></div></div><div class="admin-row"><div><b>Withdrawal fee rate</b><small>0.10 = 10%</small></div><div class="right"><input id="settingWithdrawFee" class="admin-input" type="number" step="0.01" value="'+st.withdrawalFeeRate+'"></div></div><div class="admin-row"><div><b>Cycle waiting time</b><small>Hours</small></div><div class="right"><input id="settingCycle" class="admin-input" type="number" value="'+st.cycleHours+'"></div></div><div class="admin-row"><div><b>Referral bonuses</b><small>Level 1 / Level 2</small></div><div class="right"><div style="display:flex;gap:5px"><input id="settingRef1" class="admin-input" type="number" value="'+st.referralL1+'"><input id="settingRef2" class="admin-input" type="number" value="'+st.referralL2+'"></div></div></div></div><button class="admin-btn green" style="margin-top:10px;width:100%;padding:11px" data-admin-action="save-settings">Save settings</button></div>';
}
function adminTelegram(s){
 var pending=s.withdrawals.find(function(w){return w.status==='PENDING_APPROVAL';});
 return '<div class="admin-card"><h3>Telegram Bot Control</h3><p style="font-size:8px;color:#8fa7ca">Withdrawal request message payload is prepared for the private admin channel.</p>'+(pending?'<div class="admin-row"><div><b>'+esc(pending.id)+'</b><small>Pending approval payload</small></div><div class="right"><button class="admin-btn" data-admin-action="telegram-preview" data-id="'+pending.id+'">Preview message</button></div></div>':'<div class="notice">No pending request to preview.</div>')+'</div>';
}
function renderAdmin(){
 var tab=view==='admin'?'overview':view.replace('admin-','');
 var body=adminPage(tab);
 app.innerHTML='<div class="admin-shell"><div class="admin-header"><div class="header-row"><div class="brand"><img src="./aegispay-logo.svg" alt="AegisPay"><b>Aegis<span>Pay</span></b></div><div class="header-actions"><span class="prototype">MASTER ADMIN</span><button class="icon-btn" data-action="logout">'+icon('logout')+'</button></div></div></div><main class="admin-main"><div class="admin-tabs">'+[['admin','Overview'],['admin-users','Users'],['admin-withdrawals','Withdrawals'],['admin-adjustments','Credits'],['admin-settings','Settings'],['admin-telegram','Telegram']].map(function(x){return '<button class="admin-tab '+(view===x[0]?'active':'')+'" data-action="go" data-view="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div>'+body+'</main><div class="toast"></div></div>';
 bindAdmin();
}
function bindAdmin(){
 var q=document.getElementById('adminSearch');
 if(q)q.addEventListener('input',function(){renderAdmin();setTimeout(function(){var i=document.getElementById('adminSearch');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},0);});
}
document.addEventListener('click',function(e){
 var b=e.target.closest('[data-action]');
 if(b){
  var a=b.getAttribute('data-action');
  try{
   if(a==='signup-page'){authPage='signup';loginError='';render();}
   else if(a==='login-page'){authPage='login';loginError='';render();}
   else if(a==='forgot'){var email=prompt('Enter account email');if(email){var pw=prompt('Enter new password');if(pw){core.resetPassword(email,pw);notify('Password reset. Security freeze enabled.');}}}
   else if(a==='logout'){core.authLogout();view='dashboard';authPage='login';render();notify('Logged out');}
   else if(a==='go'){view=b.getAttribute('data-view');render();}
   else if(a==='copy'){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(b.getAttribute('data-copy')||'');notify('Copied');}
   else if(a==='tier'){depositDraft.tierId=b.getAttribute('data-id');var t=core.tiers.find(function(x){return x.id===depositDraft.tierId;});depositDraft.amount=t?t.deposit:30;render();}
   else if(a==='shop-category'){shopCategory=b.getAttribute('data-category')||'All';view='shop';render();}
   else if(a==='shop-open'){shopSelectedId=b.getAttribute('data-id');view='shop-detail';render();}
   else if(a==='shop-cart'){view='shop-cart';render();}
   else if(a==='shop-add'){core.addToCart(b.getAttribute('data-id'));view='shop-cart';render();notify('Item added to Cart');}
   else if(a==='shop-buy'){core.addToCart(b.getAttribute('data-id'));view='shop-cart';render();notify('Item added — review your Cart');}
   else if(a==='shop-remove'){core.removeFromCart(b.getAttribute('data-id'));render();notify('Item removed');}
   else if(a==='shop-clear'){core.clearCart();render();notify('Cart cleared');}
   else if(a==='shop-smartfill'){core.smartFillCart();view='shop-cart';render();notify('Exact task set added');}
   else if(a==='shop-checkout'){core.checkoutCart();view='dashboard';render();notify('Tasks completed — 18-hour settlement started');}
   else if(a==='shop-refresh'){shopFeedLoaded=false;shopFeedLoading=false;core.refreshLiveCatalog(true).then(function(){shopFeedLoaded=true;render();}).catch(function(){shopFeedLoaded=true;render();});}
   else if(a==='native-scan'){if(window.AegisNative&&window.AegisNative.scan)window.AegisNative.scan();else notify('QR scanner is available in the Android build.');}
   else if(a==='deposit-submit'){depositDraft.txid=(document.getElementById('depositTxid')||{}).value||'';var dd=core.submitDeposit(depositDraft);core.verifyDeposit(dd.id);render();notify('Deposit verified');}
   else if(a==='withdraw-submit'){var am=Number((document.getElementById('withdrawAmount')||{}).value||0);core.createWithdrawal(am);render();notify('Withdrawal submitted for approval');}
   else if(a==='read-notification'){core.markNotification(b.getAttribute('data-id'));render();}
   else if(a==='wallet-modal'){showWalletModal();}
   else if(a==='close-modal'){modal=null;renderModal();}
   else if(a==='wallet-link'){core.linkWallet(document.getElementById('walletAddress').value,document.getElementById('walletOwnerName').value);modal=null;render();notify('Withdrawal wallet linked');}
   else if(a==='ai-chip'){sendAi(b.getAttribute('data-q'));}
  }catch(err){notify(err.message||'Action failed');}
  return;
 }
 var ad=e.target.closest('[data-admin-action]');
 if(ad){
  var aa=ad.getAttribute('data-admin-action'),id=ad.getAttribute('data-id');
  try{
   if(aa==='approve'){core.finalizeWithdrawal(id,true);view='admin-withdrawals';render();notify('Withdrawal approved');}
   else if(aa==='reject'){core.finalizeWithdrawal(id,false);view='admin-withdrawals';render();notify('Withdrawal rejected');}
   else if(aa==='credit'){var amt=Number(prompt('Credit amount'));if(amt>0){core.manualCredit(id,amt,prompt('Reason')||'Master Admin credit');render();notify('Credit applied');}}
   else if(aa==='reverse'){var am2=Number(prompt('Reverse amount'));if(am2>0){core.manualReverse(id,am2,prompt('Reason')||'Master Admin reversal');render();notify('Reversal applied');}}
   else if(aa==='status'){core.setUserStatus(id,ad.getAttribute('data-status'));render();notify('Account status updated');}
   else if(aa==='telegram-preview'){alert(JSON.stringify(core.telegramPayload(id),null,2));}
   else if(aa==='save-settings'){core.updateSettings({network:document.getElementById('settingNetwork').value,receivingAddress:document.getElementById('settingAddress').value,depositFee:Number(document.getElementById('settingDepositFee').value),withdrawalMinimum:Number(document.getElementById('settingWithdrawMin').value),withdrawalFeeRate:Number(document.getElementById('settingWithdrawFee').value),cycleHours:Number(document.getElementById('settingCycle').value),referralL1:Number(document.getElementById('settingRef1').value),referralL2:Number(document.getElementById('settingRef2').value)});render();notify('Settings saved');}
  }catch(ex){notify(ex.message||'Admin action failed');}
 }
});
window.addEventListener('load',function(){
 window.AegisNativeScanResult=function(v){var el=document.getElementById('depositTxid');if(el){el.value=v;depositDraft.txid=v;notify('TXID received from scanner');}};
 render();
});
setInterval(function(){if(current()&&(view==='dashboard'||view==='shop'))render();},1000);
})();

