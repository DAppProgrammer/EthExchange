import { tokens, ether, EVM_REVERT, ETHER_ADDRESS } from "./helpers";

const Token = artifacts.require("./Token");
const Exchange = artifacts.require("./Exchange");

require("chai")
  .use(require("chai-as-promised"))
  .should();

contract("Exchange", ([deployer, feeAccount, user1]) => {
  let token;
  let exchange;
  const feePercent = 10;
  beforeEach(async () => {
    //Deploy token
    token = await Token.new();

    //Transfer some tokens to user1
    await token.transfer(user1, tokens(100), { from: deployer });

    //Deploy exchange
    exchange = await Exchange.new(feeAccount, feePercent);
  });

  describe("deployment", () => {
    it("tracks the the fee account", async () => {
      const result = await exchange.feeAccount();
      result.should.equal(feeAccount);
    });

    it("tracks the the fee percent", async () => {
      const result = await exchange.feePercent();
      result.toString().should.equal(feePercent.toString());
    });
  });

  describe("fallback", () => {
    it("reverts when Ether is sent directly to exchange address", async () => {
      await exchange
        .sendTransaction({ from: user1, value: 1 })
        .should.be.rejectedWith(EVM_REVERT);
    });
  });

  describe("depositing ether", () => {
    let result;
    let amount;
    beforeEach(async () => {
      amount = ether(1);
      result = await exchange.depositEther({ from: user1, value: amount });
    });
    it("tracks ether deposit", async () => {
      result = await exchange.tokens(ETHER_ADDRESS, user1);
      result.toString().should.equal(amount.toString());
    });

    it("emits a Deposit event", async () => {
      const log = result.logs[0];
      log.event.should.eq("Deposit");
      const event = log.args;
      event.token
        .toString()
        .should.equal(ETHER_ADDRESS, "token address is correct");
      event.user.toString().should.equal(user1, "user address is correct");
      event.amount
        .toString()
        .should.equal(amount.toString(), "amount is correct");
      event.balance
        .toString()
        .should.equal(amount.toString(), "balance is correct");
    });
  });

  describe("deposting tokens", () => {
    let result;
    let amount;

    describe("success", () => {
      beforeEach(async () => {
        amount = tokens(10);
        await token.approve(exchange.address, amount, { from: user1 });
        result = await exchange.depositToken(token.address, amount, {
          from: user1
        });
      });

      it("tracks the token deposit", async () => {
        //check token balance
        let balance;
        balance = await token.balanceOf(exchange.address);
        balance.toString().should.equal(amount.toString());
        balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal(amount.toString());
      });

      it("emits a Deposit event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Deposit");
        const event = log.args;
        event.token
          .toString()
          .should.equal(token.address, "token address is correct");
        event.user.toString().should.equal(user1, "user address is correct");
        event.amount
          .toString()
          .should.equal(amount.toString(), "amount is correct");
        event.balance
          .toString()
          .should.equal(amount.toString(), "balance is correct");
      });
    });

    describe("failure", () => {
      it("rejects ether deposits", async () => {
        await exchange
          .depositToken(ETHER_ADDRESS, amount, {
            from: user1
          })
          .should.be.rejectedWith(EVM_REVERT);
      });
      it("fails when no token is approved", async () => {
        await exchange
          .depositToken(token.address, amount, {
            from: user1
          })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });
});
