import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/75 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// Bottom Sheet variant (slides up from bottom)
const DialogContent = React.forwardRef(
  ({ className, children, title, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        aria-describedby={undefined}
        className={cn(
          "fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2",
          "rounded-t-[28px] border-t border-border bg-[#0d0f1c] p-6 pb-10",
          "max-h-[90vh] overflow-y-auto",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "duration-300",
          className
        )}
        {...props}
      >
        {/* Handle */}
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-white/15" />
        {children}
        <DialogPrimitive.Close className="absolute right-5 top-5 rounded-full opacity-70 hover:opacity-100 transition-opacity focus:outline-none">
          <X size={16} className="text-muted-foreground" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 mb-5", className)} {...props} />
);
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-base font-extrabold text-foreground", className)}
    {...props}
  />
));
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
));

export {
  Dialog, DialogPortal, DialogOverlay, DialogClose,
  DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription,
};
