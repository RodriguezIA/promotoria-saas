import { Loader2, Search, ImageOff, Check, PackageOpen, ImagePlus, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useAuthStore } from '@/stores'
import { api, ApiResponse } from '@/lib'
import { createRequest } from '@/Fetch/solicitudes'
import { ClientListDTO, ProductDTO, QuestionDTO } from '@/dtos'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, Checkbox } from '@/components'

interface ProductoSeleccionado extends ProductDTO {
  preguntas: {
    id_pregunta: number;
    vc_pregunta: string;
    dc_precio: number;
  }[];
}

export const CrearSolicitud = () => {
  const { user } = useAuthStore();
  
  // Validamos si es super admin
  const isSuperAdmin = user?.id_client === 0 || user?.i_rol === 1;

  const [nombre, setNombre] = useState('');
  
  // States para Clientes (Solo Super Admin)
  const [clientes, setClientes] = useState<ClientListDTO[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [cargandoClientes, setCargandoClientes] = useState(false);

  // Listas de la base de datos
  const [listaProductos, setListaProductos] = useState<ProductDTO[]>([]);
  const [listaPreguntas, setListaPreguntas] = useState<QuestionDTO[]>([]); // Cambiado a any[] o a tu interface Question
  
  const [cargando, setCargando] = useState(false);
  const [errorTexto, setErrorTexto] = useState<string | null>(null);

  // Estado principal de la solicitud
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);

  // Búsqueda de preguntas por producto
  const [busquedaPreguntas, setBusquedaPreguntas] = useState<Record<number, string>>({});

  // Imagen de anaquel
  const [imagenAnaquel, setImagenAnaquel] = useState<File | null>(null);
  const [previewAnaquel, setPreviewAnaquel] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      const fetchClients = async () => {
        setCargandoClientes(true);
        try {
          const response = await api.get<ApiResponse<ClientListDTO[]>>('/clients/');
          setClientes(response.data);
          
          if (response.data.length > 0) {
            setSelectedClientId(response.data[0].id_client);
          }

        } catch (error) {
          console.error("Error al cargar clientes:", error);
          setErrorTexto("Error al cargar la lista de clientes.");
        } finally {
          setCargandoClientes(false);
        }
      };
      fetchClients();
    } else {
      setSelectedClientId(user?.id_client || null);
    }
  }, [isSuperAdmin, user]);

  // --- EFECTO 2: Cargar Productos y Preguntas (LÓGICA CORREGIDA) ---
  useEffect(() => {
    if (!selectedClientId) return;

    const cargarDatos = async () => {
      setCargando(true);
      setErrorTexto(null);
      setProductosSeleccionados([]);
      setImagenAnaquel(null);
      setPreviewAnaquel(null);

      try {

        // PRODDUCTOS
        const respProductos = await api.get<ApiResponse<ProductDTO[]>>(`/products/${selectedClientId}`);
        setListaProductos(respProductos.data);

        // PREGUNTAS
        const respPreguntas = await api.get<ApiResponse<QuestionDTO[]>>(`/questions/list/${selectedClientId}`);
        setListaPreguntas(respPreguntas.data);
      } catch (error) {
        console.error("Error al cargar catálogos:", error);
        setErrorTexto(error instanceof Error ? error.message : "Error al comunicarse con el servidor");
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [selectedClientId]);

  // --- MANEJADORES DE EVENTOS ---
  const handleClientChange = (value: string) => {
    setSelectedClientId(Number(value));
  };

  const toggleProducto = (productoDB: ProductDTO) => {
    setProductosSeleccionados(prev => {
      const idProducto = productoDB.id_product; 
      const existe = prev.find(p => p.id_product === idProducto);
      
      if (existe) {
        return prev.filter(p => p.id_product !== idProducto);
      } else {
        return [...prev, { 
          ...productoDB,
          preguntas: [] 
        }];
      }
    });
  };

  // ATENCIÓN: Adaptado a los nombres de la base de datos de "Question"
  const togglePregunta = (id_product: number, preguntaDB: any) => {
    setProductosSeleccionados(prev =>
      prev.map(prod => {
        if (prod.id_product === id_product) {
          const preguntaExiste = prod.preguntas.find(q => q.id_pregunta === preguntaDB.id_question);

          let nuevasPreguntas;
          if (preguntaExiste) {
            nuevasPreguntas = prod.preguntas.filter(q => q.id_pregunta !== preguntaDB.id_question);
          } else {
            // Ya no guardamos precio individual, solo la referencia a la pregunta
            nuevasPreguntas = [...prod.preguntas, {
              id_pregunta: preguntaDB.id_question,
              vc_pregunta: preguntaDB.question,
              dc_precio: 0
            }];
          }
          return { ...prod, preguntas: nuevasPreguntas };
        }
        return prod;
      })
    );
  };

  // --- MANEJADORES DE IMAGEN ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5MB");
      return;
    }

    setImagenAnaquel(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewAnaquel(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagenAnaquel(null);
    setPreviewAnaquel(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const convertirImagenABase64 = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!imagenAnaquel) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(imagenAnaquel);
    });
  };

  // --- CÁLCULOS DINÁMICOS (NUEVA LÓGICA DE PRECIOS) ---
  // Precio base $45 incluye hasta 3 preguntas. Después $15 c/u. Máximo $90.
  const totalPreguntas = productosSeleccionados.reduce((sum, prod) => sum + prod.preguntas.length, 0);

  const calcularCostoSolicitud = (numPreguntas: number) => {
    const base = 45;
    const preguntasExtra = Math.max(numPreguntas - 3, 0);
    const costoExtra = preguntasExtra * 15;
    return Math.min(base + costoExtra, 90);
  };

  const granTotal = calcularCostoSolicitud(totalPreguntas);
  const preguntasExtra = Math.max(totalPreguntas - 3, 0);
  const costoExtra = Math.min(preguntasExtra * 15, 45); // 90 - 45 = 45 max extra

  // --- GUARDAR ---
  const handleGuardar = async () => {
    if (!nombre.trim()) {
      toast.error("Por favor ingresa un nombre para la solicitud.");
      return;
    }
    if (productosSeleccionados.length === 0) {
      toast.error("Selecciona al menos un producto.");
      return;
    }
    if (!selectedClientId) {
      toast.error("No hay un cliente seleccionado.");
      return;
    }

    if (!user || !user.id_user) {
      toast.error("Error de sesión: No se encontró el ID de usuario.");
      return;
    }

    setCargando(true);

    try {
      const formData = new FormData();
      formData.append("id_user", user.id_user.toString());
      formData.append("id_client", selectedClientId.toString());
      formData.append("vc_name", nombre.trim());
      formData.append("f_value", granTotal.toString());

      if (imagenAnaquel) {
        formData.append("rackImage", imagenAnaquel);
      }

      formData.append("products", JSON.stringify(productosSeleccionados.map(prod => ({
        id_product: prod.id_product,
        questions: prod.preguntas.map(q => ({
          id_question: q.id_pregunta,
        }))
      }))));

      await api.upload<ApiResponse>('/requests/', formData);

      toast.success("¡Solicitud guardada con éxito!");
      setNombre('');
      setProductosSeleccionados([]);
      setImagenAnaquel(null);
      setPreviewAnaquel(null);
      setBusquedaPreguntas({});
    } catch (error: any) {
      console.error("Error al guardar:", error);
      toast.error(error.message || "Ocurrió un error al guardar la solicitud.");
    } finally {
      setCargando(false);
    }
  };

  // --- RENDERIZADO ---
  if (isSuperAdmin && cargandoClientes) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-info mb-2" />
        <p className="text-muted-foreground font-medium">Cargando lista de clientes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Crear Nueva Solicitud</h2>
      </div>

      {errorTexto && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/30">
          {errorTexto}
        </div>
      )}

      {/* SELECTOR DE CLIENTE */}
      {isSuperAdmin && clientes.length > 0 && (
        <div className="mb-6 bg-muted/50 p-4 rounded-lg border border-border">
          <label className="block text-sm font-semibold text-foreground mb-2">
            Selecciona el Cliente:
          </label>
          <Select
            value={selectedClientId?.toString() || ""}
            onValueChange={handleClientChange}
          >
            <SelectTrigger className="w-full md:w-1/2 bg-white">
              <SelectValue placeholder="Selecciona un cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((client) => (
                <SelectItem
                  key={client.id_client}
                  value={client.id_client.toString()}
                >
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 1. Nombre de la solicitud */}
      <div className="mb-6">
        <label className="block text-foreground font-semibold mb-2">Nombre de la Solicitud</label>
        <input 
          type="text" 
          className="w-full p-3 border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Ej. Auditoría de Verano"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={!selectedClientId}
        />
      </div>

      {/* Imagen de anaquel */}
      <div className="mb-6">
        <label className="block text-foreground font-semibold mb-2">Imagen del Anaquel</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        {!previewAnaquel ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedClientId}
            className="w-full md:w-1/2 border-2 border-dashed border-input rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-ring hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImagePlus size={32} />
            <span className="text-sm font-medium">Haz clic para subir una foto del anaquel</span>
            <span className="text-xs text-muted-foreground/70">PNG, JPG o WEBP hasta 5MB</span>
          </button>
        ) : (
          <div className="relative w-full md:w-1/2">
            <div className="aspect-video bg-muted rounded-xl overflow-hidden border border-border">
              <img
                src={previewAnaquel}
                alt="Vista previa del anaquel"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow hover:bg-destructive/90 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-info mr-2" />
          <span className="text-muted-foreground">Cargando catálogos del cliente...</span>
        </div>
      ) : selectedClientId ? (
        <>
          {/* 2. Selección de Productos */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-foreground font-semibold">1. Selecciona los Productos a auditar</label>
              <Badge variant="secondary">{productosSeleccionados.length} seleccionados</Badge>
            </div>
            {listaProductos.length === 0 ? (
              <p className="text-muted-foreground italic p-4 bg-muted/50 rounded">No hay productos registrados para este cliente.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {listaProductos.map(prod => {
                  const idProducto = prod.id_product;
                  const seleccionado = productosSeleccionados.some(p => p.id_product === idProducto);
                  const prodSeleccionado = productosSeleccionados.find(p => p.id_product === idProducto);
                  const cantidadPreguntas = prodSeleccionado?.preguntas.length || 0;
                  return (
                    <div
                      key={idProducto}
                      onClick={() => toggleProducto(prod)}
                      className={`relative group cursor-pointer rounded-xl border-2 transition-all overflow-hidden ${
                        seleccionado
                          ? 'border-ring bg-info/10 shadow-md'
                          : 'border-border bg-white hover:border-info/30 hover:shadow-sm'
                      }`}
                    >
                      {/* Badge de seleccionado */}
                      {seleccionado && (
                        <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1 shadow">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}

                      {/* Imagen del producto */}
                      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                        {prod.vc_image ? (
                          <img
                            src={prod.vc_image}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground/70">
                            <ImageOff size={32} />
                            <span className="text-xs mt-1">Sin imagen</span>
                          </div>
                        )}
                      </div>

                      {/* Nombre */}
                      <div className="p-3">
                        <p className="font-medium text-sm text-foreground line-clamp-2 text-center" title={prod.name}>
                          {prod.name}
                        </p>
                        {seleccionado && cantidadPreguntas > 0 && (
                          <p className="text-xs text-info text-center mt-1 font-medium">
                            {cantidadPreguntas} pregunta{cantidadPreguntas !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Configuración de Preguntas */}
          {productosSeleccionados.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-foreground font-semibold">2. Configura las Preguntas por Producto</label>
                <Badge variant="outline" className="text-info border-info/30 bg-info/10">
                  {totalPreguntas} pregunta{totalPreguntas !== 1 ? 's' : ''} en total
                </Badge>
              </div>

              {productosSeleccionados.map(producto => {
                const busqueda = busquedaPreguntas[producto.id_product] || '';
                const preguntasFiltradas = listaPreguntas.filter(p =>
                  p.question?.toLowerCase().includes(busqueda.toLowerCase())
                );
                const cantidadSel = producto.preguntas.length;

                return (
                  <div key={producto.id_product} className="mb-5 border border-border rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="bg-muted/50 p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="bg-info/15 text-info rounded-lg p-2">
                          <PackageOpen size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{producto.name}</h3>
                          <p className="text-xs text-muted-foreground">{cantidadSel} pregunta{cantidadSel !== 1 ? 's' : ''} seleccionada{cantidadSel !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      {/* Buscador de preguntas */}
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={16} />
                        <input
                          type="text"
                          placeholder="Buscar preguntas..."
                          className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          value={busqueda}
                          onChange={(e) => setBusquedaPreguntas(prev => ({ ...prev, [producto.id_product]: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                        {listaPreguntas.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">No hay preguntas disponibles para este cliente.</p>
                        ) : preguntasFiltradas.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">No se encontraron preguntas con "{busqueda}"</p>
                        ) : (
                          preguntasFiltradas.map(pregunta => {
                            const seleccionada = producto.preguntas.some(q => q.id_pregunta === pregunta.id_question);
                            return (
                              <div
                                key={pregunta.id_question}
                                className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors border ${
                                  seleccionada
                                    ? 'bg-success/10 border-success/30'
                                    : 'hover:bg-accent border-transparent hover:border-border'
                                }`}
                              >
                                <div className="shrink-0">
                                  <Checkbox
                                    checked={seleccionada}
                                    onCheckedChange={() => togglePregunta(producto.id_product, pregunta)}
                                    className="border-input data-[state=checked]:bg-success data-[state=checked]:border-success"
                                  />
                                </div>
                                <span className={`text-sm font-medium flex-1 select-none ${seleccionada ? 'text-success' : 'text-foreground'}`}>
                                  {pregunta.question}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. Resumen y Guardar */}
          {productosSeleccionados.length > 0 && (
            <>
              <hr className="my-6 border-input" />
              <div className="bg-primary text-primary-foreground p-5 rounded-xl shadow-lg">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Desglose de precios */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-8">
                      <span className="text-primary-foreground/70">Costo base (hasta 3 preguntas):</span>
                      <span className="font-medium">$45.00</span>
                    </div>
                    {preguntasExtra > 0 && (
                      <div className="flex justify-between gap-8 text-primary-foreground/90">
                        <span>Preguntas extra ({preguntasExtra}):</span>
                        <span>+ ${costoExtra.toFixed(2)}</span>
                      </div>
                    )}
                    {granTotal >= 90 && totalPreguntas > 6 && (
                      <div className="text-xs text-primary-foreground/70 italic">
                        Precio máximo alcanzado. Puedes seguir agregando preguntas sin costo adicional.
                      </div>
                    )}
                    <div className="flex justify-between gap-8 text-lg pt-2 border-t border-primary-foreground/20">
                      <span className="font-bold">Costo Total:</span>
                      <span className="font-bold">${granTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleGuardar}
                    disabled={cargando}
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 disabled:opacity-60 font-semibold py-3 px-8 rounded-lg shadow transition-colors text-lg w-full lg:w-auto"
                  >
                    {cargando ? 'Guardando...' : 'Crear Solicitud'}
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      ) : null}

    </div>
  );
};