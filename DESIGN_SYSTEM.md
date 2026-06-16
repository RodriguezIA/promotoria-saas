# Sistema de Diseño — Promotoria

Guía única de tema, tokens y componentes. La fuente de verdad es
[`src/index.css`](src/index.css) (Tailwind CSS v4, configuración CSS-first —
ya **no** existe `tailwind.config.js`).

## Identidad — "Consola de operaciones de campo"

Promotoria coordina promotores en punto de venta: conteos, exhibición, rutas.
La UI se lee como un **instrumento de trabajo profesional**: tinta petróleo
sobre papel cálido, datos en monoespaciada, un solo acento.

- **Marca / acento**: ámbar de señalización (`--brand`,
  `oklch(0.74 0.135 68)`). Uso mínimo y puntual: indicador del ítem activo
  del sidebar, filete superior de StatCard, marca del PageHeader y CTAs
  excepcionales (`<Button variant="brand">`). Nunca como color decorativo.
- **Acción primaria**: tinta petróleo (`--primary`, azul-verdoso casi negro
  en claro; se invierte en oscuro).
- **Rail oscuro permanente**: el sidebar usa los tokens `--sidebar-*`
  (petróleo profundo) en **ambos** temas. Es la firma visual del producto;
  el login reutiliza esa misma superficie (`bg-sidebar` + `bg-dotgrid`).
- **Estados semánticos desaturados**: success/warning/info/destructive tienen
  croma bajo a propósito; úsalos solo para significar estado, no para decorar.
- **Sin emojis en la UI**: usa íconos de `lucide-react` (stroke 1.8–2).
- **Tipografía** (se carga en `index.html`):
  - [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque)
    (`font-display`): títulos de página y cifras grandes.
  - [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk)
    (`font-sans`): texto de lectura.
  - [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono)
    (`font-mono`): encabezados de tabla, folios/IDs, etiquetas `eyebrow` y
    metadatos. Es lo que da el carácter "operativo".
- **Etiqueta `eyebrow`**: utilidad propia (mono, 11px, mayúsculas, tracking
  0.14em) para kickers, secciones del sidebar y metadatos.
- **Cifras**: siempre `tabular-nums` (ya aplicado a `td/th` en la base).
- **Radios**: base `0.5rem` (`rounded-lg`); badges/chips `rounded-md`.
- **Movimiento**: corto (0.2–0.4s), easing `power3.out` / `cubic-bezier(0.22,1,0.36,1)`.

## Tokens de color

Usa siempre las utilidades semánticas, nunca colores crudos (`bg-slate-900`,
`#fff`, `var(--text-primary)`...).

| Utilidad | Uso |
| --- | --- |
| `bg-background` / `text-foreground` | Fondo de página y texto principal |
| `bg-card` / `text-card-foreground` | Cards, modales, inputs |
| `bg-popover` | Dropdowns, popovers, tooltips de contenido |
| `bg-primary` / `text-primary-foreground` | Botón/acción primaria (tinta) |
| `bg-brand` / `text-brand-foreground` | CTA de marca (ámbar), estados activos |
| `bg-secondary`, `bg-muted` | Superficies atenuadas, fondos de tabla |
| `text-muted-foreground` | Texto secundario / descripciones |
| `bg-accent` / `text-accent-foreground` | Hover de elementos interactivos |
| `bg-destructive`, `bg-success`, `bg-warning`, `bg-info` (+ `-foreground`) | Estados semánticos |
| `border-border`, `border-input` | Bordes |
| `ring-ring` | Anillo de foco (petróleo) |
| `bg-chart-1..5` | Series de gráficas |
| `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`... | Sidebar |

El modo oscuro funciona con la clase `dark` en `<html>` (la maneja
`useTheme()` y un script anti-flash en `index.html`). No escribas variantes
`dark:` para colores: los tokens ya cambian solos. Usa `dark:` solo para
casos excepcionales.

## Componentes

Los bloques de construcción viven en `src/components/ui` (shadcn/ui adaptado).
Reglas:

1. **Botones**: `<Button>` con variantes `default` (tinta), `brand` (ámbar,
   para el CTA principal de la vista), `outline`, `secondary`, `ghost`,
   `destructive`, `link`. No estilices `<button>` a mano.
2. **Badges**: `<Badge>` con `default | secondary | brand | success | warning |
   info | destructive | outline`, o `<StatusBadge status="..." />` para
   estados de negocio.
3. **Cards**: `<Card>` (+ `CardHeader/Content/Footer`) o `StatCard` para KPIs.
4. **Páginas**: envuelve cada vista en `<PageWrapper>` y usa `<PageHeader>`
   para título + acciones.
5. **Formularios**: `Input`, `Textarea`, `Select`, `Label`, `form.tsx`
   (react-hook-form + zod). El foco es un borde + halo neutro consistente.
6. **Tablas**: usa `<DataTable>` (`components/ui/datatble.tsx`). Es
   **responsive por defecto**: colapsa las columnas que no caben y las muestra
   al expandir la fila (botón chevron, siempre la primera columna). Controla
   qué columnas permanecen visibles con `responsive.priorityColumns`.
7. **Cambio de tema**: el `<ThemeToggleHeader />` ya está en el header del
   Layout (desktop y móvil); no agregues toggles adicionales por pantalla.

## Movimiento (GSAP + CSS)

Utilidades en [`src/lib/motion.ts`](src/lib/motion.ts):

```tsx
// Transición de ruta (ya integrada en Layout)
const ref = usePageTransition<HTMLDivElement>();

// Cascada de cards al montar
const gridRef = useStaggerReveal<HTMLDivElement>([items.length]);
<div ref={gridRef} className="grid gap-4 ...">

// Cifras animadas (StatCard ya lo usa)
const numRef = useCountUp<HTMLSpanElement>(1234);
```

Para entradas simples sin JS usa las clases CSS: `animate-page-in`,
`animate-fade-up`, `animate-fade-in`, `animate-scale-in`, `stagger-children`.
Todo respeta `prefers-reduced-motion`.

## Deprecado (capa de compatibilidad)

Al final de `src/index.css` hay alias para código viejo: variables
(`--bg`, `--text-primary`, `--card-bg`, `--hover`, `--color-brand`...) y
clases (`.custom-card`, `.btn-primary`, `.badge-*`, `.text-secondary`,
`.loading-skeleton`, `.grid-responsive`...). Siguen funcionando y ya rinden
los colores nuevos, pero **no los uses en código nuevo**; migra a los tokens
y componentes de arriba. Cuando no queden usos, esa sección se borra.

Equivalencias rápidas al migrar:

| Legacy | Nuevo |
| --- | --- |
| `style={{ color: "var(--text-secondary)" }}` | `className="text-muted-foreground"` |
| `style={{ backgroundColor: "var(--card-bg)" }}` | `className="bg-card"` |
| `var(--color-brand)` / `var(--accent)` (ámbar) | `bg-brand text-brand-foreground` |
| `.custom-card` | `<Card>` |
| `.btn-primary` | `<Button variant="brand">` |
| `.badge badge-success` | `<Badge variant="success">` |
| `text-error` / `bg-error` | `text-destructive` / `bg-destructive` |
| `hover:bg-hover` | `hover:bg-accent` |

## Cómo agregar componentes shadcn

`components.json` ya apunta a Tailwind v4 con variables CSS
(`baseColor: neutral`). Ejecuta `pnpm dlx shadcn@latest add <componente>` y
ajusta cualquier color crudo a los tokens semánticos.
