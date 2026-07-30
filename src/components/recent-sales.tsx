"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Loader2, RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkout, CheckoutStatus } from "@/types/checkout";

const POLL_INTERVAL_MS = 10_000;

const formatDisplayAmount = (checkout: Checkout) => {
  if (checkout.displayCurrency === "SAT") {
    return `${checkout.displayAmount.toLocaleString()} sats`;
  }

  return `${checkout.displayAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
};

const formatCreatedAt = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const statusClasses: Record<CheckoutStatus, string> = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  expired: "border-red-200 bg-red-50 text-red-700",
};

interface CheckoutListResponse {
  items: Checkout[];
}

export function RecentSales() {
  const [sales, setSales] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecentSales = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setRefreshing(true);
    }

    try {
      const response = await fetch("/api/checkouts?limit=25", {
        cache: "no-store",
      });
      const data = (await response.json()) as CheckoutListResponse | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error ? data.error : "Failed to load recent sales"
        );
      }

      setSales((data as CheckoutListResponse).items);
      setError("");
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load recent sales"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentSales({ silent: true });

    const interval = setInterval(() => {
      fetchRecentSales({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchRecentSales]);

  const summary = useMemo(() => {
    const paidSales = sales.filter((sale) => sale.status === "paid");
    const pendingSales = sales.filter((sale) => sale.status === "pending");

    return {
      totalSales: sales.length,
      paidSales: paidSales.length,
      pendingSales: pendingSales.length,
      totalEtb: paidSales.reduce((sum, sale) => sum + sale.displayAmount, 0),
      totalSats: paidSales.reduce((sum, sale) => sum + sale.amountSats, 0),
    };
  }, [sales]);

  return (
    <Card className="w-full rounded-3xl border-zinc-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>Live Sales Feed</CardTitle>
          <CardDescription>
            Merchant activity across the most recent checkout sessions.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchRecentSales()}
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
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">Paid / Pending</div>
            <div className="mt-2 text-2xl font-semibold text-zinc-950">
              {summary.paidSales} / {summary.pendingSales}
            </div>
            <div className="mt-1 text-xs text-zinc-500">Across {summary.totalSales} recent checkout sessions</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">Settled revenue</div>
            <div className="mt-2 text-lg font-semibold text-zinc-950">
              {summary.totalEtb.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {summary.totalSats.toLocaleString()} sats collected
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-zinc-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading recent sales...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : sales.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-zinc-500">
            No checkout sessions yet. Create the first sale to populate this dashboard.
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-medium text-zinc-950">
                      {sale.memo || "Merchant checkout"}
                    </div>
                    <div className="text-xs text-zinc-500">{formatCreatedAt(sale.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusClasses[sale.status]} variant="outline">
                      {sale.status}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild className="rounded-xl px-2 text-zinc-700">
                      <Link href={`/checkout/${sale.id}`}>
                        Details
                        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-zinc-200 bg-white p-3">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">Customer price</div>
                    <div className="mt-1 font-semibold text-zinc-950">{formatDisplayAmount(sale)}</div>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-white p-3">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">Lightning amount</div>
                    <div className="mt-1 font-semibold text-zinc-950">{sale.amountSats.toLocaleString()} sats</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
                  <div>Receipt ID: <span className="font-medium text-zinc-700">{sale.id.slice(0, 8)}</span></div>
                  <div>Order ID: <span className="font-medium text-zinc-700">{sale.merchantRef || "—"}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
