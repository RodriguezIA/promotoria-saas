import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useNavigate } from "react-router-dom"
import { Plus, Store as StoreIcon, Eye, Pencil, Trash2 } from "lucide-react"


import { useAuthStore } from '@/stores'
import { getStoresForClient, deleteStoreClient, Store } from '@/Fetch/establecimientos'
import { EstablecimientoModalRegistroMasivo } from './EstablecimientoModalRegistroMasivo'
import { Button, DataTable, PageHeader, RowActions } from '@/components'


export function EstablecimientosAdministradoresClients() {
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true);
    const [establecimientos, setEstablecimientos] = useState<Store[]>([]);
    const { user } = useAuthStore();

    useEffect(() => {
        fetchEstablecimientos();
    }, [user]);

    const fetchEstablecimientos = async () => {
        if (!user?.id_client) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await getStoresForClient(user.id_client);
            
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

    const handleDeleteEstablecimeinto = async(id_store: number) => {
        try {
            if(user?.id_client && user.id_client > 0){
                const result = await deleteStoreClient(id_store);

                if(result.ok){
                    toast.success("Establecimiento eliminado correctamente");

                    window.location.reload();
                }
            } 
        } catch (error) {
            console.error("f.handleDeleteEstablecimeinto: ", error);
            toast.error("Erro al eliminar el establecimiento");
        }
    }

    const columns: ColumnDef<Store>[] = [
        {
            accessorKey: "name",
            header: "Nombre",
        },
        {
            accessorKey: "store_code",
            header: "Código de Tienda",
        },
        {
            accessorKey: "street",
            header: "Calle",
        },
        {
            accessorKey: "ext_number",
            header: "Número Exterior",
        },
        {
            accessorKey: "int_number",
            header: "Número Interior",
        },
        {
            accessorKey: "neighborhood",
            header: "Colonia",
        },
        {
            accessorKey: "municipality",
            header: "Municipio",
        },
        {
            accessorKey: "state",
            header: "Estado",
        },
        {
            accessorKey: "postal_code",
            header: "C.P.",
        },
        {
            accessorKey: "country",
            header: "País",
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
                                onClick: () => navigate(`/establecimiento/detalle/${store.id_store_client ?? store.id_store}`),
                            },
                            {
                                icon: Pencil,
                                label: "Editar",
                                onClick: () => navigate(`/establecimiento/${store.id_store_client ?? store.id_store}`),
                            },
                            {
                                icon: Trash2,
                                label: "Eliminar",
                                tone: "destructive",
                                onClick: () => store.id_store_client && handleDeleteEstablecimeinto(store.id_store_client),
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
                    responsive={{
                        enabled: true,
                    }}
                />
            </div>
        </>
    );
}