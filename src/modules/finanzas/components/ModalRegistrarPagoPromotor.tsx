import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components"

interface Props {
  pago: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// TEMPORAL: pagos a promotores se reconectará en una siguiente sesión.
export function ModalRegistrarPagoPromotor({ pago, open, onClose }: Props) {
  if (!pago) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Próximamente</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          El registro de pagos a promotores se está actualizando y estará disponible pronto.
        </p>
      </DialogContent>
    </Dialog>
  );
}
