declare module "bitcoin-core" {
  export interface ClientConfig {
    network?: string;
    username: string;
    password: string;
    host: string;
    port: number;
    ssl?: {
      enabled: boolean;
      strict: boolean;
      cert: string;
    };
    timeout?: number;
    version?: string;
  }

  export interface Block {
    hash: string;
    confirmations: number;
    size: number;
    strippedsize: number;
    weight: number;
    height: number;
    version: number;
    versionHex: string;
    merkleroot: string;
    tx: string[] | TransactionInfo[];
    time: number;
    mediantime: number;
    nonce: number;
    bits: string;
    difficulty: number;
    chainwork: string;
    nTx: number;
    previousblockhash?: string;
    nextblockhash?: string;
  }

  export interface TransactionInfo {
    txid: string;
    hash: string;
    version: number;
    size: number;
    vsize: number;
    weight: number;
    locktime: number;
    vin: TxInput[];
    vout: TxOutput[];
    hex: string;
    blockhash?: string;
    confirmations?: number;
    time?: number;
    blocktime?: number;
    fee?: number;
  }

  export interface TxInput {
    txid?: string;
    vout?: number;
    scriptSig?: {
      asm: string;
      hex: string;
    };
    txinwitness?: string[];
    sequence: number;
    coinbase?: string;
  }

  export interface TxOutput {
    value: number;
    n: number;
    scriptPubKey: {
      asm: string;
      desc: string;
      hex: string;
      type: string;
      address?: string;
      addresses?: string[];
      reqSigs?: number;
    };
  }

  export interface TransactionDetails {
    amount: number;
    fee: number;
    confirmations: number;
    blockhash: string;
    blockindex: number;
    blocktime: number;
    txid: string;
    time: number;
    timereceived: number;
    "bip125-replaceable": "yes" | "no" | "unknown";
    details: {
      address: string;
      category: "send" | "receive";
      amount: number;
      label?: string;
      vout: number;
      fee?: number;
      abandoned?: boolean;
    }[];
    hex: string;
  }

  export interface UnspentTransaction {
    txid: string;
    vout: number;
    address: string;
    label?: string;
    scriptPubKey: string;
    amount: number;
    confirmations: number;
    redeemScript?: string;
    witnessScript?: string;
    spendable: boolean;
    solvable: boolean;
    reused?: boolean;
    desc?: string;
    safe: boolean;
  }

  export interface SignedTransaction {
    hex: string;
    complete: boolean;
    errors?: {
      txid: string;
      vout: number;
      scriptSig: string;
      sequence: number;
      error: string;
    }[];
  }

  export interface AddressValidation {
    isvalid: boolean;
    address: string;
    scriptPubKey: string;
    isscript: boolean;
    iswitness: boolean;
    witness_version?: number;
    witness_program?: string;
  }

  export interface WalletInfo {
    walletname: string;
    walletversion: number;
    format: string;
    balance: number;
    unconfirmed_balance: number;
    immature_balance: number;
    txcount: number;
    keypoololdest: number;
    keypoolsize: number;
    keypoolsize_hd_internal: number;
    unlocked_until?: number;
    paytxfee: number;
    hdseedid?: string;
    private_keys_enabled: boolean;
    avoid_reuse: boolean;
    scanning: {
      duration: number;
      progress: number;
    };
  }

  export interface NetworkInfo {
    version: number;
    subversion: string;
    protocolversion: number;
    localservices: string;
    localservicesnames: string[];
    localrelay: boolean;
    timeoffset: number;
    connections: number;
    connections_in: number;
    connections_out: number;
    networkactive: boolean;
    networks: {
      name: string;
      limited: boolean;
      reachable: boolean;
      proxy: string;
      proxy_randomize_credentials: boolean;
    }[];
    relayfee: number;
    incrementalfee: number;
    localaddresses: {
      address: string;
      port: number;
      score: number;
    }[];
    warnings?: string;
  }

  export interface PeerInfo {
    id: number;
    addr: string;
    addrbind: string;
    addrlocal: string;
    network: string;
    services: string;
    servicesnames: string[];
    relaytxes: boolean;
    lastsend: number;
    lastrecv: number;
    last_transaction: number;
    last_block: number;
    bytessent: number;
    bytesrecv: number;
    conntime: number;
    timeoffset: number;
    pingtime: number;
    minping: number;
    pingwait?: number;
    version: number;
    subver: string;
    inbound: boolean;
    addnode: boolean;
    startingheight: number;
    banscore: number;
    synced_headers: number;
    synced_blocks: number;
    inflight: number[];
    whitelisted: boolean;
    permissions: string[];
    minfeefilter: number;
    bytessent_per_msg: Record<string, number>;
    bytesrecv_per_msg: Record<string, number>;
  }

