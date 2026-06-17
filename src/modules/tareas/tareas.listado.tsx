import { toast } from "sonner"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ColumnDef } from "@tanstack/react-table"
import { CheckSquare2, Eye, Loader2 } from "lucide-react"

import { useAuthStore } from "@/stores"
import { ClientDTO, TaskDTO } from "@/dtos"
import { api, ApiResponse, formatDate } from "@/lib"
import { DataTable, PageHeader, PageWrapper, RowActions, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components"

const TASK_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: "Cancelada",   color: "bg-destructive/10 text-destructive" },
  1: { label: "Pendiente",   color: "bg-warning/15 text-warning-foreground dark:text-warning" },
  2: { label: "En progreso", color: "bg-info/10 text-info" },
  3: { label: "Completada",  color: "bg-success/10 text-success" },
}

export function TareasListado() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const isSuperAdmin = user?.i_rol === 1

  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<ClientDTO[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)

  useEffect(() => {
    if (isSuperAdmin) {
      fetchClientes()
    } else {
      setSelectedClientId(user?.id_client || null)
    }
  }, [isSuperAdmin, user])

  useEffect(() => {
    if (!selectedClientId) {
      setLoading(false)
      setTasks([])
      return
    }
    fetchTasks(selectedClientId)
  }, [selectedClientId])

  const fetchClientes = async () => {
    try {
      setLoadingClientes(true)
      const resp = await api.get<ApiResponse<ClientDTO[]>>("/clients")
      const list = resp.data || []
      setClientes(list)
      if (list.length > 0) setSelectedClientId(list[0].id_client)
    } catch {
      toast.error("Error al cargar los clientes")
    } finally {
      setLoadingClientes(false)
    }
  }

  const fetchTasks = async (clientId: number) => {
    try {
      setLoading(true)
      const resp = await api.get<ApiResponse<TaskDTO[]>>(`/tasks?id_client=${clientId}`)
      setTasks(resp.data || [])
    } catch {
      toast.error("Error al cargar las tareas")
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<TaskDTO>[] = [
    {
      accessorKey: "vc_folio",
      header: "Folio",
      cell: ({ row }) => {
        const folio = row.getValue<string | null>("vc_folio")
        return folio ? (
          <span className="font-bold text-foreground">{folio}</span>
        ) : (
          <span className="text-muted-foreground/70 text-sm">—</span>
        )
      },
    },
    {
      accessorKey: "id_task",
      header: "# Tarea",
      cell: ({ row }) => (
        <span className="font-bold text-foreground">
          #{String(row.getValue<number>("id_task")).padStart(4, "0")}
        </span>
      ),
    },
    {
      id: "establecimiento",
      header: "Establecimiento",
      cell: ({ row }) => (
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
          {row.original.store?.name ?? `#${row.original.id_store}`}
        </span>
      ),
    },
    {
      id: "solicitud",
      header: "Solicitud",
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {row.original.request?.vc_name ?? `#${row.original.id_request}`}
        </span>
      ),
    },
    {
      accessorKey: "id_order",
      header: "Pedido",
      cell: ({ row }) => (
        <button
          className="font-medium text-info hover:underline"
          onClick={() => navigate(`/detalle-pedido/${row.getValue("id_order")}`)}
        >
          #{String(row.getValue<number>("id_order")).padStart(4, "0")}
        </button>
      ),
    },
    {
      id: "promotor",
      header: "Promotor",
      cell: ({ row }) => {
        const p = row.original.promoter
        return p ? (
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {p.name} {p.lastname}
          </span>
        ) : (
          <span className="text-xs italic text-destructive font-medium">Sin asignar</span>
        )
      },
    },
    {
      accessorKey: "id_status",
      header: "Estado",
      cell: ({ row }) => {
        const s = TASK_STATUS[row.getValue<number>("id_status")] ?? TASK_STATUS[1]
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
            {s.label}
          </span>
        )
      },
    },
    {
      accessorKey: "dt_register",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {formatDate(row.getValue("dt_register"))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Operaciones",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              icon: Eye,
              label: "Ver detalle",
              onClick: () => navigate(`/tareas/${row.original.id_task}`),
            },
          ]}
        />
      ),
    },
  ]

  if (isSuperAdmin && loadingClientes) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-secondary)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Cargando clientes...</p>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Tareas"
        subtitle="Seguimiento de tareas asignadas a los promotores"
        icon={CheckSquare2}
      />

      {isSuperAdmin && clientes.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
          <label className="text-sm font-medium shrink-0" style={{ color: "var(--text-secondary)" }}>Cliente:</label>
          <Select value={selectedClientId?.toString() ?? ""} onValueChange={(v) => setSelectedClientId(Number(v))}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
            <SelectContent>
              {clientes.map((c) => (
                <SelectItem key={c.id_client} value={c.id_client.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
        <DataTable
          columns={columns}
          data={tasks}
          isLoading={loading}
          emptyMessage="No hay tareas registradas para este cliente."
        />
      </div>
    </PageWrapper>
  )
}
