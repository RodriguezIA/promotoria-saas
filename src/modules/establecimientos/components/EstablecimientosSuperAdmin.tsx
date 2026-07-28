import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useNavigate } from "react-router-dom"
import { Plus, Store as StoreIcon, Eye, Trash2 } from "lucide-react"


import { StoreDTO } from '@/dtos'
import { api, ApiResponse } from '@/lib'
import { deleteStore } from '@/Fetch/establecimientos'
import { EstablecimientoModalRegistroMasivo } from './EstablecimientoModalRegistroMasivo'
import { Button, DataTable, PageHeader, RowActions } from '@/components'


export function EstablecimientosSuperAdmin() {
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true);
    const [establecimientos, setEstablecimientos] = useState<StoreDTO[]>([]);

    useEffect(() => {
        fetchEstablecimientos();
    }, []);


    const fetchEstablecimientos = async () => {
        try {
            setLoading(true);
            const response = await api.get<ApiResponse<StoreDTO[]>>(`/stores`)
            if (response.ok && response.data) {
                setEstablecimientos(response.data);
            } else {
                toast.error("Error al cargar establecimientos");
            }
        } catch (error) {
            console.error("Error fetching establecimientos:", error);
            toast.error("Error al cargar establecimientos");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEstablecimiento = async (id_store: number) => {
        try {
            const result = await deleteStore(id_store);

            if (result.ok) {
                toast.success("Establecimiento eliminado correctamente");
                fetchEstablecimientos();
            } else {
                toast.error("Error al eliminar el establecimiento");
            }
        } catch (error) {
            console.error("f.handleDeleteEstablecimiento: ", error);
            toast.error("Error al eliminar el establecimiento");
        }
    }

    const columns: ColumnDef<StoreDTO>[] = [
        {
            id: "sales_channel",
            header: "Canal de venta",
            meta: { className: "text-center" }, 
            cell: ({ row }) => {
                const store = row.original;

                if(store.sales_channel){
                    return (
                        <div className="flex flex-col items-center justify-center gap-2 py-2">
                            <img 
                                src={store.sales_channel.url_image} 
                                alt={store.sales_channel.name}
                                className="h-10 w-10 rounded-full object-cover border border-border bg-white" 
                            />
                            <span className="text-xs font-medium text-foreground text-center leading-tight">
                                {store.sales_channel.name}
                            </span>
                        </div>
                    )
                }
                return <span className="text-xs text-muted-foreground/70">Sin canal</span>
            }
        },
        {
            accessorKey: "name",
            header: "Nombre",
        },
        {
            accessorKey: "store_code",
            header: "Código de Tienda",
        },
        {
            accessorKey: "address.city.name",
            header: "Municipio",
        },
        {
            accessorKey: "address.state.name",
            header: "Estado",
        },
        {
            id: "actions",
            header: "Operaciones",
            cell: ({ row }) => {
                const store = row.original;

                return (
                    <RowActions
                        actions={[
                            {
                                icon: Eye,
                                label: "Ver detalle",
                                onClick: () => navigate(`/establecimiento/detalle/${store.id_store}`),
                            },
                            {
                                icon: Trash2,
                                label: "Eliminar",
                                tone: "destructive",
                                onClick: () => handleDeleteEstablecimiento(store.id_store),
                            },
                        ]}
                    />
                )
            }
        }
    ];

    return (
        <>
            <PageHeader
                title="Establecimientos"
                subtitle="Administra los establecimientos"
                icon={StoreIcon}
                actions={
                    <>
                        <EstablecimientoModalRegistroMasivo
                            onSuccess={() => fetchEstablecimientos()}
                        />
                        <Button onClick={() => navigate("/establecimiento")} className="flex items-center gap-2">
                            <Plus size={16} /> Nuevo Establecimiento
                        </Button>
                    </>
                }
            />

            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
                <DataTable
                    columns={columns}
                    data={establecimientos}
                    isLoading={loading}
                    emptyMessage="Aún no hay establecimientos registrados para este cliente."
                    emptyIcon={<StoreIcon size={32} className="text-muted-foreground/70" />}
                    pagination={{
                        mode: "client",
                        pageSize: 10,
                        pageSizeOptions: [5, 10, 20, 50],
                        showPageSizeSelector: true,
                        showSelectedCount: true,
                        showPageNavigation: true,
                    }}
                    responsive={{
                        enabled: true,
                    }}
                />
            </div>
        </>
    );
}