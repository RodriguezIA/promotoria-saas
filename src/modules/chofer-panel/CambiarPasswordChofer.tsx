import { toast } from 'sonner'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { useDriverAuthStore } from '@/stores/driverAuthStore'
import { updateDriverPassword } from '@/Fetch/driverPanel'
import { Button, Input, Label } from '@/components'

export default function CambiarPasswordChofer() {
  const navigate = useNavigate()
  const { driver, updateProfile } = useDriverAuthStore()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await updateDriverPassword('1234', newPassword)
      toast.success('Contraseña actualizada')
      updateProfile({ must_change_password: false })
      navigate('/chofer/mapa')
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1.5">
          Pon una nueva contraseña
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {driver?.name ? `Hola, ${driver.name}. ` : ''}
          Tu contraseña fue restablecida. Antes de continuar, pon una nueva que solo tú conozcas.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nueva contraseña</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoFocus
            />
          </div>
          <div>
            <Label>Confirma tu nueva contraseña</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading || !newPassword || !confirmPassword}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar y continuar
          </Button>
        </form>
      </div>
    </div>
  )
}
