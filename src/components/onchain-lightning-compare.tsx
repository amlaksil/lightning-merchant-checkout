"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Blocks, Loader2, RefreshCcw, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkout, CheckoutStatus } from "@/types/checkout";

const POLL_INTERVAL_MS = 10_000;

interface ComparisonResponse {
  chain: {
    network: string;
    tipHeight: number;
    bestBlockHash: string;
    bestBlockTime: string;
    mempoolSize: number;
    mempoolBytes: number;
    difficulty: number;
    searchDepth: number;
  };
  transaction: null | {
    txid: string;
    status: "mempool" | "confirmed" | "unknown";
    confirmations: number;
    blockHeight?: number;
    blockHash?: string;
    blockTime?: string;
    totalOutput?: number;
    fee?: number;
    vsize?: number;
    firstSeenTime?: string;
  };
}

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatDisplayAmount = (checkout: Checkout) => {
  if (checkout.displayCurrency === "SAT") {
    return `${checkout.displayAmount.toLocaleString()} sats`;
  }

  return `${checkout.displayAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
};

const formatStatusVariant = (status: CheckoutStatus | "confirmed" | "mempool" | "unknown") => {
  switch (status) {
    case "paid":
    case "confirmed":
      return "default";
    case "expired":
      return "destructive";
    default:
      return "outline";
  }
};

interface OnchainLightningCompareProps {
  activeCheckout: Checkout | null;
}

export function OnchainLightningCompare({
  activeCheckout,
}: OnchainLightningCompareProps) {
  const [txid, setTxid] = useState("");
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchComparison = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setRefreshing(true);
      }

      try {
        const params = new URLSearchParams();
        if (txid.trim()) {
          params.set("txid", txid.trim());
        }

        const suffix = params.toString() ? `?${params.toString()}` : "";
        const response = await fetch(`/api/compare/onchain-lightning${suffix}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as ComparisonResponse | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in data && data.error
              ? data.error
              : "Failed to load comparison data"
          );
        }

        setComparison(data as ComparisonResponse);
        setError("");
      } catch (comparisonError) {
        setError(
          comparisonError instanceof Error
            ? comparisonError.message
            : "Failed to load comparison data"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [txid]
  );

  useEffect(() => {
    fetchComparison({ silent: true });

    const interval = setInterval(() => {
      fetchComparison({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchComparison]);

  const lightningSummary = useMemo(() => {
    if (!activeCheckout) {
      return null;
    }

    return {
      displayAmount: formatDisplayAmount(activeCheckout),
      sats: `${activeCheckout.amountSats.toLocaleString()} sats`,
      paidAt: formatDateTime(activeCheckout.paidAt),
      expiresAt: formatDateTime(activeCheckout.expiresAt),
    };
  }, [activeCheckout]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>On-chain vs Lightning</CardTitle>
          <CardDescription>
            Live comparison using the active Lightning checkout and Bitcoin Core regtest state.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchComparison()}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2 text-zinc-900">
              <Zap className="h-4 w-4" />
              <span className="font-medium">Lightning checkout</span>
            </div>
            {!activeCheckout || !lightningSummary ? (
              <p className="text-sm text-zinc-500">
                Create a checkout to compare instant Lightning settlement against an on-chain payment.
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Status</span>
                  <Badge variant={formatStatusVariant(activeCheckout.status)}>
                    {activeCheckout.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Customer price</span>
                  <span>{lightningSummary.displayAmount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Lightning amount</span>
                  <span>{lightningSummary.sats}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Paid at</span>
                  <span>{lightningSummary.paidAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Expires at</span>
                  <span>{lightningSummary.expiresAt}</span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2 text-zinc-900">
              <Blocks className="h-4 w-4" />
              <span className="font-medium">Bitcoin Core state</span>
            </div>
            {loading && !comparison ? (
              <div className="flex items-center text-sm text-zinc-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading chain data...
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : comparison ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Network</span>
                  <span>{comparison.chain.network}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Tip height</span>
                  <span>{comparison.chain.tipHeight}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Best block time</span>
                  <span>{formatDateTime(comparison.chain.bestBlockTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Mempool</span>
                  <span>{comparison.chain.mempoolSize} tx</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Difficulty</span>
                  <span>{comparison.chain.difficulty.toLocaleString()}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="space-y-2">
            <Label htmlFor="onchain-txid">On-chain transaction txid</Label>
            <div className="flex gap-3">
              <Input
                id="onchain-txid"
                value={txid}
                onChange={(event) => setTxid(event.target.value)}
                placeholder="Paste a regtest txid to inspect confirmations"
              />
              <Button variant="outline" onClick={() => fetchComparison()}>
                Inspect
              </Button>
            </div>
            <p className="text-xs text-zinc-500">
              The panel searches the mempool first, then the latest {comparison?.chain.searchDepth ?? 25} blocks for confirmation state.
            </p>
          </div>

          {comparison?.transaction ? (
            <div className="rounded-lg bg-zinc-50 p-4 text-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="font-medium text-zinc-900">{comparison.transaction.txid}</div>
                <Badge variant={formatStatusVariant(comparison.transaction.status)}>
                  {comparison.transaction.status}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <span className="text-zinc-500">Confirmations:</span>{" "}
                  {comparison.transaction.confirmations}
                </div>
                <div>
                  <span className="text-zinc-500">Block height:</span>{" "}
                  {comparison.transaction.blockHeight ?? "—"}
                </div>
                <div>
                  <span className="text-zinc-500">Block time:</span>{" "}
                  {formatDateTime(comparison.transaction.blockTime)}
                </div>
                <div>
                  <span className="text-zinc-500">Total output:</span>{" "}
                  {comparison.transaction.totalOutput !== undefined
                    ? `${comparison.transaction.totalOutput} BTC`
                    : "—"}
                </div>
                <div>
                  <span className="text-zinc-500">Mempool fee:</span>{" "}
                  {comparison.transaction.fee !== undefined
                    ? `${comparison.transaction.fee} BTC`
                    : "—"}
                </div>
                <div>
                  <span className="text-zinc-500">First seen:</span>{" "}
                  {formatDateTime(comparison.transaction.firstSeenTime)}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-zinc-500">
              Paste a regtest txid to compare a real on-chain payment lifecycle with the Lightning checkout state.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
