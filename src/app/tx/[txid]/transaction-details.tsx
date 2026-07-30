"use client";

import { ChevronDown, ChevronUp, Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Add color mapping for different OP codes
const OP_CODE_COLORS: { [key: string]: string } = {
  // Stack operations
  OP_DUP: "text-blue-600",
  OP_HASH160: "text-purple-600",
  OP_EQUALVERIFY: "text-green-600",
  OP_CHECKSIG: "text-orange-600",
  OP_EQUAL: "text-green-600",
  OP_VERIFY: "text-green-600",
  OP_RETURN: "text-red-600",
  // Arithmetic
  OP_ADD: "text-pink-600",
  OP_SUB: "text-pink-600",
  OP_MUL: "text-pink-600",
  OP_DIV: "text-pink-600",
  // Flow control
  OP_IF: "text-yellow-600",
  OP_ELSE: "text-yellow-600",
  OP_ENDIF: "text-yellow-600",
  // Time locks
  OP_CHECKLOCKTIMEVERIFY: "text-cyan-600",
  OP_CHECKSEQUENCEVERIFY: "text-cyan-600",
  // Default for other OP codes
  DEFAULT: "text-zinc-600",
};

function colorizeAsm(asm: string) {
  return asm
    .split(" ")
    .map((part, index) => {
      if (part.startsWith("OP_")) {
        const color = OP_CODE_COLORS[part] || OP_CODE_COLORS.DEFAULT;
        return `<span class="${color} font-semibold" key="${index}">${part}</span>`;
      } else if (part.length === 40 && /^[0-9a-fA-F]+$/.test(part)) {
        // Likely a hash (20 bytes)
        return `<span class="text-rose-600" key="${index}">${part}</span>`;
      } else if (part.length >= 64 && /^[0-9a-fA-F]+$/.test(part)) {
        // Likely a signature or public key
        return `<span class="text-indigo-600" key="${index}">${part}</span>`;
      } else if (/^[0-9]+$/.test(part)) {
        // Numbers
        return `<span class="text-emerald-600" key="${index}">${part}</span>`;
      }
      // Other data
      return `<span class="text-zinc-600" key="${index}">${part}</span>`;
    })
    .join(" ");
}

interface Witness {
  txinwitness: string[];
}

interface ScriptSig {
  asm: string;
  hex: string;
}

interface TransactionVin {
  txid?: string;
  vout?: number;
  scriptSig?: ScriptSig;
  sequence: number;
  coinbase?: string;
  txinwitness?: string[];
  witness?: Witness;
  prevout?: {
    value: number;
    scriptPubKey: {
      asm: string;
      hex: string;
      type: string;
      address?: string;
    };
  };
}

interface ScriptPubKey {
  asm: string;
  desc: string;
  hex: string;
  type: string;
  address?: string;
  addresses?: string[];
  reqSigs?: number;
}

interface TransactionVout {
  value: number;
  n: number;
  scriptPubKey: ScriptPubKey;
}

interface TransactionData {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: TransactionVin[];
  vout: TransactionVout[];
  hex: string;
  blockhash: string;
  confirmations: number;
  time: number;
  blocktime: number;
  fee?: number;
}

function ScriptDetails({
  script,
  title,
}: {
  script: ScriptSig | ScriptPubKey;
  title: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm text-zinc-500">{title}:</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        )}
      </div>
      {expanded && (
        <div className="mt-2 space-y-2 pl-4">
          <div>
            <span className="text-xs text-zinc-500">ASM:</span>
            <p
              className="font-mono text-sm break-all mt-1 bg-zinc-100 p-2 rounded"
              dangerouslySetInnerHTML={{ __html: colorizeAsm(script.asm) }}
            />
          </div>
          <div>
            <span className="text-xs text-zinc-500">HEX:</span>
            <p className="font-mono text-sm text-zinc-600 break-all mt-1 bg-zinc-100 p-2 rounded">
              {script.hex}
            </p>
          </div>
          {"desc" in script && script.desc && (
            <div>
              <span className="text-xs text-zinc-500">Descriptor:</span>
              <p className="font-mono text-sm text-zinc-600 break-all mt-1 bg-zinc-100 p-2 rounded">
                {script.desc}
              </p>
            </div>
          )}
          {"type" in script && script.type && (
            <div>
              <span className="text-xs text-zinc-500">Type:</span>
              <p className="font-mono text-sm text-zinc-600 mt-1">
                {script.type}
              </p>
            </div>
          )}
          {"reqSigs" in script && script.reqSigs && (
            <div>
              <span className="text-xs text-zinc-500">
                Required Signatures:
              </span>
              <p className="font-mono text-sm text-zinc-600 mt-1">
                {script.reqSigs}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TransactionDetails({ txid }: { txid: string }) {
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransaction() {
      try {
        setLoading(true);
        const response = await fetch(`/api/bitcoin/tx/${txid}`);
        const data = await response.json();
        if (data.status === "success") {
          setTransaction(data.data.transaction);
        } else {
          setError(data.error || "Failed to fetch transaction");
        }
      } catch (err) {
        setError("Failed to fetch transaction details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchTransaction();
  }, [txid]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error || "Transaction not found"}</p>
      </div>
    );
  }

  const totalOutput =
    transaction.vout?.reduce((sum, output) => sum + (output?.value || 0), 0) ||
    0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">
          Transaction Details
        </h1>
        <Badge
          variant="outline"
          className={cn(
            transaction.confirmations > 0
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-yellow-50 border-yellow-200 text-yellow-700"
          )}
        >
          {transaction.confirmations > 0
            ? `${transaction.confirmations} Confirmations`
            : "Unconfirmed"}
        </Badge>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-zinc-500">
              Transaction ID
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-mono text-sm text-zinc-900">
                {transaction.txid}
              </p>
              <button
                onClick={() => copyToClipboard(transaction.txid)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <Copy className="h-4 w-4 cursor-pointer" />
              </button>
            </div>
            {transaction.hash !== transaction.txid && (
              <div className="mt-2">
                <h2 className="text-sm font-medium text-zinc-500">
                  Witness Transaction ID
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm text-zinc-900">
                    {transaction.hash}
                  </p>
                  <button
                    onClick={() => copyToClipboard(transaction.hash)}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <Copy className="h-4 w-4 cursor-pointer" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h2 className="text-sm font-medium text-zinc-500">Block Time</h2>
              <p className="text-zinc-900">
                {new Date(transaction.blocktime * 1000).toLocaleString()}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-zinc-500">Size</h2>
              <p className="text-zinc-900">
                {transaction.size.toLocaleString()} bytes
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-zinc-500">
                Virtual Size
              </h2>
              <p className="text-zinc-900">
                {transaction.vsize.toLocaleString()} vB
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-zinc-500">Weight</h2>
              <p className="text-zinc-900">
                {transaction.weight.toLocaleString()} WU
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-zinc-500">Version</h2>
              <p className="text-zinc-900">{transaction.version}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-zinc-500">Lock Time</h2>
              <p className="text-zinc-900">{transaction.locktime}</p>
            </div>
            {transaction.blockhash && (
              <div className="col-span-2">
                <h2 className="text-sm font-medium text-zinc-500">
                  Block Hash
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm text-zinc-900">
                    {transaction.blockhash}
                  </p>
                  <button
                    onClick={() => copyToClipboard(transaction.blockhash)}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <Copy className="h-4 w-4 cursor-pointer" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Inputs</h2>
            <div className="space-y-3">
              {transaction.vin.map((input, index) => (
                <div
                  key={`${input.txid}-${input.vout}-${index}`}
                  className="bg-zinc-50 p-4 rounded-lg border border-zinc-200"
                >
                  {input.coinbase ? (
                    <div>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        Coinbase
                      </Badge>
                      <div className="mt-2">
                        <span className="text-sm text-zinc-500">Coinbase:</span>
                        <p className="font-mono text-sm text-zinc-600 break-all mt-1">
                          {input.coinbase}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-500">
                          Previous Output:
                        </span>
                        <a
                          href={`/tx/${input.txid}`}
                          className="font-mono text-sm text-blue-600 hover:underline"
                        >
                          {input.txid}
                        </a>
                        <span className="text-zinc-400">#{input.vout}</span>
                      </div>
                      {input.prevout && (
                        <div className="mt-2">
                          <span className="text-sm text-zinc-500">
                            Previous Output Value:
                          </span>
                          <span className="ml-2 font-mono text-sm text-zinc-900">
                            {input.prevout.value.toFixed(8)} BTC
                          </span>
                        </div>
                      )}
                      {input.scriptSig && (
                        <ScriptDetails
                          script={input.scriptSig}
                          title="ScriptSig"
                        />
                      )}
                      {input.txinwitness && input.txinwitness.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-zinc-500">
                            Witness:
                          </span>
                          <div className="mt-1 space-y-1">
                            {input.txinwitness.map((witness, i) => (
                              <p
                                key={i}
                                className="font-mono text-sm text-zinc-600 break-all pl-4"
                              >
                                {witness}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-2">
                        <span className="text-sm text-zinc-500">Sequence:</span>
                        <span className="ml-2 font-mono text-sm text-zinc-900">
                          {input.sequence.toString(16)} (hex)
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              Outputs
            </h2>
            <div className="space-y-3">
              {transaction.vout.map((output, index) => (
                <div
                  key={`${output.n}-${index}`}
                  className="bg-zinc-50 p-4 rounded-lg border border-zinc-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">
                      Output #{output.n}
                    </span>
                    <span className="font-mono text-sm font-bold text-zinc-900">
                      {output.value.toFixed(8)} BTC
                    </span>
                  </div>
                  <ScriptDetails
                    script={output.scriptPubKey}
                    title="ScriptPubKey"
                  />
                  {output.scriptPubKey.addresses?.map((address) => (
                    <div key={address} className="mt-2">
                      <span className="text-sm text-zinc-500">Address:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono text-sm text-zinc-900">
                          {address}
                        </p>
                        <button
                          onClick={() => copyToClipboard(address)}
                          className="text-zinc-400 hover:text-zinc-600"
                        >
                          <Copy className="h-4 w-4 cursor-pointer" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                <h3 className="text-sm font-medium text-zinc-500">
                  Total Output
                </h3>
                <p className="text-lg font-bold text-zinc-900 mt-1">
                  {totalOutput.toFixed(8)} BTC
                </p>
              </div>
              {transaction.fee !== undefined && (
                <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                  <h3 className="text-sm font-medium text-zinc-500">Fee</h3>
                  <p className="text-lg font-bold text-zinc-900 mt-1">
                    {transaction.fee.toFixed(8)} BTC
                  </p>
                </div>
              )}
              <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                <h3 className="text-sm font-medium text-zinc-500">Fee Rate</h3>
                <p className="text-lg font-bold text-zinc-900 mt-1">
                  {transaction.fee !== undefined
                    ? (
                        (transaction.fee * 100000000) /
                        transaction.vsize
                      ).toFixed(2)
                    : "N/A"}{" "}
                  sat/vB
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              Raw Transaction
            </h2>
            <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-500">Hex:</span>
                <button
                  onClick={() => copyToClipboard(transaction.hex)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <Copy className="h-4 w-4 cursor-pointer" />
                </button>
              </div>
              <p className="font-mono text-sm text-zinc-600 break-all">
                {transaction.hex}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
