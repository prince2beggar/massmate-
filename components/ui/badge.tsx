import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-md border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-[#EEF2FF] text-[#324CDD] border-[#C7D2FE]/70",
        secondary: "bg-slate-100 text-[#172B4D] border-slate-200/80",
        outline: "border-slate-300 bg-white text-[#525F7F]",
        success: "bg-[#ECFDF5] text-[#047857] border-emerald-200/80",
        warning: "bg-[#FFFBEB] text-[#B45309] border-amber-200/80",
        destructive: "bg-[#FEF2F2] text-[#B91C1C] border-rose-200/80",
        info: "bg-[#F0F9FF] text-[#0369A1] border-sky-200/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
