var mainWindow = null; // Only allow a single instance to be opened

chrome.app.runtime.onLaunched.addListener(function(launchData) {
  var filesToOpen = [];
  if (launchData && launchData.items) {
    launchData.items.forEach(function (e) {
      filesToOpen.push(e.entry);
    });
  }
  
  if (mainWindow === null) {
      // Main window not opened yet.
      chrome.app.window.create("index.html", {
      id: 'ChromeSIDMain',
      bounds : {
        width : 400,
        height: 400,
        left: 100,
        top: 100,
      }
    },
      function(win) {
        mainWindow = win;
        mainWindow.ChromeSidFiles = filesToOpen;
        
        // Register close handler so a next invocation will open a new dailog.
        mainWindow.onClosed.addListener(function() {
          mainWindow = null;
        });
      });
  }
  else {
    // Window is already open.
    mainWindow.ChromeSidFiles = filesToOpen; // Copy file entries (urgh)
    // Send message to window to re-check the arguments
    chrome.runtime.sendMessage({
      action: 'checkForFileArguments'
    });
    
    // Draw attention to the window
    mainWindow.drawAttention();
  }
  
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