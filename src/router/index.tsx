import { BrowserRouter, Routes, Route } from "react-router-dom"


import { Clientes, ClienteDetalle, CrearCliente } from '@/modules/clientes' 
import { ProductPage, ProductoDetalle, ProductoForm } from '@/modules/productos'
import { Establecimientos, Establecimiento, EstablecimientoDetalle } from '@/modules/establecimientos'

import PrivateRoute from "../components/PrivateRoute";
import Layout from "../components/layout/Layout";
import Login from "../pages/Login";
import Home from "../pages/inicio/Home";
import RestorePassword from "../pages/auth/restore-password";
import Preguntas from "../pages/preguntas/Preguntas";
import PreguntaDetalle from "../pages/preguntas/PreguntaDetalle";
import Cotizaciones from "../pages/cotizaciones/Cotizaciones";
import CotizacionDetalle from "../pages/cotizaciones/CotizacionDetalle";
import Servicios from "../pages/servicios/servicios";

// Solicitudes Feature
import SolicitudesList from "../pages/Solicitudes";
import { CrearSolicitud } from "../components/CrearSolicitud";
import SolicitudDetalle from "../pages/solicitudes/SolicitudDetalle";
import { EditarSolicitud } from "../pages/solicitudes/EditarSolicitud";

// PEDIDOS
import PedidosList from "../pages/pedidos/PedidoList";
import { CrearPedido } from "../pages/pedidos/CrearPedido";
import PedidoDetalle from "../pages/pedidos/PedidoDetalle";

// FINANZAS
import Finanzas from "../pages/finanzas/Finanzas";

// PERFIL
import Perfil from "../pages/perfil/Perfil";

// MI NEGOCIO
import MiNegocio from "../pages/miNegocio/MiNegocio";


export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />
        <Route path="/restore-pwd" element={<RestorePassword />} />

        {/* Rutas privadas, protegidas por PrivateRoute */}
        <Route
          path="/"
          element={
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
          <Route path="establecimiento/:id_store_client" element={<Establecimiento />} />
          <Route path="establecimiento/detalle/:id_store_client" element={<EstablecimientoDetalle />} />

          
          <Route path="preguntas" element={<Preguntas />} />
          <Route path="preguntas/detalle/:id" element={<PreguntaDetalle />} />
          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="cotizaciones/detalle/:id" element={<CotizacionDetalle />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="solicitudes" element={<SolicitudesList />} />
          <Route path="crearSolicitud" element={<CrearSolicitud />} />
          <Route path="detalle-solicitud/:id" element={<SolicitudDetalle />} />
          <Route path="editar-solicitud/:id" element={<EditarSolicitud />} />
          <Route path="pedidos" element={<PedidosList />} />
          <Route path="crearPedido" element={<CrearPedido />} />
          <Route path="detalle-pedido/:id" element={<PedidoDetalle />} />
          <Route path="finanzas" element={<Finanzas />} />
          <Route path="mi-negocio" element={<MiNegocio />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
