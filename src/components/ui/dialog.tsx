"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

type DialogContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("Dialog components must be used within Dialog");
  return context;
}

export function Dialog({ children, open, onOpenChange }: { children: React.ReactNode, open?: boolean, onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  return <DialogContext.Provider value={{ isOpen, setIsOpen }}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
  const { setIsOpen } = useDialog();
  if (asChild && React.isValidElement<{ onClick?: (e: React.MouseEvent) => void }>(children)) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        setIsOpen(true);
        if (children.props.onClick) children.props.onClick(e);
      }
    });
  }
  return <button onClick={() => setIsOpen(true)}>{children}</button>;
}

export function DialogContent({ children, className }: { children: React.ReactNode, className?: string }) {
  const { isOpen, setIsOpen } = useDialog();
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleClose = () => setIsOpen(false);

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg backdrop:bg-black/80 backdrop:backdrop-blur-sm",
        className
      )}
    >
      {children}
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </dialog>
  );
}

export function DialogHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props}>{children}</div>;
}

export function DialogTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props}>{children}</h2>;
}

export function DialogDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props}>{children}</p>;
}

export function DialogFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props}>{children}</div>;
}

export function DialogClose({ children }: { children: React.ReactNode }) {
  const { setIsOpen } = useDialog();
  if (React.isValidElement<{ onClick?: (e: React.MouseEvent) => void }>(children)) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        setIsOpen(false);
        if (children.props.onClick) children.props.onClick(e);
      }
    });
  }
  return <button onClick={() => setIsOpen(false)}>{children}</button>;
}
