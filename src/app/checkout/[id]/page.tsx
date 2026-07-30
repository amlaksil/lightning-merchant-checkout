import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { checkoutService } from "@/lib/checkout-service";
import { Checkout, CheckoutStatus } from "@/types/checkout";

interface CheckoutPageProps {
  params: Promise<{
    id: string;
  }>;
}

const formatDisplayAmount = (checkout: Checkout) => {
  if (checkout.displayCurrency === "SAT") {
    return `${checkout.displayAmount.toLocaleString()} sats`;
  }

  return `${checkout.displayAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatSettlementMs = (settlementMs: number | null) => {
  if (settlementMs === null) {
    return "—";
  }

  const totalSeconds = Math.max(0, Math.round(settlementMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
};

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

export default async function CheckoutReceiptPage({
  params,
}: CheckoutPageProps) {
  const { id } = await params;
  const checkout = await checkoutService.getCheckoutById(id);

  if (!checkout) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to checkout
            </Link>
          </Button>
          <Badge variant={getStatusVariant(checkout.status)}>
            {checkout.status}
          </Badge>
        </div>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Checkout Receipt</CardTitle>
                <CardDescription>
                  Merchant-facing details for checkout session `{checkout.id}`.
                </CardDescription>
              </div>
              {checkout.status === "paid" ? (
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              ) : checkout.status === "pending" ? (
                <Clock3 className="h-10 w-10 text-zinc-500" />
              ) : (
                <ReceiptText className="h-10 w-10 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-zinc-500">Customer price</div>
                <div className="mt-1 text-2xl font-semibold text-zinc-900">
                  {formatDisplayAmount(checkout)}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-zinc-500">Lightning amount</div>
                <div className="mt-1 text-2xl font-semibold text-zinc-900">
                  {checkout.amountSats.toLocaleString()} sats
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-zinc-500">Item description</div>
                <div className="mt-1 text-sm text-zinc-900">
                  {checkout.memo || "—"}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Order reference</div>
                <div className="mt-1 text-sm text-zinc-900">
                  {checkout.merchantRef || "—"}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Created at</div>
                <div className="mt-1 text-sm text-zinc-900">
                  {formatDateTime(checkout.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Expires at</div>
                <div className="mt-1 text-sm text-zinc-900">
                  {formatDateTime(checkout.expiresAt)}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Paid at</div>
                <div className="mt-1 text-sm text-zinc-900">
                  {formatDateTime(checkout.paidAt)}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Settlement duration</div>
                <div className="mt-1 text-sm text-zinc-900">
                  {formatSettlementMs(checkout.settlementMs)}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Rate source</div>
                <div className="mt-1 text-sm text-zinc-900">
                  {checkout.rateSource}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">BTC/ETB snapshot</div>
                <div className="mt-1 text-sm text-zinc-900">
                  {checkout.btcEtbRate.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm text-zinc-500">Payment request</div>
              <div className="rounded-lg bg-zinc-50 p-4 font-mono text-xs text-zinc-700 break-all">
                {checkout.paymentRequest}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
