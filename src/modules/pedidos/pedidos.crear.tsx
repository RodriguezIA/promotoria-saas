import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Store as StoreIcon, FileText } from "lucide-react"


import { useAuthStore } from '@/store'
import { Button, Card } from '@/components'
import { createOrder } from '@/Fetch/pedidos'
import { getStores, Store } from '@/Fetch/establecimientos'
import { getRequestsByClient, RequestData } from '@/Fetch/solicitudes'


export const CrearPedido = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    // Asumimos que si no es super admin, toma su propio ID de cliente
    const clientId = user?.id_client === 0 ? 1 : (user?.id_client || 1);

    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    
    // Datos de la BD
    const [solicitudes, setSolicitudes] = useState<RequestData[]>([]);
    const [tiendas, setTiendas] = useState<Store[]>([]);

    // Selecciones del usuario
    const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
    const [selectedStores, setSelectedStores] = useState<number[]>([]);

    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            try {
                // Traemos las solicitudes (templates) y los establecimientos
                const [resReq, resStores] = await Promise.all([
                    getRequestsByClient(clientId),
                    getStores() // Ajusta si tu getStores requiere un id_cliente
                ]);

                if (resReq.ok && resReq.data) setSolicitudes(resReq.data);
                if (resStores.ok && resStores.data) setTiendas(resStores.data);
                
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, [clientId]);

    const toggleStore = (id_store: number) => {
        setSelectedStores(prev => 
            prev.includes(id_store) 
                ? prev.filter(id => id !== id_store)
                : [...prev, id_store]
        );
    };

    const handleCrearPedido = async () => {
        if (!selectedRequest) return alert("Selecciona una solicitud base.");
        if (selectedStores.length === 0) return alert("Selecciona al menos un establecimiento.");
        if (!user) return alert("Error de sesión.");

        setGuardando(true);
        const payload = {
            id_user: user.id_user,
            id_client: clientId,
            id_request: selectedRequest.id_request,
            stores: selectedStores
        };

        try {
            const res = await createOrder(payload);
            if (res.ok) {
                alert("¡Pedido creado! Las tareas han sido generadas para cada establecimiento.");
                navigate('/pedidos'); // Ruta que crearás para ver los pedidos/órdenes
            }
        } catch (error: any) {
            alert(error.message || "Ocurrió un error al crear el pedido.");
        } finally {
            setGuardando(false);
        }
    };

    // Cálculos
    const unitPrice = selectedRequest ? Number(selectedRequest.f_value) : 0;
    const totalOrder = unitPrice * selectedStores.length;

    if (loading) return <div className="p-12 text-center flex flex-col items-center"><Loader2 className="animate-spin mb-4" />Cargando entorno...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear Nuevo Pedido</h1>
            <p className="text-gray-500 mb-8">Selecciona la configuración a ejecutar y las tiendas destino.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. SELECCIONAR SOLICITUD (TEMPLATE) */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FileText size={20}/> 1. Elige la Solicitud Base
                    </h2>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {solicitudes.length === 0 ? <p className="text-sm text-gray-500">No hay solicitudes creadas.</p> : null}
                        {solicitudes.map(req => (
                            <Card 
                                key={req.id_request}
                                className={`p-4 cursor-pointer transition-colors border-2 ${selectedRequest?.id_request === req.id_request ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                                onClick={() => setSelectedRequest(req)}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-800">{req.vc_name}</span>
                                    <span className="text-green-600 font-bold">${Number(req.f_value).toFixed(2)}</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* 2. SELECCIONAR ESTABLECIMIENTOS */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <StoreIcon size={20}/> 2. Asignar a Establecimientos
                    </h2>
                    <div className="bg-white border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                        <div className="flex justify-between mb-4 pb-2 border-b">
                            <span className="font-medium">Tiendas seleccionadas:</span>
                            <span className="font-bold text-blue-600">{selectedStores.length}</span>
                        </div>
                        {tiendas.length === 0 ? <p className="text-sm text-gray-500">No hay establecimientos.</p> : null}
                        
                        <div className="space-y-2">
                            {tiendas.map(store => (
                                <label key={store.id_store} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 text-blue-600 rounded mr-3"
                                        checked={selectedStores.includes(store.id_store)}
                                        onChange={() => toggleStore(store.id_store)}
                                    />
                                    <div>
                                        <p className="font-medium text-gray-800">{store.name}</p>
                                        <p className="text-xs text-gray-500">{store.street} {store.ext_number}, {store.neighborhood}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* RESUMEN Y BOTÓN DE GUARDAR */}
            {selectedRequest && selectedStores.length > 0 && (
                <div className="mt-8 bg-gray-900 text-white p-6 rounded-xl flex flex-col sm:flex-row justify-between items-center shadow-lg">
                    <div>
                        <p className="text-gray-400 text-sm">Costo Solicitud: ${unitPrice.toFixed(2)} x {selectedStores.length} establecimientos</p>
                        <p className="text-2xl font-bold flex items-center gap-2">
                            Gran Total: <span className="text-green-400 text-3xl">${totalOrder.toFixed(2)} MXN</span>
                        </p>
                    </div>
                    
                    <Button 
                        size="lg" 
                        className="bg-blue-600 hover:bg-blue-500 text-lg mt-4 sm:mt-0 w-full sm:w-auto"
                        onClick={handleCrearPedido}
                        disabled={guardando}
                    >
                        {guardando ? <Loader2 className="animate-spin mr-2"/> : null}
                        Confirmar y Crear Tareas
                    </Button>
                </div>
            )}
        </div>
    );
}