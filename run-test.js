var testFile = process.argv[2],
thisFilePath = require("path").dirname(process.argv[1]),
shelljs = require("shelljs");

if (!testFile) {console.log("No test file specified"); process.exit(1);}
console.log("running test " + testFile + " from " + thisFilePath);

shelljs.rm(thisFilePath + "/test-browserified.js");
shelljs.exec("browserify " + testFile + " -o " + thisFilePath + "/test-browserified.js");

shelljs.exec("google-chrome --load-and-launch-app=" + thisFilePath);
