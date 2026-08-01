import React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";
import { useTheme, DARK_THEME_ENABLED } from "../../hooks/useTheme";

interface ThemeToggleProps {
  size?: "sm" | "md" | "lg";
  variant?: "sidebar" | "header" | "floating" | "default";
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = "md",
  showLabel = true,
  className,
}) => {
  const { toggleTheme, isLight } = useTheme();

  return (
    <Button
      variant="outline"
      size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
      onClick={DARK_THEME_ENABLED ? toggleTheme : undefined}
      disabled={!DARK_THEME_ENABLED}
      className={cn("gap-2", className)}
      title={
        DARK_THEME_ENABLED
          ? `Cambiar a tema ${isLight ? "oscuro" : "claro"}`
          : "Tema oscuro próximamente"
      }
    >
      <span className="relative flex size-4 items-center justify-center overflow-hidden">
        <Sun
          className={cn(
            "absolute size-4 transition-all duration-300",
            isLight
              ? "translate-y-0 rotate-0 opacity-100"
              : "-translate-y-6 rotate-90 opacity-0",
          )}
        />
        <Moon
          className={cn(
            "absolute size-4 transition-all duration-300",
            isLight
              ? "translate-y-6 -rotate-90 opacity-0"
              : "translate-y-0 rotate-0 opacity-100",
          )}
        />
      </span>
      {showLabel && (
        <span className="font-medium">{isLight ? "Oscuro" : "Claro"}</span>
      )}
    </Button>
  );
};

// Versión compacta solo con ícono
export const ThemeToggleCompact: React.FC<{ className?: string }> = ({
  className,
}) => (
  <ThemeToggle
    size="sm"
    showLabel={false}
    className={cn("w-10 h-10 rounded-full p-0", className)}
  />
);

// Versión para el header
export const ThemeToggleHeader: React.FC<{ className?: string }> = ({
  className,
}) => <ThemeToggle size="md" showLabel={false} className={className} />;
