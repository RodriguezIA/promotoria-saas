import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { api, ApiResponse } from '@/lib'
import { Badge } from '@/components'
import { getTaskStatus } from '@/modules/tareas/utils'

interface StoreTaskDTO {
  id_task: number
  vc_folio: string | null
  id_status: number
  dt_register: string
}

export function StoreOrderHistory({ idStore }: { idStore: number }) {
  const [tasks, setTasks] = useState<StoreTaskDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get<ApiResponse<{ data: StoreTaskDTO[] }>>(`/tasks/?id_store=${idStore}&limit=10`)
      .then((res) => setTasks(res.data.data ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [idStore])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={16} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground/70">Esta tienda todavía no tiene pedidos.</p>
  }

  return (
    <ul className="space-y-1.5">
      {tasks.map((t) => {
        const status = getTaskStatus(t.id_status)
        return (
          <li key={t.id_task} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground truncate">
              {t.vc_folio ?? `Tarea #${t.id_task}`} · {new Date(t.dt_register).toLocaleDateString('es-MX')}
            </span>
            <Badge variant="outline" className={`text-xs shrink-0 ${status.bg} ${status.text} border-0`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${status.dot}`} />
              {status.label}
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}
