import { toast } from "sonner"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Loader2, ArrowLeft, Receipt, Store, User, ClipboardList, Eye } from "lucide-react"

import { OrderDTO, TaskDTO, PromoterDTO } from "@/dtos"
import { api, ApiResponse, formatDate } from "@/lib"
import {
  Button, Card, CardContent,
  PageWrapper, PageHeader,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components"

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)

const TASK_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: "Cancelada",    color: "bg-red-50 text-red-700" },
  1: { label: "Pendiente",    color: "bg-amber-50 text-amber-700" },
  2: { label: "En progreso",  color: "bg-blue-50 text-blue-700" },
  3: { label: "Completada",   color: "bg-green-50 text-green-700" },
}

export function PedidoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const [promotores, setPromotores] = useState<PromoterDTO[]>([])
  const [loading, setLoading] = useState(true)

  const [assignModal, setAssignModal] = useState<{ open: boolean; task: TaskDTO | null; saving: boolean }>({
    open: false, task: null, saving: false,
  })
  const [selectedPromoter, setSelectedPromoter] = useState<string>("")

  useEffect(() => {
    if (!id) return
    const orderId = Number(id)

    const fetchAll = async () => {
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

    fetchAll()
  }, [id])

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
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-secondary)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Cargando pedido...</p>
        </div>
      </PageWrapper>
    )
  }

  if (!order) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Pedido no encontrado.</p>
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
          <Button variant="outline" onClick={() => navigate("/pedidos")}>
            <ArrowLeft size={16} className="mr-2" /> Volver a Pedidos
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Sidebar resumen ── */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                Resumen del pedido
              </h3>

              {/* Estado */}
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Estado</span>
                {order.id_status === 1 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-sm rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-sm rounded-full">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" /> Cancelado
                  </span>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Total cobrado</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(Number(order.f_total))}</span>
              </div>

              {/* Tareas */}
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Total de tiendas</span>
                <span className="font-semibold">{tasks.length}</span>
              </div>

              {/* Progreso tareas */}
              {tasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span>Pendientes</span><span className="font-medium text-amber-600">{pendientes}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span>En progreso</span><span className="font-medium text-blue-600">{enProgreso}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span>Completadas</span><span className="font-medium text-green-600">{completadas}</span>
                  </div>
                </div>
              )}

              {/* Solicitudes */}
              {uniqueRequests.length > 0 && (
                <div>
                  <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>Solicitudes</p>
                  <div className="flex flex-wrap gap-1">
                    {uniqueRequests.map(([id, name]) => (
                      <span key={id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
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
                <h3 className="font-semibold text-sm uppercase tracking-wide mb-3" style={{ color: "var(--text-secondary)" }}>
                  Actividad
                </h3>
                <div className="space-y-3">
                  {order.order_logs!.map((log, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                      <div>
                        <p style={{ color: "var(--text-primary)" }}>{log.vc_log}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
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
            <Store size={20} style={{ color: "var(--text-secondary)" }} />
            <h2 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
              Tareas en establecimientos
            </h2>
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-xl border p-10 text-center" style={{ borderColor: "var(--border)" }}>
              <ClipboardList size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No hay tareas en este pedido.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const status = TASK_STATUS[task.id_status] ?? TASK_STATUS[1]
                const promotorNombre = task.promoter
                  ? `${task.promoter.name} ${task.promoter.lastname}`.trim()
                  : null

                return (
                  <Card key={task.id_task} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "var(--hover)", color: "var(--text-secondary)" }}>
                            #{task.id_task}
                          </span>
                          <span className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                            {task.store?.name ?? `Tienda #${task.id_store}`}
                          </span>
                        </div>
                        {task.request && (
                          <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                            {task.request.vc_name}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:flex-col sm:items-end">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>

                        <div className="flex items-center gap-1 text-sm">
                          <User size={14} style={{ color: promotorNombre ? "var(--accent)" : "var(--text-secondary)" }} />
                          {promotorNombre ? (
                            <span className="font-medium" style={{ color: "var(--accent)" }}>{promotorNombre}</span>
                          ) : (
                            <span className="italic text-red-500 text-xs font-medium">Sin asignar</span>
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
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
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
    </PageWrapper>
  )
}
