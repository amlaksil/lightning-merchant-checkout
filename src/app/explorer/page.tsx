import { BlockchainExplorer } from "@/app/components/blockchain-explorer";

export default function ExplorerPage() {
  return (
    <div className="flex-1 min-h-screen overflow-y-auto bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <BlockchainExplorer />
      </div>
    </div>
  );
} 