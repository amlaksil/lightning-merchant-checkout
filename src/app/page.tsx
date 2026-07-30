"use client";

import { useState } from "react";

import { InvoiceGenerator } from "@/app/components/invoice-generator";
import { OnchainLightningCompare } from "@/components/onchain-lightning-compare";
import { RecentSales } from "@/components/recent-sales";
import { Checkout } from "@/types/checkout";

export default function HomePage() {
  const [activeCheckout, setActiveCheckout] = useState<Checkout | null>(null);

  return (
    <div className="min-h-screen bg-white px-4 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-3xl font-bold text-zinc-900">
            Lightning Merchant Checkout
          </h1>
          <p className="max-w-3xl text-sm text-zinc-600">
            Create an ETB-priced checkout, collect Lightning payment in sats,
            and track merchant sales through the new Supabase-backed checkout API.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] xl:items-start">
          <div className="space-y-8">
            <InvoiceGenerator onCheckoutChange={setActiveCheckout} />
            <OnchainLightningCompare activeCheckout={activeCheckout} />
          </div>
          <RecentSales />
        </div>
      </div>
    </div>
  );
}
