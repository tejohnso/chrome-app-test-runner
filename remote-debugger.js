var WebSocket = require("ws"),
ws,
messageHandler,
evalPromiseResolverObject = {resolve: 0};

function createConnectionResponse(resolver, intervalHandler) {
  return function(resp) {
    var chunks = "";

    resp.on("data", function(data) {
      chunks += data;
    });
    resp.on("end", function() {
      var inspectables;

      inspectables = JSON.parse(chunks).filter(function(tabData) {
        return tabData.type === "app";
      })[0];

      if (inspectables && inspectables.webSocketDebuggerUrl) {
        clearInterval(intervalHandler.handle);
        console.log("connecting debugger at " + inspectables.webSocketDebuggerUrl);
        ws = new WebSocket(inspectables.webSocketDebuggerUrl);
        ws.onopen = function() {
          ws.send(JSON.stringify({"id": 1, "method": "Console.enable"}));
        };
        ws.onmessage = function(event) {
          var data = JSON.parse(event.data);

          if (data.id === 9) {
            return evalPromiseResolverObject.resolver(data.result.result.value);
          }
          messageHandler(data);
        };
        resolver();
      }
    });
  }
}

function createErrorResponse(rejecter) {
  return function(resp) {
    console.log(resp);
    clearInterval(intervalHandler.handle);
    rejecter();
  }
}

module.exports = {
  attach: function() {
    return new Promise(function(resolve, reject) {
      var intervalHandler = {handle: 0},
      connectionResponse = createConnectionResponse(resolve, intervalHandler),
      errorResponse = createErrorResponse(reject);

      intervalHandler.handle = setInterval(function() {
        require("http")
        .get("http://localhost:9222/json/list", connectionResponse)
        .on("error", errorResponse);
      }, 500);
    });
  },
  setDebugHandler: function(handler) {
    messageHandler = handler;
  },
  evaluate: function(evalString) {
    return new Promise(function(resolve, reject) {
      ws.send(JSON.stringify({
        "id": 9,
        "method": "Runtime.evaluate",
        "params": {
          "expression": evalString,
          "returnByValue": true
        }
      }));
      evalPromiseResolverObject.resolver = resolve;
    });
  }
};
