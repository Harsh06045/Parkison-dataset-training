import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-[0.7rem] font-semibold tracking-[0.08em] text-white/50 uppercase",
          className
        )}
        {...props}
      />
    );
  }
);
Label.displayName = "Label";

export { Label };
