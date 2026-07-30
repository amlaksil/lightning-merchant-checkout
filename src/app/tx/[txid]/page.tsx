import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { TransactionDetails } from "./transaction-details";

export default async function TransactionPage(props: {
  params: Promise<{ txid: string }>;
}) {
  const { txid } = await props.params;

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="flex items-center gap-2 mb-8">
        <Link
          href="/explorer"
          className="text-zinc-600 hover:text-zinc-800 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Explorer
        </Link>
      </div>

      <TransactionDetails txid={txid} />
    </div>
  );
}
