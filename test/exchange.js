import { tokens, ether, EVM_REVERT, ETHER_ADDRESS } from "./helpers";
import { async } from "q";
import { AssertionError } from "assert";

const Token = artifacts.require("./Token");
const Exchange = artifacts.require("./Exchange");

require("chai")
  .use(require("chai-as-promised"))
  .should();

contract("Exchange", ([deployer, feeAccount, user1, user2]) => {
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

  describe("withdraw ETHER", () => {
    let result;
    let amount;
    beforeEach(async () => {
      amount = ether(1);
      //Deposit ether first
      await exchange.depositEther({ from: user1, value: amount });
    });

    describe("success", async () => {
      beforeEach(async () => {
        result = await exchange.withdrawEther(amount, { from: user1 });
      });
      it("withdraws Ether funds", async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1);
        balance.toString().should.equal("0");
      });

      it("emits a Withdraw event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Withdraw");
        const event = log.args;
        event.token
          .toString()
          .should.equal(ETHER_ADDRESS, "token address is correct");
        event.user.toString().should.equal(user1, "user address is correct");
        event.amount
          .toString()
          .should.equal(amount.toString(), "amount is correct");
        event.balance.toString().should.equal("0", "balance is correct");
      });
    });

    describe("failure", async () => {
      it("rejects withdraws for insufficient balance", async () => {
        await exchange
          .withdrawEther(ether(100), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("withdraw token", () => {
    let result;
    let amount;

    describe("success", async () => {
      beforeEach(async () => {
        amount = tokens(10);
        //Deposit tokens first
        await token.approve(exchange.address, amount, { from: user1 });
        await exchange.depositToken(token.address, amount, {
          from: user1
        });

        result = await exchange.withdrawToken(token.address, amount, {
          from: user1
        });
      });

      it("withdraws token funds", async () => {
        const balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal("0");
      });

      it("emits a Withdraw event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Withdraw");
        const event = log.args;
        event.token
          .toString()
          .should.equal(token.address, "token address is correct");
        event.user.toString().should.equal(user1, "user address is correct");
        event.amount
          .toString()
          .should.equal(amount.toString(), "amount is correct");
        event.balance.toString().should.equal("0", "balance is correct");
      });
    });

    describe("failure", async () => {
      it("rejects Ether withdraw", async () => {
        await exchange
          .withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
      it("rejects withdraws for insufficient balance", async () => {
        await exchange
          .withdrawToken(token.address, tokens(10), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("checking Ether balances", async () => {
    //Deposit tokens first
    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: ether(1) });
    });
    it("returns user Ether balance", async () => {
      const result = await exchange.balanceOf(ETHER_ADDRESS, user1);
      result.toString().should.equal(ether(1).toString());
    });
  });

  describe("checking token balances", async () => {
    let result;
    let amount = tokens(10);
    //Deposit tokens first
    beforeEach(async () => {
      await token.approve(exchange.address, amount, { from: user1 });
      await exchange.depositToken(token.address, amount, {
        from: user1
      });
    });
    it("returns user token balance", async () => {
      result = await exchange.balanceOf(token.address, user1);
      result.toString().should.eq(amount.toString());
    });
  });

  describe("making orders", () => {
    let result;
    const amountGet = tokens(100);
    const amountGive = ether(1);

    beforeEach(async () => {
      result = await exchange.makeOrder(
        token.address,
        tokens(100),
        ETHER_ADDRESS,
        ether(1),
        { from: user1 }
      );
    });

    it("tracks the newly created order", async () => {
      const orderCount = await exchange.orderCount();
      orderCount.toString().should.eq("1");

      let order = await exchange.orders("1");
      order.id.toString().should.equal("1", "id is correct");
      order.user.toString().should.eq(user1, "user is correct");
      order.tokenGet.should.eq(token.address, "tokenGet is correct");
      order.amountGet
        .toString()
        .should.equal(amountGet.toString(), `amountGet should be ${amountGet}`);
      order.tokenGive.should.eq(ETHER_ADDRESS, "tokenGive is correct");
      order.amountGive
        .toString()
        .should.equal(
          amountGive.toString(),
          "amountGive should be ${amountGive}"
        );
      order.timestamp
        .toString()
        .length.should.be.at.least(1, "timestap is present");
    });

    it("emits an Order event", async () => {
      const log = result.logs[0];
      log.event.should.eq("Order");
      const event = log.args;
      event.id.toString().should.equal("1", "order id is correct");
      event.user.toString().should.equal(user1, "should be user1 address");
      event.tokenGet
        .toString()
        .should.equal(
          token.address.toString(),
          "tokenGet should be token address"
        );
      event.amountGet
        .toString()
        .should.equal(
          amountGet.toString(),
          `amount get should be ${amountGet}`
        );
      event.tokenGive
        .toString()
        .should.equal(
          ETHER_ADDRESS.toString(),
          "tokenGive should be ETHER_ADDRESS"
        );
      event.amountGive
        .toString()
        .should.equal(
          amountGive.toString(),
          `amount give  should be ${amountGive}`
        );
      event.timestamp
        .toString()
        .length.should.be.at.least(1, "timestamp is correct");
    });
  });

  describe("order actions", () => {
    const amountGet = tokens(10);
    const amountGive = ether(1);
    beforeEach(async () => {
      //user1 deposits ether
      await exchange.depositEther({ from: user1, value: ether(1) });
      //user1 makes an order to buy tokens with ether
      await exchange.makeOrder(
        token.address,
        amountGet,
        ETHER_ADDRESS,
        amountGive,
        { from: user1 }
      );
    });

    describe("cancelling order", async () => {
      let result;
      describe("success", async () => {
        beforeEach(async () => {
          result = await exchange.cancelOrder("1", { from: user1 });
        });

        it("updates cancelled orders", async () => {
          const orderCancelled = await exchange.orderCancelled(1);
          orderCancelled.should.eq(true);
        });

        it("emits a Cancel event", async () => {
          const log = result.logs[0];
          log.event.should.eq("Cancel");
          const event = log.args;
          event.id.toString().should.eq("1", "id is correct");
          event.user.toString().should.equal(user1, "user address is correct");
          event.tokenGet
            .toString()
            .should.equal(token.address, "tokenGet address is correct");
          event.amountGet
            .toString()
            .should.equal(amountGet.toString(), "amountGet is correct");

          event.tokenGive
            .toString()
            .should.equal(ETHER_ADDRESS, "tokenGive address is correct");
          event.amountGive
            .toString()
            .should.equal(amountGive.toString(), "amountGive is correct");
          event.timestamp.length.should.be.at.least(1, "timestamp presents");
        });
      });

      describe("failure", () => {
        it("requires order must exists", async () => {
          await exchange
            .cancelOrder("100", { from: user1 })
            .should.be.rejectedWith(EVM_REVERT);
        });

        it("requires correct user to cancel order", async () => {
          await exchange
            .cancelOrder("1", { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });
      });
    });
  });
});
