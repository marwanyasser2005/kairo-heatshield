import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_6px_24px_rgba(34,211,238,0.15)] hover:bg-cyan-300 hover:shadow-[0_8px_30px_rgba(34,211,238,0.22)] active:scale-[0.98]",
        secondary:
          "border border-[var(--border-strong)] bg-[rgba(255,255,255,0.04)] text-[var(--foreground-secondary)] hover:border-[var(--card-hover-border)] hover:bg-[rgba(255,255,255,0.07)] active:scale-[0.98]",
        ghost:
          "text-[var(--muted)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--foreground)]",
        danger:
          "bg-[rgba(239,68,68,0.12)] text-red-200 ring-1 ring-inset ring-red-400/20 hover:bg-[rgba(239,68,68,0.2)]",
      },
      size: {
        sm: "min-h-[44px] px-3 text-xs rounded-md",
        md: "min-h-[44px] px-4 text-sm",
        lg: "min-h-[44px] px-5 text-sm rounded-lg",
        icon: "size-[44px] p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
