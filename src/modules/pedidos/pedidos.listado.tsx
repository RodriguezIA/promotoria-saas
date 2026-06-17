import { toast } from "sonner"
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ColumnDef } from '@tanstack/react-table'
import { Loader2, Receipt, Plus, Eye } from 'lucide-react'

import { useAuthStore } from '@/stores'
import { ClientDTO, OderListDTO, OrderDTO } from '@/dtos'
import { api, ApiResponse, formatDate } from '@/lib'
import { Button, DataTable, RowActions, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, PageHeader, PageWrapper } from '@/components'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)

export function PedidosList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isSuperAdmin = user?.i_rol === 1;

  const [pedidos, setPedidos] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClientDTO[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchClientes();
    } else {
      setSelectedClientId(user?.id_client || null);
    }
  }, [isSuperAdmin, user]);

  useEffect(() => {
    if (!selectedClientId) {
      setLoading(false);
      setPedidos([]);
      return;
    }
    fetchPedidos(selectedClientId);
  }, [selectedClientId]);

  const fetchClientes = async () => {
    try {
      setLoadingClientes(true);
      const resp = await api.get<ApiResponse<ClientDTO[]>>('/clients');
      const list = resp.data || [];
      setClientes(list);
      if (list.length > 0) setSelectedClientId(list[0].id_client);
    } catch {
      toast.error("Error al cargar los clientes");
    } finally {
      setLoadingClientes(false);
    }
  };

  const fetchPedidos = async (clientId: number) => {
    try {
      setLoading(true);
      const resp = await api.get<ApiResponse<OderListDTO>>(`/orders/?id_client=${clientId}`);
      setPedidos(resp.data.data || []);
    } catch {
      toast.error("Error al cargar los pedidos");
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<OrderDTO>[] = [
    {
      accessorKey: "vc_folio",
      header: "Folio",
      cell: ({ row }) => {
        const folio = row.original.vc_folio;
        if (!folio) return <span className="text-muted-foreground/70 text-sm">—</span>;
        return <span className="font-bold text-foreground">{folio}</span>;
      },
    },
    {
      accessorKey: "id_order",
      header: "# Pedido",
      cell: ({ row }) => (
        <span className="font-bold text-foreground">
          #{String(row.getValue<number>("id_order")).padStart(4, "0")}
        </span>
      ),
    },
    {
      id: "solicitudes",
      header: "Solicitudes",
      cell: ({ row }) => {
        const items = row.original.order_items ?? [];
        const unique = [...new Map(items.map(i => [i.id_request, i.request?.vc_name])).entries()];
        if (unique.length === 0) return <span className="text-muted-foreground/70 text-sm">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {unique.slice(0, 2).map(([id, name]) => (
              <span key={id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info">
                {name ?? `#${id}`}
              </span>
            ))}
            {unique.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                +{unique.length - 2} más
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "tiendas",
      header: "Tiendas",
      cell: ({ row }) => {
        const count = (row.original.order_items ?? []).length;
        return (
          <span className="bg-muted px-2.5 py-1 rounded-full text-sm font-medium text-foreground">
            {count} tienda{count !== 1 ? "s" : ""}
          </span>
        );
      },
    },
    {
      accessorKey: "f_total",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-semibold text-success">
          {formatCurrency(Number(row.getValue("f_total")))}
        </span>
      ),
    },
    {
      accessorKey: "dt_register",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.getValue("dt_register"))}</span>
      ),
    },
    {
      accessorKey: "id_status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue<number>("id_status");
        return status === 1 ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-success/10 text-success text-sm rounded-full">
            <div className="w-1.5 h-1.5 bg-success rounded-full" />
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-destructive/10 text-destructive text-sm rounded-full">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
            Cancelado
          </span>
        );
      },
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
              onClick: () => navigate(`/detalle-pedido/${row.original.id_order}`),
            },
          ]}
        />
      ),
    },
  ];

  if (isSuperAdmin && loadingClientes) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-secondary)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Cargando clientes...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Pedidos de Operación"
        subtitle="Órdenes generadas que contienen tareas para los promotores"
        icon={Receipt}
        actions={
          <Button onClick={() => navigate("/crearPedido")} className="flex items-center gap-2">
            <Plus size={16} /> Crear Pedido
          </Button>
        }
      />

      {isSuperAdmin && clientes.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
          <label className="text-sm font-medium shrink-0" style={{ color: "var(--text-secondary)" }}>Cliente:</label>
          <Select value={selectedClientId?.toString() ?? ""} onValueChange={(val) => setSelectedClientId(Number(val))}>
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
          data={pedidos}
          isLoading={loading}
          emptyMessage="No hay pedidos registrados para este cliente."
        />
      </div>
    </PageWrapper>
  );
}
