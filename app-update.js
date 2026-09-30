(function(){
'use strict';

var CHECK_URL=(window.AEGIS_UPDATE_MANIFEST_URL||'/app-version.json');
var checking=false;
var downloaded=false;

function nativeReady(){
  return !!(window.AegisNative&&window.AegisNative.startApkUpdate&&window.AegisNative.appVersionCode);
}

function currentCode(){
  if(!nativeReady())return 0;
  try{return Number(window.AegisNative.appVersionCode()||0);}catch(e){return 0;}
}

function currentName(){
  if(!nativeReady())return '';
  try{return String(window.AegisNative.appVersionName()||'');}catch(e){return '';}
}

function isAdmin(){
  return window.AEGIS_ADMIN_PORTAL===true;
}

function setBanner(html){
  var old=document.getElementById('aegisUpdateBanner');
  if(old)old.remove();
  if(!html)return;
  var el=document.createElement('div');
  el.id='aegisUpdateBanner';
  el.style.cssText='position:fixed;left:12px;right:12px;bottom:86px;z-index:99999;padding:14px 16px;border-radius:18px;background:linear-gradient(135deg,#0b1f48,#164fae 62%,#6f43df);color:#fff;box-shadow:0 18px 40px rgba(5,20,52,.35);font:700 13px/1.45 system-ui,sans-serif';
  el.innerHTML=html;
  document.body.appendChild(el);
}

function check(){
  if(checking)return;
  checking=true;
  fetch(CHECK_URL+'?t='+Date.now(),{cache:'no-store',headers:{'cache-control':'no-cache'}})
   .then(function(r){if(!r.ok)throw new Error('manifest '+r.status);return r.json();})
   .then(function(m){
     var remote=Number(m.versionCode||0),local=currentCode();
     if(!nativeReady()||!remote||remote<=local)return;
     var url=isAdmin()?m.adminApkUrl:m.clientApkUrl;
     var sha=isAdmin()?m.adminSha256:m.clientSha256;
     if(!url)return;
     var name=String(m.versionName||('v'+remote));
     setBanner('<div style="display:flex;gap:10px;align-items:center"><div style="flex:1"><div style="font-size:11px;opacity:.8">AegisPay update available</div><div style="font-size:16px;margin-top:2px">'+name+'</div><div style="font-size:10px;opacity:.8;margin-top:2px">Current '+currentName()+' → latest '+name+'</div></div><button id="aegisUpdateBtn" style="border:0;border-radius:12px;padding:10px 13px;background:#fff;color:#165ec5;font-weight:900">Update</button></div>');
     var btn=document.getElementById('aegisUpdateBtn');
     if(btn)btn.onclick=function(){
       if(downloaded)return;
       downloaded=true;btn.disabled=true;btn.textContent='Downloading…';
       try{window.AegisNative.startApkUpdate(new URL(url,location.origin).href,name,String(sha||''));}
       catch(e){downloaded=false;btn.disabled=false;btn.textContent='Update';}
     };
   })
   .catch(function(){})
   .finally(function(){checking=false;});
}

window.AegisUpdate={check:check};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(check,2500);});
else setTimeout(check,2500);
setInterval(check,30*60*1000);
})();