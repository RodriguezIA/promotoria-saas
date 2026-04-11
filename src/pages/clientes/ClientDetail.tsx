import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, FileText, Users, Package, Camera, Clock, AlertCircle, Loader2, Receipt, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Alert, AlertDescription } from "../../components/ui/alert"

import { ModalCustom } from '../../components/ModalCustom'
import { registerUserInClient, getUsersByIdClient, ClientUser } from '../../Fetch/usuarios';
import { useAuthStore } from "../../store/authStore";
import { ApiResponse, api } from "../../lib/api";
import { ClientDTO } from '../../dtos/clients'


const tabs = [
  { id: "info", label: "Información", icon: FileText },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "products", label: "Productos", icon: Package },
];

export default function ClienteDetalle() {
    const { id } = useParams();
    
    const [activeTab, setActiveTab] = useState("info");
    const [imageHover, setImageHover] = useState(false);
    const [cliente, setCliente] = useState<ClientDTO | null>(null);
    const [initials, setInitials] = useState("");

    useEffect(() => {
        const fetchingData = async() => {
            try{
                const data = await api.get<ApiResponse<ClientDTO>>(`/clients/${id}`);
                const nameInitials = data.data.name.split(" ").map((word: string) => word[0]).slice(0, 2).join("").toUpperCase();

                setInitials(nameInitials);
                setCliente(data.data);
            } catch (error) {
                console.error("Error fetching client data:", error);
            }
        };

        fetchingData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                    <Link to="/clientes">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                    </Link>
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                    Detalle del Cliente
                    </h1>
                    <p className="text-sm text-gray-500">
                    Información completa y gestión
                    </p>
                </div>
                </div>

                <div className="flex items-center gap-2">
                {/* <button className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Edit2 size={16} />
                    Editar
                </button> */}
                </div>
            </div>
            </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />

                <div className="px-6 pb-6 pt-6">
                    <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16">
                        <div
                            className="relative"
                            onMouseEnter={() => setImageHover(true)}
                            onMouseLeave={() => setImageHover(false)}
                        >
                            <div className="w-32 h-32 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                                    <span className="text-4xl font-semibold text-white">
                                        {initials}
                                    </span>
                                </div>
                            </div>

                            {/* Overlay para subir foto */}
                            {imageHover && (
                                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center cursor-pointer transition-opacity">
                                    <div className="text-center text-white">
                                        <Camera size={24} className="mx-auto mb-1" />
                                        <span className="text-xs">Cambiar foto</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Name and Status */}
                        <div className="flex-1 md:mb-2 md:pt-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {cliente?.name}
                                </h2>
                                
                                {cliente?.i_status ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        Activo
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-full">
                                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                                        Inactivo
                                    </span>
                                )}
                            </div>
                            
                            <p className="text-gray-500 mt-1">{cliente?.rfc}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200">
                <div className="border-b border-gray-200">
                    <div className="flex overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    isActive
                                        ? "border-gray-900 text-gray-900"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === "info" && <TabInfo cliente={cliente} />}
                    {activeTab === "users" && <TabUsers cliente={cliente} />}
                    {activeTab === "products" && <TabProducts cliente={cliente} />}
                </div>
            </div>
        </div>
        </div>
    );
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Tab: Información
function TabInfo({ cliente }: { cliente: ClientDTO | null }) {

  useEffect(() => {

  }, [cliente]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna Principal */}
      <div className="lg:col-span-2 space-y-6">
        {/* Información de Contacto */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Mail size={20} className="text-gray-400" />
            Información de Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="font-medium text-gray-900">{cliente?.email}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Teléfono</p>
              <p className="font-medium text-gray-900">{cliente?.phone}</p>
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin size={20} className="text-gray-400" />
            Dirección
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* País y Estado en una fila */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">País</p>
              <p className="font-medium text-gray-900">{cliente?.address?.country?.name || "No registrado"}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Estado</p>
              <p className="font-medium text-gray-900">{cliente?.address?.state?.name || "No registrado"}</p>
            </div>

            {/* Ciudad y Colonia */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Ciudad</p>
              <p className="font-medium text-gray-900">{cliente?.address?.city?.name || "No registrado"}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Colonia</p>
              <p className="font-medium text-gray-900">{cliente?.address?.neighborhood || "No registrado"}</p>
            </div>

            {/* Calle ocupa toda la fila */}
            <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
              <p className="text-sm text-gray-500 mb-1">Calle</p>
              <p className="font-medium text-gray-900">{cliente?.address?.street || "No registrado"}</p>
            </div>

            {/* Números y CP en una fila de 3 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Núm. Exterior</p>
              <p className="font-medium text-gray-900">{cliente?.address?.ext_number || "—"}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Núm. Interior</p>
              <p className="font-medium text-gray-900">{cliente?.address?.int_number || "—"}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
              <p className="text-sm text-gray-500 mb-1">Código Postal</p>
              <p className="font-medium text-gray-900">{cliente?.address?.postal_code || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Columna Lateral */}
      <div className="space-y-6">
        {/* Datos Fiscales */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Receipt size={18} className="text-gray-400" />
            Datos Fiscales
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">RFC</p>
              <p className="font-medium text-gray-900 font-mono tracking-wide">
                {cliente?.rfc || "No registrado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Constancia de Situación Fiscal</p>
              {cliente?.vc_url_situacion_fiscal ? (
                <a
                  href={cliente.vc_url_situacion_fiscal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors w-full justify-center"
                >
                  <ExternalLink size={14} />
                  Ver constancia
                </a>
              ) : (
                <p className="text-sm text-gray-400 italic">No disponible</p>
              )}
            </div>
          </div>
        </div>

        {/* Fechas */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            Fechas
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Fecha de registro</p>
              <p className="font-medium text-gray-900">
                {formatDate(cliente?.dt_register)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Última actualización</p>
              <p className="font-medium text-gray-900">
                {formatDate(cliente?.dt_updated)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ROL_LABELS: Record<number, string> = {
  1: "SuperAdmin",
  2: "Admin",
  3: "Vendedor",
};

function TabUsers({ cliente }: { cliente: ClientDTO | null }) {
  const { user } = useAuthStore();
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  const nombreRef = useRef<HTMLInputElement>(null);
  const apellidosRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const fetchUsers = async () => {
    if (!cliente?.id_client) return;
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const response = await getUsersByIdClient(cliente.id_client);
      setUsers(response.data ?? []);
    } catch (err: any) {
      setErrorUsers(err?.message || "Error al cargar los usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [cliente?.id_client]);

  const handleSaveUser = async (): Promise<boolean> => {
    setIsLoadingModal(true);
    try {

      console.log("cliente:", cliente);

      const response = await registerUserInClient({
        name: nombreRef.current?.value || "",
        lastname: apellidosRef.current?.value || "",
        email: emailRef.current?.value || "",
        password: "defaultPassword123",
        i_rol: 2,
        id_user_creator: user?.id_user || 0,
        id_client: cliente?.id_client || 0,
      });

      if (!response.ok) {
        toast.error(response.message || "Error al agregar el usuario");
        return false;
      }

      toast.success("Usuario agregado exitosamente");
      fetchUsers();
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Error al agregar el usuario");
      return false;
    } finally {
      setIsLoadingModal(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Usuarios del Cliente
          {users.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-normal">
              {users.length}
            </span>
          )}
        </h3>

        <ModalCustom
          buttonTitle="Agregar Usuario"
          dialogTitle="Agregar Nuevo Usuario"
          dialogDescription="Complete el formulario para agregar un nuevo usuario al cliente."
          isLoading={isLoadingModal}
          onSubmit={handleSaveUser}
          body={
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="nombre">Nombre</Label>
                <Input ref={nombreRef} id="nombre" name="nombre" defaultValue="" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input ref={apellidosRef} id="apellidos" name="apellidos" defaultValue="" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input ref={emailRef} type="email" id="email" name="email" defaultValue="" />
              </div>
            </div>
          }
        />
      </div>

      {errorUsers && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorUsers}</AlertDescription>
        </Alert>
      )}

      {loadingUsers ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Usuario</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rol</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Registro</th>
                {/* <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Acciones</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    No hay usuarios registrados para este cliente
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id_user} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name} {u.lastname}</p>
                          <p className="text-sm text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-sm rounded-md">
                        {ROL_LABELS[u.i_rol] ?? `Rol ${u.i_rol}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.i_status === 1 ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm text-red-700">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(u.dt_register).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    {/* <td className="px-4 py-3 text-right">
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <MoreVertical size={16} className="text-gray-500" />
                      </button>
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


interface Product {
  id_product: number;
  id_client: number;
  name: string;
  description: string | null;
  vc_image: string | null;
  i_status: number;
  dt_created: string;
  dt_updated: string;
}

// Tab: Productos
function TabProducts({ cliente }: { cliente: any | null }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cliente?.id_client) return;
    setLoading(true);
    setError(null);
    api.get<ApiResponse<Product[]>>(`/products/${cliente.id_client}`)
      .then((res) => setProducts(res.data ?? []))
      .catch((err: any) => setError(err?.message || "Error al cargar los productos"))
      .finally(() => setLoading(false));
  }, [cliente?.id_client]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Productos Asignados
          {products.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-normal">
              {products.length}
            </span>
          )}
        </h3>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Producto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Descripción</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                    No hay productos asignados a este cliente
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id_product} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-gray-500" />
                        </div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {p.description ?? <span className="italic text-gray-400">Sin descripción</span>}
                    </td>
                    <td className="px-4 py-3">
                      {p.i_status === 1 ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm text-red-700">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(p.dt_created).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
