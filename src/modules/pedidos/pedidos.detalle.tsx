import { toast } from "sonner"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Loader2, ArrowLeft, Receipt, Store, User, ClipboardList, Eye, Lock } from "lucide-react"

import { OrderDTO, TaskDTO, PromoterDTO } from "@/dtos"
import { api, ApiResponse, formatDate } from "@/lib"
import { useAuthStore } from "@/stores/authStore"
import {
  Button, Card, CardContent,
  PageWrapper, PageHeader,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components"

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)

const TASK_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: "Cancelada",    color: "bg-destructive/10 text-destructive" },
  1: { label: "Pendiente",    color: "bg-warning/15 text-warning-foreground dark:text-warning" },
  2: { label: "En progreso",  color: "bg-info/10 text-info" },
  3: { label: "Completada",   color: "bg-success/10 text-success" },
}

export function PedidoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin, isSuperAdmin } = useAuthStore()

  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const [promotores, setPromotores] = useState<PromoterDTO[]>([])
  const [loading, setLoading] = useState(true)

  const [assignModal, setAssignModal] = useState<{ open: boolean; task: TaskDTO | null; saving: boolean }>({
    open: false, task: null, saving: false,
  })
  const [selectedPromoter, setSelectedPromoter] = useState<string>("")

  const [closeDialog, setCloseDialog] = useState(false)
  const [closing, setClosing] = useState(false)

  const fetchAll = async () => {
    if (!id) return
    const orderId = Number(id)
    try {
      setLoading(true)
      const [orderResp, tasksResp, promotoresResp] = await Promise.all([
        api.get<ApiResponse<OrderDTO>>(`/orders/${orderId}`),
        api.get<ApiResponse<TaskDTO[]>>(`/tasks?id_order=${orderId}`),
        api.get<ApiResponse<PromoterDTO[]>>("/promoters"),
      ])
      setOrder(orderResp.data)
      setTasks(tasksResp.data || [])
      setPromotores(promotoresResp.data || [])
    } catch {
      toast.error("Error al cargar el pedido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleCloseOrder = async () => {
    if (!id) return
    setClosing(true)
    try {
      const resp = await api.patch<ApiResponse<OrderDTO>>(`/orders/${id}/close`)
      if (!resp.ok) {
        toast.error(resp.message || "No se pudo cerrar el pedido")
        return
      }
      toast.success("Pedido cerrado")
      setCloseDialog(false)
      await fetchAll()
    } catch {
      toast.error("Error al cerrar el pedido")
    } finally {
      setClosing(false)
    }
  }

  const openAssignModal = (task: TaskDTO) => {
    setAssignModal({ open: true, task, saving: false })
    setSelectedPromoter(task.id_promoter ? String(task.id_promoter) : "")
  }

  const handleAssign = async () => {
    if (!assignModal.task || !selectedPromoter) {
      toast.error("Selecciona un promotor")
      return
    }

    setAssignModal((prev) => ({ ...prev, saving: true }))
    try {
      await api.put<ApiResponse>(`/tasks/${assignModal.task.id_task}/assign`, {
        id_promoter: Number(selectedPromoter),
      })

      const promotor = promotores.find((p) => p.id === Number(selectedPromoter))
      setTasks((prev) =>
        prev.map((t) =>
          t.id_task === assignModal.task!.id_task
            ? {
                ...t,
                id_promoter: Number(selectedPromoter),
                promoter: {
                  id: Number(selectedPromoter),
                  name: promotor?.name ?? "",
                  lastname: promotor?.lastname ?? "",
                  phone: promotor?.phone ?? "",
                },
              }
            : t
        )
      )

      toast.success("Promotor asignado correctamente")
      setAssignModal({ open: false, task: null, saving: false })
    } catch {
      toast.error("Error al asignar el promotor")
      setAssignModal((prev) => ({ ...prev, saving: false }))
    }
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cargando pedido...</p>
        </div>
      </PageWrapper>
    )
  }

  if (!order) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-sm text-muted-foreground">Pedido no encontrado.</p>
          <Button variant="outline" onClick={() => navigate("/pedidos")}>
            <ArrowLeft size={16} className="mr-2" /> Volver
          </Button>
        </div>
      </PageWrapper>
    )
  }

  const uniqueRequests = [...new Map(
    (order.order_items ?? []).map((i) => [i.id_request, i.request?.vc_name])
  ).entries()]

  const pendientes = tasks.filter((t) => t.id_status === 1).length
  const enProgreso = tasks.filter((t) => t.id_status === 2).length
  const completadas = tasks.filter((t) => t.id_status === 3).length

  return (
    <PageWrapper>
      <PageHeader
        title={`Pedido #${String(order.id_order).padStart(4, "0")}`}
        subtitle={`Creado el ${formatDate(order.dt_register)}`}
        icon={Receipt}
        actions={
          <div className="flex gap-2">
            {(isAdmin() || isSuperAdmin()) && order.id_status === 1 && (
              <Button variant="destructive" onClick={() => setCloseDialog(true)}>
                <Lock size={16} className="mr-2" /> Cerrar pedido
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/pedidos")}>
              <ArrowLeft size={16} className="mr-2" /> Volver a Pedidos
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Sidebar resumen ── */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Resumen del pedido
              </h3>

              {/* Estado */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estado</span>
                {order.id_status === 1 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-success/10 text-success text-sm rounded-full">
                    <div className="w-1.5 h-1.5 bg-success rounded-full" /> Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-destructive/10 text-destructive text-sm rounded-full">
                    <div className="w-1.5 h-1.5 bg-destructive rounded-full" /> Cancelado
                  </span>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total cobrado</span>
                <span className="font-semibold text-foreground text-lg">{formatCurrency(Number(order.f_total))}</span>
              </div>

              {/* Tareas */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de tiendas</span>
                <span className="font-semibold">{tasks.length}</span>
              </div>

              {/* Progreso tareas */}
              {tasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Pendientes</span><span className="font-medium text-foreground">{pendientes}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>En progreso</span><span className="font-medium text-foreground">{enProgreso}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Completadas</span><span className="font-medium text-foreground">{completadas}</span>
                  </div>
                </div>
              )}

              {/* Solicitudes */}
              {uniqueRequests.length > 0 && (
                <div>
                  <p className="text-xs mb-2 text-muted-foreground">Solicitudes</p>
                  <div className="flex flex-wrap gap-1">
                    {uniqueRequests.map(([id, name]) => (
                      <span key={id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {name ?? `#${id}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logs */}
          {(order.order_logs ?? []).length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm uppercase tracking-wide mb-3 text-muted-foreground">
                  Actividad
                </h3>
                <div className="space-y-3">
                  {order.order_logs!.map((log, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                      <div>
                        <p className="text-foreground">{log.vc_log}</p>
                        <p className="text-xs mt-0.5 text-muted-foreground">
                          {formatDate(log.dt_registro)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Lista de tareas ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Store size={20} className="text-muted-foreground" />
            <h2 className="font-semibold text-lg text-foreground">
              Tareas en establecimientos
            </h2>
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <ClipboardList size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No hay tareas en este pedido.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const status = TASK_STATUS[task.id_status] ?? TASK_STATUS[1]
                const promotorNombre = task.promoter
                  ? `${task.promoter.name} ${task.promoter.lastname}`.trim()
                  : null

                return (
                  <Card key={task.id_task} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            #{task.id_task}
                          </span>
                          <span className="font-semibold truncate text-foreground">
                            {task.store?.name ?? `Tienda #${task.id_store}`}
                          </span>
                        </div>
                        {task.request && (
                          <p className="text-sm truncate text-muted-foreground">
                            {task.request.vc_name}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:flex-col sm:items-end">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>

                        <div className="flex items-center gap-1.5 text-sm">
                          <User size={14} className="text-muted-foreground" />
                          {promotorNombre ? (
                            <span className="font-medium text-foreground">{promotorNombre}</span>
                          ) : (
                            <span className="text-xs font-medium text-warning-foreground dark:text-warning bg-warning/15 px-2 py-0.5 rounded-full">Sin asignar</span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/tareas/${task.id_task}`)}
                          >
                            <Eye size={14} className="mr-1.5" /> Ver detalle
                          </Button>
                          <Button
                            size="sm"
                            variant={promotorNombre ? "outline" : "default"}
                            onClick={() => openAssignModal(task)}
                          >
                            {promotorNombre ? "Cambiar promotor" : "Asignar promotor"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal asignación ── */}
      <Dialog
        open={assignModal.open}
        onOpenChange={(v) => !v && setAssignModal({ open: false, task: null, saving: false })}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Asignar promotor</DialogTitle>
            <DialogDescription>
              {assignModal.task?.store?.name ?? `Tarea #${assignModal.task?.id_task}`}
              {assignModal.task?.request && ` · ${assignModal.task.request.vc_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {promotores.length === 0 ? (
              <p className="text-sm text-warning-foreground dark:text-warning bg-warning/15 p-3 rounded-lg border border-warning/40">
                No hay promotores registrados. Da de alta un promotor primero.
              </p>
            ) : (
              <Select value={selectedPromoter} onValueChange={setSelectedPromoter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un promotor" />
                </SelectTrigger>
                <SelectContent>
                  {promotores.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} {p.lastname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAssignModal({ open: false, task: null, saving: false })}
              disabled={assignModal.saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assignModal.saving || !selectedPromoter || promotores.length === 0}
            >
              {assignModal.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmación cierre de pedido ── */}
      <AlertDialog open={closeDialog} onOpenChange={(v) => !closing && setCloseDialog(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Las tareas que estén en revisión se aprobarán automáticamente. Las que ya estén terminadas no se
              verán afectadas. Las que aún no se hayan contestado se cancelarán automáticamente con el motivo
              "Cierre de pedido" y se notificará a los promotores asignados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseOrder}
              className="bg-destructive hover:bg-destructive/90"
              disabled={closing}
            >
              {closing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cerrar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  )
}
