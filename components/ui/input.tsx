import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 sm:h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm text-[#172B4D] shadow-xs transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#172B4D] placeholder:text-slate-400 hover:border-slate-400 focus-visible:border-[#324CDD] focus-visible:ring-2 focus-visible:ring-[#324CDD]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 aria-invalid:border-[#DC2626] aria-invalid:ring-2 aria-invalid:ring-[#DC2626]/20",
        className
      )}
      {...props}
    />
  );
}

export { Input };
