import React from 'react';
import { cn } from '../../lib/utils';
import { Badge } from './badge';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'error' | 'info';
  text?: string;
  className?: string;
}

const statusConfig = {
  active: { text: 'Activo', variant: 'success' },
  inactive: { text: 'Inactivo', variant: 'destructive' },
  pending: { text: 'Pendiente', variant: 'warning' },
  success: { text: 'Exitoso', variant: 'success' },
  warning: { text: 'Advertencia', variant: 'warning' },
  error: { text: 'Error', variant: 'destructive' },
  info: { text: 'Información', variant: 'info' },
} as const;

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  className
}) => {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn('uppercase tracking-wide', className)}>
      {text || config.text}
    </Badge>
  );
};
