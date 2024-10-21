import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from "@ton/core";

export type TimerContractConfig = {
  schedule: Cell;
  timer_owner_address: Address;
  timer_caller_address: Address;
  furthest_schedule: number;
  timer_bounce_address: Address;
};

export function timerContractConfigToCell(config: TimerContractConfig): Cell {
  return beginCell()
    .storeBit(false)
    .storeAddress(config.timer_owner_address)
    .storeAddress(config.timer_caller_address)
    .storeUint(config.furthest_schedule, 64)
    .storeAddress(config. timer_bounce_address)
    .endCell();
}

export class TimerContract implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromConfig(
    config: TimerContractConfig,
    code: Cell,
    workchain = 0
  ) {
    const data = timerContractConfigToCell(config);
    const init = { code, data };
    const address = contractAddress(workchain, init);

    return new TimerContract(address, init);
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
        schedule: stack.readCellOpt(),
        owner: stack.readAddress(),
        caller: stack.readAddress(),
        furthest_schedule: stack.readNumber(),
        timer_bounce_address: stack.readAddress(),
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

  async sendNewCallerAddress(
    provider: ContractProvider,
    sender: Sender,
    value: bigint,
    newCallerAddress: Address
  ) {
    const msg_body = beginCell()
      .storeUint(2, 32) // OP code
      .storeAddress(newCallerAddress)
      .endCell();

    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msg_body,
    });
  }

  async sendScheduleTimer(
    provider: ContractProvider, 
    sender: Sender, 
    value: bigint
  ) {
    const msg_body = beginCell()
      .storeUint(0x24E5F1CA, 32) // OP code
      .storeUint(new Date().getTime() * 1000 + 2, 64) // time to scheddule
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
}