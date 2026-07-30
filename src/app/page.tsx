"use client";

import { useState } from "react";
import { BanknoteArrowUp, ReceiptText, Zap } from "lucide-react";

import { InvoiceGenerator } from "@/app/components/invoice-generator";
import { OnchainLightningCompare } from "@/components/onchain-lightning-compare";
import { RecentSales } from "@/components/recent-sales";
import { SalesOverview } from "@/components/sales-overview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkout } from "@/types/checkout";

const valueProps = [
  {
    title: "Price in ETB",
    description: "Merchants think in birr while the app settles every checkout in sats.",
    icon: BanknoteArrowUp,
  },
  {
    title: "Instant settlement",
    description: "Generate a Lightning invoice, collect payment, and confirm the sale immediately.",
    icon: Zap,
  },
  {
    title: "Stored receipts",
    description: "Every checkout is tracked with receipt details and payment lifecycle.",
    icon: ReceiptText,
  },
];

export default function HomePage() {
  const [activeCheckout, setActiveCheckout] = useState<Checkout | null>(null);

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="grid gap-8 px-6 py-8 md:px-10 md:py-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-center">
            <div className="space-y-5">
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-xs">
                Merchant POS Demo
              </Badge>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-950 md:text-5xl">
                  Ethio Lightning Checkout
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-zinc-600 md:text-base">
                  Accept ETB-priced payments, settle instantly over Lightning, and keep a live
                  merchant record of receipts and sales.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {valueProps.map((item) => (
                <Card key={item.title} className="border-zinc-200 bg-zinc-50/80">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="rounded-xl bg-zinc-950 p-2 text-white">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-zinc-950">{item.title}</div>
                      <p className="text-sm leading-5 text-zinc-600">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <SalesOverview />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
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
