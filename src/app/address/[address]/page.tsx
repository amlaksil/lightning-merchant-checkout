import Link from "next/link";

import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { BitcoinCLI } from "@/lib/bitcoin-cli";

interface AddressPageProps {
  params: Promise<{
    address: string;
  }>;
}

export default async function AddressPage(props: AddressPageProps) {
  const params = await props.params;
  const bitcoin = new BitcoinCLI();
  const addressInfo = await bitcoin.getAddressOverview(params.address);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">
          Address Details
        </h1>
        <div className="flex items-center gap-2">
          <p className="font-mono text-sm break-all">{addressInfo.address}</p>
          <CopyButton text={addressInfo.address} />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Overview</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-zinc-500">Type</span>
                <p className="text-zinc-900">
                  {addressInfo.iswitness
                    ? `Witness v${addressInfo.witness_version}`
                    : addressInfo.isscript
                    ? "Script"
                    : "Legacy"}
                </p>
              </div>
              <div>
                <span className="text-sm text-zinc-500">Script PubKey</span>
                <p className="font-mono text-sm break-all text-zinc-900">
                  {addressInfo.scriptPubKey}
                </p>
              </div>
              {addressInfo.witness_program && (
                <div>
                  <span className="text-sm text-zinc-500">Witness Program</span>
                  <p className="font-mono text-sm break-all text-zinc-900">
                    {addressInfo.witness_program}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Balance</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-zinc-500">Current Balance</span>
                <p className="text-2xl font-bold text-zinc-900">
                  {addressInfo.balance.toFixed(8)} BTC
                </p>
              </div>
              <div>
                <span className="text-sm text-zinc-500">Unspent Outputs</span>
                <p className="text-zinc-900">
                  {addressInfo.unspent_txouts.length} UTXO
                  {addressInfo.unspent_txouts.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Unspent Transaction Outputs
          </h2>
          {addressInfo.unspent_txouts.length === 0 ? (
            <p className="text-zinc-500">No unspent outputs found</p>
          ) : (
            <div className="space-y-3">
              {addressInfo.unspent_txouts.map((utxo) => (
                <div
                  key={`${utxo.txid}-${utxo.vout}`}
                  className="bg-zinc-50 p-3 rounded-lg border border-zinc-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/tx/${utxo.txid}`}
                      className="font-mono text-sm text-blue-600 hover:text-blue-800"
                    >
                      {utxo.txid.substring(0, 10)}...
                      {utxo.txid.substring(utxo.txid.length - 10)}
                    </Link>
                    <span className="font-mono font-medium">
                      {utxo.amount.toFixed(8)} BTC
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    Output Index: {utxo.vout} | Block Height: {utxo.height}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
