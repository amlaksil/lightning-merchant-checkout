"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CircleAlert,
  CheckCircle2,
  Copy,
  Loader2,
  ReceiptText,
  RotateCcw,
  ScanLine,
  TimerReset,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Checkout } from "@/types/checkout";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 2_000;
const DEFAULT_EXPIRY_SECONDS = 3_600;
const QUICK_PRODUCTS = [
  { label: "Coffee", amount: 150, memo: "Coffee" },
  { label: "Snack", amount: 300, memo: "Snack" },
  { label: "T-Shirt", amount: 5000, memo: "T-Shirt" },
  { label: "Custom", amount: null, memo: "" },
] as const;

const formatCurrency = (amount: number, currency: "ETB" | "SAT") => {
  if (currency === "SAT") {
    return `${amount.toLocaleString()} sats`;
  }

  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const formatSettlementDuration = (settlementMs?: number | null) => {
  if (!settlementMs || settlementMs < 1000) {
    return "Under 1 second";
  }

  const totalSeconds = Math.round(settlementMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (!minutes) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
};

const getRemainingMs = (expiresAt: string) =>
  Math.max(0, new Date(expiresAt).getTime() - Date.now());

const formatCountdown = (remainingMs: number) => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

interface InvoiceGeneratorProps {
  onCheckoutChange?: (checkout: Checkout | null) => void;
}

export function InvoiceGenerator({ onCheckoutChange }: InvoiceGeneratorProps) {
  const [displayAmount, setDisplayAmount] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [merchantRef, setMerchantRef] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [checkingPayment, setCheckingPayment] = useState<boolean>(false);
  const [countdownMs, setCountdownMs] = useState<number>(0);

  useEffect(() => {
    onCheckoutChange?.(checkout);
  }, [checkout, onCheckoutChange]);

  useEffect(() => {
    if (!checkout || checkout.status !== "pending") {
      setCountdownMs(0);
      return;
    }

    setCountdownMs(getRemainingMs(checkout.expiresAt));
    const interval = setInterval(() => {
      setCountdownMs(getRemainingMs(checkout.expiresAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [checkout]);

  useEffect(() => {
    if (!checkout || checkout.status !== "pending") {
      setCheckingPayment(false);
      return;
    }

    setCheckingPayment(true);
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/checkouts/${checkout.id}/refresh`, {
          method: "POST",
        });
        if (!response.ok) {
          throw new Error("Failed to refresh checkout status");
        }

        const nextCheckout = (await response.json()) as Checkout;

        setCheckout((previousCheckout) => {
          if (
            previousCheckout?.status === "pending" &&
            nextCheckout.status === "paid"
          ) {
            toast.success("Payment received", {
              description: "The Lightning payment settled successfully.",
            });
          }

          if (
            previousCheckout?.status === "pending" &&
            nextCheckout.status === "expired"
          ) {
            toast.error("Checkout expired", {
              description: "Create a new sale to generate a fresh invoice.",
            });
          }

          return nextCheckout;
        });
      } catch (refreshError) {
        console.error("Error refreshing checkout status:", refreshError);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(pollInterval);
      setCheckingPayment(false);
    };
  }, [checkout]);

  const amountPreview = useMemo(() => {
    if (!checkout) {
      return null;
    }

    return {
      displayAmount: formatCurrency(
        checkout.displayAmount,
        checkout.displayCurrency
      ),
      settlementAmount: formatCurrency(checkout.amountSats, "SAT"),
      expiresAt: formatDateTime(checkout.expiresAt),
      countdown: formatCountdown(countdownMs),
      isExpiredInUi: countdownMs <= 0,
    };
  }, [checkout, countdownMs]);

  const selectedPreset = useMemo(() => {
    const amount = Number(displayAmount);

    return QUICK_PRODUCTS.find((product) => {
      if (product.amount === null) {
        return false;
      }

      return product.amount === amount && product.memo === memo;
    })?.label;
  }, [displayAmount, memo]);

  const resetCheckoutForm = () => {
    setDisplayAmount("");
    setMemo("");
    setMerchantRef("");
    setError("");
    setCheckout(null);
    setCheckingPayment(false);
    setCountdownMs(0);
  };

  const applyPreset = (product: (typeof QUICK_PRODUCTS)[number]) => {
    if (product.amount !== null) {
      setDisplayAmount(String(product.amount));
    }

    setMemo(product.memo);
    setError("");
  };

  const handleCreateCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayAmount: Number(displayAmount),
          displayCurrency: "ETB",
          memo,
          merchantRef,
          expirySeconds: DEFAULT_EXPIRY_SECONDS,
        }),
      });

      const data = (await response.json()) as Checkout | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Failed to create checkout"
        );
      }

      setCheckout(data as Checkout);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "An unexpected error occurred"
      );
      console.error(checkoutError);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!checkout?.paymentRequest) {
      return;
    }

    navigator.clipboard.writeText(checkout.paymentRequest);
    toast.success("Payment request copied", {
      description: "The Lightning invoice is now in your clipboard.",
    });
  };

  const isCreateDisabled = loading || Number(displayAmount) <= 0;

  return (
    <Card className="w-full rounded-3xl border-zinc-200 bg-white shadow-sm">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl text-zinc-950">Merchant Point of Sale</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-zinc-600">
              Pick a preset or enter a custom amount, then generate a Lightning payment request
              that settles in sats while keeping ETB pricing visible for the merchant.
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-xs">
            ETB pricing · LN settlement
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_PRODUCTS.map((product) => {
            const isActive =
              product.amount === null
                ? !selectedPreset && displayAmount.length > 0
                : selectedPreset === product.label;

            return (
              <button
                key={product.label}
                type="button"
                onClick={() => applyPreset(product)}
                className={cn(
                  "rounded-2xl border px-4 py-4 text-left transition-colors",
                  isActive
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-zinc-300 hover:bg-zinc-100"
                )}
              >
                <div className="text-sm font-medium">{product.label}</div>
                <div className={cn("mt-1 text-xs", isActive ? "text-zinc-300" : "text-zinc-500")}>
                  {product.amount === null
                    ? "Enter a custom ETB amount"
                    : `${product.amount.toLocaleString()} ETB`}
                </div>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="display-amount">Amount (ETB)</Label>
            <Input
              id="display-amount"
              type="number"
              min="1"
              step="0.01"
              value={displayAmount}
              onChange={(event) => setDisplayAmount(event.target.value)}
              placeholder="Enter customer price"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="merchant-ref">Order ID</Label>
            <Input
              id="merchant-ref"
              value={merchantRef}
              onChange={(event) => setMerchantRef(event.target.value)}
              placeholder="Optional merchant order reference"
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="memo">Item / Service</Label>
          <Textarea
            id="memo"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="What is the customer paying for?"
            className="min-h-[96px]"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}

        {checkout && amountPreview && (
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50/70 p-5">
            {checkout.status === "paid" ? (
              <div className="space-y-5 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-white p-3 text-emerald-600 shadow-sm">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">
                        Payment received
                      </div>
                      <p className="text-2xl font-semibold text-zinc-950">
                        {amountPreview.displayAmount}
                      </p>
                      <p className="text-sm text-zinc-600">
                        Settled instantly as {amountPreview.settlementAmount}
                      </p>
                    </div>
                  </div>
                  <Badge className="w-fit rounded-full border-emerald-200 bg-white px-3 py-1 text-emerald-700" variant="outline">
                    paid
                  </Badge>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-200/60 bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">Receipt ID</div>
                    <div className="mt-1 text-sm font-semibold text-zinc-950">
                      {checkout.id.slice(0, 8)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-200/60 bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">Order ID</div>
                    <div className="mt-1 text-sm font-semibold text-zinc-950">
                      {checkout.merchantRef || "—"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-200/60 bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">Settlement time</div>
                    <div className="mt-1 text-sm font-semibold text-zinc-950">
                      {formatSettlementDuration(checkout.settlementMs)}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200/60 bg-white p-4 text-sm text-zinc-700">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-zinc-500">Item / Service</div>
                      <div className="mt-1 font-medium text-zinc-950">{memo || "Merchant sale"}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">Paid at</div>
                      <div className="mt-1 font-medium text-zinc-950">
                        {checkout.paidAt ? formatDateTime(checkout.paidAt) : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button className="rounded-xl bg-zinc-950 text-white hover:bg-zinc-800" asChild>
                    <Link href={`/checkout/${checkout.id}`}>
                      <ReceiptText className="mr-2 h-4 w-4" />
                      View receipt
                    </Link>
                  </Button>
                  <Button variant="outline" className="rounded-xl bg-white" onClick={resetCheckoutForm}>
                    Start new sale
                  </Button>
                </div>
              </div>
            ) : checkout.status === "expired" || amountPreview.isExpiredInUi ? (
              <div className="space-y-5 rounded-3xl border border-red-200 bg-red-50/70 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-white p-3 text-red-600 shadow-sm">
                      <TimerReset className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium uppercase tracking-[0.2em] text-red-700">
                        Invoice expired
                      </div>
                      <p className="text-2xl font-semibold text-zinc-950">
                        {amountPreview.displayAmount}
                      </p>
                      <p className="text-sm text-zinc-600">
                        The customer did not pay before the expiry window ended.
                      </p>
                    </div>
                  </div>
                  <Badge className="w-fit rounded-full border-red-200 bg-white px-3 py-1 text-red-700" variant="outline">
                    expired
                  </Badge>
                </div>

                <div className="rounded-2xl border border-red-200/60 bg-white p-4 text-sm text-zinc-700">
                  <div className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-4 w-4 text-red-600" />
                    <div className="space-y-1">
                      <p className="font-medium text-zinc-950">Action required</p>
                      <p>
                        Generate a fresh payment request to continue this sale. The current invoice
                        can no longer be paid reliably.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-red-200/60 bg-white p-4 text-sm">
                    <div className="text-zinc-500">Item / Service</div>
                    <div className="mt-1 font-medium text-zinc-950">{memo || "Merchant sale"}</div>
                  </div>
                  <div className="rounded-2xl border border-red-200/60 bg-white p-4 text-sm">
                    <div className="text-zinc-500">Expired at</div>
                    <div className="mt-1 font-medium text-zinc-950">{amountPreview.expiresAt}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button className="rounded-xl bg-zinc-950 text-white hover:bg-zinc-800" onClick={resetCheckoutForm}>
                    Create fresh invoice
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)] xl:items-start">
                <div className="mx-auto rounded-3xl border border-zinc-200 bg-white p-4">
                  <QRCodeSVG value={checkout.paymentRequest} size={208} />
                </div>

                <div className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-950">Active customer checkout</p>
                      <p className="text-xs text-zinc-500">
                        Ask the customer to scan the QR code or copy the Lightning invoice
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="border-amber-200 bg-amber-50 px-3 py-1 text-amber-700" variant="outline">
                        waiting for payment
                      </Badge>
                      <Badge variant="outline" className="px-3 py-1">{amountPreview.countdown} left</Badge>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">Customer price</div>
                      <div className="mt-2 text-2xl font-semibold text-zinc-950">
                        {amountPreview.displayAmount}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">Settlement amount</div>
                      <div className="mt-2 text-2xl font-semibold text-zinc-950">
                        {amountPreview.settlementAmount}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm">
                      <div className="text-zinc-500">Item / Service</div>
                      <div className="mt-1 font-medium text-zinc-950">{memo || "Merchant sale"}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm">
                      <div className="text-zinc-500">Order ID</div>
                      <div className="mt-1 font-medium text-zinc-950">{merchantRef || "—"}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm">
                    <div className="flex items-start gap-3">
                      <ScanLine className="mt-0.5 h-4 w-4 text-zinc-600" />
                      <div className="space-y-1">
                        <div className="font-medium text-zinc-950">Customer instructions</div>
                        <div className="text-zinc-600">
                          Scan the QR code with a Lightning wallet, approve the invoice, and wait
                          for the merchant screen to confirm the payment.
                        </div>
                        <div className="text-xs text-zinc-500">
                          Invoice expires at {amountPreview.expiresAt}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Lightning invoice</Label>
                      <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <p className="break-all font-mono text-xs text-zinc-600">
                        {checkout.paymentRequest}
                      </p>
                    </div>
                  </div>

                  {checkingPayment && checkout.status === "pending" && (
                    <div className="flex items-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Merchant screen is watching for settlement...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-zinc-100 pt-6 sm:flex-row">
        <Button
          className="h-11 flex-1 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800"
          onClick={handleCreateCheckout}
          disabled={isCreateDisabled}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating invoice...
            </>
          ) : (
            "Generate payment request"
          )}
        </Button>
        {(checkout || displayAmount || memo || merchantRef) && (
          <Button variant="outline" className="h-11 rounded-xl" onClick={resetCheckoutForm}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset sale
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
