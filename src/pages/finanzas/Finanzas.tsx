import { useAuthStore } from "../../store/authStore";
import FinanzasSuperAdmin from "./FinanzasSuperAdmin";
import FinanzasAdmin from "./FinanzasAdmin";

export default function Finanzas() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.i_rol === 1;
  return isSuperAdmin ? <FinanzasSuperAdmin /> : <FinanzasAdmin />;
}
