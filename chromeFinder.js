var shelljs = require("shelljs");
module.exports = function findChrome() {
  var isWin = /^win/.test(process.platform);

  chromePath = shelljs.which("google-chrome") ||
  shelljs.which("chrome") ||
  shelljs.which("chromium");

  if(isWin && !chromePath) {
    var paths = [
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      process.env.USERPROFILE + "\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe"];

    paths = paths.filter(function(path) {
      return shelljs.test("-f", path);
    });

    chromePath = paths[0];
  }

  return chromePath;
};
