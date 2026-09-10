import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Copy, Check, Smartphone, DollarSign } from "lucide-react"

import logoMark from "@/assets/isologo_promotoria_N.png"

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.promotoriadigital.app"

export function InvitacionPromotor() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get("ref")?.trim().toUpperCase() ?? ""
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!code) return
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        <img src={logoMark} alt="Promotoria" className="w-16 h-16 mx-auto" />

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Te invitaron a ganar dinero extra
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Descarga la app de Promotoria, regístrate como promotor y empieza a generar ingresos completando tareas cerca de ti.
          </p>
        </div>

        {code && (
          <div className="bg-muted/60 rounded-xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground">Tu código de invitación</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold tracking-widest text-primary">{code}</span>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Copiar código"
              >
                {copied ? <Check size={18} className="text-success" /> : <Copy size={18} className="text-muted-foreground" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Si la app no te llevó directo al registro, pega este código donde dice "Código de invitación" al crear tu cuenta.
            </p>
          </div>
        )}

        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-xl py-3.5 hover:opacity-90 transition-opacity"
        >
          <Smartphone size={20} />
          Descargar la app
        </a>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
          <DollarSign size={16} className="text-success" />
          Cuenta lo que hay en anaquel, acomoda exhibidores, y cobra por cada tarea.
        </div>
      </div>
    </div>
  )
}
