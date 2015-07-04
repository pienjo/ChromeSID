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