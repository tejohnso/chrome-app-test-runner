#!/usr/bin/env node
var cliOptions = require("minimist")(process.argv.slice(2)),
testFiles = cliOptions._,
path = require("path"),
thisFilePath = path.dirname(process.argv[1]),
shelljs = require("shelljs"),
spawn = require("child_process").spawn,
regExp = /[^"]*"(.*)", source: chrome-extension/,
EOL = require("os").EOL;

runTest(testFiles.shift());

function cleanLaunchEnvironment() {
  shelljs.rm(path.join(thisFilePath, "test-browserified.js"));
  shelljs.rm("-rf", path.join(thisFilePath, "temp-data-dir"));
}

function browserifyTestFile(file) {
  return shelljs.exec("browserify " + file + " -o " + path.join(thisFilePath, "test-browserified.js")).code;
}

function runTest(filePath) {
  if (!filePath) {return;}
  cleanLaunchEnvironment();
  console.log("browserifying " + path.join(process.cwd(), filePath));
  if (browserifyTestFile(path.join(process.cwd(), filePath)) !== 0) {return;}
  startServer()
  .then(function(serverProcess) {
    var chromeProcess;

    console.log(EOL + "Running test " + path.join(process.cwd(), filePath));

    chromeProcess = spawn("google-chrome", 
    ["--enable-logging=stderr",
    "--log-level=0",
    "--user-data-dir=" + path.join(thisFilePath, "temp-data-dir"),
    " --load-and-launch-app=" + thisFilePath]);

    chromeProcess.on("close", function(code) {
      console.log("Closed child process");
      stopServer(serverProcess);
      runTest(testFiles.shift());
    });

    chromeProcess.stderr.on("data", function(data) {
      var logOutput = regExp.exec(data.toString());
      if (!logOutput) {return;}
      console.log(logOutput[1]);
      if (logOutput[1].indexOf("All tests completed!0") > -1) {
        return setTimeout(function() {chromeProcess.kill();}, 500);
      }
      if (logOutput[1].indexOf("All tests completed!") > -1) {
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
    if (!cliOptions.hasOwnProperty("mock-server")) {resolve();}

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

function stopServer(process) {
  if (!process) {return;}
  console.log("Stopping server");
  process.kill();
}
