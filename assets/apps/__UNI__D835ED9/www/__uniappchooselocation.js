(function(){
  'use strict';
  window.__uniappChooseLocation = function(){
    if(window.AegisNative && AegisNative.chooseLocation){ AegisNative.chooseLocation(); return true; }
    return false;
  };
})();
