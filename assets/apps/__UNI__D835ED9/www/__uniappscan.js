(function(){
  'use strict';
  window.__uniappScan = function(){
    if(window.AegisNative && AegisNative.scan){ AegisNative.scan(); return true; }
    return false;
  };
})();
