var coverageReporter = require("./coverageReporter.js");
module.exports = function(chromeProcess, filePath) {
  var chunks = "",
  logLine,
  path = require("path"),
  EOL = require("os").EOL,
  regExp = new RegExp(".*" + EOL),
  fs = require("fs"),
  execSync = require("child_process").execSync,
  writableLogParser = require("stream").Writable({decodeStrings: false});

  writableLogParser._write = function(chunk, encoding, callback) {
    chunks += chunk.toString();
    if (!regExp.test(chunks)) {return callback();}

    logLine = chunks; chunks = "";
    if (/--istanbul-coverage--/.test(logLine)) {
      saveCoverage(logLine.substr(21), path.basename(filePath));
      return callback();
    }

    console.log(logLine.slice(0, -1));
    if (/^All tests completed!0/.test(logLine)) {
      setTimeout(function() {chromeProcess.kill();}, 800);
    }
    return callback();
  };

  function saveCoverage(coverageJson, fileName) {
    var stdout;
    fs.writeFileSync(path.join(__dirname, "coverage", "coverage-" + fileName + ".json"), coverageJson);
    coverageReporter("coverage-" + fileName + ".json")
  }

  return writableLogParser;
};
