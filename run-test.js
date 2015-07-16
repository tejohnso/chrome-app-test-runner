#!/usr/bin/env node
var cliOptions = require("minimist")(process.argv.slice(2)),
testFiles = cliOptions._,
includeOveralCoverageSummary = testFiles.length > 1,
path = require("path"),
fs = require("fs"),
shelljs = require("shelljs"),
spawn = require("child_process").spawn,
execSync = require("child_process").execSync,
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
  var tempChromeDataPath = path.join(__dirname, "temp-data-dir");
  shelljs.rm(path.join(__dirname, "test-browserified.js"));
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

function runTest(filePath) {
  if (!filePath) {
    if (includeOveralCoverageSummary) {
      stdout = execSync("istanbul --color report --root coverage lcov text-summary", {timeout: 3000, cwd: __dirname});
      console.log(stdout.toString());
    }

    return;
  }

  cleanLaunchEnvironment();

  console.log("browserifying " + path.join(process.cwd(), filePath));
  browserifyTestFile(path.join(process.cwd(), filePath));
  makeFileComplyWithCSP();
  startServer()
  .then(function(serverProcess) {
    var chromeProcess, passing = true, chunk = "", regExp = /"(.*)", source: chrome-extension.*/;

    console.log(EOL + "Running test " + path.join(process.cwd(), filePath));

    chromeProcess = spawn(chromePath, 
    ["--enable-logging=stderr",
    "--log-level=0",
    "--user-data-dir=" + path.join(__dirname, "temp-data-dir"),
    " --load-and-launch-app=" + __dirname]).on('error', function( err ){ throw err; });

    chromeProcess.on("close", function(code) {
      console.log("Closed child process");
      stopServer(serverProcess);
      runTest(testFiles.shift());
    });

    chromeProcess.stderr.on("data", function(data) {

      chunk += data.toString();

      checkForBrowserOutput();

      function checkForBrowserOutput() {
        var parseResult = regExp.exec(chunk),
        logText;

        if (!parseResult) {return;}

        chunk = chunk.substr(parseResult.index + parseResult[0].length);
        logText = parseResult[1];

        if (/--istanbul-coverage--/.test(logText)) {
          return saveCoverage(logText.substr(21), path.basename(filePath));
        }

        if (logText.indexOf("All tests completed!0") > -1) {
          if (!passing) {return;}
          return setTimeout(function() {chromeProcess.kill();}, 800);
        }
        if (logText.indexOf("Uncaught") === 0) {
          passing = false;
          testFiles = [];
        }

        checkForBrowserOutput();
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
  var stdout;
  fs.writeFileSync(path.join(__dirname, "coverage", "coverage-" + fileName + ".json"), coverageJson);
  stdout = execSync("istanbul --color report --root coverage --include coverage-" + fileName + ".json lcov text-summary", {timeout: 3000, cwd: __dirname});
  console.log(stdout.toString());
}

function stopServer(process) {
  if (!process) {return;}
  console.log("Stopping server");
  process.kill();
}
