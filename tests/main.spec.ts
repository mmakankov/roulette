import { Address, beginCell, Cell, toNano } from "@ton/core";
import { hex } from "../build/main.compiled.json";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { MainContract } from "../wrappers/MainContract";
import { TimerContract } from "../wrappers/TimerContract";
import "@ton/test-utils";
import { compile } from "@ton/blueprint";

describe("main.fc contract tests", () => {

    describe("main.fc contract tests", () => {
        let blockchain: Blockchain;
        let myContract: SandboxContract<MainContract>;
        let timerContract: SandboxContract<TimerContract>;
        let initWallet: SandboxContract<TreasuryContract>;
        let ownerWallet: SandboxContract<TreasuryContract>;
        let timerBounceAddress: SandboxContract<TreasuryContract>;
        let codeCell: Cell;
        let timerCodeCell: Cell;

        beforeAll(async () => {
          codeCell = await compile("MainContract");
          timerCodeCell = await compile("TimerContract");
        });

        beforeEach(async () => {
          blockchain = await Blockchain.create();
          initWallet = await blockchain.treasury("initWallet");
          ownerWallet = await blockchain.treasury("ownerWallet");
          timerBounceAddress = await blockchain.treasury("timerBounceAddress");

          timerContract = blockchain.openContract(
            await TimerContract.createFromConfig(
              {
                schedule: beginCell().endCell(),
                timer_owner_address: ownerWallet.address,
                timer_caller_address: ownerWallet.address,
                furthest_schedule: 0,
                timer_bounce_address: timerBounceAddress.address
              },
              timerCodeCell
            )
          );

          myContract = blockchain.openContract(
            await MainContract.createFromConfig(
              {
                is_timer_started: false,
                number: 0,
                address: initWallet.address,
                owner_address: ownerWallet.address,
                timer_address: timerContract.address,
              },
              codeCell
            )
          );

          timerContract.sendNewCallerAddress(
            ownerWallet.getSender(),
            toNano("0.05"),
            myContract.address,
          )
        });
      
        it("should set the proper owner address", async () => {
          const sentMessageResult = await myContract.sendNewOwnerAddress(
            ownerWallet.getSender(),
            toNano("0.05"),
            Address.parse("EQC88411xVVjMw4ZcLWp5MuYP-Gr5y35antkE44BxUa1Tfwk")
          );
      
          expect(sentMessageResult.transactions).toHaveTransaction({
            from: ownerWallet.address,
            to: myContract.address,
            success: true,
          });
      
          const data = await myContract.getData();
          expect(data.owner_address.toString()).toBe("EQC88411xVVjMw4ZcLWp5MuYP-Gr5y35antkE44BxUa1Tfwk");
        });
        it("fail to set the proper owner address, becourse of wrong owner", async () => {
          const senderWallet = await blockchain.treasury("sender");
      
          const sentMessageResult = await myContract.sendNewOwnerAddress(
            senderWallet.getSender(),
            toNano("0.05"),
            Address.parse("EQC88411xVVjMw4ZcLWp5MuYP-Gr5y35antkE44BxUa1Tfwk")
          );
      
          expect(sentMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: myContract.address,
            success: false,
            exitCode: 103,
          });
      
          const data = await myContract.getData();
          expect(data.owner_address.toString()).toBe(ownerWallet.address.toString());
        });
        it("should set the proper timer address", async () => {
          const sentMessageResult = await myContract.sendNewTimerAddress(
            ownerWallet.getSender(),
            toNano("0.05"),
            Address.parse("EQC88411xVVjMw4ZcLWp5MuYP-Gr5y35antkE44BxUa1Tfwk")
          );
      
          expect(sentMessageResult.transactions).toHaveTransaction({
            from: ownerWallet.address,
            to: myContract.address,
            success: true,
          });
      
          const data = await myContract.getData();
          expect(data.timer_address.toString()).toBe("EQC88411xVVjMw4ZcLWp5MuYP-Gr5y35antkE44BxUa1Tfwk");
        });
        it("fail to set the timer address, becourse of wrong owner", async () => {
          const senderWallet = await blockchain.treasury("sender");
      
          const sentMessageResult = await myContract.sendNewTimerAddress(
            senderWallet.getSender(),
            toNano("0.05"),
            Address.parse("EQC88411xVVjMw4ZcLWp5MuYP-Gr5y35antkE44BxUa1Tfwk")
          );
      
          expect(sentMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: myContract.address,
            success: false,
            exitCode: 103,
          });
      
          const data = await myContract.getData();
          expect(data.timer_address.toString()).toBe(timerContract.address.toString());
        });
// ========================== timer tests
        it("successfully set timer owner", async () => {
          const messageResult = await timerContract.sendNewOwnerAddress(
              ownerWallet.getSender(),
              toNano("0.05"),
              Address.parse("EQC88411xVVjMw4ZcLWp5MuYP-Gr5y35antkE44BxUa1Tfwk")
          );
          expect(messageResult.transactions).toHaveTransaction({
            from: ownerWallet.address,
            to: timerContract.address,
            success: true,
          });
      
          const data = await timerContract.getData();
          expect(data.owner.toString()).toBe("EQC88411xVVjMw4ZcLWp5MuYP-Gr5y35antkE44BxUa1Tfwk");
        });
        it("successfully set timer caller", async () => {
          const messageResult = await timerContract.sendNewCallerAddress(
              ownerWallet.getSender(),
              toNano("0.05"),
              Address.parse("EQC88411xVVjMw4ZcLWp5MuYP-Gr5y35antkE44BxUa1Tfwk")
          );
          expect(messageResult.transactions).toHaveTransaction({
            from: ownerWallet.address,
            to: timerContract.address,
            success: true,
          });
      
          const data = await timerContract.getData();
          expect(data.caller.toString()).toBe("EQC88411xVVjMw4ZcLWp5MuYP-Gr5y35antkE44BxUa1Tfwk");
        });
        it("successfully schedules a timer", async () => {
          const messageResult = await timerContract.sendScheduleTimer(
              ownerWallet.getSender(), //TODO: myContract.getSender()
              toNano("0.05"),
          );
          expect(messageResult.transactions).toHaveTransaction({
            from: myContract.address,
            to: timerContract.address,
            success: true,
          });
      
        });
// ========================== 
        it("successfully deposits funds", async () => {
            const senderWallet = await blockchain.treasury("sender");
            const senderWallet2 = await blockchain.treasury("sender2");
        
            const depositMessageResult = await myContract.sendDeposit(
                senderWallet.getSender(),
                toNano("5")
            );
            // const depositMessageResult2 = await myContract.sendDeposit(
            //     senderWallet2.getSender(),
            //     toNano("5")
            // );
        
            expect(depositMessageResult.transactions).toHaveTransaction({
                from: senderWallet.address,
                to: myContract.address,
                success: true,
            });
        
            const balanceRequest = await myContract.getBalance();
        
            expect(balanceRequest.number).toBeGreaterThan(toNano("9.99"));
        });
        it("should return funds as no command is sent", async () => {
            const senderWallet = await blockchain.treasury("sender");
        
            const depositMessageResult = await myContract.sendNoCodeDeposit(
              senderWallet.getSender(),
              toNano("5")
            );
        
            expect(depositMessageResult.transactions).toHaveTransaction({
              from: senderWallet.address,
              to: myContract.address,
              success: true,
            });
        
            const balanceRequest = await myContract.getBalance();
        
            expect(balanceRequest.number).toBeGreaterThan(toNano("4.99"));
        });
        it("successfully finish game", async () => {
            await myContract.sendDeposit(initWallet.getSender(), toNano("5"));
        
            const finishGameRequestResult = await myContract.sendFinishGameRequest(
              ownerWallet.getSender(),
              toNano("0.05"),
            );
        
            // expect(finishGameRequestResult.transactions[0]).toHaveTransaction({
            //   from: timer.address,
            //   to: myContract.address,
            //   success: true,
            // });
            // expect(finishGameRequestResult.transactions[1]).toHaveTransaction({
            //   from: myContract.address,
            //   to: ownerWallet.address,
            //   success: true,
            // });
            expect(finishGameRequestResult.transactions[2]).toHaveTransaction({
              from: myContract.address,
              to: initWallet.address,
              success: true,
            });
        });
        it("fails to finish game (not a timer address)", async () => {
            const senderWallet = await blockchain.treasury("sender");
        
            await myContract.sendDeposit(senderWallet.getSender(), toNano("5"));
        
            const withdrawalRequestResult = await myContract.sendFinishGameRequest(
              senderWallet.getSender(),
              toNano("0.5"),
            );
        
            expect(withdrawalRequestResult.transactions).toHaveTransaction({
              from: senderWallet.address,
              to: myContract.address,
              success: false,
              exitCode: 104,
            });
        });
      });
  
});