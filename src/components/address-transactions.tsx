"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import type { TransactionInfo } from "@/types/bitcoin-cli";

interface AddressTransactionsProps {
  txids: string[];
}

export function AddressTransactions({ txids }: AddressTransactionsProps) {
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    async function fetchTransactions() {
      if (txids.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/bitcoin/address/transactions?txids=${txids.join(",")}&page=${page}&pageSize=${pageSize}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setTransactions(data.transactions);
        setTotal(data.total);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setError(error instanceof Error ? error.message : 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [txids, page]);

  if (txids.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Transaction History</h2>
          <Badge variant="secondary">0 transactions</Badge>
        </div>
        <p className="text-zinc-500">No transactions found</p>
      </Card>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Transaction History</h2>
        <Badge variant="secondary">
          {total} transaction{total === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="space-y-3">
        {error ? (
          <div className="text-red-500 p-4 text-center">
            {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => {
                setError(null);
                setPage(1);
              }}
            >
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="py-8">
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-zinc-100 rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {transactions.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">No transactions found</p>
            ) : (
              <>
                {transactions.map((tx) => (
                  <div key={tx.txid} className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tx/${tx.txid}`}
                          className="font-mono text-sm text-blue-600 hover:text-blue-800"
                        >
                          {tx.txid}
                        </Link>
                        <CopyButton text={tx.txid} />
                      </div>
                      <Link href={`/tx/${tx.txid}`}>
                        <ArrowUpRight className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500">Size:</span>{" "}
                        <span className="text-zinc-900">{tx.size} bytes</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Inputs:</span>{" "}
                        <span className="text-zinc-900">{tx.vin.length}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Outputs:</span>{" "}
                        <span className="text-zinc-900">{tx.vout.length}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-zinc-500">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Card>
  );
} 