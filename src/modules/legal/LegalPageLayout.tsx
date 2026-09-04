import { ReactNode } from "react"
import { Link } from "react-router-dom"

import logo from "@/assets/promotorialogotipo_positivo.png"

export function LegalPageLayout({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center mb-6">
          <img src={logo} alt="Promotoria" className="h-16" />
        </div>

        <div className="bg-white rounded-xl border border-border p-8 md:p-10">
          <h1 className="text-2xl font-bold text-foreground text-center">{title}</h1>
          <p className="text-xs text-muted-foreground text-center mt-1 mb-8 italic">
            Última actualización: {updated}
          </p>

          <div className="prose prose-sm max-w-none space-y-4 text-foreground">
            {children}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/login" className="underline">Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  )
}

export function LegalH2({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-bold text-foreground mt-6 mb-2">{children}</h2>
}

export function LegalH3({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold text-foreground mt-4 mb-1.5">{children}</h3>
}

export function LegalP({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-foreground/90">{children}</p>
}

export function LegalUl({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/90">{children}</ul>
}

export function LegalPlaceholder({ children }: { children: ReactNode }) {
  return (
    <span className="bg-warning/20 text-warning-foreground px-1 rounded italic">
      [{children}]
    </span>
  )
}
