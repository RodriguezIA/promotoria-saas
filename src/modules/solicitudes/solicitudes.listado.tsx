import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Loader2, Pencil, ClipboardList, Eye, Trash, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { RequestDTO } from "@/dtos"
import { useAuthStore } from "@/stores"
import { api, ApiResponse } from "@/lib"
import { getCLientsList } from "@/Fetch/clientes"
import { deleteRequest } from "@/Fetch/solicitudes"
import { Button, ConfirmModal, DataTable, PageHeader, PageWrapper, RowActions, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components"


export function SolicitudesList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Validamos si es super admin
  const isSuperAdmin = user?.id_client === 0 || user?.i_rol === 1;

  // Estados
  const [solicitudes, setSolicitudes] = useState<RequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el selector de clientes (Super Admin)
  const [clientes, setClientes] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [loadingClientes, setLoadingClientes] = useState(false);

  // --- EFECTO 1: Cargar Clientes (Solo Super Admin) ---
  useEffect(() => {
    if (isSuperAdmin) {
      const fetchClients = async () => {
        setLoadingClientes(true);
        try {
          const response = await getCLientsList();
          const clientsList = response.data || [];
          setClientes(clientsList);
          
          if (clientsList.length > 0) {
            setSelectedClientId(clientsList[0].id_client);
          }
        } catch (error) {
          console.error("Error al cargar clientes:", error);
        } finally {
          setLoadingClientes(false);
        }
      };
      fetchClients();
    } else {
      setSelectedClientId(user?.id_client || null);
    }
  }, [isSuperAdmin, user]);

  // --- EFECTO 2: Cargar Solicitudes del Cliente Seleccionado ---
  useEffect(() => {
    if (!selectedClientId) return;

    const fetchSolicitudes = async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiResponse<{ data: RequestDTO[]; meta: any }>>(`/requests?${new URLSearchParams({ id_client: selectedClientId.toString() })}`);
        if (res.ok && res.data?.data) {
          setSolicitudes(res.data.data);
        } else {
          setSolicitudes([]);
        }
      } catch (error) {
        console.error("Error cargando solicitudes", error);
        setSolicitudes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitudes();
  }, [selectedClientId]);

  // Estado del modal de confirmación de eliminación
  const [solicitudAEliminar, setSolicitudAEliminar] = useState<{ id: number; nombre: string } | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const handleClientChange = (value: string) => {
    setSelectedClientId(Number(value));
  };

  const handleEliminar = async () => {
    if (!solicitudAEliminar) return;
    setEliminando(true);

    try {
      await deleteRequest(solicitudAEliminar.id);
      setSolicitudes(prev => prev.filter(s => s.id_request !== solicitudAEliminar.id));
      toast.success("Solicitud eliminada correctamente.");
      setSolicitudAEliminar(null);
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la solicitud.");
    } finally {
      setEliminando(false);
    }
  };

  // --- DEFINICIÓN DE COLUMNAS ---
  const columns: ColumnDef<RequestDTO>[] = [
    {
      accessorKey: "vc_folio",
      header: "Folio",
      cell: ({ row }) => {
        const folio = row.original.vc_folio;
        if (!folio) {
          return <span className="text-muted-foreground/70 text-sm">—</span>;
        }
        return <span className="font-bold text-foreground">{folio}</span>;
      },
    },
    {
      accessorKey: "vc_name",
      header: "Nombre de la Solicitud",
      cell: ({ row }) => (
        <span
          className="font-medium cursor-pointer hover:underline text-info"
          onClick={() => navigate(`/detalle-solicitud/${row.original.id_request}`)}
        >
          {row.getValue("vc_name")}
        </span>
      ),
    },
    {
      accessorKey: "dt_register",
      header: "Fecha de Registro",
      cell: ({ row }) => {
        const fecha = new Date(row.original.dt_register);
        return fecha.toLocaleDateString("es-MX", { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      },
    },
    {
      accessorKey: "f_value",
      header: "Total ($)",
      cell: ({ row }) => {
        const total = Number(row.original.f_value);
        return <span className="font-semibold">${total.toFixed(2)} MXN</span>;
      },
    },
    {
      id: "actions",
      header: "Operaciones",
      cell: ({ row }) => {
        const id = row.original.id_request;

        return (
          <RowActions
            actions={[
              {
                icon: Eye,
                label: "Ver detalle",
                onClick: () => navigate(`/detalle-solicitud/${id}`),
              },
              {
                icon: Pencil,
                label: "Editar",
                onClick: () => navigate(`/editar-solicitud/${id}`),
              },
              {
                icon: Trash,
                label: "Eliminar",
                onClick: () => setSolicitudAEliminar({ id, nombre: row.original.vc_name }),
              },
            ]}
          />
        );
      },
    }
  ];

  if (isSuperAdmin && loadingClientes) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--text-secondary)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Cargando clientes...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Solicitudes"
        subtitle="Listado de solicitudes generadas para revisión en campo"
        icon={ClipboardList}
        actions={
          <Button onClick={() => navigate("/crearSolicitud")} className="flex items-center gap-2">
            <Plus size={16} /> Nueva solicitud
          </Button>
        }
      />

      {isSuperAdmin && clientes.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
          <label className="text-sm font-medium shrink-0" style={{ color: "var(--text-secondary)" }}>
            Cliente:
          </label>
          <Select value={selectedClientId?.toString() || ""} onValueChange={handleClientChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecciona un cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((client) => (
                <SelectItem key={client.id_client} value={client.id_client.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
          <DataTable
            columns={columns}
            data={solicitudes}
            isLoading={loading}
            emptyMessage={
              isSuperAdmin && !selectedClientId 
                ? "Selecciona un cliente para ver sus solicitudes." 
                : "No hay solicitudes aún. Crea la primera."
            }
            pagination={{
              showPageSizeSelector: true,
              showPageNavigation: true,
              showSelectedCount: false,
              pageSize: 10,
            }}
            responsive={{
              enabled: true,
            }}
          />
      </div>
      <ConfirmModal
        open={!!solicitudAEliminar}
        onClose={() => setSolicitudAEliminar(null)}
        onConfirm={handleEliminar}
        loading={eliminando}
        variant="danger"
        icon={<Trash2 size={22} />}
        title="¿Eliminar solicitud?"
        description={`Se eliminará "${solicitudAEliminar?.nombre}". Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
      />
    </PageWrapper>
  );
}