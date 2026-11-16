import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#5850EC] focus:ring-1 focus:ring-[#5850EC]/30 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

