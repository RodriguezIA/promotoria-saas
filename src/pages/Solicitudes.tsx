import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Loader2, MoreHorizontal, Eye, Edit2 } from "lucide-react"; // <-- Agregamos iconos

import { Button } from "../components/ui/button";
import { DataTable } from "../components/ui/datatble";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

// Importamos el DropdownMenu (Ajusta la ruta si es diferente en tu proyecto)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

// Importaciones de tus APIs reales
import { useAuthStore } from "../store/authStore";
import { getRequestsByClient, RequestData } from "../Fetch/solicitudes";
import { getCLientsList } from "../Fetch/clientes";

export default function SolicitudesList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Validamos si es super admin
  const isSuperAdmin = user?.id_client === 0 || user?.i_rol === 1;

  // Estados
  const [solicitudes, setSolicitudes] = useState<RequestData[]>([]);
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
        const res = await getRequestsByClient(selectedClientId);
        if (res.ok && res.data) {
          setSolicitudes(res.data);
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

  const handleClientChange = (value: string) => {
    setSelectedClientId(Number(value));
  };

  // --- DEFINICIÓN DE COLUMNAS ---
  const columns: ColumnDef<RequestData>[] = [
    {
      accessorKey: "vc_name",
      header: "Nombre de la Solicitud",
      cell: ({ row }) => (
        <span
          className="font-medium cursor-pointer hover:underline text-blue-600"
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
      accessorKey: "id_status",
      header: "Estatus",
      cell: ({ row }) => {
        const statusId = row.original.id_status;
        const estatus = statusId === 1 ? "Pendiente" : statusId === 2 ? "Completada" : "Cancelada";
        const colorClass =
          statusId === 1
            ? "bg-amber-100 text-amber-800"
            : statusId === 2
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800";
              
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
            {estatus}
          </span>
        );
      },
    },
    // --- NUEVA COLUMNA DE ACCIONES ---
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const id = row.original.id_request;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => navigate(`/detalle-solicitud/${id}`)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4 text-blue-600" />
                <span>Ver Detalle</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => navigate(`/editar-solicitud/${id}`)}
                className="cursor-pointer"
              >
                <Edit2 className="mr-2 h-4 w-4 text-amber-600" />
                <span>Editar Solicitud</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isSuperAdmin && loadingClientes) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
        <p className="text-gray-500 font-medium">Cargando listado de clientes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Solicitudes</h1>
            <p className="text-sm text-gray-500 mt-1">Listado de solicitudes generadas para revisión en campo.</p>
          </div>
          <Button onClick={() => navigate("/crearSolicitud")} className="flex items-center gap-2">
            <Plus size={18} /> Crear nueva solicitud
          </Button>
        </div>

        {/* SELECTOR DE CLIENTES (Exclusivo Super Admin) */}
        {isSuperAdmin && clientes.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Ver solicitudes del cliente:
            </label>
            <Select
              value={selectedClientId?.toString() || ""}
              onValueChange={handleClientChange}
            >
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

        {/* Tabla de Datos */}
        <div className="bg-card rounded-lg border shadow-sm p-4 bg-white">
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
        
      </div>
    </div>
  );
}