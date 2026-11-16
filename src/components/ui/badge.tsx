import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "cash" | "upi" | "outline" | "neutral" | "danger";
}

export function Badge({
  className,
  variant = "neutral",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    gold: "bg-gold/15 text-gold border-gold/30",
    cash: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    upi: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    outline: "border-navy-600 text-slate-300",
    neutral: "bg-navy-800 text-slate-300 border-navy-700",
    danger: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

