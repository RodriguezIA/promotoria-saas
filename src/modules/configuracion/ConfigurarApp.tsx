import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Loader2, Settings, UploadCloud, Video, Trash2, Save, MessageSquareText, Phone } from "lucide-react"

import { getLoginVideo, uploadLoginVideo, removeLoginVideo, getTaskInstructions, setTaskInstructions, getWhatsappSoporteClientes, setWhatsappSoporteClientes, getWhatsappSoportePromotores, setWhatsappSoportePromotores } from "@/Fetch/appConfig"
import { Button, PageWrapper, PageHeader, Textarea, Input } from "@/components"

export default function ConfigurarApp() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [quitando, setQuitando] = useState(false);

  const [instrucciones, setInstrucciones] = useState("");
  const [guardandoInstrucciones, setGuardandoInstrucciones] = useState(false);

  const [whatsappClientes, setWhatsappClientes] = useState("");
  const [guardandoWhatsappClientes, setGuardandoWhatsappClientes] = useState(false);
  const [whatsappPromotores, setWhatsappPromotores] = useState("");
  const [guardandoWhatsappPromotores, setGuardandoWhatsappPromotores] = useState(false);

  const cargar = () => {
    setLoading(true);
    Promise.all([getLoginVideo(), getTaskInstructions(), getWhatsappSoporteClientes(), getWhatsappSoportePromotores()])
      .then(([videoRes, instruccionesRes, whatsappClientesRes, whatsappPromotoresRes]) => {
        if (videoRes.ok) setVideoUrl(videoRes.data.url);
        if (instruccionesRes.ok) setInstrucciones(instruccionesRes.data.value);
        if (whatsappClientesRes.ok) setWhatsappClientes(whatsappClientesRes.data.value);
        if (whatsappPromotoresRes.ok) setWhatsappPromotores(whatsappPromotoresRes.data.value);
      })
      .catch(() => toast.error("Error al cargar la configuración"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      toast.error("El archivo debe ser un video");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error("El video no debe superar los 50MB");
      return;
    }
    setFile(f);
  };

  const handleSubir = async () => {
    if (!file) return;
    setSubiendo(true);
    try {
      const res = await uploadLoginVideo(file);
      if (res.ok) {
        toast.success("Video actualizado exitosamente");
        setVideoUrl(res.data.url);
        setFile(null);
      }
    } catch (e: any) {
      toast.error(e?.message || "Error al subir el video");
    } finally {
      setSubiendo(false);
    }
  };

  const handleQuitar = async () => {
    setQuitando(true);
    try {
      await removeLoginVideo();
      toast.success("Video eliminado, se usará el fondo por defecto");
      setVideoUrl(null);
    } catch (e: any) {
      toast.error(e?.message || "Error al quitar el video");
    } finally {
      setQuitando(false);
    }
  };

  const handleGuardarInstrucciones = async () => {
    if (!instrucciones.trim()) {
      toast.error("El texto no puede quedar vacío");
      return;
    }
    setGuardandoInstrucciones(true);
    try {
      await setTaskInstructions(instrucciones.trim());
      toast.success("Texto actualizado exitosamente");
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar el texto");
    } finally {
      setGuardandoInstrucciones(false);
    }
  };

  const handleGuardarWhatsappClientes = async () => {
    setGuardandoWhatsappClientes(true);
    try {
      await setWhatsappSoporteClientes(whatsappClientes.trim());
      toast.success("Número actualizado exitosamente");
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar el número");
    } finally {
      setGuardandoWhatsappClientes(false);
    }
  };

  const handleGuardarWhatsappPromotores = async () => {
    setGuardandoWhatsappPromotores(true);
    try {
      await setWhatsappSoportePromotores(whatsappPromotores.trim());
      toast.success("Número actualizado exitosamente");
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar el número");
    } finally {
      setGuardandoWhatsappPromotores(false);
    }
  };

  if (loading)
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Cargando configuración...</span>
        </div>
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <PageHeader
        title="Configurar app"
        subtitle="Video de bienvenida en el login de la app de promotores"
        icon={Settings}
      />

      <div className="max-w-xl space-y-4">
        <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-info" />
            <h3 className="font-semibold text-foreground">Video de bienvenida</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Se reproduce una sola vez en la pantalla de inicio de sesión de la app, encima del fondo verde. Si no subes ningún video, se usa el fondo actual sin cambios.
          </p>

          {videoUrl && (
            <div className="rounded-lg overflow-hidden border border-border bg-black">
              <video src={videoUrl} controls className="w-full max-h-64" />
            </div>
          )}

          {!file ? (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-input rounded-xl p-6 cursor-pointer text-muted-foreground hover:border-ring hover:text-foreground transition-colors">
              <UploadCloud size={28} />
              <span className="text-sm font-medium">
                {videoUrl ? "Subir un video nuevo (reemplaza el actual)" : "Subir video"}
              </span>
              <span className="text-xs text-muted-foreground/70">MP4 recomendado, hasta 50MB</span>
              <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
            </label>
          ) : (
            <div className="flex items-center gap-3 border border-border rounded-lg p-3 bg-muted/40">
              <Video className="w-5 h-5 text-info shrink-0" />
              <span className="text-sm flex-1 truncate" title={file.name}>{file.name}</span>
              <Button size="sm" onClick={handleSubir} disabled={subiendo}>
                {subiendo ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setFile(null)} disabled={subiendo}>
                Cancelar
              </Button>
            </div>
          )}

          {videoUrl && (
            <Button
              variant="outline"
              onClick={handleQuitar}
              disabled={quitando}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              {quitando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Quitar video (usar fondo por defecto)
            </Button>
          )}
        </div>

        <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-info" />
            <h3 className="font-semibold text-foreground">Instrucciones al aceptar una tarea</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            El promotor ve este texto justo después de aceptar una tarea. Usa <code className="px-1 py-0.5 rounded bg-muted text-foreground">{'{tienda}'}</code> donde quieras que aparezca el nombre de la tienda.
          </p>
          <Textarea
            value={instrucciones}
            onChange={(e) => setInstrucciones(e.target.value)}
            rows={4}
          />
          <Button onClick={handleGuardarInstrucciones} disabled={guardandoInstrucciones}>
            {guardandoInstrucciones ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar texto
          </Button>
        </div>

        <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-info" />
            <h3 className="font-semibold text-foreground">WhatsApp de soporte a clientes</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            A este número se manda el botón "Contactar Soporte" que ve el dueño de un negocio en su panel.
          </p>
          <div className="flex gap-2">
            <Input
              value={whatsappClientes}
              onChange={(e) => setWhatsappClientes(e.target.value)}
              placeholder="Ej. 5218117105018"
              className="flex-1"
            />
            <Button onClick={handleGuardarWhatsappClientes} disabled={guardandoWhatsappClientes}>
              {guardandoWhatsappClientes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-info" />
            <h3 className="font-semibold text-foreground">WhatsApp de soporte a promotores</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            A este número se manda el mensaje cuando alguien intenta entrar al login (como dueño de empresa) con un celular que no está registrado.
          </p>
          <div className="flex gap-2">
            <Input
              value={whatsappPromotores}
              onChange={(e) => setWhatsappPromotores(e.target.value)}
              placeholder="Ej. 5218117105018"
              className="flex-1"
            />
            <Button onClick={handleGuardarWhatsappPromotores} disabled={guardandoWhatsappPromotores}>
              {guardandoWhatsappPromotores ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
