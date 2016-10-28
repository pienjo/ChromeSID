chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create("index.html", {
    id: 'ChromeSIDMain',
    bounds : {
      width : 400,
      height: 400,
      left: 100,
      top: 100,
    }
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, callback){
   
    if (request && request.action === 'createSettings') {
      chrome.app.window.create( "playersettings.html", {
        id: 'ChromeSidSettings',
        bounds: {
          width : 200,
          height : 200,
          left: 200,
          top: 100,
        }
      },
        function(win) {
          win.Config = request.config; // Propagate settings from request (is this really the only way? Can't propagate the model itself, since it has been JSON serialised :-/ )
          callback(win);
          
          // Register close event handler. Needs to be done here, per API docs:
          //
          // "Fired when the window is closed. Note, this should be listened to from a window other than the window being closed, for example from the background page."
          //
          
          // I suspect it's possible to send a message to a specific window (in casu: 'sender', but I haven't found anything in the documentation..)
          win.onClosed.addListener(function() {
                chrome.runtime.sendMessage({
                  action: "settingsClosed"
                });
          });
      });
      return true;
    }
});