import React from "react";
import { formatINR } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

interface CurrencyDisplayProps {
  amount: number | string | null | undefined;
  className?: string;
  symbolClassName?: string;
  showDecimals?: boolean;
}

export function CurrencyDisplay({
  amount,
  className,
  showDecimals = true,
}: CurrencyDisplayProps) {
  const formatted = formatINR(amount, showDecimals);

  return (
    <span className={cn("font-medium tracking-tight tabular-nums", className)}>
      {formatted}
    </span>
  );
}

