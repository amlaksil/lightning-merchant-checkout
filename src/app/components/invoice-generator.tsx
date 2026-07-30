"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Copy,
  Loader2,
  RotateCcw,
  TimerReset,
} from "lucide-react";

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
            toast.success("Checkout paid", {
              description: "The customer payment settled successfully.",
            });
          }

          if (
            previousCheckout?.status === "pending" &&
            nextCheckout.status === "expired"
          ) {
            toast.error("Checkout expired", {
              description: "Create a new payment request for the customer.",
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

  const resetCheckoutForm = () => {
    setDisplayAmount("");
    setMemo("");
    setMerchantRef("");
    setError("");
    setCheckout(null);
    setCheckingPayment(false);
    setCountdownMs(0);
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
      description: "The checkout payment request is now in your clipboard.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create Merchant Checkout</CardTitle>
        <CardDescription>
          Price in ETB, settle in sats, and track payment state through the new
          checkout API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display-amount">Customer Price (ETB)</Label>
          <Input
            id="display-amount"
            type="number"
            min="1"
            step="0.01"
            value={displayAmount}
            onChange={(event) => setDisplayAmount(event.target.value)}
            placeholder="Enter amount in ETB"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="memo">Item Description</Label>
          <Textarea
            id="memo"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="Describe what the customer is paying for"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="merchant-ref">Order Reference</Label>
          <Input
            id="merchant-ref"
            value={merchantRef}
            onChange={(event) => setMerchantRef(event.target.value)}
            placeholder="Optional merchant-side reference"
          />
        </div>

        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}

        {checkout && amountPreview && (
          <div
            className={cn(
              "mt-6 space-y-4 transition-all duration-500",
              checkout.status === "paid" && "opacity-60"
            )}
          >
            {checkout.status === "paid" ? (
              <div className="flex flex-col items-center justify-center py-8 text-green-600">
                <CheckCircle2 className="h-24 w-24 animate-in zoom-in" />
                <p className="mt-4 text-lg font-medium">Checkout Paid</p>
                <p className="text-sm text-muted-foreground">
                  {amountPreview.displayAmount} settled as {amountPreview.settlementAmount}
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href={`/checkout/${checkout.id}`}>View receipt</Link>
                </Button>
              </div>
            ) : checkout.status === "expired" || amountPreview.isExpiredInUi ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center text-destructive">
                <TimerReset className="mx-auto h-12 w-12" />
                <p className="mt-4 text-lg font-medium">Checkout expired</p>
                <p className="mt-2 text-sm">
                  The payment window closed before settlement. Create a new sale
                  to generate a fresh invoice.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="rounded-lg bg-white p-4">
                    <QRCodeSVG value={checkout.paymentRequest} size={200} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Payment Request</Label>
                    <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <p className="break-all font-mono text-xs">
                      {checkout.paymentRequest}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Customer Price:</span>{" "}
                    {amountPreview.displayAmount}
                  </div>
                  <div>
                    <span className="font-medium">Lightning Amount:</span>{" "}
                    {amountPreview.settlementAmount}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <span className="capitalize">{checkout.status}</span>
                  </div>
                  <div>
                    <span className="font-medium">Time left:</span>{" "}
                    {amountPreview.countdown}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Expires at:</span>{" "}
                    {amountPreview.expiresAt}
                  </div>
                </div>
                {checkingPayment && checkout.status === "pending" && (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <span>Waiting for customer payment...</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button
          className="flex-1"
          onClick={handleCreateCheckout}
          disabled={loading || Number(displayAmount) <= 0}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating checkout...
            </>
          ) : (
            "Create Checkout"
          )}
        </Button>
        {checkout && (
          <Button variant="outline" onClick={resetCheckoutForm}>
            <RotateCcw className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
