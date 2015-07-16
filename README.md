## Chrome App Test Runner
This test runner will run mocha tests in a chrome app so that platform integration tests can be run.

The test files are expected to use nodejs style modules and mocha bdd style tests.

Test coverage reports can be found in coverage/

#### Providing a mock server
If your integration tests require a mock http server, the server can be specified with --mock-server=<server-file>

The server must output a listening string indicating the port number when it is ready to receive requests.  For example: listening on 8888

##### Usage
```
 node run-test.js <test-file> [<test-file> ...] [--mock-server=<server-file>]
```
