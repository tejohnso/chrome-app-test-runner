Takes a test file and browserifies it.
The test file is expected to use node modules and mocha bdd tests.
An optional mock http server can be specified with --mock-server=<full-path-to-js-file>
The server must output a listening string indicating the port number when it is ready to receive requests.  For example: listening on 8888

usage: node run-test.js <full-path-to-test-file> [<full-path-to-test-file> ...] [--mock-server=<full-path>]
