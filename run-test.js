var cliOptions = require("minimist")(process.argv.slice(2)),
testFiles = cliOptions._,
includeOveralCoverageSummary = testFiles.length > 1,
path = require("path"),
coverageReporter = require("./coverageReporter.js"),
spawn = require("child_process").spawn,
serverHandler = require("./serverHandler.js"),
remoteDebugger = require("./remote-debugger.js"),
chromePath = require("./chromeFinder.js")();

if (!chromePath) {console.log("Chrome could not be found"); return;}

runTests(testFiles.shift());

function runTests(filePath) {
  if (!filePath) {
    if (includeOveralCoverageSummary) {
      coverageReporter();
    }

    return;
  }

  require("./testFilePrep.js")(filePath);

  serverHandler.startServer(cliOptions["mock-server"])
  .then(function() {
    var chromeProcess,
    chromeDebugLogTransform = require("./chromeDebugLogTransform.js")("chrome-extension"),
    logOutputHandler;

    console.log("Running test " + path.join(process.cwd(), filePath));

    chromeProcess = spawn(chromePath, 
    ["--remote-debugging-port=9222",
    "--user-data-dir=" + path.join(__dirname, "temp-data-dir"),
    " --load-and-launch-app=" + __dirname], {detached: true})
    .on('error', function( err ){ throw err; });

    remoteDebugger.setDebugHandler(function(data) {
      var message = "";
      try {
        data.params.message.parameters.forEach(function(param) {
          message += param.value;
        });
        console.log(message);
        if (message === "All tests passed!") {
          passedTestHandler();
        }
        if (/Failure count: [\d]+/.test(message)) {
          failedTestHandler();
        }
      } catch(e) {}
    });

    function passedTestHandler() {
      serverHandler.stopServer();
      remoteDebugger.evaluate("window.__coverage__")
      .then(function(resp) {
        saveCoverage(JSON.stringify(resp), path.basename(filePath));
        chromeProcess.kill();
        setTimeout(function() {runTests(testFiles.shift());}, 800);
      })
      .catch(function(e) {
        console.log(e);
      });
    }

    function failedTestHandler() {
      serverHandler.stopServer();
      chromeProcess.kill();
      process.exitCode = 1;
    }

    chromeProcess.stdout.pipe(process.stdout);
    return remoteDebugger.attach();
  })
  .catch(function(e) {
    console.log(e);
    serverHandler.stopServer();
  });

  function saveCoverage(coverageJson, fileName) {
    var filePath = path.join(__dirname, "coverage", "coverage-" + fileName + ".json");
    require("fs").writeFileSync(filePath, coverageJson);

    coverageReporter("coverage-" + fileName + ".json")
  }
}
