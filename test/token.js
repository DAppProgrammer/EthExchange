var Token = artifacts.require("Token");

contract("Token", function(accounts) {
  var token;
  beforeEach(async () => {
    token = await Token.deployed();
  });

  it("it initializes correctly", async () => {
    const name = await token.name();
    assert.equal(name, "My Token", 'name should be "My Token"');
  });
});
