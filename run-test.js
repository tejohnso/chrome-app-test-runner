var testFile = process.argv[2],
thisFilePath = require("path").dirname(process.argv[1]),
shelljs = require("shelljs");

if (!testFile) {console.log("No test file specified"); process.exit(1);}
console.log("running test " + testFile + " from " + thisFilePath);

shelljs.rm("./test-browserify.js");
shelljs.exec("browserify " + testFile + " -o " + thisFilePath + "test-browserify.js");

if (process.platform === "win32") {
  shelljs.exec("google-chrome --load-and-launch-app=" + thisFilePath);
} else {
  shelljs.exec(thisFilePath + "/node_modules/run-headless-chromium/run-headless-chromium.js --load-and-launch-app=" + thisFilePath);
}
