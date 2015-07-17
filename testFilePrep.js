module.exports = function(filePath) {
  var fs = require("fs"),
  execSync = require("child_process").execSync,
  path = require("path"),
  shelljs = require("shelljs");

  cleanLaunchEnvironment();
  browserifyTestFile(path.join(process.cwd(), filePath));
  makeFileComplyWithCSP();

  function cleanLaunchEnvironment() {
    var tempChromeDataPath = path.join(__dirname, "temp-data-dir");
    shelljs.rm("-f", path.join(__dirname, "test-browserified.js"));
    shelljs.rm("-rf", tempChromeDataPath);
    shelljs.mkdir(tempChromeDataPath);
    shelljs.cp(path.join(__dirname, "First Run"), tempChromeDataPath);
  }

  function browserifyTestFile(file) {
    return execSync("browserify -t browserify-istanbul " + file + " -o " + path.join(__dirname, "test-browserified.js"), {cwd: __dirname});
  }

  function makeFileComplyWithCSP() {
    var fileText = fs.readFileSync(path.join(__dirname, "test-browserified.js"), "utf-8");
    fs.writeFileSync(path.join(__dirname, "test-browserified.js"), fileText.replace(/= \(Function\('return this'\)\)\(\);/g, "= window;"));
  }

};
