import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Truck, Plus, Phone, Mail, Trash2, Loader2 } from "lucide-react"

import { PageWrapper, PageHeader, Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components"
import { getDrivers, createDriver, deactivateDriver, DriverDTO } from "@/Fetch/drivers"

export default function Choferes() {
  const [drivers, setDrivers] = useState<DriverDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" })
  const [driverToDelete, setDriverToDelete] = useState<DriverDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDrivers = async () => {
    setLoading(true)
    try {
      const res = await getDrivers()
      setDrivers(res.data)
    } catch {
      toast.error("Error al cargar los choferes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.password.trim()) {
      toast.error("Nombre, teléfono y contraseña son requeridos")
      return
    }
    setCreating(true)
    try {
      await createDriver({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
      })
      toast.success("Chofer creado exitosamente")
      setShowCreate(false)
      setForm({ name: "", phone: "", email: "", password: "" })
      fetchDrivers()
    } catch (e: any) {
      toast.error(e?.message || "Error al crear el chofer")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!driverToDelete) return
    setDeleting(true)
    try {
      await deactivateDriver(driverToDelete.id_driver)
      toast.success("Chofer dado de baja")
      setDriverToDelete(null)
      fetchDrivers()
    } catch (e: any) {
      toast.error(e?.message || "Error al dar de baja al chofer")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Choferes"
        subtitle="Alta y baja de los choferes que reparten tus pedidos"
        icon={Truck}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} className="mr-2" /> Nuevo chofer
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : drivers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Truck size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">Todavía no has dado de alta ningún chofer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver) => (
            <Card key={driver.id_driver}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {driver.vc_photo ? (
                      <img src={driver.vc_photo} alt={driver.name} className="w-full h-full object-cover" />
                    ) : (
                      <Truck size={20} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{driver.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone size={12} /> {driver.phone}
                    </p>
                    {driver.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail size={12} /> {driver.email}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDriverToDelete(driver)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Crear chofer */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Nuevo chofer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Nombre completo *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Teléfono *</Label>
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="10 dígitos" />
            </div>
            <div>
              <Label>Correo (opcional)</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label>Contraseña *</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">
                El chofer va a usar su teléfono y esta contraseña para entrar a su panel.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={creating}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 size={14} className="mr-2 animate-spin" />}
              Crear chofer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar baja */}
      <AlertDialog open={!!driverToDelete} onOpenChange={(v) => !v && setDriverToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dar de baja a {driverToDelete?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Ya no podrá iniciar sesión ni se le podrán asignar más rutas. Esta acción no borra su historial de entregas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={deleting}>
              {deleting && <Loader2 size={14} className="mr-2 animate-spin" />}
              Dar de baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  )
}
