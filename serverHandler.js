var path = require("path"),
spawn = require("child_process").spawn,
processContainer = {process: 0};

module.exports = {
  startServer: function(serverPath) {
    return new Promise(function(resolve, reject) {
      if (!serverPath) {return resolve();}

      console.log("Starting server " + path.join(process.cwd(), serverPath));
      processContainer.process = spawn("node", [path.join(process.cwd(), serverPath)]);
      processContainer.process.stdout.on("data", function(data) {
        console.log("Mock server: " + data);
        if (/listening on [\d]*/i.test(data.toString())) {
          resolve(processContainer.process);
        }
      });
      processContainer.process.stderr.on("data", function(data) {
        console.log("Mock server err: " + data);
      });
    });
  },

  stopServer: function() {
    console.log("Stopping server");
    processContainer.process.kill();
  }
};
