var path = require("path"),
spawn = require("child_process").spawn;

module.exports = {
  startServer: function(serverPath) {
    return new Promise(function(resolve, reject) {
      var serverProcess;
      if (!serverPath) {return resolve();}

      console.log("Starting server " + path.join(process.cwd(), serverPath));
      serverProcess = spawn("node", [path.join(process.cwd(), serverPath)]);
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
  },

  stopServer: function(process) {
    if (!process) {return;}
    console.log("Stopping server");
    process.kill();
  }
};

