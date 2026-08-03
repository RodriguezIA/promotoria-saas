import { toast } from "sonner"
import { useState, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Link, useNavigate } from "react-router-dom"
import { Loader2, Package, Plus, Pencil, Trash2, Eye } from "lucide-react"


import { useAuthStore } from '@/stores';
import { ProductDTO, ClientDTO } from "@/dtos";
import { api, ApiResponse, formatDate } from '@/lib'
import { Avatar, Button, DataTable, PageWrapper, PageHeader, RowActions, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ConfirmModal } from '@/components';


export default function ProductPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();


  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null; loading: boolean }>({ open: false, id: null, loading: false });


  const isSuperAdmin = user?.i_rol === 1;


  useEffect(() => {
    if (isSuperAdmin) {
      fetchClients();
    } else {
      setSelectedClientId(user?.id_client || null);
    }
  }, [isSuperAdmin, user]);

  useEffect(() => {
    if (selectedClientId) {
      fetchProducts(selectedClientId);
    } else {
      setLoading(false);
      setProducts([]);
      setError(null);
    }
  }, [selectedClientId]);



  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await api.get<ApiResponse<ClientDTO[]>>(`/clients`);
      const clientsList = response.data || [];
      setClients(clientsList);
      
      if (clientsList.length > 0) {
        setSelectedClientId(clientsList[0].id_client);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
      toast.error("Error al cargar los clientes");
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchProducts = async (clientId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<ProductDTO[]>>(`/products/${clientId}`);
      setProducts(response.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (value: string) => {
    setSelectedClientId(Number(value));
  };


  const handleDelete = (id_product: number) => {
    setDeleteModal({ open: true, id: id_product, loading: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await api.delete<ApiResponse>(`/products/${deleteModal.id}`);
      toast.success("Producto eliminado exitosamente");
      setDeleteModal({ open: false, id: null, loading: false });
      if (selectedClientId) fetchProducts(selectedClientId);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar producto");
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns: ColumnDef<ProductDTO>[] = [
    {
      accessorKey: "vc_image",
      header: "#",
      cell: ({ row }) => {
        const imageUrl = row.getValue("vc_image") as string | null;
        return (
          <Avatar
            size="sm"
            src={imageUrl || undefined}
            alt={row.original.name}
            fallback={<Package size={16} />}
          />
        );
      },
    },
    {
      accessorKey: "vc_folio",
      header: "Folio",
      cell: ({ row }) => {
        const folio = row.getValue("vc_folio") as string | null | undefined;
        return folio ? (
          <span className="font-bold text-foreground">{folio}</span>
        ) : (
          <span className="text-muted-foreground/70 text-sm">—</span>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="font-medium text-foreground">
          {row.getValue("name")}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return (
          <div className="text-muted-foreground max-w-xs truncate">
            {description || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "i_status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("i_status") as number;
        return status === 1 ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-success/10 text-success text-sm rounded-full">
            <div className="w-1.5 h-1.5 bg-success rounded-full" />
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-destructive/10 text-destructive text-sm rounded-full">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
            Inactivo
          </span>
        );
      },
    },
    {
      accessorKey: "dt_created",
      header: "Fecha de registro",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {formatDate(row.getValue("dt_created"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Operaciones",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <RowActions
            actions={[
              {
                icon: Eye,
                label: "Ver detalle",
                onClick: () => navigate(`/producto/detalle/${product.id_product}`),
              },
              {
                icon: Pencil,
                label: "Editar",
                onClick: () => navigate(`/producto/${product.id_product}`),
              },
              {
                icon: Trash2,
                label: "Eliminar",
                tone: "destructive",
                onClick: () => handleDelete(product.id_product),
              },
            ]}
          />
        );
      },
    }
  ];

  if (isSuperAdmin && loadingClients) {
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
        title="Productos"
        subtitle="Administra los productos del cliente"
        icon={Package}
        actions={
          <Link to="/producto" state={{ id_client: selectedClientId }}>
            <Button className="flex items-center gap-2">
              <Plus size={16} /> Nuevo Producto
            </Button>
          </Link>
        }
      />

      {isSuperAdmin && clients.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
          <label className="text-sm font-medium shrink-0" style={{ color: "var(--text-secondary)" }}>Cliente:</label>
          <Select value={selectedClientId?.toString() || ""} onValueChange={handleClientChange}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id_client} value={client.id_client.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
        <DataTable
          columns={columns}
          data={products}
          isLoading={loading}
          emptyMessage="No hay productos registrados."
        />
      </div>

      <ConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title="Eliminar producto"
        description="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        loading={deleteModal.loading}
        variant="danger"
        icon={<Trash2 className="h-5 w-5" />}
      />
    </PageWrapper>
  );
}