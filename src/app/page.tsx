"use client";

import { InvoiceGenerator } from "@/app/components/invoice-generator";

export default function HomePage() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md px-4 py-8">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900">
            Lightning Merchant Checkout
          </h1>
          <p className="text-sm text-zinc-600">
            Create a checkout invoice, collect a Lightning payment, and use this
            flow as the base for the ETB + Supabase merchant experience.
          </p>
        </div>
        <InvoiceGenerator />
      </div>
    </div>
  );
}
