import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { CreditCard, Plus, Pencil, Trash2, Loader2, ImageIcon } from 'lucide-react'

import {
  PageWrapper, PageHeader, Button, DataTable, RowActions,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label, Textarea,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components'
import { getChannels, createChannel, updateChannel, deleteChannel, ChannelSaleDTO } from '@/Fetch/channelSales'

export default function CanalesVenta() {
  const [channels, setChannels] = useState<ChannelSaleDTO[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ChannelSaleDTO | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const [toDelete, setToDelete] = useState<ChannelSaleDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchChannels = async () => {
    setLoading(true)
    try {
      const res = await getChannels()
      setChannels(res.data)
    } catch {
      toast.error('Error al cargar los canales de venta')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setDescription('')
    setFile(null)
    setShowForm(true)
  }

  const openEdit = (channel: ChannelSaleDTO) => {
    setEditing(channel)
    setName(channel.name)
    setDescription(channel.description ?? '')
    setFile(null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      toast.error('El nombre y la descripción son requeridos')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateChannel(editing.id, { name: name.trim(), description: description.trim() }, file)
        toast.success('Canal actualizado')
      } else {
        await createChannel({ name: name.trim(), description: description.trim() }, file)
        toast.success('Canal creado')
      }
      setShowForm(false)
      fetchChannels()
    } catch (e: any) {
      toast.error(e?.message || 'Error al guardar el canal')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteChannel(toDelete.id)
      toast.success('Canal eliminado')
      setToDelete(null)
      fetchChannels()
    } catch (e: any) {
      toast.error(e?.message || 'Error al eliminar el canal')
    } finally {
      setDeleting(false)
    }
  }

  const columns: ColumnDef<ChannelSaleDTO>[] = [
    {
      id: 'logo',
      header: 'Logo',
      meta: { className: 'text-center' },
      cell: ({ row }) =>
        row.original.url_image ? (
          <img src={row.original.url_image} alt={row.original.name} className="w-10 h-10 rounded-full object-cover border border-border bg-white mx-auto" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto">
            <ImageIcon size={16} className="text-muted-foreground/50" />
          </div>
        ),
    },
    { accessorKey: 'name', header: 'Nombre' },
    { accessorKey: 'description', header: 'Descripción' },
    {
      id: 'actions',
      header: 'Operaciones',
      cell: ({ row }) => (
        <RowActions
          actions={[
            { icon: Pencil, label: 'Editar', onClick: () => openEdit(row.original) },
            { icon: Trash2, label: 'Eliminar', tone: 'destructive', onClick: () => setToDelete(row.original) },
          ]}
        />
      ),
    },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Canales de venta"
        subtitle="OXXO, Soriana, autoservicio, etc. — se usan para clasificar tiendas"
        icon={CreditCard}
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-2" /> Nuevo canal
          </Button>
        }
      />

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
        <DataTable
          columns={columns}
          data={channels}
          isLoading={loading}
          emptyMessage="Aún no hay canales de venta registrados."
        />
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar canal' : 'Nuevo canal de venta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Nombre *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. OXXO" />
            </div>
            <div>
              <Label>Descripción *</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Logo (opcional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {editing?.url_image && !file && (
                <img src={editing.url_image} alt={editing.name} className="w-12 h-12 rounded-full object-cover mt-2 border border-border" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar {toDelete?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Las tiendas que ya tengan este canal asignado no se ven afectadas, pero ya no podrás elegirlo para tiendas nuevas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={deleting}>
              {deleting && <Loader2 size={14} className="mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  )
}