  export interface MempoolInfo {
    loaded: boolean;
    size: number;
    bytes: number;
    usage: number;
    maxmempool: number;
    mempoolminfee: number;
    minrelaytxfee: number;
    unbroadcastcount: number;
  }

  export interface MempoolEntry {
    vsize: number;
    size: number;
    weight: number;
    fee: number;
    modifiedfee: number;
    time: number;
    height: number;
    descendantcount: number;
    descendantsize: number;
    descendantfees: number;
    ancestorcount: number;
    ancestorsize: number;
    ancestorfees: number;
    wtxid: string;
    fees: {
      base: number;
      modified: number;
      ancestor: number;
      descendant: number;
    };
    depends: string[];
    spentby: string[];
    'bip125-replaceable': boolean;
    unbroadcast?: boolean;
  }

  export type RawMempool = Record<string, MempoolEntry>;

  export type BlockTemplateRequest = {
    mode?: "template" | "proposal";
    capabilities?: ("longpoll" | "coinbasetxn" | "coinbasevalue" | "proposal" | "serverlist" | "workid")[];
    rules?: ("segwit" | "signet" | "testnet" | "regtest")[];
  };

  export type BlockTemplateResponse = {
    capabilities: string[];
    version: number;
    rules: string[];
    vbavailable: Record<string, number>;
    vbrequired: number;
    previousblockhash: string;
    transactions: TransactionInfo[];
    coinbaseaux: Record<string, string>;
    coinbasevalue: number;
    longpollid: string;
    target: string;
    mintime: number;
    mutable: string[];
    noncerange: string;
    sigoplimit: number;
    sizelimit: number;
    weightlimit: number;
    curtime: number;
    bits: string;
    height: number;
  };

  export type MemoryStats = {
    locked: {
      used: number;
      free: number;
      total: number;
      locked: number;
      chunks_used: number;
      chunks_free: number;
    };
  };

  export default class Client {
    constructor(config: ClientConfig);

    getBlockCount(): Promise<number>;
    getBlock(hash: string, verbosity?: number): Promise<Block>;
    getBlockHash(height: number): Promise<string>;
    getBlockTemplate(template_request?: BlockTemplateRequest): Promise<BlockTemplateResponse>;
    submitBlock(hexdata: string, dummy?: string): Promise<string>;
    getTransaction(txid: string, include_watchonly?: boolean): Promise<TransactionDetails>;
    getRawTransaction(txid: string, verbose?: boolean, blockhash?: string): Promise<string | TransactionInfo>;
    createRawTransaction(inputs: TxInput[], outputs: Record<string, number | string>, locktime?: number, replaceable?: boolean): Promise<string>;
    signRawTransactionWithWallet(hexstring: string, prevtxs?: TxInput[], sighashtype?: string): Promise<SignedTransaction>;
    sendRawTransaction(hexstring: string, maxfeerate?: number): Promise<string>;
    getNewAddress(label?: string, type?: "legacy" | "p2sh-segwit" | "bech32"): Promise<string>;
    validateAddress(address: string): Promise<AddressValidation>;
    sendToAddress(address: string, amount: number, comment?: string, comment_to?: string, subtractfeefromamount?: boolean, replaceable?: boolean, conf_target?: number, estimate_mode?: string): Promise<string>;
    generateToAddress(blocks: number, address: string, maxtries?: number): Promise<string[]>;
    getBalance(minconf?: number, include_watchonly?: boolean): Promise<number>;
    getWalletInfo(): Promise<WalletInfo>;
    listUnspent(minconf?: number, maxconf?: number, addresses?: string[], include_unsafe?: boolean, query_options?: Record<string, unknown>): Promise<UnspentTransaction[]>;
    listTransactions(count?: number, skip?: number, include_watchonly?: boolean): Promise<TransactionDetails[]>;
    getPeerInfo(): Promise<PeerInfo[]>;
    getNetworkInfo(): Promise<NetworkInfo>;
    getMempoolInfo(): Promise<MempoolInfo>;
    getRawMempool(verbose?: boolean): Promise<string[] | RawMempool>;
    uptime(): Promise<number>;
    getMemoryInfo(mode?: "stats" | "mallocinfo"): Promise<MemoryStats | string>;
    stop(): Promise<void>;
  }
}
