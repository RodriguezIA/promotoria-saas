import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getProductsByClient } from '../../Fetch/products'; 
import { getQuestions, getClientsForQuestion } from '../../Fetch/questions'; 
import { getRequestById, updateFullRequest } from '../../Fetch/solicitudes'; // <- Importamos lo nuevo
import { Loader2, Save, ArrowLeft } from "lucide-react";

import { Button } from '../../components/ui/button';

// --- INTERFACES ---
interface ProductoSeleccionado {
  id_product: number;
  name: string;
  preguntas: PreguntaSeleccionada[];
}

interface PreguntaSeleccionada {
  id_pregunta: number;
  vc_pregunta: string;
  dc_precio: number;
}

export const EditarSolicitud = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // --- ESTADOS ---
  const [nombre, setNombre] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  
  // Catálogos
  const [listaProductos, setListaProductos] = useState<any[]>([]);
  const [listaPreguntas, setListaPreguntas] = useState<any[]>([]);
  
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorTexto, setErrorTexto] = useState<string | null>(null);

  // Estado principal
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);

  // --- EFECTO: Cargar Solicitud y Catálogos ---
  useEffect(() => {
    const cargarTodo = async () => {
      if (!id) return;
      setCargandoInicial(true);
      setErrorTexto(null);

      try {
        // 1. Obtener los datos actuales de la solicitud
        const resSolicitud = await getRequestById(Number(id));
        if (!resSolicitud.ok || !resSolicitud.data) {
          throw new Error("No se pudo cargar la solicitud original.");
        }
        
        const dataSol = resSolicitud.data;
        setNombre(dataSol.vc_name);
        setSelectedClientId(dataSol.id_client || null); // Tu backend debe devolver id_client en getRequestById

        const currentClientId = dataSol.id_client;

        if (currentClientId) {
          // 2. Traer catálogos correspondientes a este cliente
          const [resProductos, resPreguntas] = await Promise.all([
            getProductsByClient(currentClientId),
            getQuestions()
          ]);

          const productosCatalog = Array.isArray(resProductos.data) ? resProductos.data : Array.isArray(resProductos) ? resProductos : [];
          setListaProductos(productosCatalog);

          if (resPreguntas.ok && resPreguntas.data) {
            const preguntasConClientes = await Promise.all(
              resPreguntas.data.map(async (pregunta: any) => {
                try {
                  const clientesRes = await getClientsForQuestion(pregunta.id_question);
                  return {
                    ...pregunta,
                    assignedClients: clientesRes.ok ? clientesRes.data || [] : [],
                  };
                } catch {
                  return { ...pregunta, assignedClients: [] };
                }
              })
            );

            const preguntasDelCliente = preguntasConClientes.filter(p => 
              p.assignedClients?.some((c: any) => c.id_client === currentClientId)
            );
            setListaPreguntas(preguntasDelCliente);
          }

          // 3. Re-construir el estado de productosSeleccionados para marcar los checkboxes
          if (dataSol.productos) {
            const preSeleccionados: ProductoSeleccionado[] = dataSol.productos.map((p: any) => {
              // Buscamos el nombre del producto en el catálogo recién descargado
              const prodRef = productosCatalog.find((pc: any) => (pc.id_product || pc.id) === p.id_product);
              
              return {
                id_product: p.id_product,
                name: prodRef ? prodRef.name : `Producto #${p.id_product}`,
                preguntas: p.preguntas?.map((q: any) => ({
                  id_pregunta: q.id_question,
                  vc_pregunta: q.vc_question || 'Pregunta',
                  dc_precio: Number(q.precio_aplicado)
                })) || []
              };
            });
            
            setProductosSeleccionados(preSeleccionados);
          }
        }
      } catch (error: any) {
        console.error("Error al cargar datos para edición:", error);
        setErrorTexto(error.message || "Error al comunicarse con el servidor");
      } finally {
        setCargandoInicial(false);
      }
    };

    cargarTodo();
  }, [id]);

  // --- MANEJADORES DE EVENTOS ---
  const toggleProducto = (productoDB: any) => {
    setProductosSeleccionados(prev => {
      const idProducto = productoDB.id_product || productoDB.id; 
      const existe = prev.find(p => p.id_product === idProducto);
      
      if (existe) {
        return prev.filter(p => p.id_product !== idProducto);
      } else {
        return [...prev, { 
          id_product: idProducto, 
          name: productoDB.name, 
          preguntas: [] 
        }];
      }
    });
  };

  const togglePregunta = (id_product: number, preguntaDB: any) => {
    setProductosSeleccionados(prev => 
      prev.map(prod => {
        if (prod.id_product === id_product) {
          const preguntaExiste = prod.preguntas.find(q => q.id_pregunta === preguntaDB.id_question);
          
          let nuevasPreguntas;
          if (preguntaExiste) {
            nuevasPreguntas = prod.preguntas.filter(q => q.id_pregunta !== preguntaDB.id_question);
          } else {
            nuevasPreguntas = [...prod.preguntas, {
              id_pregunta: preguntaDB.id_question,
              vc_pregunta: preguntaDB.question,
              dc_precio: Number(preguntaDB.base_price) 
            }];
          }
          return { ...prod, preguntas: nuevasPreguntas };
        }
        return prod;
      })
    );
  };

  const calcularSubtotal = (preguntas: PreguntaSeleccionada[]) => {
    return preguntas.reduce((sum, q) => sum + q.dc_precio, 0);
  };

  const granTotal = productosSeleccionados.reduce((sum, prod) => {
    return sum + calcularSubtotal(prod.preguntas);
  }, 0);

  // --- GUARDAR (ACTUALIZAR) ---
  const handleActualizar = async () => {
    if (!nombre.trim()) {
      alert("Por favor ingresa un nombre para la solicitud.");
      return;
    }
    if (productosSeleccionados.length === 0) {
      alert("Selecciona al menos un producto.");
      return;
    }
    if (!selectedClientId) {
      alert("Error: No se ha detectado el cliente de la solicitud.");
      return;
    }
    if (!user || !user.id_user) {
      alert("Error de sesión: No se encontró el ID de usuario.");
      return;
    }

    setGuardando(true);

    const payload = {
      id_user: user.id_user,
      id_cliente: selectedClientId,
      nombre_solicitud: nombre.trim(),
      costo_total: granTotal,
      productos: productosSeleccionados.map(prod => ({
        id_product: prod.id_product,
        subtotal: calcularSubtotal(prod.preguntas),
        preguntas: prod.preguntas.map(q => ({
          id_pregunta: q.id_pregunta,
          precio_aplicado: q.dc_precio
        }))
      }))
    };

    try {
      const respuesta = await updateFullRequest(Number(id), payload);
      
      if (respuesta.ok) {
        alert("¡Solicitud actualizada con éxito!");
        navigate(`/detalle-solicitud/${id}`); // Regresamos al detalle
      }
    } catch (error: any) {
      console.error("Error al actualizar:", error);
      alert(error.message || "Ocurrió un error al actualizar la solicitud.");
    } finally {
      setGuardando(false);
    }
  };

  // --- RENDERIZADO ---
  if (cargandoInicial) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium text-lg">Cargando datos de la solicitud...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Editar Solicitud #{id}</h2>
          <p className="text-sm text-gray-500 mt-1">Modifica los productos o checklist y guarda los cambios.</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/detalle-solicitud/${id}`)} className="flex items-center gap-2">
          <ArrowLeft size={16} /> Cancelar
        </Button>
      </div>

      {errorTexto && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          {errorTexto}
        </div>
      )}

      {/* 1. Nombre de la solicitud */}
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">Nombre de la Solicitud</label>
        <input 
          type="text" 
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej. Auditoría de Verano"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      {/* 2. Selección de Productos */}
      <div className="mb-8">
        <label className="block text-gray-700 font-semibold mb-3">1. Modifica los Productos a auditar</label>
        {listaProductos.length === 0 ? (
          <p className="text-gray-500 italic p-4 bg-gray-50 rounded">No hay productos registrados en el catálogo.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {listaProductos.map(prod => {
              const idProducto = prod.id_product || prod.id;
              const seleccionado = productosSeleccionados.some(p => p.id_product === idProducto);
              return (
                <label 
                  key={idProducto} 
                  className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${seleccionado ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                >
                  <input 
                    type="checkbox" 
                    className="mr-3 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    checked={seleccionado}
                    onChange={() => toggleProducto(prod)}
                  />
                  <span className="font-medium text-gray-800 line-clamp-1" title={prod.name}>{prod.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Configuración de Preguntas */}
      {productosSeleccionados.length > 0 && (
        <div className="mb-8">
          <label className="block text-gray-700 font-semibold mb-4">2. Ajusta las Preguntas por Producto</label>
          
          {productosSeleccionados.map(producto => {
            const subtotal = calcularSubtotal(producto.preguntas);
            
            return (
              <div key={producto.id_product} className="mb-5 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-100 p-4 flex justify-between items-center border-b border-gray-200">
                  <h3 className="font-bold text-gray-800">{producto.name}</h3>
                  <span className="font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full text-sm">
                    Subtotal: ${subtotal.toFixed(2)}
                  </span>
                </div>
                
                <div className="p-4 bg-white">
                  <div className="space-y-3">
                    {listaPreguntas.length === 0 ? (
                      <p className="text-sm text-gray-500">No hay preguntas disponibles en el catálogo.</p>
                    ) : (
                      listaPreguntas.map(pregunta => {
                        const seleccionada = producto.preguntas.some(q => q.id_pregunta === pregunta.id_question);
                        return (
                          <label key={pregunta.id_question} className="flex items-start cursor-pointer group p-2 rounded hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                            <input 
                              type="checkbox" 
                              className="mt-1 mr-3 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                              checked={seleccionada}
                              onChange={() => togglePregunta(producto.id_product, pregunta)}
                            />
                            <div className="flex-1 flex justify-between items-center">
                              <span className="text-sm text-gray-700 font-medium">{pregunta.question}</span>
                              <span className="text-sm font-bold text-gray-600 ml-4">${Number(pregunta.base_price).toFixed(2)}</span>
                            </div>
                          </label>
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
          <hr className="my-6 border-gray-300" />
          <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-900 text-white p-5 rounded-lg shadow-lg">
            <div className="text-lg mb-4 sm:mb-0 flex items-center">
              Costo Total Actualizado: 
              <span className="text-3xl font-bold text-green-400 ml-3">${granTotal.toFixed(2)}</span>
            </div>
            <Button 
              onClick={handleActualizar}
              disabled={guardando}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-lg shadow transition-colors text-lg flex items-center gap-2"
            >
              {guardando ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {guardando ? 'Guardando...' : 'Actualizar Solicitud'}
            </Button>
          </div>
        </>
      )}

    </div>
  );
};