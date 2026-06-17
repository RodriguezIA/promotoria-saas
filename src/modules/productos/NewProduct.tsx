import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { ArrowLeft, Package, FileText, Save, AlertCircle, ImagePlus, X, Loader2 } from "lucide-react"


import { ProductDTO } from "@/dtos"
import { useAuthStore } from '@/stores'
import { MensajeConfirmacion } from '@/components'
import { api, ApiResponse, FormErrors } from '@/lib'


export default function ProductoForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const { id_client, id_product } = useParams()
  
  const isEditMode = Boolean(id_product)
  const isSuperAdmin = user?.i_rol === 1
  const clientIdFromParams = Number(id_client)
  const clientIdFromState = Number((location.state as any)?.id_client)
  const resolvedClientId = isSuperAdmin ? (clientIdFromState || clientIdFromParams || null) : (user?.id_client || null);

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [imageChanged, setImageChanged] = useState(false)
  const [loadingData, setLoadingData] = useState(isEditMode)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", description: ""})
  const [originalData, setOriginalData] = useState({ id_product: 0, name: "", description: "", vc_image: ""})


  const fetchProduct = async () => {
    try {
      setLoadingData(true);
      const res = await api.get<ApiResponse<ProductDTO>>(`/products/product/${id_product}`)
      const product = res.data;

      setFormData({
        name: product.name || "",
        description: product.description || "",
      });

      setOriginalData({
        id_product: product.id_product,
        name: product.name || "",
        description: product.description || "",
        vc_image: product.vc_image || "",
      });

      if (product.vc_image) {
        setImagePreview(product.vc_image);
      }
    } catch (error) {
      console.error("Error cargando producto:", error);
      toast.error("Error al cargar el producto");
      navigate(-1);
    } finally {
      setLoadingData(false);
    }
  };

  const hasChanges = () => {
    return (
      formData.name !== originalData.name ||
      formData.description !== originalData.description ||
      imageChanged
    );
  };

  const haveData = Boolean(
    formData.name.trim() ||
    formData.description.trim() ||
    imageFile
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten archivos de imagen");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar los 5MB");
        return;
      }

      setImageFile(file);
      setImageChanged(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setImageChanged(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let productId = Number(id_product);

      if (isEditMode) {

        await api.put(`/products/${productId}`, {
          id_user: user?.id_user!,
          id_client: resolvedClientId!,
          name: formData.name,
          description: formData.description || undefined,
        })

        if (imageChanged && imageFile) {
          const formatImage = new FormData();
          formatImage.append('file', imageFile)
          await api.upload<ApiResponse>(`/products/upload-image/${resolvedClientId}/${originalData.id_product}`, formatImage)
        }

        toast.success("Producto actualizado exitosamente");
        navigate(`/productos/`);
      } else {

        if (!resolvedClientId) {
          toast.error("Selecciona un cliente antes de crear el producto")
          setLoading(false)
          return
        }

        // Un solo request multipart: datos + imagen opcional juntos.
        const fd = new FormData();
        fd.append('id_user', String(user?.id_user));
        fd.append('id_client', String(resolvedClientId));
        fd.append('name', formData.name);
        if (formData.description) fd.append('description', formData.description);
        if (imageFile) fd.append('file', imageFile);

        await api.upload<ApiResponse<ProductDTO>>('/products', fd);

        toast.success("Producto creado exitosamente");
        navigate(`/productos/`);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(isEditMode ? "Error al actualizar producto" : "Error al crear producto");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const shouldConfirm = isEditMode ? hasChanges() : haveData;
    
    if (shouldConfirm) {
      setShowConfirm(true);
    } else {
      navigate(-1);
    }
  };

  const handleConfirmCancel = () => {
    setShowConfirm(false);
    navigate(-1);
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  useEffect(() => {
    if (isEditMode && id_product) {
      fetchProduct();
    }
  }, [id_product]);


  if (loadingData) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-muted-foreground/70" />
          <p className="text-muted-foreground">Cargando producto...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-muted-foreground" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {isEditMode ? "Editar Producto" : "Nuevo Producto"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isEditMode 
                    ? "Modifica la información del producto" 
                    : "Completa la información del producto"
                  }
                </p>
              </div>
            </div>

            <button
              type="submit"
              form="producto-form"
              disabled={loading || (isEditMode && !hasChanges())}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {isEditMode ? "Guardando..." : "Creando..."}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isEditMode ? "Guardar cambios" : "Crear producto"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <form id="producto-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Producto */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package size={20} className="text-muted-foreground" />
              <h2 className="text-lg font-medium text-foreground">
                Información del Producto
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Shampoo Anti-caspa 500ml"
                  className={`w-full px-4 py-2.5 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors ${
                    errors.name
                      ? "border-destructive/30 bg-destructive/10"
                      : "border-border"
                  }`}
                />
                {errors.name && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-destructive">
                    <AlertCircle size={14} />
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Imagen */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Imagen del Producto
                </label>
                
                {imagePreview ? (
                  <div className="relative w-40 h-40">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                    >
                      <X size={14} />
                    </button>
                    {/* Botón para cambiar imagen */}
                    <label className="absolute bottom-2 right-2 p-2 bg-white/90 rounded-lg cursor-pointer hover:bg-white transition-colors shadow-sm">
                      <ImagePlus size={16} className="text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-input rounded-lg cursor-pointer hover:border-ring transition-colors">
                    <ImagePlus size={32} className="text-muted-foreground/70 mb-2" />
                    <span className="text-sm text-muted-foreground">Subir imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText size={20} className="text-muted-foreground" />
              <h2 className="text-lg font-medium text-foreground">
                Descripción
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Descripción del producto
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe las características del producto..."
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none"
              />
            </div>
          </div>
        </form>
      </div>

      <MensajeConfirmacion
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="¿Deseas cancelar?"
        description={
          isEditMode 
            ? "Se perderán los cambios no guardados." 
            : "Se perderá la información ingresada."
        }
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}