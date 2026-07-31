'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge'; 

export function AppSidebar() {
  const [nodeStatus, setNodeStatus] = useState<{ blocks: number; connections: number; } | null>(null);

  useEffect(() => {
    // Mocking the data so you can build the UI without the backend keys
    const fetchStatus = async () => {
      setNodeStatus({
        blocks: 840000, 
        connections: 12,
      });
    };
    fetchStatus(); 
  }, []);

  return (
    <div className="flex flex-col h-full border-r bg-muted/20">
      <div className="px-4 py-3 border-b">
        {nodeStatus ? (
          <Badge variant="outline" className="flex items-center gap-2 w-fit bg-background">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Block {nodeStatus.blocks?.toLocaleString()} · {nodeStatus.connections} peers
            </span>
          </Badge>
        ) : (
          <Badge variant="destructive" className="w-fit text-xs">
            Node Offline
          </Badge>
        )}
      </div>
    </div>
  );
}
