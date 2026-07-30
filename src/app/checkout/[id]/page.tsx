import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ReceiptText,
  ShieldCheck,
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
    <div className="min-h-screen bg-zinc-50 px-4 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Button variant="outline" className="w-fit rounded-xl bg-white" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to checkout
            </Link>
          </Button>
          <Badge
            variant={getStatusVariant(checkout.status)}
            className="w-fit rounded-full px-3 py-1"
          >
            {checkout.status}
          </Badge>
        </div>

        <Card className="rounded-3xl border-zinc-200 bg-white shadow-sm">
          <CardHeader className="space-y-4 border-b border-zinc-100">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Ethio Lightning Checkout
                  </div>
                  <CardTitle className="text-3xl text-zinc-950">
                    Merchant Receipt
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-sm leading-6">
                    Receipt for checkout session <span className="font-medium text-zinc-700">{checkout.id}</span>.
                    This record shows the customer price, Lightning settlement,
                    and merchant settlement metadata.
                  </CardDescription>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Receipt ID
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-950">
                      {checkout.id.slice(0, 8)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Order ID
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-950">
                      {checkout.merchantRef || "—"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Status
                    </div>
                    <div className="mt-1 text-sm font-semibold capitalize text-zinc-950">
                      {checkout.status}
                    </div>
                  </div>
                </div>
              </div>

              {checkout.status === "paid" ? (
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              ) : checkout.status === "pending" ? (
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                  <Clock3 className="h-10 w-10" />
                </div>
              ) : (
                <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                  <ReceiptText className="h-10 w-10" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Customer price
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                  {formatDisplayAmount(checkout)}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Lightning amount
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                  {checkout.amountSats.toLocaleString()} sats
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-950">
                  <ReceiptText className="h-4 w-4" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Order details
                  </h2>
                </div>
                <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-zinc-500">Item / Service</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {checkout.memo || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">Order ID</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {checkout.merchantRef || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">Created at</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {formatDateTime(checkout.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">Expires at</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {formatDateTime(checkout.expiresAt)}
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-950">
                  <ShieldCheck className="h-4 w-4" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Settlement details
                  </h2>
                </div>
                <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-zinc-500">Paid at</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {formatDateTime(checkout.paidAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">Settlement duration</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {formatSettlementMs(checkout.settlementMs)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">Rate source</div>
                    <div className="mt-1 text-sm font-medium capitalize text-zinc-900">
                      {checkout.rateSource}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">BTC/ETB snapshot</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {checkout.btcEtbRate.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <Separator />

            <details className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <summary className="cursor-pointer list-none text-sm font-medium text-zinc-950">
                Show technical details
              </summary>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-sm text-zinc-500">Full checkout ID</div>
                  <div className="mt-1 break-all font-mono text-xs text-zinc-700">
                    {checkout.id}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500">Payment request</div>
                  <div className="mt-1 rounded-xl bg-white p-4 font-mono text-xs break-all text-zinc-700">
                    {checkout.paymentRequest}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500">Payment hash</div>
                  <div className="mt-1 break-all font-mono text-xs text-zinc-700">
                    {checkout.rHash}
                  </div>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
