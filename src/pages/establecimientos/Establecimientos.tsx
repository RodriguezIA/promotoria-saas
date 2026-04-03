import React from 'react';

import { EstablecimientosAdministradoresClients } from './EstablecimientosAdministradoresClients'
import { EstablecimientosSuperAdmin } from './EstablecimientosSuperAdmin'

import { useAuthStore } from '../../store/authStore';
import { PageWrapper } from '../../components/ui/page-wrapper';

const Establecimientos: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <PageWrapper>
      {user?.i_rol === 1 && <EstablecimientosSuperAdmin />}
      {user?.i_rol === 2 && <EstablecimientosAdministradoresClients />}
    </PageWrapper>
  );
};

export default Establecimientos;