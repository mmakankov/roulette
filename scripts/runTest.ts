import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { MainContract } from "../wrappers/MainContract"; // this is the interface class we just implemented
import { TonClient, WalletContractV4, Address, toNano } from "@ton/ton";

// import * as dotenv from 'dotenv'
// dotenv.config({ path: '../.env' });

import dotenv from "dotenv"
dotenv.config();

async function main() {
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({ endpoint });

  // open Roulette instance by address
  const rouletteAddress = Address.parse("EQDpD0o9C2q1F7qa1nTx1eyuPvUCNuAJFB-uF6qcJGXCi1Ml");
  const roulette = new MainContract(rouletteAddress);
  const rouletteContract = client.open(roulette);

  const walletPhrases = [
    process.env.MAIN_TEST_WALLET_PHRASE as string,
    process.env.TEST_WALLET_PHRASE_2 as string,
    process.env.TEST_WALLET_PHRASE_3 as string,
    process.env.TEST_WALLET_PHRASE_4 as string,
    process.env.TEST_WALLET_PHRASE_5 as string,
  ];
  console.log("walletPhrases: ", walletPhrases);

  for (let index = 0; index < walletPhrases.length; index++) {
    // open wallet v4 (notice the correct wallet version here)
    const mnemonic = walletPhrases[index];; // your 24 secret words (replace ... with the rest of the words)
    console.log(mnemonic.split(" "));
    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    if (!await client.isContractDeployed(wallet.address)) {
        return console.log("wallet is not deployed");
    }

    // open wallet and read the current seqno of the wallet
    const walletContract = client.open(wallet);
    const walletSender = walletContract.sender(key.secretKey);
    const seqno = await walletContract.getSeqno();

    // send the increment transaction
    await rouletteContract.sendDeposit(walletSender, toNano("0.1"));

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
        console.log("waiting for transaction to confirm...");
        await sleep(1500);
        currentSeqno = await walletContract.getSeqno();
    }
    console.log("transaction confirmed!");
  }

  console.log("Connected all wallets to the game");
}

main();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}