mocha.run(function(failureCount) {
  if (!failureCount) {console.log("--istanbul-coverage--" + JSON.stringify(__coverage__));}
  console.log("All tests completed!" + failureCount);
});
