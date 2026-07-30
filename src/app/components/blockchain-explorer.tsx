"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { BlockInfo, TransactionInfo } from "@/types/bitcoin-cli";

interface BlockData {
  height: number;
  hash: string;
  timestamp: number;
  size: number;
  weight: number;
  transactions: TransactionInfo[];
  miner: string;
  difficulty: number;
  fees: number;
}

interface SearchResult {
  type: "block" | "transaction" | "address";
  data: BlockInfo | TransactionInfo | AddressResult;
}

interface ApiBlockData {
  height: number;
  hash: string;
  time: number;
  size: number;
  weight: number;
  tx: TransactionInfo[];
  difficulty: number;
  stats?: {
    miner?: string;
    totalfee?: number;
  };
}

interface MempoolData {
  info: {
    size: number;
    bytes: number;
    usage: number;
    maxmempool: number;
    mempoolminfee: number;
    minrelaytxfee: number;
  };
  transactions: {
    [txid: string]: {
      vsize: number;
      weight: number;
      time: number;
      fees: {
        base: number;
      };
    };
  };
}

interface AddressResult {
  address: string;
  isvalid: boolean;
  scriptPubKey: string;
  isscript: boolean;
  iswitness: boolean;
  witness_version?: number;
  witness_program?: string;
  balance: number;
  unspent_txouts: Array<{
    txid: string;
    vout: number;
    amount: number;
    height: number;
  }>;
  transactions: TransactionInfo[];
}

function Block({
  block,
  onClick,
  isSelected,
}: {
  block: BlockData | null;
  onClick: (block: BlockData) => void;
  isSelected: boolean;
}) {
  if (!block) return null;

  const date = new Date(block.timestamp * 1000);
  const diffTime = Math.abs(Date.now() - date.getTime());
  const diffMinutes = Math.round(diffTime / (1000 * 60));
  const diffHours = Math.round(diffTime / (1000 * 60 * 60));
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30));
  const diffYears = Math.round(diffTime / (1000 * 60 * 60 * 24 * 365));

  const timeAgo = () => {
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffMonths < 12) {
      return `${diffMonths} months ago`;
    } else {
      return `${diffYears} years ago`;
    }
  };

  return (
    <button
      onClick={() => onClick(block)}
      className={cn(
        "relative p-4 rounded-lg border transition-all cursor-pointer min-w-[200px] w-[200px]",
        isSelected
          ? "bg-zinc-100 border-zinc-300 shadow-sm"
          : "bg-white border-zinc-200 hover:border-zinc-300"
      )}
    >
      <div className="text-center">
        <div className="text-sm font-medium text-zinc-900">Block</div>
        <div className="text-2xl font-bold text-zinc-900">{block.height}</div>
        <div className="text-sm text-zinc-500">
          {block.transactions.length} txs
        </div>
        <div className="text-sm text-zinc-500">{timeAgo()}</div>
      </div>
    </button>
  );
}

