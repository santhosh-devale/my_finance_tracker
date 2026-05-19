import * as React from "react";
import { cn } from "../../lib/utils";

const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-xl border border-border bg-input px-4 py-2 text-sm text-foreground",
      "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors",
      "disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
      "[color-scheme:dark]",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export { Select };
