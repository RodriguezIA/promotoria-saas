import { Loader2, ImageOff } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"


import { RequestDTO } from '@/dtos'
import { useAuthStore } from "@/stores"
import { api, ApiResponse } from "@/lib"
import { getCLientsList } from "@/Fetch/clientes"
import { Button, Card, Separator, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components"



export function SolicitudDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    // Validamos si es super admin
    const isSuperAdmin = user?.id_client === 0 || user?.i_rol === 1;

    const [solicitud, setSolicitud] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [clientes, setClientes] = useState<any[]>([]);

    useEffect(() => {
        const fetchDatos = async () => {
            if (!id) return;

            setLoading(true);

            try {
                const res =  api.get<ApiResponse<RequestDTO>>(`/requests/${id}`);
                
                if (res) {
                    const data = (await res).data;
                
                    const solicitudFormateada = {
                        id: data.id_request,
                        nombre: data.vc_name,
                        dt_registro: data.dt_register,
                        total: data.f_value,
                        id_cliente: data.id_client,
                        url_rack_image: data.url_rack_image || null,
                        estatus: data.id_status === 1 ? "Pendiente" : data.id_status === 2 ? "Completada" : "Cancelada",
                        productos: data.request_products?.map((p: any) => {
                            return {
                                id_producto: p.id_product,
                                nombre: p.product?.name || `Producto #${p.id_product}`,
                                precio_extra: p.f_subtotal,
                                preguntas: p.request_product_questions?.map((q: any) => ({
                                    id_pregunta: q.id_request_product_question,
                                    texto: q.question.question || 'Pregunta sin texto',
                                    // precio: q.precio_aplicado
                                })) || []
                            };
                        }) || []
                    };
                    
                    setSolicitud(solicitudFormateada);

                    if (isSuperAdmin) {
                        const clientsRes = await getCLientsList();
                        if (clientsRes.data) {
                            setClientes(clientsRes.data);
                        }
                    }
                }
            } catch (error) {
                console.error("Error cargando solicitud", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDatos();
    }, [id, isSuperAdmin]);

    // Manejador si el Super Admin intenta cambiar el cliente de la solicitud
    const handleCambiarCliente = (nuevoIdCliente: string) => {
        setSolicitud((prev: any) => ({ ...prev, id_cliente: Number(nuevoIdCliente) }));
        // NOTA: Para que este cambio se guarde en la BD, tendrías que llamar a una API como updateRequest 
        // y asegurarte que el backend acepte cambiar el id_client.
        alert("Atención: El cambio de cliente es solo visual por ahora. Requiere actualizar el endpoint en el backend para guardarlo.");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 size={32} className="animate-spin text-info mb-4" />
                <p className="text-muted-foreground font-medium">Cargando detalles de la solicitud...</p>
            </div>
        );
    }

    if (!solicitud) {
        return (
            <div className="p-8 text-center bg-white m-4 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 text-foreground">Solicitud no encontrada</h2>
                <Button onClick={() => navigate("/solicitudes")}>Volver a la lista</Button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{solicitud.nombre}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Solicitud ID: #{solicitud.id} | Fecha: {new Date(solicitud.dt_registro).toLocaleDateString()}
                    </p>
                </div>
                <Button variant="outline" onClick={() => navigate("/solicitudes")}>
                    Volver
                </Button>
            </div>

            {/* SELECTOR DE CLIENTES (Exclusivo Super Admin) */}
            {isSuperAdmin && (
                <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
                    <label className="block text-sm font-semibold text-foreground mb-2">
                        Cliente Propietario de la Solicitud:
                    </label>
                    <Select
                        value={solicitud.id_cliente?.toString()}
                        onValueChange={handleCambiarCliente}
                    >
                        <SelectTrigger className="w-full md:w-1/2 bg-white">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Productos a Revisar</h2>
                    {solicitud.productos.map((prod: any) => (
                        <Card key={prod.id_producto} className="p-4 shadow-sm border-border">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-base text-foreground">{prod.nombre}</h3>
                                {/* <span className="text-sm font-medium bg-muted px-2 py-1 rounded">Cant: {prod.cantidad}</span> */}
                            </div>
                            <Separator className="mb-3" />
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">Checklist ({prod.preguntas.length} items)</h4>
                                <ul className="text-sm border rounded-md divide-y divide-border">
                                    {prod.preguntas.length > 0 ? (
                                        prod.preguntas.map((q: any) => (
                                            <li key={q.id_pregunta} className="p-3 flex justify-between hover:bg-accent transition-colors">
                                                <span className="text-foreground">{q.texto}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="p-3 text-muted-foreground italic text-center">Sin checklist asignado</li>
                                    )}
                                </ul>
                            </div>
                        </Card>
                    ))}
                </div>

                <div>
                    <Card className="p-5 sticky top-4 shadow-md border-border">
                        <h2 className="text-lg font-bold mb-4 text-foreground border-b pb-2">Resumen Financiero</h2>

                        {(() => {
                            const totalPreguntas = solicitud.productos.reduce((sum: number, p: any) => sum + (p.preguntas?.length || 0), 0);
                            const preguntasExtra = Math.max(totalPreguntas - 3, 0);
                            const costoExtra = Math.min(preguntasExtra * 15, 45);
                            return (
                                <div className="space-y-3 text-sm mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Costo base (hasta 3 preguntas):</span>
                                        <span className="font-medium">$45.00</span>
                                    </div>

                                    {preguntasExtra > 0 && (
                                        <div className="flex justify-between text-warning-foreground dark:text-warning font-medium">
                                            <span>Preguntas extra ({preguntasExtra}):</span>
                                            <span>+ ${costoExtra.toFixed(2)}</span>
                                        </div>
                                    )}

                                    {Number(solicitud.total) >= 90 && totalPreguntas > 6 && (
                                        <div className="text-xs text-muted-foreground italic">
                                            Precio máximo alcanzado. Preguntas adicionales sin costo extra.
                                        </div>
                                    )}

                                    <div className="flex justify-between text-sm pt-2">
                                        <span className="text-muted-foreground">Total preguntas configuradas:</span>
                                        <span className="font-medium">{totalPreguntas}</span>
                                    </div>
                                </div>
                            );
                        })()}

                        <Separator className="my-4" />

                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-lg text-foreground">Total Solicitud</span>
                            <span className="font-black text-2xl text-info">${Number(solicitud.total).toFixed(2)}</span>
                        </div>

                        {/* <div className="flex gap-2 mt-4">
                            <span className={`w-full text-center px-4 py-3 rounded-md border font-bold ${
                                solicitud.estatus === "Pendiente" ? "bg-warning/20 text-warning-foreground dark:text-warning border-warning/40" :
                                solicitud.estatus === "Completada" ? "bg-success/15 text-success border-success/30" :
                                "bg-muted text-foreground border-input"
                            }`}>
                                Estado actual: {solicitud.estatus}
                            </span>
                        </div> */}
                    </Card>

                    {/* Imagen del anaquel */}
                    <Card className="p-5 shadow-md border-border">
                        <h2 className="text-base font-bold mb-3 text-foreground border-b pb-2">Imagen del Anaquel</h2>
                        {solicitud.url_rack_image ? (
                            <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                                <img
                                    src={solicitud.url_rack_image}
                                    alt="Imagen del anaquel"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="aspect-video rounded-lg border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                <ImageOff size={28} className="opacity-50" />
                                <p className="text-xs">Sin imagen del anaquel</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}