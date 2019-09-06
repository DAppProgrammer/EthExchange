var Exchange = artifacts.require("Exchange");

contract("Exchange", function(accounts) {
  it("should assert true", function(done) {
    var exchange = Exchange.deployed();
    assert.isTrue(true);
    done();
  });
});
