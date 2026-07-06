import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Loader2, Eye, Trash, Trash2, User } from "lucide-react"
import { toast } from "sonner"

import { PromoterDTO } from "@/dtos"
import { getAllPromoters } from "@/Fetch/promotores"
import { DataTable, PageHeader, PageWrapper, RowActions, Button, ConfirmModal, Avatar } from "@/components"

export function PromotoresList() {
  const navigate = useNavigate()
  const [promotores, setPromotores] = useState<PromoterDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [promoterAEliminar, setPromotorAEliminar] = useState<{ id: number; nombre: string } | null>(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    getAllPromoters()
      .then((res) => {
        if (res.ok) setPromotores(res.data)
      })
      .catch(() => toast.error("Error al cargar los promotores"))
      .finally(() => setLoading(false))
  }, [])

  const handleEliminar = async () => {
    if (!promoterAEliminar) return
    setEliminando(true)
    try {
      toast.success("Promotor eliminado correctamente")
      setPromotores(prev => prev.filter(p => p.id !== promoterAEliminar.id))
      setPromotorAEliminar(null)
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el promotor")
    } finally {
      setEliminando(false)
    }
  }

  const columns: ColumnDef<PromoterDTO>[] = [
    {
      accessorKey: "vc_image",
      header: "Foto",
      cell: ({ row }) => (
        <Avatar
          size="md"
          src={row.original.vc_image || undefined}
          alt={row.original.name}
          fallback={<User size={16} />}
        />
      ),
    },
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <span 
          className="font-medium text-foreground cursor-pointer hover:underline text-info"
          onClick={() => navigate(`/detalle-promotor/${row.original.id}`)}
        >
          {row.original.name} {row.original.lastname ?? ""}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Correo",
      cell: ({ row }) =>
        row.original.email ? (
          <span className="text-sm text-muted-foreground">{row.original.email}</span>
        ) : <span className="text-muted-foreground/70 text-sm">—</span>,
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ row }) =>
        row.original.phone ? (
          <span className="text-sm">{row.original.phone}</span>
        ) : <span className="text-muted-foreground/70 text-sm">—</span>,
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.original.isActive ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
        }`}>
          {row.original.isActive ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Operaciones",
      cell: ({ row }) => {
        const id = row.original.id
        return (
          <RowActions
            actions={[
              {
                icon: Eye,
                label: "Ver detalle",
                onClick: () => navigate(`/detalle-promotor/${id}`),
              },
            ]}
          />
        )
      },
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Promotores"
        subtitle="Listado de promotores que despachan las tareas en campo"
        icon={Plus}
        actions={
          <Button onClick={() => navigate("/crearPromotor")} className="flex items-center gap-2">
            <Plus size={16} /> Nuevo promotor
          </Button>
        }
      />

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
        <DataTable
          columns={columns}
          data={promotores}
          isLoading={loading}
          emptyMessage="No hay promotores registrados aún."
          pagination={{
            showPageSizeSelector: true,
            showPageNavigation: true,
            showSelectedCount: false,
            pageSize: 10,
          }}
          responsive={{ enabled: true }}
        />
      </div>

      <ConfirmModal
        open={!!promoterAEliminar}
        onClose={() => setPromotorAEliminar(null)}
        onConfirm={handleEliminar}
        loading={eliminando}
        variant="danger"
        icon={<Trash2 size={22} />}
        title="¿Eliminar promotor?"
        description={`Se eliminará a "${promoterAEliminar?.nombre}". Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
      />
    </PageWrapper>
  )
}
