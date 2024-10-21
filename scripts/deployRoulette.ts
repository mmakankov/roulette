import { address, toNano } from "@ton/core";
import { MainContract } from "../wrappers/MainContract";
import { compile, NetworkProvider } from "@ton/blueprint";

export async function run(provider: NetworkProvider) {
  const myContract = MainContract.createFromConfig(
    {
      is_timer_started: false,
      number: 0,
      address: address("EQC88411xVVjMw4ZcLWp5MuYP-Gr5y35antkE44BxUa1Tfwk"),
      owner_address: address("EQC88411xVVjMw4ZcLWp5MuYP-Gr5y35antkE44BxUa1Tfwk"),
      timer_address: address("EQA40ZXJ7ge55ILZhyjgc8uQ19l_vo8vIAxK-JbhMBjzGWTY"),
    },
    await compile("MainContract")
  );

  const openedContract = provider.open(myContract);

  openedContract.sendDeploy(provider.sender(), toNano("0.03"));

  await provider.waitForDeploy(myContract.address);
}