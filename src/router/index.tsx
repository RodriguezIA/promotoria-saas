import { BrowserRouter, Routes, Route } from "react-router-dom"

import { Layout } from "@/layout"
import { Home } from '@/modules/home'
import { NotFound } from '@/modules/not-found'
import { Maintenance } from '@/modules/maintenance'
import { Finanzas, FinanzasActivadores, FinanzasPromotores } from '@/modules/finanzas'
import { ConfigurarApp } from '@/modules/configuracion'
import { Perfil, MiNegocio } from '@/modules/perfil'
import { PrivateRoute, Login, RestorePassword } from '@/modules/auth'
import { EliminarCuenta } from '@/modules/eliminar-cuenta'
import { AvisoPrivacidad, Terminos } from '@/modules/legal'
import { ListadoPreguntas, PreguntaDetalle } from '@/modules/preguntas'
import { Clientes, ClienteDetalle, CrearCliente } from '@/modules/clientes'
import { CrearPedido, PedidoDetalle, PedidosList } from '@/modules/pedidos'
import { TareasListado, TareaDetalle } from '@/modules/tareas'
import { PromotoresList, PromoterDetalle } from '@/modules/promotores'
import { ProductPage, ProductoDetalle, ProductoForm } from '@/modules/productos'
import { Establecimientos, Establecimiento, EstablecimientoDetalle } from '@/modules/establecimientos'
import { Mapa, AsignarMinimos } from '@/modules/mapa'
import { MisPrepedidos } from '@/modules/prepedidos'
import { CrearSolicitud, EditarSolicitud, SolicitudDetalle, SolicitudesList } from '@/modules/solicitudes'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/restore-pwd" element={<RestorePassword />} />
        <Route path="/mantenimiento" element={<Maintenance />} />
        <Route path="/eliminar-cuenta" element={<EliminarCuenta />} />
        <Route path="/aviso-de-privacidad" element={<AvisoPrivacidad />} />
        <Route path="/terminos" element={<Terminos />} />

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
          <Route path="establecimiento/:id_store" element={<Establecimiento />} />
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
          <Route path="mapa" element={<Mapa />} />
          <Route path="mis-prepedidos" element={<MisPrepedidos />} />
          <Route path="mapa/asignar-minimos" element={<AsignarMinimos />} />
          <Route path="promotores" element={<PromotoresList />} />
          <Route path="detalle-promotor/:id" element={<PromoterDetalle />} />
          <Route path="finanzas" element={<Finanzas />} />
          <Route path="finanzas/cobro-clientes" element={<Finanzas />} />
          <Route path="finanzas/pago-promotores" element={<FinanzasPromotores />} />
          <Route path="finanzas/pago-activadores" element={<FinanzasActivadores />} />
          <Route path="finanzas/gestion-pagos" element={<Finanzas />} />
          <Route path="finanzas/gestion-gastos" element={<Maintenance />} />
          <Route path="configurar-app" element={<ConfigurarApp />} />
          <Route path="reportes/pedidos" element={<PedidosList />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="mi-negocio" element={<MiNegocio />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
