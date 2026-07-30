"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bolt, Blocks } from "lucide-react";

import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Merchant Checkout",
      href: "/",
      icon: Bolt,
    },
    {
      name: "Bitcoin Explorer",
      href: "/explorer",
      icon: Blocks,
    },
  ];

  return (
    <div className="flex h-[100vh] w-[250px] flex-col bg-white border-r border-zinc-200">
      <div className="flex h-14 items-center border-b border-zinc-200 px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Bolt className="h-6 w-6 text-zinc-900" />
          <span className="font-semibold text-zinc-900">
            Lightning Merchant Checkout
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive
                    ? "text-zinc-900"
                    : "text-zinc-600 group-hover:text-zinc-900"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
