/**
 * ROW-ACTIONS: Botonera estándar para la columna "Operaciones" (última columna)
 * de las DataTables. Renderiza botones de ícono `outline` (h-8 w-8) con tooltip,
 * en tono neutro o destructivo. Es la fuente única del estilo de acciones de
 * tabla: úsala en lugar de repetir <Button size="icon"> a mano en cada columna.
 *
 * Uso:
 *   {
 *     id: "actions",
 *     header: "Operaciones",
 *     cell: ({ row }) => (
 *       <RowActions
 *         actions={[
 *           { icon: Eye, label: "Ver detalle", onClick: () => navigate(...) },
 *           { icon: Pencil, label: "Editar", onClick: () => navigate(...) },
 *           { icon: Trash2, label: "Eliminar", tone: "destructive", onClick: () => del() },
 *         ]}
 *       />
 *     ),
 *   }
 */
import type { LucideIcon } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

export interface RowAction {
  /** Ícono de lucide-react (stroke 1.8–2). */
  icon: LucideIcon;
  /** Texto del tooltip y aria-label. */
  label: string;
  onClick: () => void;
  /** Tono visual: neutro por defecto, rojo desaturado para acciones destructivas. */
  tone?: "default" | "destructive";
  /** No renderiza la acción (p. ej. sin permisos). */
  hidden?: boolean;
  disabled?: boolean;
}

interface RowActionsProps {
  actions: RowAction[];
  className?: string;
}

export function RowActions({ actions, className }: RowActionsProps) {
  const visible = actions.filter((a) => !a.hidden);

  if (visible.length === 0) {
    return <span className="text-muted-foreground/70 text-sm">—</span>;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("flex items-center gap-1.5", className)}>
        {visible.map((action) => {
          const Icon = action.icon;
          return (
            <Tooltip key={action.label}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={action.label}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  className={cn(
                    "h-8 w-8 text-muted-foreground hover:text-foreground",
                    action.tone === "destructive" &&
                      "text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
