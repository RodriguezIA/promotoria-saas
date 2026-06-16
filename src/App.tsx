import AppRouter from "./router";
import { useTheme } from "./hooks/useTheme";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  useTheme();

  return (
    <>
      <Toaster position="top-center" expand={true} richColors closeButton />
      <AppRouter />
    </>
  );
}
