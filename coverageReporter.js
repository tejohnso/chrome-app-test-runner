var execSync = require("child_process").execSync;
module.exports = function(specificFile) {
  if (specificFile) {
    specificFile = "--include " + specificFile;
  } else {
    specificFile = "";
  }

  var stdout = execSync("istanbul --color report --root coverage " + specificFile + " lcov text-summary", {timeout: 3000, cwd: __dirname});
  console.log(stdout.toString());
};
