import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, id, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        id={id}
        ref={ref}
        className={cn(
          "size-3.5 appearance-none rounded-full border border-white/15 bg-white/[0.04] transition-colors checked:border-indigo-500 checked:bg-indigo-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/40",
          className
        )}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
