
(function(){
'use strict';

const DEMO={
  users:[
    {email:'user@aegispay.demo',clientId:'AP10023',name:'Client Name',role:'USER',balance:12480,earned:37},
    {email:'admin@aegispay.demo',clientId:'APADMIN',name:'Operations Admin',role:'ADMIN',balance:0,earned:0},
    {email:'master@aegispay.demo',clientId:'APMASTER',name:'Master Administrator',role:'MASTER ADMIN',balance:0,earned:0}
  ],
  referrals:[
    {name:'Ahmed Khan',id:'AP45872',level:1,date:'12 Sep 2026',reward:5,status:'Active',count:3},
    {name:'Sara Ali',id:'AP77219',level:1,date:'08 Sep 2026',reward:5,status:'Active',count:5},
    {name:'Usman Malik',id:'AP99012',level:2,date:'04 Sep 2026',reward:2,status:'Pending',count:2},
    {name:'Hina Fatima',id:'AP66781',level:1,date:'28 Aug 2026',reward:5,status:'Active',count:1},
    {name:'Bilal Ahmed',id:'AP33455',level:1,date:'20 Aug 2026',reward:5,status:'Active',count:0},
    {name:'Ali Raza',id:'AP10118',level:2,date:'18 Aug 2026',reward:2,status:'Active',count:1}
  ],
  activity:[
    {name:'Imran K.',action:'Deposited',amount:'50 USDT',out:false},
    {name:'Sara M.',action:'Withdrawn',amount:'25 USDT',out:true},
    {name:'Ali F.',action:'Deposited',amount:'100 USDT',out:false},
    {name:'Ayesha R.',action:'Withdrawn',amount:'15 USDT',out:true}
  ],
  nodes:[
    {name:'Guardian Node',id:'NODE-1001',allocation:'5,000 USDT',yield:'1.24%',region:'Dubai',status:'Active'},
    {name:'Sentinel Node',id:'NODE-1002',allocation:'7,500 USDT',yield:'0.92%',region:'London',status:'Active'}
  ]
};

let user=JSON.parse(localStorage.getItem('aegis_user')||'null');
let view='home',refTab='list',noticeOpen=false;

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function copyText(v,msg){if(navigator.clipboard)navigator.clipboard.writeText(v).catch(()=>{});toast(msg||'Copied')}
function toast(msg){let t=document.querySelector('.toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function icon(x){return x}
function initials(n){return (n||'A').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}

function login(){
  const email=(document.getElementById('login_email')?.value||'').trim();
  const id=(document.getElementById('login_id')?.value||'').trim().toUpperCase();
  const found=DEMO.users.find(u=>(u.email.toLowerCase()===email.toLowerCase()||u.name.toLowerCase()===email.toLowerCase())&&u.clientId===id);
  const err=document.getElementById('login_error');
  if(!found){if(err)err.textContent='Please enter a valid Client Name / Email and Client ID.';return}
  user={...found};localStorage.setItem('aegis_user',JSON.stringify(user));view='home';render()
}
function logout(){localStorage.removeItem('aegis_user');user=null;view='home';render()}
function nav(v){view=v;refTab='list';render();window.scrollTo({top:0,behavior:'smooth'})}

function loginScreen(){
 return '<div class="login-screen"><div class="login-phone">'+
 '<div class="brand"><img class="brand-logo" src="./aegispay-logo.svg" alt="AegisPay"></div><div class="brand-tagline">Your Payments, Your Way</div>'+
 '<div class="login-art"><div class="live-pop p1"><b>Ali Khan</b><span>Just Withdrawn</span><strong>25 USDT</strong><small>1m ago</small></div><div class="live-pop p2"><b>Sara Malik</b><span>Just Withdrawn</span><strong>50 USDT</strong><small>3m ago</small></div><div class="live-pop p3"><b>Usman Raza</b><span>Just Withdrawn</span><strong>100 USDT</strong><small>5m ago</small></div><div class="live-pop p4"><b>Hina Fatima</b><span>Just Withdrawn</span><strong>15 USDT</strong><small>7m ago</small></div><div class="orbit"></div><div class="orbit two"></div><div class="city"><i class="building b1"></i><i class="building b2"></i><i class="building b3"></i><i class="building b4"></i><i class="building b5"></i><i class="building b6"></i><i class="building b7"></i></div></div>'+
 '<div class="login-card"><h1>Welcome Back</h1><p>Login to your account</p>'+
 '<div class="field"><span class="ico">👤</span><input id="login_email" autocomplete="username" placeholder="Client Name / Email"></div>'+
 '<div class="field"><span class="ico">🔒</span><input id="login_id" autocomplete="off" placeholder="Client ID"><button class="eye" onclick="toggleId()">◉</button></div>'+
 '<button class="login-btn" onclick="login()">Log In <span>→</span></button><div class="forgot">Forgot Client ID?</div>'+
 '<div id="login_error" class="login-error"></div><div class="login-note">Secure AegisPay client access</div></div></div></div>'
}
function toggleId(){const i=document.getElementById('login_id');if(i)i.type=i.type==='password'?'text':'password'}

function top(){
 return '<header class="top"><div class="top-row"><div class="brand"><img class="brand-logo" src="./aegispay-logo.svg" alt="AegisPay"></div>'+
 '<div class="top-actions"><button class="icon-btn" onclick="showNotifications()">♟<span class="dot"></span></button><button class="icon-btn" onclick="nav(\'profile\')">●</button></div></div>'+
 (view==='home'?'<div class="welcome"><div class="small">Welcome,</div><h2>'+esc(user.name)+'</h2><div class="client-id">Client ID: '+esc(user.clientId)+' <button class="copy" onclick="copyText(\''+esc(user.clientId)+'\',\'Client ID copied\')">▣</button></div></div>'+
 '<div class="ticker">'+DEMO.activity.map(a=>'<div class="ticker-item"><span class="bubble '+(a.out?'out':'')+'">'+(a.out?'↑':'↓')+'</span><div><b>'+esc(a.name)+'</b> '+esc(a.action)+'<small>'+esc(a.amount)+'</small></div></div>').join('')+'</div>':'')+
 '</header>'
}

function levels(){return '<div class="level-card"><div class="level lv1"><span class="crown">♛</span><div><b>LV 1</b><strong>5%</strong><small>Direct</small></div></div><div class="level lv2"><span class="crown">♛</span><div><b>LV 2</b><strong>7%</strong><small>Indirect</small></div></div><div class="level lv3"><span class="crown">♛</span><div><b>LV 3</b><strong>10%</strong><small>Network</small></div></div></div>'}

function referralCard(){return '<div class="ref-card"><div class="ref-title"><div class="ref-icon">👥+</div><div><h3>Referral</h3><p>Invite Friends & Earn Rewards</p></div></div><div class="ref-label">Your Unique Referral ID</div><div class="ref-id">AP10023 <button class="copy-btn" onclick="copyText(\'AP10023\',\'Referral ID copied\')">▣</button></div><div class="ref-actions"><button class="share wa" onclick="shareWhatsApp()">◉ WhatsApp</button><button class="share share-blue" onclick="shareLink()">⌯ Share Link</button></div></div>'}

function tiles(){return '<div class="tile-grid"><button class="tile" onclick="nav(\'assets\')"><span><span class="ti blue">💰</span></span><span><b>Top Up</b><small>Deposit Amount</small></span><span class="arrow">›</span></button>'+
'<button class="tile" onclick="toast(\'Shop module ready for next phase\')"><span><span class="ti purple">🛒</span></span><span><b>Shop</b><small>Amazon Shopping</small></span><span class="arrow">›</span></button>'+
'<button class="tile" onclick="nav(\'profile\')"><span><span class="ti green">▣</span></span><span><b>Account Details</b><small>View Your Account</small></span><span class="arrow">›</span></button>'+
'<button class="tile" onclick="toast(\'Crypto module ready for next phase\')"><span><span class="ti orange">₿</span></span><span><b>Crypto</b><small>Buy & Manage</small></span><span class="arrow">›</span></button></div>'}

function home(){
 return top()+'<main class="content">'+levels()+referralCard()+tiles()+
 '<div class="section"><div class="section-head"><h3>Account Summary</h3><button onclick="nav(\'assets\')">View Assets</button></div><div class="stat-grid"><div class="stat"><strong>12,480</strong><small>Balance USDT</small></div><div class="stat"><strong>2</strong><small>Active Nodes</small></div><div class="stat"><strong>37</strong><small>Rewards Earned</small></div></div></div>'+
 '</main>'+bottom()+
 '<div class="toast"></div>'
}

function pageHead(title,sub){return '<div class="page-title"><button class="back" onclick="nav(\'home\')">‹</button><div><h2>'+esc(title)+'</h2><small>'+esc(sub||'')+'</small></div></div>'}

function referral(){
 const refs=DEMO.referrals;
 return '<main class="content">'+pageHead('Referral','Invite friends and build your network')+
 '<div class="banner"><h2>Invite Friends<br>Earn Rewards</h2><p>Share your unique link and earn USDT rewards when your referrals join and make a deposit.</p></div>'+
 '<div class="reward-grid"><div class="reward"><strong>5 USDT</strong><b>Direct Referral</b><small>When your direct referral joins<br><b>(Level 1)</b></small></div><div class="reward purple"><strong>2 USDT</strong><b>Indirect Referral</b><small>When your friend&#039;s referral joins<br><b>(Level 2)</b></small></div></div>'+
 '<div class="link-box"><b style="font-size:13px">Your Referral Link</b><div class="link-row" style="margin-top:8px"><span>https://aegispay.com/signup/AP10023</span><button class="copy-btn" onclick="copyText(\'https://aegispay.com/signup/AP10023\',\'Referral link copied\')">▣</button></div><div class="ref-actions"><button class="share wa" onclick="shareWhatsApp()">◉ Share on WhatsApp</button><button class="share share-blue" onclick="shareLink()">⌯ Share More</button></div></div>'+
 '<div class="section" style="padding-bottom:8px"><div class="stat-grid"><div class="stat"><strong>12</strong><small>Total Referrals</small></div><div class="stat"><strong>8</strong><small>Direct (L1)</small></div><div class="stat"><strong>14</strong><small>Indirect (L2)</small></div></div><div class="tabs"><button class="tab '+(refTab==='list'?'active':'')+'" onclick="refTab=\'list\';render()">My Referrals (12)</button><button class="tab '+(refTab==='network'?'active':'')+'" onclick="refTab=\'network\';render()">Network View</button></div>'+
 (refTab==='list'?'<div class="ref-list">'+refs.map(r=>'<div class="ref-row"><span class="avatar">●</span><div><b>'+esc(r.name)+'</b><small>ID: '+esc(r.id)+' · '+esc(r.date)+'</small></div><div class="earn"><span class="pill '+(r.level===1?'green':'purple')+'">Level '+r.level+'</span><br>+'+r.reward+' USDT</div><span class="chev">›</span></div>').join('')+'</div>':'networkView()')+
 '</div></main>'+bottom()+'<div class="toast"></div>'
}

function networkView(){return '<div class="network-card"><div class="legend"><i style="background:#1675f5"></i>You (AP10023)&nbsp;&nbsp; <i style="background:#11ad76"></i>Level 1&nbsp;&nbsp; <i style="background:#7927df"></i>Level 2</div><div class="tree"><div class="tree-me">●<br><b>You</b><br>AP10023</div><div class="tree-line"></div><div class="tree-level">'+['Ahmed','Sara','Hina'].map(n=>'<div class="tree-node"><b>'+n+'</b>AP'+Math.floor(10000+Math.random()*89999)+'<br>+5 USDT</div>').join('')+'</div><div class="tree-line" style="width:78%"></div><div class="tree-level">'+['Ali','Zoya','Bilal','Ayesha'].map(n=>'<div class="tree-node l2"><b>'+n+'</b>AP'+Math.floor(10000+Math.random()*89999)+'<br>+2 USDT</div>').join('')+'</div></div><div class="network-summary"><div class="sum"><strong>AP10023</strong><small>You</small></div><div class="sum"><strong>8</strong><small>Level 1</small></div><div class="sum"><strong>14</strong><small>Level 2</small></div><div class="sum"><strong>37</strong><small>Total Earned</small></div></div></div>'}

function assets(){return '<main class="content">'+pageHead('Assets','Balance, nodes and account activity')+
 '<div class="asset-balance"><small>Available Balance</small><strong>12,480.00 USDT</strong><small>AegisPay platform balance</small><div class="asset-actions" style="margin-top:15px"><button class="asset-action" onclick="toast(\'Top Up request opened\')">＋ Top Up</button><button class="asset-action" onclick="toast(\'Withdrawal request opened\')">↗ Withdraw</button></div></div>'+
 '<div class="asset-card"><div class="section-head"><h3>My Active Nodes</h3><button onclick="toast(\'Node details opened\')">View All</button></div>'+DEMO.nodes.map(n=>'<div class="node-mini"><span class="nicon">◆</span><span style="flex:1;margin-left:9px"><b>'+n.name+'</b><small>'+n.id+' · '+n.region+'</small></span><span style="text-align:right"><b>'+n.yield+'</b><small>'+n.allocation+'</small></span></div>').join('')+'</div>'+
 '<div class="asset-card"><div class="section-head"><h3>Recent Activity</h3></div>'+DEMO.activity.map(a=>'<div class="node-mini"><span class="nicon">'+(a.out?'↑':'↓')+'</span><span style="flex:1;margin-left:9px"><b>'+a.name+' '+a.action+'</b><small>Today · AegisPay activity</small></span><b style="color:'+(a.out?'#e89508':'#079b68')+'">'+a.amount+'</b></div>').join('')+'</div></main>'+bottom()+'<div class="toast"></div>'}

function profile(){return '<main class="content">'+pageHead('My Profile','Client account and preferences')+
 '<div class="profile-head"><div class="profile-avatar">'+initials(user.name)+'</div><div><h2>'+esc(user.name)+'</h2><p>Client ID: '+esc(user.clientId)+'</p><span class="pill green">Verified Account</span></div></div>'+
 '<div class="menu-list">'+
 '<button class="menu-item" onclick="copyText(\'AP10023\',\'Client ID copied\')"><span class="mi">▣</span><span><b>Client ID</b><small>AP10023</small></span><span class="right">›</span></button>'+
 '<button class="menu-item" onclick="nav(\'referral\')"><span class="mi">👥</span><span><b>Referral Program</b><small>5% / 7% / 10% network levels</small></span><span class="right">›</span></button>'+
 '<button class="menu-item" onclick="showNotifications()"><span class="mi">♟</span><span><b>Notifications</b><small>Account and activity alerts</small></span><span class="right">›</span></button>'+
 '<button class="menu-item" onclick="nav(\'ai\')"><span class="mi">🤖</span><span><b>AI Bot</b><small>General platform guidance</small></span><span class="right">›</span></button>'+
 '<button class="menu-item" onclick="logout()"><span class="mi">↪</span><span><b>Log Out</b><small>End this device session</small></span><span class="right">›</span></button>'+
 '</div></main>'+bottom()+'<div class="toast"></div>'}

let messages=[{bot:true,text:'Hello! I am AegisPay AI Bot. I can explain platform features, referrals, nodes and account screens.'}];
function ai(){return '<main class="content">'+pageHead('AI Bot','General information assistant')+
 '<div class="chat"><div class="chat-head"><div class="bot">🤖</div><div><b>AegisPay AI Bot</b><small style="display:block;color:#7c8ba6;font-size:9px">Online · informational only</small></div></div><div class="chat-scroll">'+messages.map(m=>'<div class="msg '+(m.bot?'':'user')+'">'+esc(m.text)+'</div>').join('')+'</div><div class="chat-input"><input id="chat_q" placeholder="Ask about referrals, nodes, withdrawals..."><button onclick="askAI()">↑</button></div></div></main>'+bottom()+'<div class="toast"></div>'}
function askAI(){let q=(document.getElementById('chat_q')?.value||'').trim();if(!q)return;messages.push({bot:false,text:q});let l=q.toLowerCase(),ans=l.includes('referral')?'Your referral program shows Level 1, Level 2 and Level 3 structures. The demo rewards shown are 5 USDT for direct and 2 USDT for indirect referrals.':l.includes('withdraw')?'Withdrawal requests are shown in the Assets workflow. The current build is a platform workflow/demo and does not move real funds.':l.includes('node')?'Your Assets screen shows active nodes with allocation, region and yield information.':'I can explain the AegisPay interface and demo workflows. I do not provide individualized financial advice or execute real payments.';messages.push({bot:true,text:ans});render();setTimeout(()=>{let c=document.querySelector('.chat-scroll');if(c)c.scrollTop=c.scrollHeight},30)}

function bottom(){return '<nav class="bottom"><button class="'+(view==='home'?'active':'')+'" onclick="nav(\'home\')"><span>⌂</span>Home</button><button class="'+(view==='assets'?'active':'')+'" onclick="nav(\'assets\')"><span>◇</span>Assets</button><button class="'+(view==='profile'?'active':'')+'" onclick="nav(\'profile\')"><span>●</span>My Profile</button><button class="'+(view==='ai'?'active':'')+'" onclick="nav(\'ai\')"><span>🤖</span>AI Bot</button></nav>'}

function showNotifications(){noticeOpen=!noticeOpen;render();if(noticeOpen)setTimeout(()=>{let x=document.querySelector('.notice');if(x)x.scrollIntoView({behavior:'smooth',block:'start'})},30)}
function shareWhatsApp(){let u='https://aegispay.com/signup/AP10023';window.open('https://wa.me/?text='+encodeURIComponent('Join me on AegisPay: '+u),'_blank')}
function shareLink(){copyText('https://aegispay.com/signup/AP10023','Referral link copied')}

function notificationPanel(){return noticeOpen?'<div class="section notice" style="margin:12px 13px 0"><div class="section-head"><h3>Notifications</h3><button onclick="noticeOpen=false;render()">Close</button></div><div class="node-mini"><span class="nicon">✓</span><span style="flex:1;margin-left:9px"><b>Referral reward updated</b><small>Your network reward summary is ready.</small></span><small>Now</small></div><div class="node-mini"><span class="nicon">↗</span><span style="flex:1;margin-left:9px"><b>Withdrawal activity</b><small>A recent platform activity was recorded.</small></span><small>Today</small></div></div>':''
}

function render(){
 document.getElementById('app').innerHTML=user?'<div class="app"><div class="shell">'+(view==='home'?home():view==='referral'?top()+referral():view==='assets'?top()+assets():view==='profile'?top()+profile():top()+ai())+notificationPanel()+'</div></div>':loginScreen();
}
window.login=login;window.logout=logout;window.nav=nav;window.toggleId=toggleId;window.copyText=copyText;window.shareWhatsApp=shareWhatsApp;window.shareLink=shareLink;window.showNotifications=showNotifications;window.askAI=askAI;window.render=render;
render();
})();
