import * as grpc from "@grpc/grpc-js";

// Frontend types
export interface FrontendInvoice {
  paymentRequest: string;
  amount: number;
  memo: string;
  expiry: number;
  rHash: string; // hex string of the r_hash buffer
  paymentAddr: string; // hex string of the payment_addr buffer
  isPaid?: boolean;
}

// Backend request types
export interface InvoiceRequest {
  amount: number;
  memo: string;
  expiry?: number;
}

// LND API response types
export interface LndInvoice {
  r_hash: Buffer;
  payment_request: string;
  add_index: string;
  payment_addr: Buffer;
  settled?: boolean;
  state?: "OPEN" | "SETTLED" | "CANCELED" | "ACCEPTED";
  settle_date?: string;
  creation_date?: string;
  value?: string;
}

// Payment status response
export interface PaymentStatus {
  isPaid: boolean;
}

// Custom type for LND Lightning service
export interface LightningService extends grpc.Client {
  addInvoice(
    args: LndInvoiceRequest,
    callback: (error: Error | null, response: LndInvoice) => void
  ): void;
  getInfo(
    args: Record<string, never>,
    callback: (error: Error | null, response: NodeInfo) => void
  ): void;
  lookupInvoice(
    args: { r_hash: Buffer },
    callback: (error: Error | null, response: LndInvoice) => void
  ): void;
}

export interface NodeInfo {
  version: string;
  identityPubkey: string;
  alias: string;
  color: string;
  numPeers: number;
  numActiveChannels: number;
  numInactiveChannels: number;
  numPendingChannels: number;
  blockHeight: number;
  syncedToChain: boolean;
}

export interface LndInvoiceRequest {
  value: number;
  memo: string;
  expiry: number;
}

// Types for the LND gRPC service
export interface LndServices {
  lightning: LightningService;
  router: grpc.Client | null;
  invoices: grpc.Client | null;
}

// Configuration for your LND node connection
export interface LndConfig {
  rpcServer: string;
  tlsCertPath: string;
  macaroonPath: string;
}
