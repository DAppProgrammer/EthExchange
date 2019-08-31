var Token = artifacts.require("Token");

require("chai")
  .use(require("chai-as-promised"))
  .should();

contract("Token", function(accounts) {
  let token;
  const name = "Dapp Token";
  const symbol = "DAPP";
  const decimals = "18";
  const totalSupply = "1000000000000000000000000";

  beforeEach(async () => {
    token = await Token.deployed();
  });

  describe("deployment", () => {
    it("tracks the name", async () => {
      const result = await token.name();
      //assert.equal(name, "My Token", 'name should be "My Token"');
      result.should.equal(name, "Name should be equal 'My Token'");
    });

    it("tracks the symbol", async () => {
      const result = await token.symbol();
      result.should.equal(symbol, "Symbol should be equal 'Dapp Token'");
    });

    it("tracks the decimals", async () => {
      const result = await token.decimals();
      result.toString().should.equal(decimals, "Symbol should be equal '18'");
    });

    it("tracks the total supply", async () => {
      const result = await token.totalSupply();
      result
        .toString()
        .should.equal(
          totalSupply,
          "Total supply should be equal '1000000000000000000000000'"
        );
    });
  });
});
