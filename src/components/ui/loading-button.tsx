import React from 'react';
import { Button } from './button';
import { cn } from '../../lib/utils';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  /** `primary` y `accent` son alias legacy de `default` y `brand` */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'brand' | 'primary' | 'accent';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  loadingText?: string;
}

const LEGACY_VARIANTS = { primary: 'default', accent: 'brand' } as const;

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  variant = 'default',
  size = 'default',
  children,
  loadingText,
  disabled,
  className,
  ...props
}) => {
  return (
    <Button
      variant={variant in LEGACY_VARIANTS ? LEGACY_VARIANTS[variant as keyof typeof LEGACY_VARIANTS] : (variant as Exclude<typeof variant, 'primary' | 'accent'>)}
      size={size}
      disabled={disabled || loading}
      className={cn(
        loading && 'cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading && (
        <div className="loading-spinner mr-2" />
      )}
      {loading ? (loadingText || children) : children}
    </Button>
  );
};