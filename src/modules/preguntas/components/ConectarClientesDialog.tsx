import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Loader2, Search, Check, Users } from "lucide-react"

import { useAuthStore } from "@/stores"
import { getCLientsList } from "@/Fetch/clientes"
import { assignClientsToQuestion } from "@/Fetch/questions"
import { ClientListDTO, QuestionDTO } from "@/dtos"
import {
    Button,
    Checkbox,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
} from "@/components"

interface ConectarClientesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pregunta: QuestionDTO | null
    onSuccess: () => void
}

export function ConectarClientesDialog({
    open,
    onOpenChange,
    pregunta,
    onSuccess,
}: ConectarClientesDialogProps) {
    const { user } = useAuthStore()

    const [clientes, setClientes] = useState<ClientListDTO[]>([])
    const [clientesFiltrados, setClientesFiltrados] = useState<ClientListDTO[]>([])
    const [selectedClientIds, setSelectedClientIds] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loadingClientes, setLoadingClientes] = useState(false)
    const [loadingGuardar, setLoadingGuardar] = useState(false)

    // Cargar clientes cuando se abre el diálogo
    useEffect(() => {
        if (open && pregunta) {
            cargarClientes()
            setSearchTerm("")
        }
    }, [open, pregunta])

    // Pre-seleccionar clientes ya asignados
    useEffect(() => {
        if (pregunta?.questions_client) {
            const asignados = pregunta.questions_client.map((qc) => qc.id_client)
            setSelectedClientIds(asignados)
        } else {
            setSelectedClientIds([])
        }
    }, [pregunta])

    // Filtrar clientes por búsqueda
    useEffect(() => {
        if (!searchTerm.trim()) {
            setClientesFiltrados(clientes)
        } else {
            const term = searchTerm.toLowerCase()
            setClientesFiltrados(
                clientes.filter((c) =>
                    c.name.toLowerCase().includes(term) ||
                    c.email?.toLowerCase().includes(term)
                )
            )
        }
    }, [searchTerm, clientes])

    const cargarClientes = async () => {
        setLoadingClientes(true)
        try {
            const res = await getCLientsList()
            if (res?.data) {
                setClientes(res.data)
                setClientesFiltrados(res.data)
            }
        } catch (error) {
            console.error("Error cargando clientes:", error)
            toast.error("Error al cargar los clientes")
        } finally {
            setLoadingClientes(false)
        }
    }

    const toggleCliente = (id_client: number) => {
        setSelectedClientIds((prev) =>
            prev.includes(id_client)
                ? prev.filter((id) => id !== id_client)
                : [...prev, id_client]
        )
    }

    const handleGuardar = async () => {
        if (!pregunta || !user) return

        setLoadingGuardar(true)
        try {
            const result = await assignClientsToQuestion(pregunta.id_question, {
                id_user: user.id_user,
                clients: selectedClientIds,
            })

            if (result.ok) {
                toast.success("Clientes asignados correctamente")
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error(result.message || "Error al asignar clientes")
            }
        } catch (error) {
            console.error("Error asignando clientes:", error)
            toast.error("Error al asignar clientes a la pregunta")
        } finally {
            setLoadingGuardar(false)
        }
    }

    const todosSeleccionados =
        clientes.length > 0 && selectedClientIds.length === clientes.length
    const algunosSeleccionados =
        selectedClientIds.length > 0 && selectedClientIds.length < clientes.length

    const toggleTodos = () => {
        if (todosSeleccionados) {
            setSelectedClientIds([])
        } else {
            setSelectedClientIds(clientes.map((c) => c.id_client))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users size={20} />
                        Conectar Clientes
                    </DialogTitle>
                    <DialogDescription>
                        {pregunta
                            ? `Selecciona los clientes que tendrán acceso a: "${pregunta.question}"`
                            : "Selecciona los clientes para esta pregunta"}
                    </DialogDescription>
                </DialogHeader>

                {/* Buscador */}
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <Input
                        placeholder="Buscar cliente por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Checkbox "Seleccionar todos" */}
                {clientes.length > 0 && (
                    <div className="flex items-center gap-2 py-2 border-b">
                        <Checkbox
                            checked={todosSeleccionados}
                            data-state={algunosSeleccionados ? "indeterminate" : todosSeleccionados ? "checked" : "unchecked"}
                            onCheckedChange={toggleTodos}
                        />
                        <span className="text-sm font-medium text-foreground">
                            {todosSeleccionados
                                ? "Deseleccionar todos"
                                : "Seleccionar todos"}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                            {selectedClientIds.length} de {clientes.length} seleccionados
                        </span>
                    </div>
                )}

                {/* Lista de clientes */}
                <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px] pr-1 space-y-1 mt-1">
                    {loadingClientes ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/70" />
                        </div>
                    ) : clientesFiltrados.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchTerm
                                ? "No se encontraron clientes"
                                : "No hay clientes disponibles"}
                        </div>
                    ) : (
                        clientesFiltrados.map((cliente) => {
                            const seleccionado = selectedClientIds.includes(cliente.id_client)
                            return (
                                <div
                                    key={cliente.id_client}
                                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors border ${
                                        seleccionado
                                            ? "bg-info/10 border-info/30"
                                            : "hover:bg-accent border-transparent hover:border-border"
                                    }`}
                                >
                                    <div className="shrink-0">
                                        <Checkbox
                                            checked={seleccionado}
                                            onCheckedChange={() => toggleCliente(cliente.id_client)}
                                            className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-ring"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-sm font-medium truncate ${
                                                seleccionado ? "text-info" : "text-foreground"
                                            }`}
                                        >
                                            {cliente.name}
                                        </p>
                                        {cliente.email && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {cliente.email}
                                            </p>
                                        )}
                                    </div>
                                    {seleccionado && (
                                        <Check size={16} className="text-info shrink-0" />
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>

                <DialogFooter className="mt-4 gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loadingGuardar}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGuardar}
                        disabled={loadingGuardar}
                        className="min-w-[120px]"
                    >
                        {loadingGuardar && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
