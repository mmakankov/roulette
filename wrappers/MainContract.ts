import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, Sender, SenderArguments, SendMode } from "@ton/core";

export type MainContractConfig = {
  is_timer_started: boolean;
  number: number;
  address: Address;
  owner_address: Address;
  timer_address: Address;
};

export function mainContractConfigToCell(config: MainContractConfig): Cell {
  return beginCell()
    .storeBit(config.is_timer_started)
    .storeUint(config.number, 16)
    .storeAddress(config.address)
    .storeAddress(config.owner_address)
    .storeAddress(config.timer_address)
    .storeBit(false)
    .storeBit(false)
    .storeUint(0, 64)
    .storeUint(0, 64)
    .endCell();
}

export class MainContract implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromConfig(
    config: MainContractConfig,
    code: Cell,
    workchain = 0
  ) {
    const data = mainContractConfigToCell(config);
    const init = { code, data };
    const address = contractAddress(workchain, init);

    return new MainContract(address, init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async getData(provider: ContractProvider) {
    const { stack } = await provider.get("get_contract_storage_data", []);
    return {
      is_timer_started: stack.readBoolean(),
      contributors_count: stack.readNumber(),
      recent_sender: stack.readAddress(),
      owner_address: stack.readAddress(),
      timer_address: stack.readAddress(),
      // addresses_dict: stack.readBoolean(),
      // bets: stack.readBoolean(),
      // total_sum: stack.readNumber(),
    };
  }

  // async getSender() {
  //   return this
  // }

  // send(args: SenderArguments): Promise<void> {
  //   return this;
  // }

  async getBalance(provider: ContractProvider) {
    const { stack } = await provider.get("balance", []);
    return {
      number: stack.readNumber(),
    };
  }

  async sendNewOwnerAddress(
    provider: ContractProvider,
    sender: Sender,
    value: bigint,
    newOwnerAddress: Address
  ){
    const msg_body = beginCell()
      .storeUint(1, 32) // OP code
      .storeAddress(newOwnerAddress)
      .endCell();

    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msg_body,
    });
  }

  async sendNewTimerAddress(
    provider: ContractProvider,
    sender: Sender,
    value: bigint,
    newTimerAddress: Address
  ) {
    const msg_body = beginCell()
      .storeUint(2, 32) // OP code
      .storeAddress(newTimerAddress)
      .endCell();

    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msg_body,
    });
  }

  async sendDeposit(provider: ContractProvider, sender: Sender, value: bigint) {
    const msg_body = beginCell()
      .storeUint(3, 32) // OP code
      .endCell();

    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msg_body,
    });
  }

  async sendNoCodeDeposit(
    provider: ContractProvider,
    sender: Sender,
    value: bigint
  ) {
    const msg_body = beginCell().endCell();

    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msg_body,
    });
  }

  async sendFinishGameRequest(
    provider: ContractProvider,
    sender: Sender,
    value: bigint
  ) {
    const msg_body = beginCell()
      .storeUint(4, 32) // OP code
      .endCell();

    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msg_body,
    });
  }
}
