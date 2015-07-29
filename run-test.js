var cliOptions = require("minimist")(process.argv.slice(2)),
testFiles = cliOptions._,
includeOveralCoverageSummary = testFiles.length > 1,
path = require("path"),
coverageReporter = require("./coverageReporter.js"),
spawn = require("child_process").spawn,
serverHandler = require("./serverHandler.js"),
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

  require("./testFilePrep.js")(filePath),

  serverHandler.startServer(cliOptions["mock-server"])
  .then(function(serverProcess) {
    var chromeProcess,
    chromeDebugLogTransform = require("./chromeDebugLogTransform.js")("chrome-extension"),
    logOutputHandler;

    console.log("Running test " + path.join(process.cwd(), filePath));

    chromeProcess = spawn(chromePath, 
    ["--enable-logging=stderr",
    "--log-level=0",
    "--user-data-dir=" + path.join(__dirname, "temp-data-dir"),
    " --load-and-launch-app=" + __dirname], {detached: true})
    .on('error', function( err ){ throw err; });

    chromeProcess.on("close", function(code) {
      serverHandler.stopServer(serverProcess);
      runTests(testFiles.shift());
    });

    logOutputHandler = require("./logOutputHandler.js")(chromeProcess, filePath);
    chromeProcess.stderr.pipe(chromeDebugLogTransform).pipe(logOutputHandler);
    chromeProcess.stdout.on("data", function(data) {
      console.log("Chrome stdout: " + data);
    });
  });
}
