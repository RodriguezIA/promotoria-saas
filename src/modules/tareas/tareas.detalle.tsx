import { toast } from "sonner"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowLeft, CheckSquare2, ClipboardList, Loader2, MapPin, Store, User, FileText, Image as ImageIcon, Receipt } from "lucide-react"

import { TaskDTO } from "@/dtos"
import { api, ApiResponse, formatDate } from "@/lib"
import { Button, Card, CardContent, DataTable, PageHeader, PageWrapper } from "@/components"
import { getTaskStatus } from "./utils"

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)

interface ChecklistRow {
  id_request_product_question: number
  producto: string
  pregunta: string
  respuesta: string
  evidencia: string | null
}

export function TareaDetalle() {
  const { id_task } = useParams()
  const navigate = useNavigate()

  const [task, setTask] = useState<TaskDTO | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id_task) return
    const fetch = async () => {
      try {
        setLoading(true)
        const resp = await api.get<ApiResponse<TaskDTO>>(`/tasks/${id_task}/checklist`)
        setTask(resp.data)
      } catch {
        toast.error("Error al cargar la tarea")
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id_task])

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-secondary)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Cargando tarea...</p>
        </div>
      </PageWrapper>
    )
  }

  if (!task) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Tarea no encontrada.</p>
          <Button variant="outline" onClick={() => navigate("/tareas")}>
            <ArrowLeft size={16} className="mr-2" /> Volver
          </Button>
        </div>
      </PageWrapper>
    )
  }

  const status = getTaskStatus(task.id_status)
  const promotorNombre = task.promoter ? `${task.promoter.name} ${task.promoter.lastname}`.trim() : null

  const addressParts = [
    task.storeAddress?.street,
    task.storeAddress?.ext_number && `#${task.storeAddress.ext_number}`,
    task.storeAddress?.neighborhood,
    task.storeAddress?.city?.name,
    task.storeAddress?.state?.name,
  ].filter(Boolean)

  const checklistRows: ChecklistRow[] = (task.request?.request_products ?? []).flatMap((rp) =>
    rp.request_product_questions.map((rpq) => {
      const answer = task.myAnswers?.find(
        (a) => a.id_request_product_question === rpq.id_request_product_question,
      )
      return {
        id_request_product_question: rpq.id_request_product_question,
        producto: rp.product.name,
        pregunta: rpq.question.question,
        respuesta: answer?.vc_answer || "—",
        evidencia: answer?.vc_image_url ?? null,
      }
    }),
  )

  const checklistColumns: ColumnDef<ChecklistRow>[] = [
    { accessorKey: "producto", header: "Producto" },
    { accessorKey: "pregunta", header: "Pregunta" },
    { accessorKey: "respuesta", header: "Respuesta" },
    {
      id: "evidencia",
      header: "Evidencia",
      cell: ({ row }) => {
        const url = row.original.evidencia
        return url ? (
          <a href={url} target="_blank" rel="noreferrer">
            <img
              src={url}
              alt="Evidencia"
              className="w-12 h-12 object-cover rounded border"
              style={{ borderColor: "var(--border)" }}
            />
          </a>
        ) : (
          <span className="text-muted-foreground/70 text-sm">—</span>
        )
      },
    },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title={`Tarea #${String(task.id_task).padStart(4, "0")}`}
        subtitle={`Registrada el ${formatDate(task.dt_register)}`}
        icon={CheckSquare2}
        actions={
          <div className="flex gap-2">
            {task.id_order && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/detalle-pedido/${task.id_order}`)}>
                <Receipt size={14} className="mr-1.5" /> Ver pedido
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/tareas")}>
              <ArrowLeft size={16} className="mr-2" /> Volver
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Sidebar resumen ── */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                Resumen
              </h3>

              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Estado</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              {task.order && (
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Pedido</span>
                  <button
                    className="font-semibold text-info hover:underline text-sm"
                    onClick={() => navigate(`/detalle-pedido/${task.id_order}`)}
                  >
                    #{String(task.id_order).padStart(4, "0")}
                  </button>
                </div>
              )}

              {task.request?.f_value && (
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Valor</span>
                  <span className="font-semibold text-success">{formatCurrency(Number(task.request.f_value))}</span>
                </div>
              )}

              {task.client && (
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Cliente</span>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{task.client.name}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Notificaciones</span>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{task.i_notification_count ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Columna derecha ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Establecimiento */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Store size={18} style={{ color: "var(--text-secondary)" }} />
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Establecimiento</h3>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                  {task.store?.name ?? `#${task.id_store}`}
                </p>
                {task.store?.store_code && (
                  <p className="text-xs px-2 py-0.5 rounded w-fit font-medium" style={{ backgroundColor: "var(--hover)", color: "var(--text-secondary)" }}>
                    {task.store.store_code}
                  </p>
                )}
                {addressParts.length > 0 && (
                  <div className="flex items-start gap-2 mt-2">
                    <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: "var(--text-secondary)" }} />
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {addressParts.join(", ")}
                      {task.storeAddress?.postal_code && ` CP ${task.storeAddress.postal_code}`}
                    </p>
                  </div>
                )}
                {task.storeAddress?.address_references && (
                  <p className="text-xs mt-1 italic" style={{ color: "var(--text-secondary)" }}>
                    Ref: {task.storeAddress.address_references}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Solicitud */}
          {task.request && (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={18} style={{ color: "var(--text-secondary)" }} />
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Solicitud</h3>
                </div>
                <div className="flex items-start gap-4">
                  {task.request.url_rack_image && (
                    <img
                      src={task.request.url_rack_image}
                      alt={task.request.vc_name}
                      className="w-16 h-16 object-cover rounded-lg border shrink-0"
                      style={{ borderColor: "var(--border)" }}
                    />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{task.request.vc_name}</p>
                    {task.request.f_value && (
                      <p className="text-sm text-success font-medium">{formatCurrency(Number(task.request.f_value))}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Promotor */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <User size={18} style={{ color: "var(--text-secondary)" }} />
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Promotor asignado</h3>
              </div>
              {promotorNombre ? (
                <div className="space-y-2">
                  <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>{promotorNombre}</p>
                  {task.promoter?.phone && (
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Tel: {task.promoter.phone}</p>
                  )}
                  {task.promoter?.email && (
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{task.promoter.email}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <p className="text-sm italic text-destructive font-medium">Sin promotor asignado</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Foto de acomodo + Checklist (ancho completo, se llenan cuando la tarea ya se contestó) ── */}
      <div className="space-y-4">
        {task.arrangement_photo_url && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon size={18} style={{ color: "var(--text-secondary)" }} />
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Foto de acomodo</h3>
              </div>
              <a href={task.arrangement_photo_url} target="_blank" rel="noreferrer">
                <img
                  src={task.arrangement_photo_url}
                  alt="Foto de acomodo"
                  className="max-h-96 rounded-lg border object-contain"
                  style={{ borderColor: "var(--border)" }}
                />
              </a>
            </CardContent>
          </Card>
        )}

        {checklistRows.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList size={18} style={{ color: "var(--text-secondary)" }} />
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Checklist de la tarea</h3>
              </div>
              <DataTable
                columns={checklistColumns}
                data={checklistRows}
                emptyMessage="Sin respuestas registradas."
                export={{
                  enableExcel: true,
                  fileName: `checklist_tarea_${task.id_task}`,
                  sheetName: "Checklist",
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  )
}
