import { tokens, EVM_REVERT } from "./helpers";

var Token = artifacts.require("Token");

require("chai")
  .use(require("chai-as-promised"))
  .should();

contract("Token", function([deployer, receiver, exchange]) {
  let token;
  const name = "Dapp Token";
  const symbol = "DAPP";
  const decimals = "18";
  const totalSupply = tokens(1000000).toString();

  beforeEach(async () => {
    token = await Token.deployed();
  });

  describe("deployment", async () => {
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

    it("assigns the total supply to the deployer", async () => {
      const result = await token.balanceOf(deployer);
      result
        .toString()
        .should.equal(
          totalSupply,
          "assigns total supply to deployer correctly"
        );
    });
  });

  describe("sending tokens", async () => {
    describe("success", async () => {
      let result;
      let amount;
      beforeEach(async () => {
        amount = tokens(100);
        result = await token.transfer(receiver, tokens(100).toString(), {
          from: deployer
        });
      });

      it("transfers token balances", async () => {
        let balanceOf;
        balanceOf = await token.balanceOf(deployer);
        balanceOf.toString().should.equal(tokens(999900).toString());

        balanceOf = await token.balanceOf(receiver);
        balanceOf.toString().should.equal(amount.toString());
      });

      it("emits a Transfer event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Transfer");
        const event = log.args;
        event.from.toString().should.equal(deployer, "from addres is correct");
        event.to.toString().should.equal(receiver, "to addres is correct");
        event.value
          .toString()
          .should.equal(tokens(100).toString(), "value is correct");
      });
    });
    describe("failure", async () => {
      it("rejects insufficient balances", async () => {
        let invalidAmount;
        invalidAmount = tokens(1000000000);
        await token
          .transfer(receiver, invalidAmount, { from: deployer })
          .should.be.rejectedWith(EVM_REVERT);

        invalidAmount = tokens(1000);
        await token
          .transfer(deployer, invalidAmount, { from: receiver })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("rejects invalid recipient", async () => {
        await token.transfer(0x0, 10, { from: deployer }).should.be.rejected;
      });
    });
  });

  describe("approving token", async () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = tokens(100);
      result = await token.approve(exchange, amount, { from: deployer });
    });

    describe("success", async () => {
      it("allocates an allownace for delegated token spending on exchange", async () => {
        const allownace = await token.allowance(deployer, exchange);
        allownace.toString().should.equal(amount.toString());
      });

      it("emits an Approval event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Approval");
        const event = log.args;
        event.owner.toString().should.equal(deployer, "from addres is correct");
        event.spender.toString().should.equal(exchange, "to addres is correct");
        event.value
          .toString()
          .should.equal(tokens(100).toString(), "value is correct");
      });
    });

    describe("failure", async () => {
      it("rejects invalid spender", async () => {
        result = await token.approve(0x0, amount, { from: deployer }).should.be
          .rejected;
      });
    });
  });

  describe("sending tokens", async () => {
    describe("success", async () => {
      let result;
      let amount;

      beforeEach(async () => {
        amount = tokens(100);
        await token.approve(exchange, amount, { from: deployer });
      });

      beforeEach(async () => {
        result = await token.transferFrom(deployer, receiver, amount, {
          from: exchange
        });
      });

      it("transfers token balances", async () => {
        let balanceOf;
        balanceOf = await token.balanceOf(deployer);
        console.log(`balance of deployer: ${balanceOf}`);
        // balanceOf.toString().should.equal(tokens(999700).toString());

        balanceOf = await token.balanceOf(receiver);
        console.log(`balance of receiver: ${balanceOf}`);
        // balanceOf.toString().should.equal(amount.toString());
      });

      it("emits a Transfer event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Transfer");
        const event = log.args;
        event.from.toString().should.equal(deployer, "from addres is correct");
        event.to.toString().should.equal(receiver, "to addres is correct");
        event.value
          .toString()
          .should.equal(tokens(100).toString(), "value is correct");
      });
    });

    describe("failure", async () => {
      it("rejects insufficient balances", async () => {
        let invalidAmount;
        invalidAmount = tokens(100);
        await token
          .transferFrom(deployer, receiver, invalidAmount, { from: deployer })
          .should.be.rejectedWith(EVM_REVERT);
        invalidAmount = tokens(1000);
        await token
          .transfer(deployer, invalidAmount, { from: receiver })
          .should.be.rejectedWith(EVM_REVERT);
      });
      it("rejects invalid recipient", async () => {
        await token.transfer(0x0, 10, { from: deployer }).should.be.rejected;
      });
    });
  });
});
