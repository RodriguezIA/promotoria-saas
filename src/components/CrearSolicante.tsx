import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useSolicitudStore } from "../store/solicitudes";
import { useAuthStore } from "../store/authStore";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";

import { Trash2 } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

// -------------------- Tipos --------------------
interface Pregunta {
  id: string | number;
  texto: string;
  precio: number; // 0 = gratuita
}


// Util: genera URL segura para File | string
const toImgUrl = (img: File | string) =>
  typeof img === "string" ? img : URL.createObjectURL(img);

// -------------------- Subcomponentes --------------------
function ProductoCard({
  producto,
  onSelect,
}: {
  producto: { id_producto: string; name: string; description?: string; images: (File | string)[] };
  onSelect: () => void;
}) {
  const imgUrl = useMemo(() => (producto.images?.[0] ? toImgUrl(producto.images[0]) : ""), [producto.images]);

  // Revoca el objectURL si aplica
  useEffect(() => {
    return () => {
      if (producto.images?.[0] && typeof producto.images[0] !== "string") {
        URL.revokeObjectURL(imgUrl);
      }
    };
  }, [imgUrl, producto.images]);

  return (
    <Card
      onClick={onSelect}
      className="cursor-pointer hover:ring-2 ring-primary w-full max-w-xs flex items-center p-2 gap-3"
    >
      {imgUrl ? (
        <img src={imgUrl} alt={producto.name} className="w-20 h-20 object-cover rounded border" />
      ) : (
        <div className="w-20 h-20 grid place-content-center border rounded text-xs text-muted-foreground">Sin imagen</div>
      )}

      <div className="flex-1">
        <h3 className="font-semibold text-base line-clamp-1">{producto.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{producto.description || "Sin descripción"}</p>
      </div>
    </Card>
  );
}

function PreguntaItem({ pregunta, selected, onToggle }: { pregunta: Pregunta; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left border p-2 rounded transition-colors ${selected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
        }`}
    >
      <div className="flex items-center justify-between">
        <span>{pregunta.texto}</span>
        {pregunta.precio > 0 && <span className="text-xs opacity-80">+${pregunta.precio} MXN</span>}
      </div>
    </button>
  );
}

function ProductoSeleccionado({
  p,
  onRemove,
  index,
}: {
  p: { id: string; nombre: string; imagenes: string[]; preguntas: Pregunta[] };
  onRemove: () => void;
  index: number;
}) {
  const costoPreguntas = p.preguntas.reduce((acc, q) => acc + q.precio, 0);
  const costoExtraProducto = index >= 3 ? 15 : 0; // 4to en adelante
  const totalExtra = costoPreguntas + costoExtraProducto;

  return (
    <div className="flex items-center border rounded-lg p-3 shadow-sm bg-background relative group w-full max-w-xs">
      {p.imagenes?.[0] ? (
        <img src={p.imagenes[0]} alt={p.nombre} className="w-20 h-20 object-cover rounded mr-4" />
      ) : (
        <div className="w-20 h-20 mr-4 grid place-content-center border rounded text-xs text-muted-foreground">Sin imagen</div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold mb-1 truncate">{p.nombre}</h3>
        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
          {p.preguntas.map((q) => (
            <li key={q.id} className="truncate">{q.texto}</li>
          ))}
        </ul>
        {totalExtra > 0 && <span className="text-sm text-green-600 font-semibold">+ ${totalExtra} MXN</span>}
      </div>

      <button
        onClick={onRemove}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground p-1 rounded"
        aria-label="Eliminar producto"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

// -------------------- Página --------------------
export default function CrearSolicitud() {
  const navigate = useNavigate();

  const authIdClient = useAuthStore((state) => state.id_client);

  // Use the API instead of a non-existent store for products
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!authIdClient) return;
      try {
        const { getProductsByClient } = await import("../Fetch/products");
        const data = await getProductsByClient(authIdClient);
        setProducts(data || []);
      } catch (error) {
        console.error("Error al obtener productos:", error);
      }
    };
    fetchProducts();
  }, [authIdClient]);

  const { agregarProducto, eliminarProducto, calcularPrecioTotal, productos, limpiarSolicitud } = useSolicitudStore();

  const [productoActual, setProductoActual] = useState<any | null>(null);
  const [preguntasSeleccionadas, setPreguntasSeleccionadas] = useState<Pregunta[]>([]);

  // Estado de inputs fijos de la solicitud
  const [nombreSolicitud, setNombreSolicitud] = useState(`Solicitud ${new Date().toLocaleDateString()}`);
  const [cantidadTiendas, setCantidadTiendas] = useState(1);

  // Estado para las preguntas reales de la API
  const [preguntasDisponibles, setPreguntasDisponibles] = useState<Pregunta[]>([]);
  const [loadingPreguntas, setLoadingPreguntas] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Filtra productos que aún no han sido agregados a la solicitud
  const productosSinAgregar = useMemo(
    () => products.filter((p) => !productos.some((sel) => sel.id === p.id_producto)),
    [products, productos]
  );

  // Selección de producto del catálogo
  const handleSeleccionarProducto = async (producto: any) => {
    setProductoActual(producto);
    setPreguntasSeleccionadas([]);
    setLoadingPreguntas(true);

    try {
      if (!authIdClient) throw new Error("No hay id_client en sesión");
      const { getPreguntasByNegocio } = await import("../Fetch/preguntas");
      const res = await getPreguntasByNegocio(authIdClient);

      if (res.ok && res.data) {
        // Mapear al tipo local
        const mapped: Pregunta[] = res.data.map((p) => ({
          id: p.id_pregunta,
          texto: p.vc_pregunta,
          precio: p.dc_precio || 0,
        }));
        setPreguntasDisponibles(mapped);
      } else {
        toast.error("No se pudieron cargar las preguntas");
        setPreguntasDisponibles([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al obtener preguntas del negocio");
      setPreguntasDisponibles([]);
    } finally {
      setLoadingPreguntas(false);
    }
  };

  // Toggle de preguntas con 1 gratis por producto
  const handleTogglePregunta = (pregunta: Pregunta) => {
    const exists = preguntasSeleccionadas.some((p: Pregunta) => p.id === pregunta.id);
    if (exists) {
      setPreguntasSeleccionadas((prev: Pregunta[]) => prev.filter((p: Pregunta) => p.id !== pregunta.id));
      return;
    }

    const yaHayGratis = preguntasSeleccionadas.some((p: Pregunta) => p.precio === 0);
    if (pregunta.precio === 0 && yaHayGratis) {
      toast("Solo puedes seleccionar una pregunta gratuita por producto");
      return;
    }

    setPreguntasSeleccionadas((prev: Pregunta[]) => [...prev, pregunta]);
  };

  // Confirma producto + preguntas
  const handleConfirmarProducto = () => {
    if (!productoActual) return;
    if (preguntasSeleccionadas.length === 0) {
      toast("Debes seleccionar al menos una pregunta");
      return;
    }

    agregarProducto({
      id: productoActual.id_producto,
      nombre: productoActual.name,
      imagenes: (productoActual.images || []).map((img: any) => toImgUrl(img)),
      preguntas: preguntasSeleccionadas.map(p => ({
        id: Number(p.id),
        texto: p.texto,
        precio: p.precio
      })),
    });

    setProductoActual(null);
    setPreguntasSeleccionadas([]);
  };

  // Guarda solicitud (mock): limpia el store y vuelve a listado
  const handleGuardarSolicitud = async () => {
    if (productoActual) {
      toast("Termina de confirmar el producto en edición antes de guardar");
      return;
    }

    if (productos.length === 0) {
      toast("Agrega al menos un producto a la solicitud");
      return;
    }

    setGuardando(true);
    try {
      const { createSolicitudMock } = await import("../Fetch/solicitudesMock");

      // Construir payload
      const payload = {
        nombre: nombreSolicitud || `Solicitud ${new Date().toLocaleDateString()}`,
        id_client: authIdClient || 0,
        tiendas: cantidadTiendas,
        total: calcularPrecioTotal(),
        productos: productos.map((p) => ({
          id_producto: p.id,
          nombre: p.nombre,
          cantidad: 1, // Por ahora es 1
          precio_extra: p.preguntas.reduce((acc: number, q: Pregunta) => acc + q.precio, 0),
          preguntas: p.preguntas.map((q: any) => ({
            id_pregunta: String(q.id),
            texto: q.texto,
            precio: Number(q.precio)
          }))
        }))
      };

      await createSolicitudMock(payload);
      toast.success("Solicitud creada exitosamente");
      limpiarSolicitud();
      navigate("/solicitudes");
    } catch (error) {
      console.error("Error al guardar solicitud:", error);
      toast.error("Error al guardar la solicitud");
    } finally {
      setGuardando(false);
    }
  };

  // -------------------- Render --------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Crear Solicitud</h1>
          <p className="text-sm text-gray-500 mt-1">Configura y agrega productos a la solicitud.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Columna izquierda: catálogo / selección de preguntas */}
          <div className="w-full lg:w-2/3 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Paso 1: Configurar productos</h2>

            <div className="flex flex-col gap-2 mb-6">
              <Label htmlFor="nombre">Nombre de la solicitud</Label>
              <Input
                id="nombre"
                placeholder="Ej. Revisión mensual de caducidad"
                value={nombreSolicitud}
                onChange={(e) => setNombreSolicitud(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 mb-8">
              <Label htmlFor="tiendas">Cantidad de tiendas a visitar</Label>
              <Input
                id="tiendas"
                type="number"
                min="1"
                value={cantidadTiendas}
                onChange={(e) => setCantidadTiendas(parseInt(e.target.value) || 1)}
              />
            </div>

            {productos.length >= 3 && (
              <p className="text-sm text-amber-600 mb-2">Al agregar un producto extra se suman $15 MXN adicionales.</p>
            )}

            {/* Lista de productos disponibles o selector de preguntas */}
            {!productoActual ? (
              <div className={`flex flex-col ${productosSinAgregar.length === 1 ? "items-center" : "items-start"} gap-4`}>
                {productosSinAgregar.length > 0 ? (
                  productosSinAgregar.map((producto: any) => (
                    <ProductoCard key={producto.id_producto} producto={producto} onSelect={() => handleSeleccionarProducto(producto)} />
                  ))
                ) : (
                  <p className="text-muted-foreground">Todos los productos del catálogo ya fueron agregados.</p>
                )}
              </div>
            ) : (
              <>
                <h2 className="font-semibold text-lg mb-2">Selecciona preguntas para: {productoActual.name}</h2>
                {loadingPreguntas ? (
                  <p className="text-sm text-muted-foreground my-4">Cargando checkist...</p>
                ) : preguntasDisponibles.length === 0 ? (
                  <p className="text-sm text-red-500 my-4">Este cliente no tiene preguntas activas. Contacta a un administrador.</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {preguntasDisponibles.map((p: Pregunta) => (
                      <PreguntaItem
                        key={p.id}
                        pregunta={p}
                        selected={preguntasSeleccionadas.some((ps: Pregunta) => String(ps.id) === String(p.id))}
                        onToggle={() => handleTogglePregunta(p)}
                      />
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setProductoActual(null)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmarProducto} disabled={preguntasSeleccionadas.length === 0}>
                    Confirmar producto
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Columna derecha: resumen */}
          <div className="w-full lg:w-1/3 flex flex-col justify-between bg-white rounded-lg border border-gray-200 p-6 h-fit sticky top-6">
            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-900">Resumen y Productos Seleccionados</h2>
              <Separator className="mb-4" />

              {productoActual ? (
                <div className="border rounded-lg p-3 shadow-sm bg-background">
                  <h3 className="font-semibold mb-2">{productoActual.name}</h3>
                  {productoActual.images?.[0] ? (
                    <img src={toImgUrl(productoActual.images[0])} alt={productoActual.name} className="w-16 h-16 object-cover rounded border" />
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin imagen</p>
                  )}
                  <ul className="mt-3 text-sm text-muted-foreground list-disc list-inside">
                    {preguntasSeleccionadas.map((p) => (
                      <li key={p.id}>{p.texto}</li>
                    ))}
                  </ul>
                </div>
              ) : productos.length > 0 ? (
                <div className={`flex flex-col ${productos.length === 1 ? "items-center" : "items-start"} gap-4`}>
                  {productos.map((p: any, index: number) => (
                    <ProductoSeleccionado key={p.id} p={p} index={index} onRemove={() => eliminarProducto(p.id)} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Aún no has agregado productos.</p>
              )}
            </div>

            {/* Footer fijo */}
            <div className="mt-6">
              <Separator className="mb-4" />
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-gray-700">Total:</span>
                <span className="text-xl font-bold text-gray-900">${calcularPrecioTotal()} MXN</span>
              </div>
              <Button onClick={handleGuardarSolicitud} className="w-full bg-gray-900 hover:bg-gray-800 text-white" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar solicitud"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

