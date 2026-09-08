import { toast } from "sonner"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, ScanBarcode, MapPinCheck, Route as RouteIcon } from "lucide-react"


import { useAuthStore } from "@/stores"
import { useDriverAuthStore } from "@/stores/driverAuthStore"
import { loginUser } from "@/Fetch/login"
import { driverLogin } from "@/Fetch/driverPanel"
import { Button, Input } from "@/components"
import logoMark from "@/assets/isologo_promotoria_N.png"

const STOPS = [
  { icon: ScanBarcode, label: "Cuenta lo que hay en el anaquel, en el momento" },
  { icon: MapPinCheck, label: "Confirma que el promotor llegó a la tienda correcta" },
  { icon: RouteIcon, label: "Arma la ruta de entrega con datos reales, no con suposiciones" },
];

export function Login() {
  const navigate = useNavigate();
  const authstore = useAuthStore();
  const driverLoginStore = useDriverAuthStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username || !password || loading) return;
    setLoading(true);
    try {
      // Se intenta primero como cliente/master. Si no coincide, se prueba
      // como chofer (usa telefono en vez de usuario/correo) — asi la
      // persona no tiene que saber de antemano cual es su tipo de cuenta.
      const response = await loginUser(username, password);
      authstore.login(response.data.token, response.data.user);
      navigate("/");
      return;
    } catch (adminError) {
      try {
        const driverResponse = await driverLogin(username.trim(), password);
        driverLoginStore(driverResponse.data.token, driverResponse.data.driver);
        navigate("/chofer/mapa");
        return;
      } catch (driverError) {
        console.error(adminError, driverError);
        toast.error("Usuario o contraseña incorrectos");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel de marca — la ruta de entrega es el hilo visual de toda la pantalla */}
      <div className="hidden lg:flex lg:w-[46%] min-h-screen relative flex-col justify-between p-12 bg-sidebar text-sidebar-accent-foreground overflow-hidden">
        <RouteBackdrop />

        <div className="relative z-10">
          <img
            src="/promotorialogotipo_principalblanco.png"
            alt="Promotoria"
            className="h-10 object-contain"
          />
        </div>

        <div className="relative z-10 space-y-11">
          <div>
            <h2 className="font-display text-4xl xl:text-5xl font-bold leading-[1.08] tracking-tight text-white max-w-md">
              Sabes qué pasó en el punto de venta antes de colgar el teléfono.
            </h2>
            <p className="mt-5 text-base xl:text-lg text-sidebar-foreground max-w-md">
              Promotoria sigue cada visita de principio a fin: lo que el
              promotor encontró, lo que entregó el chofer, y lo que falta por
              surtir mañana.
            </p>
          </div>

          <ul className="space-y-5">
            {STOPS.map(({ icon: Icon, label }, i) => (
              <li key={label} className="relative flex items-start gap-4 pl-1">
                {i < STOPS.length - 1 && (
                  <span
                    className="absolute left-[19px] top-9 w-px h-[calc(100%+0.75rem)] bg-sidebar-border"
                    aria-hidden
                  />
                )}
                <span className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full border border-sidebar-border bg-sidebar-accent shrink-0">
                  <Icon className="w-4 h-4 text-sidebar-primary" strokeWidth={2} />
                </span>
                <span className="text-sm text-sidebar-foreground leading-snug pt-2.5">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-sidebar-foreground/40">
          © 2025 Promotoria — Plataforma de promotoría
        </p>
      </div>

      {/* Formulario */}
      <div className="w-full lg:w-[54%] flex items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Marca compacta (visible cuando no hay panel) */}
          <img
            src={logoMark}
            alt="Promotoria"
            className="h-12 object-contain mb-8 lg:hidden"
          />

          <div className="mb-9">
            <span className="hidden lg:block h-[3px] w-7 rounded-full bg-brand mb-4" aria-hidden />
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Bienvenido de nuevo
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Cliente, promotor o chofer — entra con tu usuario y contraseña.
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
                placeholder="Correo o teléfono"
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

            <div className="text-center text-xs text-muted-foreground pt-1">
              <button
                type="button"
                onClick={() => navigate("/restore-pwd")}
                className="text-foreground font-medium hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>

          <div className="text-center text-xs text-muted-foreground mt-10">
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

/**
 * Ilustracion de fondo del panel de marca: una ruta de entrega trazada entre
 * paradas, en vez del patron de puntos generico de antes. Es el mismo
 * concepto central de Logistica, no una textura decorativa cualquiera.
 */
function RouteBackdrop() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.16] pointer-events-none"
      viewBox="0 0 600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <path
        d="M -40 120 C 120 60, 180 220, 340 180 S 560 60, 640 200 C 520 340, 460 420, 300 400 S 40 520, 120 660 C 260 760, 420 700, 500 820 S 560 980, 700 940"
        fill="none"
        stroke="var(--sidebar-primary)"
        strokeWidth="2.5"
        strokeDasharray="1 14"
        strokeLinecap="round"
      />
      {[
        [-40, 120],
        [340, 180],
        [300, 400],
        [120, 660],
        [500, 820],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6" fill="var(--sidebar-primary)" />
      ))}
    </svg>
  );
}
