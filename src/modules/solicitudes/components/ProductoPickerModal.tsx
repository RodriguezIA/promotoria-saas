import { useState, useEffect } from 'react'
import { Loader2, Search, ImageOff, Check, ChevronLeft, ChevronRight, PackageOpen } from 'lucide-react'

import { api, ApiResponse } from '@/lib'
import { ProductDTO } from '@/dtos'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Button,
  Badge,
} from '@/components'

interface PageMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface PaginatedProducts {
  data: ProductDTO[]
  meta: PageMeta
}

interface ProductoPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: number
  /** IDs de productos actualmente seleccionados (estado vive en el padre). */
  selectedIds: number[]
  /** Alterna la selección de un producto en el padre. */
  onToggle: (product: ProductDTO) => void
}

const PAGE_SIZE = 12

export const ProductoPickerModal = ({
  open,
  onOpenChange,
  clientId,
  selectedIds,
  onToggle,
}: ProductoPickerModalProps) => {
  const [productos, setProductos] = useState<ProductDTO[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // Debounce de la búsqueda: al escribir, esperamos antes de pedir al backend.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  // Reset al abrir el modal.
  useEffect(() => {
    if (open) {
      setSearch('')
      setDebouncedSearch('')
      setPage(1)
    }
  }, [open])

  // Carga paginada desde el backend.
  useEffect(() => {
    if (!open || !clientId) return

    let cancelado = false
    const cargar = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        })
        const termino = debouncedSearch.trim()
        if (termino) params.set('search', termino)

        const resp = await api.get<ApiResponse<PaginatedProducts>>(
          `/products/paginated/${clientId}?${params.toString()}`,
        )
        if (!cancelado) {
          setProductos(resp.data.data)
          setMeta(resp.data.meta)
        }
      } catch {
        if (!cancelado) {
          setProductos([])
          setMeta(null)
        }
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [open, clientId, page, debouncedSearch])

  const selectedSet = new Set(selectedIds)
  const totalPages = meta?.totalPages ?? 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0 w-[95vw] max-w-3xl max-h-[85vh] overflow-hidden">
        {/* Encabezado + buscador */}
        <div className="p-5 border-b border-border space-y-4">
          <DialogHeader>
            <DialogTitle>Añadir productos</DialogTitle>
            <DialogDescription>
              Selecciona los productos a auditar. Puedes buscar por nombre.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70"
              size={16}
            />
            <Input
              autoFocus
              placeholder="Buscar producto por nombre..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Grid de productos (área desplazable) */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="animate-spin" size={20} />
              <span>Cargando productos...</span>
            </div>
          ) : productos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <PackageOpen size={36} className="mb-2 opacity-60" />
              <p className="text-sm">
                {debouncedSearch
                  ? `No se encontraron productos para "${debouncedSearch}".`
                  : 'No hay productos registrados para este cliente.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {productos.map((prod) => {
                const seleccionado = selectedSet.has(prod.id_product)
                return (
                  <button
                    type="button"
                    key={prod.id_product}
                    onClick={() => onToggle(prod)}
                    className={`relative group text-left cursor-pointer rounded-xl border-2 transition-all overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      seleccionado
                        ? 'border-ring bg-info/10 shadow-md'
                        : 'border-border bg-card hover:border-info/30 hover:shadow-sm'
                    }`}
                  >
                    {seleccionado && (
                      <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1 shadow">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}

                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {prod.vc_image ? (
                        <img
                          src={prod.vc_image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground/70">
                          <ImageOff size={28} />
                          <span className="text-xs mt-1">Sin imagen</span>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5">
                      <p
                        className="font-medium text-sm text-foreground line-clamp-2 text-center"
                        title={prod.name}
                      >
                        {prod.name}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Pie: paginación + contador + cerrar */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{selectedIds.length} seleccionados</Badge>
            {meta && (
              <span className="text-xs text-muted-foreground">
                {meta.total} producto{meta.total !== 1 ? 's' : ''} en total
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-1 tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={loading || page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={() => onOpenChange(false)}>Listo</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
