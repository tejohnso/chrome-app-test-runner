chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create("test-runner.html", {width: 1024, height: 768});
});
