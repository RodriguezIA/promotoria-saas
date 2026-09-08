import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Truck, Loader2 } from 'lucide-react'

import { Button, Input, Label } from '@/components'
import { driverLogin } from '@/Fetch/driverPanel'
import { useDriverAuthStore } from '@/stores/driverAuthStore'

export default function ChoferLogin() {
  const navigate = useNavigate()
  const login = useDriverAuthStore((s) => s.login)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim() || !password.trim()) {
      toast.error('Ingresa tu teléfono y contraseña')
      return
    }
    setLoading(true)
    try {
      const res = await driverLogin(phone.trim(), password)
      login(res.data.token, res.data.driver)
      navigate('/chofer/mapa')
    } catch (e: any) {
      toast.error(e?.message || 'Teléfono o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Truck size={26} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Panel de Choferes</h1>
          <p className="text-sm text-muted-foreground">Inicia sesión con tu teléfono</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10 dígitos" />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}
