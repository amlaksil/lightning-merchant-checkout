"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";

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

const getStatusVariant = (status: CheckoutStatus) => {
  switch (status) {
    case "paid":
      return "default";
    case "expired":
      return "destructive";
    default:
      return "outline";
  }
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
      const response = await fetch("/api/checkouts?limit=10", {
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

  const totals = useMemo(() => {
    const paidSales = sales.filter((sale) => sale.status === "paid");

    return {
      totalSales: sales.length,
      paidSales: paidSales.length,
      totalSats: paidSales.reduce((sum, sale) => sum + sale.amountSats, 0),
    };
  }, [sales]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>
            Latest 10 checkout sessions from the Supabase-backed merchant flow.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchRecentSales()}
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
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <div className="text-zinc-500">Sessions</div>
            <div className="text-lg font-semibold text-zinc-900">
              {totals.totalSales}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-zinc-500">Paid</div>
            <div className="text-lg font-semibold text-zinc-900">
              {totals.paidSales}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-zinc-500">Settled</div>
            <div className="text-lg font-semibold text-zinc-900">
              {totals.totalSats.toLocaleString()} sats
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
                className="rounded-lg border p-4 text-sm text-zinc-700"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="font-medium text-zinc-900">
                    {sale.memo || "Merchant checkout"}
                  </div>
                  <Badge variant={getStatusVariant(sale.status)}>
                    {sale.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-500">Customer price:</span>{" "}
                    {formatDisplayAmount(sale)}
                  </div>
                  <div>
                    <span className="text-zinc-500">Lightning amount:</span>{" "}
                    {sale.amountSats.toLocaleString()} sats
                  </div>
                  <div>
                    <span className="text-zinc-500">Created:</span>{" "}
                    {formatCreatedAt(sale.createdAt)}
                  </div>
                  <div>
                    <span className="text-zinc-500">Reference:</span>{" "}
                    {sale.merchantRef || "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
