import { BrowserRouter, Routes, Route } from "react-router-dom"

import { Layout } from "@/layout"
import { Home } from '@/modules/home'
import { Finanzas } from '@/modules/finanzas'
import { Perfil, MiNegocio } from '@/modules/perfil'
import { PrivateRoute, Login, RestorePassword } from '@/modules/auth'
import { ListadoPreguntas, PreguntaDetalle } from '@/modules/preguntas'
import { Clientes, ClienteDetalle, CrearCliente } from '@/modules/clientes'
import { CrearPedido, PedidoDetalle, PedidosList } from '@/modules/pedidos'
import { TareasListado, TareaDetalle } from '@/modules/tareas'
import { PromotoresList, PromoterDetalle } from '@/modules/promotores'
import { ProductPage, ProductoDetalle, ProductoForm } from '@/modules/productos'
import { Establecimientos, Establecimiento, EstablecimientoDetalle } from '@/modules/establecimientos'
import { CrearSolicitud, EditarSolicitud, SolicitudDetalle, SolicitudesList } from '@/modules/solicitudes'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/restore-pwd" element={<RestorePassword />} />

        <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="crearCliente" element={<CrearCliente />} />
          <Route path="clientes/:id" element={<ClienteDetalle />} />
          <Route path="productos" element={<ProductPage />} />
          <Route path="producto" element={<ProductoForm />} />
          <Route path="producto/:id_product" element={<ProductoForm />} />
          <Route path="producto/detalle/:id_product" element={<ProductoDetalle />} />
          <Route path="establecimientos" element={<Establecimientos />} />
          <Route path="establecimiento" element={<Establecimiento />} />
          <Route path="establecimiento/detalle/:id_store_client" element={<EstablecimientoDetalle />} />
          <Route path="preguntas" element={<ListadoPreguntas />} />
          <Route path="preguntas/detalle/:id" element={<PreguntaDetalle />} />
          <Route path="solicitudes" element={<SolicitudesList />} />
          <Route path="crearSolicitud" element={<CrearSolicitud />} />
          <Route path="detalle-solicitud/:id" element={<SolicitudDetalle />} />
          <Route path="editar-solicitud/:id" element={<EditarSolicitud />} />
          <Route path="pedidos" element={<PedidosList />} />
          <Route path="crearPedido" element={<CrearPedido />} />
          <Route path="detalle-pedido/:id" element={<PedidoDetalle />} />
          <Route path="tareas" element={<TareasListado />} />
          <Route path="tareas/:id_task" element={<TareaDetalle />} />
          <Route path="promotores" element={<PromotoresList />} />
          <Route path="detalle-promotor/:id" element={<PromoterDetalle />} />
          <Route path="finanzas" element={<Finanzas />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="mi-negocio" element={<MiNegocio />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
