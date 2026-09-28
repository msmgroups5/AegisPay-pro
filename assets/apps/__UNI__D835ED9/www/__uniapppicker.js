(function(){
  'use strict';
  window.__uniappPicker = function(items, callback){
    var value = Array.isArray(items) && items.length ? items[0] : '';
    if(typeof callback === 'function') callback(value);
    return value;
  };
})();
