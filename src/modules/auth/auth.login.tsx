import { toast } from "sonner"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, MapPin, ScanBarcode, Route } from "lucide-react"


import { useAuthStore } from "@/stores"
import { loginUser } from "@/Fetch/login"
import { Button, Input } from "@/components"
import logoMark from "@/assets/isologo_promotoria_N.png"

const CAPABILITIES = [
  { icon: ScanBarcode, label: "Conteos de inventario en sitio" },
  { icon: MapPin, label: "Promotores verificados en tienda" },
  { icon: Route, label: "Rutas optimizadas con datos reales" },
];

export function Login() {
  const navigate = useNavigate();
  const authstore = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username || !password || loading) return;
    setLoading(true);
    try {
      const response = await loginUser(username, password);
      authstore.login(response.data.token, response.data.user);
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel de marca — petróleo profundo con retícula cartográfica */}
      <div className="hidden lg:flex lg:w-[44%] min-h-screen relative flex-col justify-between p-12 bg-sidebar text-sidebar-accent-foreground bg-dotgrid overflow-hidden">
        {/* Resplandor ámbar sutil */}
        <div
          className="absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--brand), transparent 70%)" }}
          aria-hidden
        />

        <div className="relative z-10">
          <img
            src="/promotorialogotipo_principalblanco.png"
            alt="Promotoria"
            className="h-10 object-contain"
          />
        </div>

        <div className="relative z-10 space-y-10">
          <div>
            <p className="eyebrow !text-sidebar-foreground/60 mb-4">
              Operación de campo en retail
            </p>
            <h2 className="font-display text-4xl xl:text-5xl font-bold leading-[1.08] tracking-tight text-white">
              Tu mercancía,
              <br />
              contada y en ruta.
            </h2>
            <p className="mt-5 text-base xl:text-lg text-sidebar-foreground max-w-md">
              Promotoria conecta tu marca con promotores confiables para
              conteos, exhibición e información de producto en el punto de
              venta — en tiempo real.
            </p>
          </div>

          <ul className="space-y-3">
            {CAPABILITIES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-sidebar-foreground">
                <span className="flex items-center justify-center w-7 h-7 rounded-md border border-sidebar-border bg-sidebar-accent/60 shrink-0">
                  <Icon className="w-3.5 h-3.5 text-sidebar-primary" strokeWidth={2} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 font-mono text-[10px] tracking-widest uppercase text-sidebar-foreground/40">
          © 2025 Promotoria — Plataforma de promotoría
        </p>
      </div>

      {/* Formulario */}
      <div className="w-full lg:w-[56%] flex items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Marca compacta (visible cuando no hay panel) */}
          <img
            src={logoMark}
            alt="Promotoria"
            className="h-12 object-contain mb-8 lg:hidden"
          />

          <div className="mb-8">
            <span className="hidden lg:block h-[3px] w-7 rounded-full bg-brand mb-4" aria-hidden />
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Bienvenido de nuevo
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Usuario
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !username || !password}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar sesión
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-2">
              <button
                type="button"
                onClick={() => navigate("/restore-pwd")}
                className="text-foreground font-medium hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-background text-muted-foreground">
                  ¿No tienes una cuenta?
                </span>
              </div>
            </div>

            <div className="text-center space-y-3 p-4 bg-card rounded-lg border border-border">
              <p className="text-sm text-foreground font-medium">
                Descubre cómo Promotoria puede transformar tu negocio
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  toast.error("Redirigir a página de solicitud de prueba")
                }
              >
                Solicita tu prueba gratuita
              </Button>
            </div>
          </form>

          <div className="text-center text-xs text-muted-foreground mt-8">
            Al iniciar sesión, aceptas nuestros{" "}
            <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
              Términos de Servicio
            </a>{" "}
            y{" "}
            <a href="/aviso-de-privacidad" target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
              Política de Privacidad
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
