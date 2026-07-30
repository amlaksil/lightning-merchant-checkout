"use client";

import { Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  return (
    <Copy
      onClick={() => copyToClipboard(text)}
      className={className || "h-4 w-4 text-zinc-400 cursor-pointer hover:text-zinc-600"}
    />
  );
} 