import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
import Layout from "../components/layout/Layout";
import Login from "../pages/Login";
import Home from "../pages/inicio/Home";
import ClientesList from "../pages/clientes/Cliente";
import RestorePassword from "../pages/auth/restore-password";
import CrearCliente from "../pages/clientes/ClienteN";
import ClientDetailPage from "../pages/clientes/ClientDetail";
import ProductPage from "../pages/productos/Products";
import CreateProduct from "../pages/productos/NewProduct";
import ProductDetail from "../pages/productos/ProductDetail";
import Establecimientos from "../pages/establecimientos/Establecimientos";
import Establecimiento from "../pages/establecimientos/Establecimiento";
import EstablecimientoDetalle from "../pages/establecimientos/EstablecimientoDetalle";
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
          <Route path="clientes" element={<ClientesList />} />
          <Route path="crearCliente" element={<CrearCliente />} />
          <Route path="clientes/:id" element={<ClientDetailPage />} />
          
          <Route path="productos" element={<ProductPage />} />
          <Route path="producto" element={<CreateProduct />} />
          <Route path="producto/:id_product" element={<CreateProduct />} />
          <Route path="producto/detalle/:id_product" element={<ProductDetail />} />
          <Route path="establecimientos" element={<Establecimientos />} />
          <Route path="establecimiento" element={<Establecimiento />} />
          <Route path="establecimiento/:id_store_client" element={<Establecimiento />} />
          <Route path="establecimiento/detalle/:id_store_client" element={<EstablecimientoDetalle />} />
          <Route path="preguntas" element={<Preguntas />} />
          <Route path="preguntas/detalle/:id" element={<PreguntaDetalle />} />


          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="cotizaciones/detalle/:id" element={<CotizacionDetalle />} />

          <Route path="servicios" element={<Servicios />} />

          {/* Solicitudes Feature */}
          <Route path="solicitudes" element={<SolicitudesList />} />
          <Route path="crearSolicitud" element={<CrearSolicitud />} />
          <Route path="detalle-solicitud/:id" element={<SolicitudDetalle />} />
          <Route path="editar-solicitud/:id" element={<EditarSolicitud />} />

          {/* Pedidos */}
          <Route path="pedidos" element={<PedidosList />} />
          <Route path="crearPedido" element={<CrearPedido />} />
          <Route path="detalle-pedido/:id" element={<PedidoDetalle />} />

          {/* Finanzas */}
          <Route path="finanzas" element={<Finanzas />} />

          {/* Mi Negocio */}
          <Route path="mi-negocio" element={<MiNegocio />} />

          {/* Perfil */}
          <Route path="perfil" element={<Perfil />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
