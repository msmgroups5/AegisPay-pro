(function(){
'use strict';

/*
 * AegisPay Client UI reset.
 * All previous client UI markup, catalog content, CSS hooks and screen
 * definitions have been removed. Backend services remain untouched so the
 * new UI can be built screen-by-screen and connected to the existing data
 * layer later.
 */
var service=window.AegisSupabaseService;

window.AegisPayClientRuntime={
  service:service,
  isAvailable:function(){return !!(service&&service.isAvailable&&service.isAvailable());},
  session:function(){return service&&service.session?service.session():Promise.resolve(null);},
  currentUser:function(){return service&&service.currentUser?service.currentUser():Promise.resolve(null);},
  profile:function(){return service&&service.claimAegisPayProfile?service.claimAegisPayProfile():Promise.resolve(null);}
};

document.documentElement.lang='en';
document.documentElement.dir='ltr';

var root=document.getElementById('app');
if(root){
  root.innerHTML='';
  root.removeAttribute('aria-live');
}
})();