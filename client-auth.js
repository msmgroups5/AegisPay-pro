(function(){
'use strict';

var root=document.getElementById('app');
var service=window.AegisSupabaseService;
var authType=new URLSearchParams((window.location.hash||'').replace(/^#/, '')).get('type')||'';
var state={phase:'loading',mode:(authType==='invite'||authType==='recovery')?'password-update':'login',profile:null,message:''};
var busy=false;
var profileRequest=null;
var authSubscription=null;

function esc(value){
 return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function brand(){
 return '<div class="brand"><img src="./aegispay-logo.svg" alt="AegisPay"><b>Aegis<span>Pay</span></b></div>';
}
function shell(content,badge){
 return '<div class="auth-wrap"><div class="auth-card"><div class="auth-top">'+brand()+'<span class="prototype">'+esc(badge||'SECURE ACCESS')+'</span></div>'+content+'</div></div><div class="toast"></div>';
}
function messageBlock(){
 if(!state.message)return '';
 return '<div role="status" aria-live="polite" style="min-height:18px;color:'+(state.messageTone==='success'?'#13845b':'#c34861')+';font-size:12px;margin:12px 0">'+esc(state.message)+'</div>';
}
function renderLoading(){
 root.innerHTML=shell('<div class="auth-hero"><div class="logo-badge">'+(window.AegisSupabaseClient?'Secure account':'Checking secure connection')+'</div><h1>Verifying account</h1><p>Please wait while AegisPay checks your sign-in and approved profile.</p></div>','SECURE ACCESS');
}
function renderLogin(){
 root.innerHTML=shell('<div class="auth-hero"><div class="logo-badge">Secure Access</div><h1>Welcome Back</h1><p>Sign in to your AegisPay client account.</p></div>'+
  '<form id="loginForm"><div class="field"><label for="loginEmail">Email</label><div class="field-wrap"><input id="loginEmail" name="email" type="email" autocomplete="username" required placeholder="you@example.com"></div></div>'+
  '<div class="field"><label for="loginPassword">Password</label><div class="field-wrap"><input id="loginPassword" name="password" type="password" autocomplete="current-password" required placeholder="Your password"></div></div>'+
  messageBlock()+'<button class="primary" type="submit" '+(busy?'disabled':'')+'>'+(busy?'Signing in…':'Sign In Securely')+'</button></form>'+
  '<button class="ghost-dark" style="width:100%;margin-top:9px" type="button" data-action="reset">Forgot password?</button>'+
  '<div class="small-note">Access is limited to invited and approved AegisPay accounts. Public account creation is disabled.</div>','AEGISPAY');
}
function renderReset(){
 root.innerHTML=shell('<div class="auth-hero"><div class="logo-badge">Account Recovery</div><h1>Reset your password</h1><p>Enter your account email. If it is registered, Supabase will send password reset instructions.</p></div>'+
  '<form id="resetForm"><div class="field"><label for="resetEmail">Email</label><div class="field-wrap"><input id="resetEmail" type="email" autocomplete="email" required placeholder="you@example.com"></div></div>'+
  messageBlock()+'<button class="primary" type="submit" '+(busy?'disabled':'')+'>'+(busy?'Sending…':'Send reset email')+'</button></form>'+
  '<button class="ghost-dark" style="width:100%;margin-top:9px" type="button" data-action="login">Back to sign in</button>','ACCOUNT RECOVERY');
}
function renderPasswordUpdate(){
 root.innerHTML=shell('<div class="auth-hero"><div class="logo-badge">'+(authType==='invite'?'Invitation':'Account Recovery')+'</div><h1>'+(authType==='invite'?'Set your account password':'Choose a new password')+'</h1><p>'+(authType==='invite'?'Set a password to finish activating your approved AegisPay account.':'Choose a new password to finish recovering your account.')+'</p></div>'+
  '<form id="passwordForm"><div class="field"><label for="newPassword">New password</label><div class="field-wrap"><input id="newPassword" type="password" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters"></div></div>'+
  '<div class="field"><label for="confirmPassword">Confirm new password</label><div class="field-wrap"><input id="confirmPassword" type="password" autocomplete="new-password" minlength="8" required placeholder="Repeat your new password"></div></div>'+
  messageBlock()+'<button class="primary" type="submit" '+(busy?'disabled':'')+'>'+(busy?'Saving…':'Save password')+'</button></form>','SECURE ACCOUNT');
}
function renderProfile(){
 var profile=state.profile||{};
 var status=String(profile.status||'').trim();
 root.innerHTML=shell('<div class="auth-hero"><div class="logo-badge">Verified AegisPay Profile</div><h1>Welcome, '+esc(profile.name||'AegisPay client')+'</h1><p>Your sign-in is connected to an approved AegisPay profile.</p></div>'+
  '<div class="list"><div class="list-row"><div class="list-icon blue-bg">A</div><div><b>Email</b><small>'+esc(profile.email||'')+'</small></div></div>'+
  '<div class="list-row"><div class="list-icon green-bg">✓</div><div><b>Account status</b><small>'+esc(status||'Verified')+'</small></div></div>'+
  '<div class="list-row"><div class="list-icon purple-bg">U</div><div><b>Access type</b><small>Client account</small></div></div></div>'+
  '<div class="notice" style="margin-top:16px">Secure sign-in and live profile linking are active. Dashboard balances and transactions will appear after their server-side data workflows are connected.</div>'+
  messageBlock()+'<button class="primary" style="margin-top:14px" type="button" data-action="logout" '+(busy?'disabled':'')+'>'+(busy?'Signing out…':'Sign Out')+'</button>','LIVE PROFILE');
}
function render(){
 if(!root)return;
 if(state.phase==='loading'){renderLoading();return;}
 if(state.mode==='password-update')renderPasswordUpdate();
 else if(state.mode==='reset')renderReset();
 else if(state.profile)renderProfile();
 else renderLogin();
 bind();
}
function bind(){
 var login=document.getElementById('loginForm');
 if(login)login.addEventListener('submit',submitLogin);
 var reset=document.getElementById('resetForm');
 if(reset)reset.addEventListener('submit',submitReset);
 var password=document.getElementById('passwordForm');
 if(password)password.addEventListener('submit',submitPasswordUpdate);
 var resetButton=document.querySelector('[data-action="reset"]');
 if(resetButton)resetButton.addEventListener('click',function(){state.mode='reset';state.message='';render();});
 var loginButton=document.querySelector('[data-action="login"]');
 if(loginButton)loginButton.addEventListener('click',function(){state.mode='login';state.message='';render();});
 var logoutButton=document.querySelector('[data-action="logout"]');
 if(logoutButton)logoutButton.addEventListener('click',submitLogout);
}
function authError(error){
 var code=String(error&&error.code||'');
 var text=String(error&&error.message||error||'');
 if(/invalid login credentials|invalid email or password/i.test(text))return 'Email or password is incorrect, or the invitation has not been activated.';
 if(/verify your email|email.*confirm/i.test(text))return 'Verify your email using the AegisPay invitation link, then sign in again.';
 if(code==='42501'||/not been approved|no unclaimed aegispay profile|not approved for aegispay/i.test(text))return 'This account is not approved for AegisPay access. Contact the AegisPay administrator.';
 if(/rate limit/i.test(text))return 'Too many attempts were made. Wait a few minutes and try again.';
 if(/supabase client unavailable/i.test(text))return 'Secure sign-in is temporarily unavailable. Refresh the page and try again.';
 return 'AegisPay could not verify this account. Check your details or contact the AegisPay administrator.';
}
function isAccessDenied(error){
 var code=String(error&&error.code||'');
 var text=String(error&&error.message||error||'');
 return code==='42501'||code==='AEGIS_ACCESS_DENIED'||/not been approved|no unclaimed aegispay profile|no approved aegispay profile|not approved for aegispay|client access is not enabled|account is not active/i.test(text);
}
function validateProfile(profile){
 if(!profile||!profile.id)throw new Error('No approved AegisPay profile is linked to this account.');
 if(String(profile.role||'').trim().toUpperCase()!=='USER'){
  var roleError=new Error('Client access is not enabled for this profile.');
  roleError.code='AEGIS_ACCESS_DENIED';
  throw roleError;
 }
 var status=String(profile.status||'').trim().toUpperCase();
 if(status!=='ACTIVE'&&status!=='NORMAL'){
  var statusError=new Error('Account is not active.');
  statusError.code='AEGIS_ACCESS_DENIED';
  throw statusError;
 }
}
function refreshProfile(){
 if(profileRequest)return profileRequest;
 profileRequest=(async function(){
  state.phase='loading';state.message='';render();
  try{
   var account=await service.claimAegisPayProfile();
   validateProfile(account.profile);
   state.profile={
    id:account.profile.id,
    name:account.profile.name||account.user.email||'AegisPay client',
    email:account.profile.email||account.user.email||'',
    role:account.profile.role,
    status:account.profile.status
   };
   state.mode='profile';state.phase='ready';state.message='';state.messageTone='';
   return true;
  }catch(error){
   state.profile=null;state.mode='login';state.phase='ready';state.message=authError(error);state.messageTone='error';
   if(isAccessDenied(error)){
    state.phase='loading';
    try{await service.signOut();}catch(signOutError){}
    state.phase='ready';
   }
   return false;
  }finally{
   profileRequest=null;
   render();
  }
 })();
 return profileRequest;
}
async function submitLogin(event){
 event.preventDefault();
 var email=document.getElementById('loginEmail').value;
 var password=document.getElementById('loginPassword').value;
 busy=true;state.phase='loading';state.message='';render();
 try{
  await service.signIn(email,password);
  await refreshProfile();
 }catch(error){
  state.profile=null;state.mode='login';state.phase='ready';state.message=authError(error);state.messageTone='error';
 }finally{
  busy=false;
  if(state.phase==='loading')state.phase='ready';
  render();
 }
}
async function submitReset(event){
 event.preventDefault();
 var email=document.getElementById('resetEmail').value;
 busy=true;state.phase='loading';state.message='';render();
 try{
  await service.sendPasswordReset(email);
  state.mode='reset';state.phase='ready';state.message='If this email belongs to an account, password reset instructions have been sent.';state.messageTone='success';
 }catch(error){
  state.mode='reset';state.phase='ready';state.message=authError(error);state.messageTone='error';
 }finally{busy=false;render();}
}
async function submitPasswordUpdate(event){
 event.preventDefault();
 var password=document.getElementById('newPassword').value;
 var confirmation=document.getElementById('confirmPassword').value;
 if(password.length<8){state.message='Use a password with at least 8 characters.';state.messageTone='error';render();return;}
 if(password!==confirmation){state.message='The two passwords do not match.';state.messageTone='error';render();return;}
 busy=true;state.phase='loading';state.message='';render();
 try{
  await service.updatePassword(password);
  try{window.history.replaceState(null,document.title,window.location.pathname+window.location.search);}catch(historyError){}
  await refreshProfile();
 }catch(error){
  state.mode='password-update';state.phase='ready';state.message=authError(error);state.messageTone='error';
 }finally{busy=false;if(state.phase==='loading')state.phase='ready';render();}
}
async function submitLogout(){
 busy=true;state.phase='loading';state.message='';render();
 try{await service.signOut();state.profile=null;state.mode='login';}
 catch(error){state.message=authError(error);state.messageTone='error';}
 finally{busy=false;state.phase='ready';render();}
}
function boot(){
 render();
 if(!service||!service.isAvailable()){
  state.phase='ready';state.message='Secure sign-in is unavailable. Refresh the page and try again.';state.messageTone='error';render();return;
 }
 authSubscription=service.onAuthStateChange(function(event,session){
  if(event==='SIGNED_OUT'){
   state.profile=null;
   if(state.phase!=='loading'){state.mode='login';state.message='';state.phase='ready';}
   render();
  }else if(event==='PASSWORD_RECOVERY'){
   state.profile=null;state.mode='password-update';state.phase='ready';state.message='';render();
  }else if(event==='SIGNED_IN'&&session&&!state.profile&&state.mode!=='password-update'){
   window.setTimeout(function(){refreshProfile();},0);
  }
 });
 if(authType==='invite'||authType==='recovery'){
  service.session().then(function(session){
   if(session){state.mode='password-update';state.message='';}
   else{state.mode='login';state.message='This invitation or recovery link is invalid or expired. Request a new link.';state.messageTone='error';}
   state.phase='ready';render();
  }).catch(function(error){state.mode='login';state.phase='ready';state.message=authError(error);state.messageTone='error';render();});
  return;
 }
 service.session().then(function(session){
  if(session){refreshProfile();}
  else{state.phase='ready';render();}
 }).catch(function(error){state.phase='ready';state.message=authError(error);state.messageTone='error';render();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();