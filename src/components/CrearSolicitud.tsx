import React, { useState, useEffect } from 'react';
// IMPORTANTE: Ajusta estas rutas dependiendo de la estructura de tus carpetas
import { useAuthStore } from '../store/authStore';
import { getProductsByClient } from '../Fetch/products'; 
import { getCLientsList } from '../Fetch/clientes'; 
// NUEVAS IMPORTACIONES: Usando la lógica que sí funciona de tu otro componente
import { getQuestions, getClientsForQuestion } from '../Fetch/questions'; 
import { Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

import { createRequest } from '../Fetch/solicitudes';

// --- INTERFACES LOCALES ---
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

interface Client {
  id_client: number;
  name: string;
}

export const CrearSolicitud = () => {
  const { user } = useAuthStore();
  
  // Validamos si es super admin
  const isSuperAdmin = user?.id_client === 0 || user?.i_rol === 1;

  // --- ESTADOS ---
  const [nombre, setNombre] = useState('');
  
  // Estados para Clientes (Solo Super Admin)
  const [clientes, setClientes] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [cargandoClientes, setCargandoClientes] = useState(false);

  // Listas de la base de datos
  const [listaProductos, setListaProductos] = useState<any[]>([]);
  const [listaPreguntas, setListaPreguntas] = useState<any[]>([]); // Cambiado a any[] o a tu interface Question
  
  const [cargando, setCargando] = useState(false);
  const [errorTexto, setErrorTexto] = useState<string | null>(null);

  // Estado principal de la solicitud
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);

  // --- EFECTO 1: Cargar Clientes (Solo si es Super Admin) ---
  useEffect(() => {
    if (isSuperAdmin) {
      const fetchClients = async () => {
        setCargandoClientes(true);
        try {
          const response = await getCLientsList();
          const clientsList = response.data || [];
          setClientes(clientsList);
          
          if (clientsList.length > 0) {
            setSelectedClientId(clientsList[0].id_client);
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

      try {
        // 1. Llamamos a Productos y a TODAS las preguntas al mismo tiempo
        const [resProductos, resPreguntas] = await Promise.all([
          getProductsByClient(selectedClientId),
          getQuestions()
        ]);

        // 2. Setear Productos
        const productosData = resProductos.data || resProductos; 
        setListaProductos(Array.isArray(productosData) ? productosData : []);

        // 3. Procesar y Filtrar Preguntas (Igual que en PreguntasSuperAdmin)
        if (resPreguntas.ok && resPreguntas.data) {
          
          // Traemos los clientes de cada pregunta
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

          // Filtramos para dejar SOLO las que pertenecen al cliente seleccionado
          const preguntasDelCliente = preguntasConClientes.filter(p => 
            p.assignedClients?.some((c: any) => c.id_client === selectedClientId)
          );

          setListaPreguntas(preguntasDelCliente);
        } else {
          throw new Error(resPreguntas.message || "Error al obtener las preguntas");
        }

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
            // Transformamos los datos a la interfaz que necesitas para armar el JSON
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

  // --- CÁLCULOS DINÁMICOS ---
  const calcularSubtotal = (preguntas: PreguntaSeleccionada[]) => {
    return preguntas.reduce((sum, q) => sum + q.dc_precio, 0);
  };

  const granTotal = productosSeleccionados.reduce((sum, prod) => {
    return sum + calcularSubtotal(prod.preguntas);
  }, 0);

  // --- GUARDAR ---
  const handleGuardar = async () => {
    if (!nombre.trim()) {
      alert("Por favor ingresa un nombre para la solicitud.");
      return;
    }
    if (productosSeleccionados.length === 0) {
      alert("Selecciona al menos un producto.");
      return;
    }
    if (!selectedClientId) {
      alert("No hay un cliente seleccionado.");
      return;
    }
    
    // Validamos que exista un usuario en el store para mandar su ID
    if (!user || !user.id_user) {
      alert("Error de sesión: No se encontró el ID de usuario.");
      return;
    }

    // Usamos disabled o un estado de "guardando" para evitar doble click
    setCargando(true);

    const payload = {
      id_user: user.id_user, // ¡AQUÍ MANDAMOS EL ID DEL USUARIO DESDE EL STORE!
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
      console.log("Enviando al Backend:", payload);
      const respuesta = await createRequest(payload);
      
      if (respuesta.ok) {
        alert("¡Solicitud guardada con éxito!");
        // Aquí podrías limpiar el formulario o redireccionar al usuario
        setNombre('');
        setProductosSeleccionados([]);
      }
    } catch (error: any) {
      console.error("Error al guardar:", error);
      alert(error.message || "Ocurrió un error al guardar la solicitud.");
    } finally {
      setCargando(false);
    }
  };

  // --- RENDERIZADO ---
  if (isSuperAdmin && cargandoClientes) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
        <p className="text-gray-500 font-medium">Cargando lista de clientes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Crear Nueva Solicitud</h2>
      </div>

      {errorTexto && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          {errorTexto}
        </div>
      )}

      {/* SELECTOR DE CLIENTE */}
      {isSuperAdmin && clientes.length > 0 && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
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
        <label className="block text-gray-700 font-semibold mb-2">Nombre de la Solicitud</label>
        <input 
          type="text" 
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej. Auditoría de Verano"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={!selectedClientId}
        />
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-blue-500 mr-2" />
          <span className="text-gray-500">Cargando catálogos del cliente...</span>
        </div>
      ) : selectedClientId ? (
        <>
          {/* 2. Selección de Productos */}
          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-3">1. Selecciona los Productos a auditar</label>
            {listaProductos.length === 0 ? (
              <p className="text-gray-500 italic p-4 bg-gray-50 rounded">No hay productos registrados para este cliente.</p>
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
              <label className="block text-gray-700 font-semibold mb-4">2. Configura las Preguntas por Producto</label>
              
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
                          <p className="text-sm text-gray-500">No hay preguntas disponibles para este cliente.</p>
                        ) : (
                          listaPreguntas.map(pregunta => {
                            // ATENCIÓN: Usamos id_question aquí
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
                                  {/* ATENCIÓN: Usamos question y base_price */}
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
                  Costo Total: 
                  <span className="text-3xl font-bold text-green-400 ml-3">${granTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleGuardar}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow transition-colors text-lg"
                >
                  Crear Solicitud
                </button>
              </div>
            </>
          )}
        </>
      ) : null}

    </div>
  );
};