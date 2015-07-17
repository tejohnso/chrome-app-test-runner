var EOL = require("os").EOL;
module.exports = function(sourcePrefix) {
  var tx = require("stream").Transform({decodeStrings: false}),
  regExp = new RegExp('"(.*)", source: ' + (sourcePrefix || '') + '[^"]+' + EOL);
  tx.chunk = "";

  tx._transform = function(chunk, encoding, callback) {
    tx.chunk += chunk.toString();
    checkForLogEntries();
    callback();
  };

  tx._flush = function(callback) {
    callback();
  };

  function checkForLogEntries() {
    var parseResult = regExp.exec(tx.chunk),
    logEntry;

    if (!parseResult) {return false;}
    logEntry = parseResult[1];
    tx.chunk = tx.chunk.substr(parseResult.index + parseResult[0].length);
    tx.push(logEntry + EOL);
    checkForLogEntries();
  }

  return tx;
};
