(function(){
  'use strict';
  window.__uniappOpenLocation = function(query){
    if(window.AegisNative && AegisNative.openLocation){ AegisNative.openLocation(query || ''); return true; }
    return false;
  };
})();
