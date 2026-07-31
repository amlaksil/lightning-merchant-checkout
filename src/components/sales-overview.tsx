"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BanknoteArrowUp, Clock3, Loader2, Receipt, Zap } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Checkout } from "@/types/checkout";

const POLL_INTERVAL_MS = 10_000;

interface CheckoutListResponse {
  items: Checkout[];
}

const formatEtb = (amount: number) =>
  `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

const metricCards = [
  { key: "revenueEtb", label: "Today’s Sales", icon: BanknoteArrowUp },
  { key: "paidOrders", label: "Paid Orders", icon: Receipt },
  { key: "pendingOrders", label: "Pending Orders", icon: Clock3 },
  { key: "revenueSats", label: "Revenue (sats)", icon: Zap },
] as const;

export function SalesOverview() {
  const [sales, setSales] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    try {
      const response = await fetch("/api/checkouts?limit=25", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load sales overview");
      }

      const data = (await response.json()) as CheckoutListResponse;
      setSales(data.items);
    } catch (error) {
      console.error("Error loading sales overview:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
    const interval = setInterval(fetchSales, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchSales]);

  const summary = useMemo(() => {
    const todayFloor = startOfToday();
    const todaysSales = sales.filter(
      (sale) => new Date(sale.createdAt).getTime() >= todayFloor
    );
    const paidSales = todaysSales.filter((sale) => sale.status === "paid");
    const pendingSales = todaysSales.filter((sale) => sale.status === "pending");

    return {
      revenueEtb: formatEtb(
        paidSales.reduce((sum, sale) => sum + sale.displayAmount, 0)
      ),
      paidOrders: paidSales.length.toLocaleString(),
      pendingOrders: pendingSales.length.toLocaleString(),
      revenueSats: `${paidSales
        .reduce((sum, sale) => sum + sale.amountSats, 0)
        .toLocaleString()} sats`,
    };
  }, [sales]);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metricCards.map((metric) => (
        <Card key={metric.key} className="rounded-2xl border-zinc-200 bg-white shadow-sm">
          <CardContent className="flex items-start justify-between p-5">
            <div className="space-y-2">
              <div className="text-sm font-medium text-zinc-500">{metric.label}</div>
              <div className="text-2xl font-semibold tracking-tight text-zinc-950">
                {loading ? "—" : summary[metric.key]}
              </div>
              <div className="text-xs text-zinc-500">Live merchant snapshot from recent checkout activity</div>
            </div>
            <div className="rounded-xl bg-zinc-100 p-2 text-zinc-900">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <metric.icon className="h-4 w-4" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
