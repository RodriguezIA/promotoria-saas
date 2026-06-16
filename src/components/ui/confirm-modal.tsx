import { ReactNode, useRef, useEffect } from "react";
import gsap from "gsap";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "./button";
import { Loader2 } from "lucide-react";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: "danger" | "default";
  icon?: ReactNode;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  variant = "default",
  icon,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const tl = gsap.timeline();

    if (overlayRef.current) {
      gsap.set(overlayRef.current, { opacity: 0 });
      tl.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
    }

    if (contentRef.current) {
      gsap.set(contentRef.current, { opacity: 0, y: -52 });
      tl.to(
        contentRef.current,
        { opacity: 1, y: 0, duration: 0.38, ease: "power3.out" },
        "-=0.2"
      );
    }
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          ref={overlayRef}
          className="fixed inset-0 z-50 bg-black/60"
        />
        <DialogPrimitive.Content
          ref={contentRef}
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-xl focus:outline-none"
        >
          <DialogHeader>
            {icon && (
              <div
                className={
                  variant === "danger"
                    ? "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive"
                    : "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-foreground"
                }
              >
                {icon}
              </div>
            )}
            <DialogTitle className="text-center">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-center">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1"
              variant={variant === "danger" ? "destructive" : "default"}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
