#!/usr/bin/env node
var cliOptions = require("minimist")(process.argv.slice(2)),
testFiles = cliOptions._,
path = require("path"),
fs = require("fs"),
thisFilePath = path.dirname(process.argv[1]),
shelljs = require("shelljs"),
spawn = require("child_process").spawn,
EOL = require("os").EOL,
chromePath;

(function findChrome() {
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
}());

if (!chromePath) {
  console.log("Chrome could not be found");
  return;
}

runTest(testFiles.shift());

function cleanLaunchEnvironment() {
  var tempChromeDataPath = path.join(thisFilePath, "temp-data-dir");
  shelljs.rm(path.join(thisFilePath, "test-browserified.js"));
  shelljs.rm("-rf", tempChromeDataPath);
  shelljs.mkdir(tempChromeDataPath);
  shelljs.cp(path.join(thisFilePath, "First Run"), tempChromeDataPath);
}

function browserifyTestFile(file) {
  return shelljs.exec("browserify -t browserify-istanbul " + file + " -o " + path.join(thisFilePath, "test-browserified.js")).code;
}

function makeFileComplyWithCSP() {
  var fileText = fs.readFileSync(path.join(thisFilePath, "test-browserified.js"), "utf-8");
  fs.writeFileSync(path.join(thisFilePath, "test-browserified.js"), fileText.replace(/= \(Function\('return this'\)\)\(\);/, "= window;"));
}

function runTest(filePath) {
  if (!filePath) {return;}
  cleanLaunchEnvironment();

  console.log("browserifying " + path.join(process.cwd(), filePath));
  if (browserifyTestFile(path.join(process.cwd(), filePath)) !== 0) {return;}
  makeFileComplyWithCSP();
  startServer()
  .then(function(serverProcess) {
    var chromeProcess, passing = true;

    console.log(EOL + "Running test " + path.join(process.cwd(), filePath));

    chromeProcess = spawn(chromePath, 
    ["--enable-logging=stderr",
    "--log-level=0",
    "--user-data-dir=" + path.join(thisFilePath, "temp-data-dir"),
    " --load-and-launch-app=" + thisFilePath]).on('error', function( err ){ throw err; });

    chromeProcess.on("close", function(code) {
      console.log("Closed child process");
      stopServer(serverProcess);
      runTest(testFiles.shift());
    });

    chromeProcess.stderr.on("data", function(data) {
      var regExp = /[^"]*"(.*)", source: chrome-extension/,
      logOutput = regExp.exec(data.toString());
      if (!logOutput) {return;}

      if (/^--istanbul-coverage--/.test(logOutput[1])) {
        return saveCoverage(logOutput[1].substr(21), path.basename(filePath));
      }

      console.log(logOutput[1]);

      if (logOutput[1].indexOf("All tests completed!0") > -1) {
        if (!passing) {return;}
        return setTimeout(function() {chromeProcess.kill();}, 800);
      }
      if (logOutput[1].indexOf("Uncaught") === 0) {
        passing = false;
        testFiles = [];
      }
    });

    chromeProcess.stdout.on("data", function(data) {
      console.log("Chrome stdout: " + data);
    });
  });
}

function startServer() {
  return new Promise(function(resolve, reject) {
    var serverProcess;
    if (!cliOptions.hasOwnProperty("mock-server")) {return resolve();}

    console.log(EOL + "Starting server " + path.join(process.cwd(), cliOptions["mock-server"]));
    serverProcess = spawn("node", [path.join(process.cwd(), cliOptions["mock-server"])]);
    serverProcess.stdout.on("data", function(data) {
      console.log("Mock server: " + data);
      if (/listening on [\d]*/i.test(data.toString())) {
        resolve(serverProcess);
      }
    });
    serverProcess.stderr.on("data", function(data) {
      console.log("Mock server err: " + data);
    });
  });
}

function saveCoverage(coverageJson, fileName) {
  fs.writeFileSync(path.join(thisFilePath, "coverage", "coverage-" + fileName + ".json"), coverageJson);
  return shelljs.exec("istanbul --color report --root coverage lcov text-summary");
}

function stopServer(process) {
  if (!process) {return;}
  console.log("Stopping server");
  process.kill();
}
