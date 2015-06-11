console.log("\nRunning tests");
mocha.run(function(failureCount) {
  console.log("All tests completed!" + failureCount);
});
