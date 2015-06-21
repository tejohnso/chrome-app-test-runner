Takes a test file and browserifies it.
The test file is expected to use node modules and mocha bdd tests.
An optional mock http server can be specified with --mock-server=<server-file>
The server must output a listening string indicating the port number when it is ready to receive requests.  For example: listening on 8888

usage: node run-test.js <test-file> [<test-file> ...] [--mock-server=<server-file>]
