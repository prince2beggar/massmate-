import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading card content"
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white p-6 space-y-4",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function TableRowsSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading ledger rows"
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white overflow-hidden",
        className
      )}
    >
      <div className="border-b border-slate-200 bg-[#F8F9FE] px-5 py-3 flex items-center justify-between gap-4">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-24 hidden sm:block" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="px-5 py-3.5 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20 hidden sm:block" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InlineLoader({
  label = "Loading...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium text-[#525F7F]",
        className
      )}
    >
      <Loader2
        className="h-4 w-4 animate-spin text-[#324CDD]"
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}
