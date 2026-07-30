"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Blocks,
  ChevronDown,
  ChevronUp,
  Clock3,
  Loader2,
  RefreshCcw,
  Zap,
} from "lucide-react";

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

const formatStatusVariant = (
  status: CheckoutStatus | "confirmed" | "mempool" | "unknown"
) => {
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
  const [showInspector, setShowInspector] = useState(false);

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
        const data = (await response.json()) as
          | ComparisonResponse
          | { error?: string };

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
    <Card className="w-full rounded-3xl border-zinc-200 bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <CardTitle>Why Lightning Wins</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6">
            Lightning settles customer payments immediately, while on-chain
            Bitcoin payments move through mempool and confirmation stages before
            the merchant treats them as final.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchComparison()}
          disabled={refreshing}
          className="rounded-xl"
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
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="mb-3 flex items-center gap-2 text-zinc-900">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Lightning checkout</span>
            </div>
            {!activeCheckout || !lightningSummary ? (
              <div className="space-y-3 text-sm text-zinc-600">
                <p>Create a checkout to show the instant-settlement customer flow.</p>
                <div className="rounded-xl border border-zinc-200 bg-white p-3">
                  <div className="font-medium text-zinc-900">Typical flow</div>
                  <ul className="mt-2 space-y-1 text-xs text-zinc-500">
                    <li>1. Merchant generates a Lightning invoice</li>
                    <li>2. Customer scans and pays</li>
                    <li>3. Merchant sees payment settle immediately</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
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
                  <span className="text-zinc-500">Settlement</span>
                  <span>{lightningSummary.sats}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Paid at</span>
                  <span>{lightningSummary.paidAt}</span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="mb-3 flex items-center gap-2 text-zinc-900">
              <Clock3 className="h-4 w-4" />
              <span className="text-sm font-medium">On-chain confirmation</span>
            </div>
            {loading && !comparison ? (
              <div className="flex items-center text-sm text-zinc-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading chain state...
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : comparison ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Network</span>
                  <span>{comparison.chain.network}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Tip height</span>
                  <span>{comparison.chain.tipHeight}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Mempool</span>
                  <span>{comparison.chain.mempoolSize} tx</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Latest block</span>
                  <span>{formatDateTime(comparison.chain.bestBlockTime)}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-zinc-900">
                <Blocks className="h-4 w-4" />
                <span className="font-medium">Live on-chain inspector</span>
              </div>
              <p className="text-sm text-zinc-500">
                Optional demo tool for showing how a Bitcoin transaction moves
                from mempool to confirmed.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-fit rounded-xl"
              onClick={() => setShowInspector((current) => !current)}
            >
              {showInspector ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Hide inspector
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Show inspector
                </>
              )}
            </Button>
          </div>

          {showInspector && (
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="onchain-txid">Regtest transaction txid</Label>
                <div className="flex gap-3">
                  <Input
                    id="onchain-txid"
                    value={txid}
                    onChange={(event) => setTxid(event.target.value)}
                    placeholder="Paste a txid to inspect confirmation progress"
                  />
                  <Button variant="outline" className="rounded-xl" onClick={() => fetchComparison()}>
                    Inspect
                  </Button>
                </div>
                <p className="text-xs text-zinc-500">
                  The inspector checks the mempool first, then the latest{" "}
                  {comparison?.chain.searchDepth ?? 25} blocks for the
                  transaction.
                </p>
              </div>

              {comparison?.transaction ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="truncate font-medium text-zinc-900">
                      {comparison.transaction.txid}
                    </div>
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
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-4 text-sm text-zinc-500">
                  Paste a regtest txid when you want to demonstrate the live
                  confirmation lifecycle during the presentation.
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
