Takes a test file and browserifies it.
The test file is expected to use node modules and mocha bdd tests.
An optional mock http server can be specified with --mock-server=<full-path-to-js-file>

usage: node run-test.js <full-path-to-test-file> [<full-path-to-test-file> ...] [--mock-server=<full-path>]
