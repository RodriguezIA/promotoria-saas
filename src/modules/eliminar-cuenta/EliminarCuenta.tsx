import { useState } from "react"
import { toast } from "sonner"
import { Link } from "react-router-dom"
import { ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react"

import { Button, Input } from "@/components"
import { api, ApiResponse } from "@/lib"
import logo from "@/assets/promotorialogotipo_positivo.png"

export function EliminarCuenta() {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  const canSubmit =
    phone.trim().length > 0 &&
    password.length > 0 &&
    confirmText.trim().toUpperCase() === "ELIMINAR"

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("Completa tu celular, contraseña, y escribe ELIMINAR para confirmar")
      return
    }

    setIsLoading(true)
    try {
      await api.post<ApiResponse<null>>("/promoters/request-deletion", {
        phone: phone.trim(),
        password,
      })
      setDone(true)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo eliminar la cuenta"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center mb-2">
          <img src={logo} alt="Promotoria" className="h-20" />
        </div>

        {done ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center space-y-3">
            <CheckCircle2 className="mx-auto text-success" size={48} />
            <h1 className="text-lg font-bold text-foreground">Tu cuenta fue eliminada</h1>
            <p className="text-sm text-muted-foreground">
              Tus datos de pago (CLABE/tarjeta) se borraron de forma permanente de nuestros
              servidores. Ya no podrás iniciar sesión con esta cuenta en la app de Promotoria.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border p-8 space-y-5">
            <div>
              <h1 className="text-lg font-bold text-foreground">Eliminar mi cuenta de Promotoria</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Puedes solicitar la baja de tu cuenta de promotor desde aquí, sin necesidad de
                abrir la app.
              </p>
            </div>

            <div className="flex gap-2 items-start bg-warning/10 border border-warning/30 rounded-lg p-3">
              <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">
                Esta acción es permanente. Se eliminarán de nuestros servidores tus datos de
                pago (CLABE/tarjeta) y se dará de baja tu cuenta. No podrás deshacer esto.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Celular registrado
                </span>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10 dígitos"
                  className="mt-1"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Contraseña
                </span>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña de la app"
                  className="mt-1"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Escribe ELIMINAR para confirmar
                </span>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="ELIMINAR"
                  className="mt-1"
                />
              </label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isLoading}
              className="w-full bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? "Eliminando..." : "Eliminar mi cuenta permanentemente"}
            </Button>

            <div className="flex items-start gap-2 pt-2 border-t border-border">
              <ShieldCheck size={16} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Pedimos tu contraseña para confirmar que eres el dueño de esta cuenta — así
                evitamos que alguien más pueda borrarla solo con tu número de celular.
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/login" className="underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
