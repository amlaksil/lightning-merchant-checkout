import { Card } from "@/components/ui/card";

export default function AddressLoading() {
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <div className="mb-6">
        <div className="h-8 w-48 bg-zinc-100 rounded-lg animate-pulse mb-2" />
        <div className="h-6 w-96 bg-zinc-100 rounded-lg animate-pulse" />
      </div>

      <div className="flex flex-col gap-6">
        <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="h-6 w-32 bg-zinc-100 rounded-lg animate-pulse mb-4" />
            <div className="space-y-4">
              <div>
                <div className="h-4 w-16 bg-zinc-100 rounded animate-pulse mb-2" />
                <div className="h-6 w-32 bg-zinc-100 rounded animate-pulse" />
              </div>
              <div>
                <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse mb-2" />
                <div className="h-6 w-full bg-zinc-100 rounded animate-pulse" />
              </div>
              <div>
                <div className="h-4 w-20 bg-zinc-100 rounded animate-pulse mb-2" />
                <div className="h-6 w-48 bg-zinc-100 rounded animate-pulse" />
              </div>
            </div>
          </div>

          <div>
            <div className="h-6 w-24 bg-zinc-100 rounded-lg animate-pulse mb-4" />
            <div className="space-y-4">
              <div>
                <div className="h-4 w-28 bg-zinc-100 rounded animate-pulse mb-2" />
                <div className="h-8 w-40 bg-zinc-100 rounded animate-pulse" />
              </div>
              <div>
                <div className="h-4 w-32 bg-zinc-100 rounded animate-pulse mb-2" />
                <div className="h-6 w-24 bg-zinc-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="h-6 w-48 bg-zinc-100 rounded-lg animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-zinc-50 p-3 rounded-lg border border-zinc-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="h-6 w-96 bg-zinc-100 rounded animate-pulse" />
                  <div className="h-6 w-24 bg-zinc-100 rounded animate-pulse" />
                </div>
                <div className="h-4 w-48 bg-zinc-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
} 