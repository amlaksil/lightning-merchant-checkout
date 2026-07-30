import * as fs from "fs";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { promisify } from "util";
import path from "path";
import {
  LndConfig,
  LndInvoice,
  LndServices,
  LightningService,
  NodeInfo,
  LndInvoiceRequest,
} from "@/types/lnd";

const DEFAULT_CONFIG: LndConfig = {
  rpcServer: process.env.LND_RPC_SERVER || "localhost:10001",
  tlsCertPath:
    process.env.LND_CERT_PATH ||
    "/Users/theophilus/.polar/networks/2/volumes/lnd/alice/tls.cert",
  macaroonPath:
    process.env.LND_MACAROON_PATH ||
    "/Users/theophilus/.polar/networks/2/volumes/lnd/alice/data/chain/bitcoin/regtest/admin.macaroon",
};

export class LndClient {
  private services: LndServices;
  private config: LndConfig;

  constructor(config: LndConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.services = this.buildServices();
  }

  private buildServices(): LndServices {
    let sslCreds;
    let macaroon = "";
    let credentials;

    try {
      // Try to load TLS certificate
      const tlsCert = fs.readFileSync(this.config.tlsCertPath);
      sslCreds = grpc.credentials.createSsl(tlsCert);

      try {
        // Try to load macaroon only if we have SSL credentials
        macaroon = fs.readFileSync(this.config.macaroonPath).toString("hex");
        const metadata = new grpc.Metadata();
        metadata.add("macaroon", macaroon);

        const macaroonCreds = grpc.credentials.createFromMetadataGenerator(
          (_context, callback) => callback(null, metadata)
        );

        // Combine the credentials only if we have both SSL and macaroon
        credentials = grpc.credentials.combineChannelCredentials(
          sslCreds,
          macaroonCreds
        );
      } catch (error: unknown) {
        const err = error as Error;
        console.warn(
          "Macaroon file not found, using SSL credentials only:",
          err.message
        );
        credentials = sslCreds;
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.warn(
        "TLS certificate not found, using insecure credentials:",
        err.message
      );
      credentials = grpc.credentials.createInsecure();
    }

    const protoPath = path.resolve(process.cwd(), "src/lightning.proto");
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    // We need to use unknown first since the proto types are dynamic
    const lnrpc = protoDescriptor.lnrpc as unknown as {
      Lightning: new (
        host: string,
        credentials: grpc.ChannelCredentials
      ) => LightningService;
    };

    const lightning = new lnrpc.Lightning(this.config.rpcServer, credentials);

    return {
      lightning,
      router: null, // Add if needed
      invoices: null, // Add if needed
    };
  }

  // Create an invoice
  async createInvoice(
    amount: number,
    memo: string,
    expiry: number = 3600
  ): Promise<LndInvoice> {
    try {
      const call = promisify<LndInvoiceRequest, LndInvoice>(
        this.services.lightning.addInvoice
      ).bind(this.services.lightning);

      const invoice = await call({
        value: amount,
        memo: memo,
        expiry: expiry,
      });

      return invoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }

  // Check invoice payment status
  async checkInvoiceStatus(rHash: Buffer): Promise<LndInvoice> {
    try {
      const call = promisify<{ r_hash: Buffer }, LndInvoice>(
        this.services.lightning.lookupInvoice
      ).bind(this.services.lightning);
      return await call({ r_hash: rHash });
    } catch (error) {
      console.error("Error checking invoice status:", error);
      throw error;
    }
  }

  // Get info about the node
  async getInfo(): Promise<NodeInfo> {
    try {
      const call = promisify<Record<string, never>, NodeInfo>(
        this.services.lightning.getInfo
      ).bind(this.services.lightning);
      return await call({});
    } catch (error) {
      console.error("Error getting node info:", error);
      throw error;
    }
  }
}

export const lndClient = new LndClient();
