var cliOptions = require("minimist")(process.argv.slice(2)),
testFiles = cliOptions._,
path = require("path"),
thisFilePath = path.dirname(process.argv[1]),
shelljs = require("shelljs"),
spawn = require("child_process").spawn,
serverProcess,
regExp = /[^"]*"(.*)", source: chrome-extension/,
EOL = require("os").EOL;

runTest(testFiles.shift());

function cleanLaunchEnvironment() {
  shelljs.rm(path.join(thisFilePath, "test-browserified.js"));
  shelljs.rm("-rf", path.join(thisFilePath, "temp-data-dir"));
}

function browserifyTestFile(file) {
  shelljs.exec("browserify " + file + " -o " + path.join(thisFilePath, "test-browserified.js"));
}

function runTest(fullFilePath) {
  var childProcess;

  if (!fullFilePath) {return;}
  cleanLaunchEnvironment();
  browserifyTestFile(fullFilePath);
  startServer();
  console.log(EOL + "Running test " + fullFilePath);
  childProcess = spawn("google-chrome", ["--enable-logging=stderr", "--log-level=0", "--user-data-dir=" + path.join(thisFilePath, "temp-data-dir"), " --load-and-launch-app=" + thisFilePath]);

  childProcess.on("close", function(code) {
    console.log("Closed child process");
    stopServer();
    runTest(testFiles.shift());
  });

  childProcess.stderr.on("data", function(data) {
    var logOutput = regExp.exec(data.toString());
    if (!logOutput) {return;}
    console.log(logOutput[1]);
    if (logOutput[1].indexOf("All tests completed!0")) {
      setTimeout(function() {childProcess.kill();}, 500);
    }
  });

  childProcess.stdout.on("data", function(data) {
    console.log("Chrome stdout: " + data);
  });
}

function startServer() {
  if (!cliOptions.hasOwnProperty("mock-server")) {return;}
  console.log(EOL + "Starting server " + cliOptions["mock-server"]);
  serverProcess = spawn("node", [cliOptions["mock-server"]]);
  console.log("Server pid: " + serverProcess.pid);
  serverProcess.stdout.on("data", function(data) {
    console.log("Mock server: " + data);
  });
  serverProcess.stderr.on("data", function(data) {
    console.log("Mock server err: " + data);
  });
}

function stopServer() {
  if (!serverProcess) {return;}
  console.log("Stopping server");
  serverProcess.kill();
}
