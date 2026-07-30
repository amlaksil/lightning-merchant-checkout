import Client, {
  ClientConfig,
  TransactionDetails,
  UnspentTransaction,
  TxInput,
  SignedTransaction,
  Block,
  AddressValidation,
  WalletInfo,
  NetworkInfo,
  PeerInfo,
  MempoolInfo,
  RawMempool,
  TransactionInfo,
} from "bitcoin-core";

export interface BitcoinConfig extends ClientConfig {
  network: "mainnet" | "testnet" | "regtest" | "signet";
}

// Default configuration for Bitcoin Core
const DEFAULT_CONFIG: BitcoinConfig = {
  network: "signet",
  username: "btrustbuildersrpc",
  password: "btrustbuilderspass",
  host: "165.22.121.70",
  port: 38332,
  timeout: 30000,
  // version: "28.0.0",
};

export class BitcoinClient {
  // Use a more specific type assertion that includes all the methods we need
  private client: Client & {
    getBlockCount(): Promise<number>;
    getNewAddress(label?: string, type?: "legacy" | "p2sh-segwit" | "bech32"): Promise<string>;
    sendToAddress(address: string, amount: number, comment?: string): Promise<string>;
    generateToAddress(blocks: number, address: string): Promise<string[]>;
    getTransaction(txid: string): Promise<TransactionDetails>;
    getBalance(minconf?: number): Promise<number>;
    listUnspent(minconf?: number, maxconf?: number): Promise<UnspentTransaction[]>;
    createRawTransaction(inputs: TxInput[], outputs: Record<string, number>): Promise<string>;
    signRawTransactionWithWallet(txHex: string): Promise<SignedTransaction>;
    sendRawTransaction(txHex: string): Promise<string>;
    getBlock(hash: string, verbosity?: number): Promise<Block>;
    getBlockHash(height: number): Promise<string>;
    validateAddress(address: string): Promise<AddressValidation>;
    listTransactions(count?: number, skip?: number): Promise<TransactionDetails[]>;
    getWalletInfo(): Promise<WalletInfo>;
    getPeerInfo(): Promise<PeerInfo[]>;
    getNetworkInfo(): Promise<NetworkInfo>;
    getMempoolInfo(): Promise<MempoolInfo>;
    getRawMempool(verbose?: boolean): Promise<RawMempool>;
    getRawTransaction(txid: string, verbose?: boolean): Promise<string | TransactionInfo>;
  };
  readonly network: string;

  constructor(config: Partial<BitcoinConfig> = {}) {
    const finalConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    console.log("Initializing Bitcoin client with config:", {
      ...finalConfig,
      password: "******", // Hide password in logs
    });
    this.client = new Client(finalConfig) as Client & typeof this.client;
    this.network = finalConfig.network;
  }

  /**
   * Get the current block height
   */
  async getBlockCount(): Promise<number> {
    return this.client.getBlockCount();
  }

  /**
   * Get a new Bitcoin address
   * @param type - The type of address to generate (legacy, p2sh-segwit, bech32)
   * @param label - Optional label for the address
   */
  async getNewAddress(
    type: "legacy" | "p2sh-segwit" | "bech32" = "bech32",
    label?: string
  ): Promise<string> {
    return this.client.getNewAddress(label, type);
  }

  /**
   * Send Bitcoin to an address
   * @param address - The Bitcoin address to send to
   * @param amount - Amount in BTC
   */
  async sendToAddress(
    address: string,
    amount: number,
    comment?: string
  ): Promise<string> {
    return this.client.sendToAddress(address, amount, comment);
  }

  /**
   * Generate new blocks (regtest only)
   * @param blocks - Number of blocks to generate
   * @param address - Optional address to send the reward to
   */
  async generateToAddress(blocks: number, address: string): Promise<string[]> {
    if (this.network !== "regtest") {
      throw new Error("Block generation is only available in regtest mode");
    }
    return this.client.generateToAddress(blocks, address);
  }

  /**
   * Get transaction details
   * @param txid - Transaction ID
   */
  async getTransaction(txid: string): Promise<TransactionDetails> {
    return this.client.getTransaction(txid);
  }

  /**
   * Get wallet balance
   */
  async getBalance(minconf = 0): Promise<number> {
    return this.client.getBalance(minconf);
  }

  /**
   * List unspent transactions
   * @param minconf - Minimum confirmations (default: 1)
   * @param maxconf - Maximum confirmations (default: 9999999)
   */
  async listUnspent(
    minconf = 0,
    maxconf = 9999999
  ): Promise<UnspentTransaction[]> {
    return this.client.listUnspent(minconf, maxconf);
  }

  /**
   * Create a raw transaction
   * @param inputs - Transaction inputs
   * @param outputs - Transaction outputs
   */
  async createRawTransaction(
    inputs: TxInput[],
    outputs: Record<string, number>
  ): Promise<string> {
    return this.client.createRawTransaction(inputs, outputs);
  }

  /**
   * Sign a raw transaction
   * @param txHex - Raw transaction hex
   */
  async signRawTransactionWithWallet(
    txHex: string
  ): Promise<SignedTransaction> {
    return this.client.signRawTransactionWithWallet(txHex);
  }

  /**
   * Send a raw transaction
   * @param txHex - Signed transaction hex
   */
  async sendRawTransaction(txHex: string): Promise<string> {
    return this.client.sendRawTransaction(txHex);
  }

  /**
   * Fund a channel (useful for opening Lightning channels)
   * @param address - The address to send funds to
   * @param amount - Amount in BTC
   * @param confirmations - Number of blocks to generate for confirmation (regtest only)
   */
  async fundAddress(
    address: string,
    amount: number,
    confirmations = 6
  ): Promise<void> {
    const txid = await this.sendToAddress(address, amount);
    const minerAddress = await this.getNewAddress();
    await this.generateToAddress(confirmations, minerAddress);
    console.log(`Funded address ${address} with ${amount} BTC (txid: ${txid})`);
  }

  async getBlock(hash: string, verbosity = 1): Promise<Block> {
    return this.client.getBlock(hash, verbosity);
  }

  async getBlockHash(height: number): Promise<string> {
    return this.client.getBlockHash(height);
  }

  async validateAddress(address: string): Promise<AddressValidation> {
    return this.client.validateAddress(address);
  }

  async listTransactions(count = 10, skip = 0): Promise<TransactionDetails[]> {
    return this.client.listTransactions(count, skip);
  }

  async getWalletInfo(): Promise<WalletInfo> {
    return this.client.getWalletInfo();
  }

  async getPeerInfo(): Promise<PeerInfo[]> {
    return this.client.getPeerInfo();
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      console.log("Fetching network info...");
      const info = await this.client.getNetworkInfo();
      console.log("Network info received:", info);
      return info;
    } catch (error) {
      console.error("Error in getNetworkInfo:", error);
      throw error;
    }
  }

  async getMempoolInfo(): Promise<MempoolInfo> {
    return this.client.getMempoolInfo();
  }

  async getRawMempool(verbose = true): Promise<RawMempool> {
    return this.client.getRawMempool(verbose) as Promise<RawMempool>;
  }

  /**
   * Get raw transaction details
   * @param txid - Transaction ID
   * @param verbose - Whether to return detailed transaction info
   */
  async getRawTransaction(
    txid: string,
    verbose = true
  ): Promise<string | TransactionInfo> {
    return this.client.getRawTransaction(txid, verbose);
  }
}

// Export a default instance
export const bitcoin = new BitcoinClient();
