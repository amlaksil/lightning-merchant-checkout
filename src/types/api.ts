export interface BitcoinInfoResponse {
  status: 'success' | 'error';
  data?: {
    network: {
      version: number;
      subversion: string;
      connections: number;
      networkActive: boolean;
      networks: {
        name: string;
        limited: boolean;
        reachable: boolean;
        proxy: string;
        proxy_randomize_credentials: boolean;
      }[];
      warnings: string;
    };
    wallet: {
      balance: number;
      unconfirmedBalance: number;
      immatureBalance: number;
      txCount: number;
      walletName: string;
      walletVersion: number;
      privateKeysEnabled: boolean;
    };
  };
  message?: string;
} 