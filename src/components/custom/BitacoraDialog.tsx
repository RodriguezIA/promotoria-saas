import { History, Loader2 } from "lucide-react"

import { ActivityLogEntry } from "../../dtos"
import { formatDate } from "../../lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"
import { ScrollArea } from "../ui/scroll-area"

export interface BitacoraDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    logs: ActivityLogEntry[]
    title?: string
    isLoading?: boolean
}

/**
 * Modal genérico para mostrar la bitácora de un recurso (store_logs,
 * client_logs, etc.) como timeline descendente. El caller es responsable de
 * obtener el arreglo de logs (p. ej. al hacer clic en "Bitácora" de una fila)
 * y pasarlo tal cual — este componente solo lo ordena y lo pinta.
 */
export function BitacoraDialog({
    open,
    onOpenChange,
    logs,
    title = "Bitácora de actividad",
    isLoading = false,
}: BitacoraDialogProps) {
    const sortedLogs = [...logs].sort(
        (a, b) => new Date(b.dt_register).getTime() - new Date(a.dt_register).getTime(),
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History size={18} className="text-muted-foreground" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        Historial de actividad, del más reciente al más antiguo.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/70" />
                    </div>
                ) : sortedLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        Sin actividad registrada.
                    </p>
                ) : (
                    <ScrollArea className="max-h-[50vh] pr-4">
                        <ul className="space-y-4">
                            {sortedLogs.map((entry, index) => (
                                <li key={`${entry.dt_register}-${index}`} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="mt-1.5 size-2 rounded-full bg-brand shrink-0" />
                                        {index < sortedLogs.length - 1 && (
                                            <div className="w-px flex-1 bg-border mt-1" />
                                        )}
                                    </div>
                                    <div className="pb-1">
                                        <p className="text-sm text-foreground">{entry.log}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(entry.dt_register)}
                                            {entry.users && ` · ${entry.users.name} ${entry.users.lastname}`}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    )
}