function BlockDetails({ block }: { block: BlockData | null }) {
  if (!block) return null;

  const formattedData = {
    height: block.height,
    hash: block.hash || "",
    timestamp: block.timestamp || Date.now() / 1000,
    size: block.size || 0,
    weight: block.weight || 0,
    difficulty: block.difficulty || 0,
    fees: block.fees || 0,
    miner: block.miner || "Unknown",
    transactions: block.transactions || [],
  };

  return (
    <div className="mt-8 bg-white border border-zinc-200 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-4">
            Block #{formattedData.height}
          </h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-zinc-500">Hash</div>
              <div className="font-mono text-sm break-all text-zinc-900">
                {formattedData.hash}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-zinc-500">Timestamp</div>
                <div className="text-zinc-900">
                  {new Date(formattedData.timestamp * 1000).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Miner</div>
                <div className="text-zinc-900">{formattedData.miner}</div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Size</div>
                <div className="text-zinc-900">
                  {(formattedData.size / 1000).toFixed(2)} KB
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Weight</div>
                <div className="text-zinc-900">
                  {(formattedData.weight / 1000).toFixed(2)} KWU
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Difficulty</div>
                <div className="text-zinc-900">
                  {formattedData.difficulty.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-500">Fees</div>
                <div className="text-zinc-900">
                  {formattedData.fees.toFixed(8)} BTC
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-zinc-900">Transactions</h3>
            <Badge
              variant="outline"
              className="bg-zinc-50 text-zinc-900 border-zinc-200"
            >
              {formattedData.transactions.length} transaction
              {formattedData.transactions.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto pr-2">
            {formattedData.transactions.map((tx) => {
              const totalOutput =
                tx.vout?.reduce(
                  (sum, output) => sum + (output.value || 0),
                  0
                ) || 0;

              return (
                <div
                  key={tx.txid}
                  className="bg-zinc-50 p-3 rounded-md text-sm border border-zinc-200"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-mono text-xs truncate text-zinc-900 w-full flex items-center gap-1">
                      <Link
                        href={`/tx/${tx.txid}`}
                        className="hover:underline cursor-pointer"
                      >
                        {tx.txid?.slice(0, 10)}...{tx.txid?.slice(-10)}
                      </Link>
                      <CopyButton text={tx.txid} />
                    </div>
                    <Link
                      href={`/tx/${tx.txid}`}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <ArrowUpRight className="h-4 w-4 cursor-pointer" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600">
                    <div>Size: {tx.size || 0} bytes</div>
                    <div>vSize: {tx.vsize || 0} vB</div>
                    <div>Inputs: {tx.vin?.length || 0}</div>
                    <div>Outputs: {tx.vout?.length || 0}</div>
                    <div>
                      Total Output:{" "}
                      <span className="font-mono font-bold">
                        {totalOutput.toFixed(8)} BTC
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MempoolStats({ mempoolData }: { mempoolData: MempoolData | null }) {
  if (!mempoolData) return null;

  const unconfirmedTxs = Object.keys(mempoolData.transactions).length;
  const memoryUsage = `${(mempoolData.info.usage / (1024 * 1024)).toFixed(
    1
  )} MB`;
  const minFee = `${(mempoolData.info.mempoolminfee * 100000000).toFixed(
    1
  )} sat/vB`;
  const medianFee = `${(mempoolData.info.minrelaytxfee * 100000000).toFixed(
    1
  )} sat/vB`;

  const feeRates = {
    low: `${(mempoolData.info.mempoolminfee * 100000000).toFixed(1)} sat/vB`,
    medium: `${(mempoolData.info.minrelaytxfee * 100000000 * 2).toFixed(
      1
    )} sat/vB`,
    high: `${(mempoolData.info.minrelaytxfee * 100000000 * 4).toFixed(
      1
    )} sat/vB`,
    priority: `${(mempoolData.info.minrelaytxfee * 100000000 * 8).toFixed(
      1
    )} sat/vB`,
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <Card className="bg-white border-zinc-200">
          <div className="p-4">
            <div className="text-sm text-zinc-500 mb-1">
              Unconfirmed Transactions
            </div>
            <div className="text-xl font-bold text-zinc-900">
              {unconfirmedTxs.toLocaleString()}
            </div>
          </div>
        </Card>
        <Card className="bg-white border-zinc-200">
          <div className="p-4">
            <div className="text-sm text-zinc-500 mb-1">Memory Usage</div>
            <div className="text-xl font-bold text-zinc-900">{memoryUsage}</div>
          </div>
        </Card>
        <Card className="bg-white border-zinc-200">
          <div className="p-4">
            <div className="text-sm text-zinc-500 mb-1">Minimum Fee</div>
            <div className="text-xl font-bold text-zinc-900">{minFee}</div>
          </div>
        </Card>
        <Card className="bg-white border-zinc-200">
          <div className="p-4">
            <div className="text-sm text-zinc-500 mb-1">Relay Fee</div>
            <div className="text-xl font-bold text-zinc-900">{medianFee}</div>
          </div>
        </Card>
      </div>

      <div className="mt-8 bg-white border border-zinc-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-zinc-900 mb-4">
          Transaction Fees
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-2 bg-zinc-50 rounded-md border border-zinc-200">
            <div className="text-sm text-zinc-500 mb-1">Low Priority</div>
            <div className="text-lg font-bold text-green-600">
              {feeRates.low}
            </div>
          </div>
          <div className="text-center p-2 bg-zinc-50 rounded-md border border-zinc-200">
            <div className="text-sm text-zinc-500 mb-1">Medium Priority</div>
            <div className="text-lg font-bold text-yellow-600">
              {feeRates.medium}
            </div>
          </div>
          <div className="text-center p-2 bg-zinc-50 rounded-md border border-zinc-200">
            <div className="text-sm text-zinc-500 mb-1">High Priority</div>
            <div className="text-lg font-bold text-orange-600">
              {feeRates.high}
            </div>
          </div>
          <div className="text-center p-2 bg-zinc-50 rounded-md border border-zinc-200">
            <div className="text-sm text-zinc-500 mb-1">Urgent Priority</div>
            <div className="text-lg font-bold text-red-600">
              {feeRates.priority}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function BlockchainExplorer() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<BlockData | null>(null);
  const [mempoolData, setMempoolData] = useState<MempoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  async function fetchData() {
    try {
      const [blocksResponse, mempoolResponse] = await Promise.all([
        fetch(`/api/bitcoin/blocks?start=${currentPage}&limit=10`),
        fetch("/api/bitcoin/mempool"),
      ]);

      const blocksData = await blocksResponse.json();
      const mempoolData = await mempoolResponse.json();

      // Transform block data to match UI expectations
      const transformedBlocks = blocksData.map((block: ApiBlockData) => ({
        height: block.height,
        hash: block.hash,
        timestamp: block.time,
        size: block.size,
        weight: block.weight,
        transactions: block.tx || [],
        miner: block.stats?.miner || "Unknown",
        difficulty: block.difficulty,
        fees: block.stats?.totalfee || 0,
      }));

      // Transform mempool data
      const transformedMempool: MempoolData = {
        info: mempoolData.info,
        transactions: mempoolData.transactions,
      };

      setBlocks(transformedBlocks);
      setMempoolData(transformedMempool);

      // Set the first block as selected by default if none is selected
      if (!selectedBlock && transformedBlocks.length > 0) {
        setSelectedBlock(transformedBlocks[0]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch blockchain data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
    // we need to disable this because we want to fetch data on every page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    setCurrentPage((prev) => prev + 1);
  };

  // Calculate visible blocks based on window size
  const visibleBlocks = blocks;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Abort any existing search request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/bitcoin/search?q=${encodeURIComponent(searchQuery.trim())}`,
        {
          signal: abortController.signal,
        }
      );
      const data = await response.json();

      // Only update state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        if (response.ok) {
          setSearchResults(data.results);
          // If we found a block, select it
          const blockResult = data.results.find(
            (r: SearchResult) => r.type === "block"
          );
          if (blockResult) {
            const block = blockResult.data as BlockInfo;
            const fees = block.tx.reduce(
              (sum, tx) =>
                sum +
                tx.vout.reduce((voutSum, vout) => voutSum + vout.value, 0),
              0
            );
            // Convert BlockInfo to BlockData
            setSelectedBlock({
              hash: block.hash,
              height: block.height,
              timestamp: block.time,
              size: block.size,
              weight: block.weight,
              transactions: block.tx,
              miner: "Unknown", // We could parse this from coinbase tx if needed
              difficulty: block.difficulty,
              fees: fees,
            });
          }
        } else {
          toast.error(data.error || "Search failed");
          setSearchResults([]);
        }
      }
    } catch (error) {
      // Only show error if it's not an abort error
      if (!abortController.signal.aborted) {
        console.error("Search error:", error);
        toast.error("Failed to perform search");
        setSearchResults([]);
      }
    } finally {
      // Only update searching state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setIsSearching(false);
      }
    }
  };

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleAddressClick = (address: string) => {
    router.push(`/address/${address}`);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
          <div className="h-64 bg-zinc-200 rounded"></div>
          <div className="h-96 bg-zinc-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">
          Bitcoin Blockchain (signet)
        </h1>
        <form onSubmit={handleSearch} className="relative max-w-md">
          <Input
            type="search"
            placeholder="Search block / transaction / address"
            className="bg-white border-zinc-200 text-zinc-900 min-w-md placeholder:text-zinc-400 pr-20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-zinc-900 text-white rounded-md hover:bg-zinc-800",
              isSearching && "opacity-50 cursor-not-allowed"
            )}
            disabled={isSearching}
          >
            {isSearching ? "..." : "Search"}
          </button>
        </form>
      </div>

      {searchResults.length > 0 && searchResults[0].type !== "block" && (
        <div className="mb-6 space-y-4">
          {searchResults.map((result, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge>
                    {result.type === "transaction" ? "Transaction" : "Address"}
                  </Badge>
                  <div className="mt-2">
                    {result.type === "transaction" && (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-zinc-500">
                            Transaction ID:
                          </p>
                          <Link
                            href={`/tx/${
                              (result.data as TransactionInfo).txid
                            }`}
                            className="hover:underline cursor-pointer"
                          >
                            {(result.data as TransactionInfo).txid}
                          </Link>
                          <CopyButton
                            text={(result.data as TransactionInfo).txid}
                          />
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-zinc-500">Size:</span>{" "}
                            <span className="text-zinc-900">
                              {(result.data as TransactionInfo).size} bytes
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Weight:</span>{" "}
                            <span className="text-zinc-900">
                              {(result.data as TransactionInfo).weight} WU
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Inputs:</span>{" "}
                            <span className="text-zinc-900">
                              {(result.data as TransactionInfo).vin.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Outputs:</span>{" "}
                            <span className="text-zinc-900">
                              {(result.data as TransactionInfo).vout.length}
                            </span>
                          </div>
                          <div className="mt-4 flex justify-start">
                            <button
                              onClick={() =>
                                router.push(
                                  `/tx/${(result.data as TransactionInfo).txid}`
                                )
                              }
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                            >
                              View Details
                              <ArrowUpRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                    {result.type === "address" && (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-zinc-500">Address:</p>
                          <button
                            onClick={() =>
                              handleAddressClick(
                                (result.data as AddressResult).address
                              )
                            }
                            className="font-mono text-sm hover:text-blue-600"
                          >
                            {(result.data as AddressResult).address}
                          </button>
                          <CopyButton
                            text={(result.data as AddressResult).address}
                          />
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-zinc-500">Type:</span>{" "}
                            <span className="text-zinc-900">
                              {(result.data as AddressResult).iswitness
                                ? `Witness v${
                                    (result.data as AddressResult)
                                      .witness_version
                                  }`
                                : (result.data as AddressResult).isscript
                                ? "Script"
                                : "Legacy"}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Balance:</span>{" "}
                            <span className="text-zinc-900 font-mono">
                              {(result.data as AddressResult).balance.toFixed(
                                8
                              )}{" "}
                              BTC
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">
                              Unspent Outputs:
                            </span>{" "}
                            <span className="text-zinc-900">
                              {
                                (result.data as AddressResult).unspent_txouts
                                  .length
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">
                              Total Transactions:
                            </span>{" "}
                            <span className="text-zinc-900">
                              {
                                (result.data as AddressResult).unspent_txouts
                                  ?.length
                              }
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-start">
                          <button
                            onClick={() =>
                              handleAddressClick(
                                (result.data as AddressResult).address
                              )
                            }
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            View Details
                            <ArrowUpRight className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="relative">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 0}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 rounded-full bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 z-10",
            currentPage === 0
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          )}
        >
          <ChevronLeft className="h-4 w-4 text-zinc-600" />
        </button>

        <div className="overflow-x-auto">
          <div className="inline-flex gap-4 px-6">
            {visibleBlocks.map((block, index) => (
              <Block
                key={`${block.hash}-${block.height}-${index}`}
                block={block}
                onClick={setSelectedBlock}
                isSelected={selectedBlock?.hash === block.hash}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 rounded-full bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 z-10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 text-zinc-600" />
        </button>
      </div>

      <Tabs defaultValue="block" className="mt-8">
        <TabsList className="bg-white border border-zinc-200">
          <TabsTrigger
            value="block"
            className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 cursor-pointer hover:bg-zinc-50"
          >
            Block Details
          </TabsTrigger>
          <TabsTrigger
            value="mempool"
            className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 cursor-pointer hover:bg-zinc-50"
          >
            Mempool
          </TabsTrigger>
        </TabsList>
        <TabsContent value="block">
          <BlockDetails block={selectedBlock} />
        </TabsContent>
        <TabsContent value="mempool">
          <MempoolStats mempoolData={mempoolData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
