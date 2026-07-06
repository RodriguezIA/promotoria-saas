import { useState, useRef } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { api, ApiResponse } from "@/lib"
import { PromoterDTO } from "@/dtos"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components"

interface UploadImageModalProps {
  open: boolean
  onClose: () => void
  idPromoter: number
  onSuccess: (imageUrl: string) => void
}

export function UploadImageModal({ open, onClose, idPromoter, onSuccess }: UploadImageModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes")
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede exceder 5MB")
      return
    }

    setFile(selectedFile)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecciona una imagen primero")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await api.upload<ApiResponse<PromoterDTO>>(
        `/promoters/${idPromoter}/upload-image`,
        formData
      )

      if (response.ok) {
        toast.success("Imagen actualizada correctamente")
        onSuccess(response.data.vc_image || "")
        handleClose()
      } else {
        toast.error(response.message || "Error al subir la imagen")
      }
    } catch (error: any) {
      console.error("Error:", error)
      toast.error(error.message || "Error al subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Actualizar foto de perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Haz clic o arrastra una imagen</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP (máx 5MB)</p>
          </div>

          {preview && (
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
                className="absolute top-2 right-2 bg-destructive/90 text-white p-1.5 rounded-full hover:bg-destructive"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Subiendo...
                </>
              ) : (
                <>
                  <Upload size={16} /> Subir
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
