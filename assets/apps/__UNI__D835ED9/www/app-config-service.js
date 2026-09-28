(function(){
  'use strict';
  window.AegisAppConfigService = {
    endpoint: function(path){ return path || ''; },
    get: function(key, fallback){ return window.__AEGIS_UNI_CONFIG__[key] || fallback; }
  };
})();
