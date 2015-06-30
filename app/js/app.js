(function() {
  'use strict';

  function ChromeSid() {
    this.sidplayer = new app.sidplay("#chromeSidContainer");
    this.sidplayer.GetInfo(function(data)
    {
      document.querySelector('#status').textContent = data.libraryVersion;
    });
  }

  var chromeSid = new ChromeSid();
})();