import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4 flex-wrap", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-[3px] w-7 rounded-full bg-brand" aria-hidden />
          {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />}
        </div>
        <h1 className="text-2xl font-bold tracking-tight font-display text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1 text-muted-foreground max-w-prose">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
