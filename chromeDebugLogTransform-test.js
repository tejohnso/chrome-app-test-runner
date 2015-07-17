var assert = require("assert"),
writable,
output,
tx;

function genString(len) {
  var s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array(len).join().split(",").map(function() { return s.charAt(Math.floor(Math.random() * s.length)); }).join('');
}


describe("chrome log output transform", function() {
  beforeEach(function() {
    writable = require("stream").Writable();
    writable._write = function(chunk, encoding, callback) {
      output += chunk;
    };

    output = "";
  });

  it("outputs the required text for any source", function() {
    tx = require("./test.js")();
    tx.pipe(writable);
    tx.end('123456"testoutput", source: 123456\n');
    assert.equal(output, "testoutput");
  });

  it("outputs the required text for a specific source", function() {
    tx = require("./test.js")("my-source-prefix");
    tx.pipe(writable);
    tx.end('123456"testoutput", source: my-source-prefix123456\n');

    assert.equal(output, "testoutput");
  });

  it("outputs nothing for the wrong source", function() {
    tx = require("./test.js")("my-source-prefix");
    tx.pipe(writable);
    tx.end('123456"testoutput", source: my-other-prefix123456\n');

    assert.equal(output, "");
  });

  it("works on huge strings", function() {
    var hugeString = genString(50000) +
    '123456"testoutput", source: anything' + genString(50000) + "\n";

    tx = require("./test.js")();
    tx.pipe(writable);
    tx.end(hugeString);

    assert.equal(output, "testoutput");
  });
});
