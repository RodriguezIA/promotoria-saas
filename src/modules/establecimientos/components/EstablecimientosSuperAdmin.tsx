import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useNavigate } from "react-router-dom"
import { Plus, Store as StoreIcon, Eye, Pencil, History, Trash2 } from "lucide-react"


import { StoreDTO, StoreLogDTO } from '@/dtos'
import { api, ApiResponse } from '@/lib'
import { deleteStore } from '@/Fetch/establecimientos'
import { EstablecimientoModalRegistroMasivo } from './EstablecimientoModalRegistroMasivo'
import { Button, DataTable, PageHeader, RowActions, BitacoraDialog } from '@/components'


export function EstablecimientosSuperAdmin() {
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true);
    const [establecimientos, setEstablecimientos] = useState<StoreDTO[]>([]);

    const [bitacoraOpen, setBitacoraOpen] = useState(false);
    const [bitacoraLoading, setBitacoraLoading] = useState(false);
    const [bitacoraLogs, setBitacoraLogs] = useState<StoreLogDTO[]>([]);

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

    const handleOpenBitacora = async (id_store: number) => {
        setBitacoraOpen(true);
        setBitacoraLoading(true);
        try {
            const res = await api.get<ApiResponse<StoreDTO>>(`/stores/${id_store}`);
            setBitacoraLogs(res.data.logs ?? []);
        } catch (error) {
            console.error("Error al cargar la bitácora:", error);
            toast.error("Error al cargar la bitácora");
        } finally {
            setBitacoraLoading(false);
        }
    }

    const columns: ColumnDef<StoreDTO>[] = [
        {
            id: "sales_channel",
            header: "Canal de venta",
            meta: { className: "text-center" }, 
            cell: ({ row }) => {
                const channel = row.original.sales_channel;

                return (
                    <div className="flex flex-col items-center justify-center gap-2 py-2">
                        {channel ? (
                            <>
                                {channel.url_image && (
                                    <img
                                        src={channel.url_image}
                                        alt={channel.name}
                                        className="h-10 w-10 rounded-full object-cover border border-border bg-white"
                                    />
                                )}
                                <span className="text-xs font-medium text-foreground text-center leading-tight">
                                    {channel.name}
                                </span>
                            </>
                        ) : (
                            <span className="text-xs text-muted-foreground/70">Sin canal</span>
                        )}
                    </div>
                )
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
                                icon: Pencil,
                                label: "Editar",
                                onClick: () => navigate(`/establecimiento/${store.id_store}`),
                            },
                            {
                                icon: History,
                                label: "Bitácora",
                                onClick: () => handleOpenBitacora(store.id_store),
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

            <BitacoraDialog
                open={bitacoraOpen}
                onOpenChange={setBitacoraOpen}
                logs={bitacoraLogs}
                isLoading={bitacoraLoading}
                title="Bitácora del establecimiento"
            />
        </>
    );
}