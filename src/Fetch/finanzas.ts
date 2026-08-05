import { api, ApiResponse } from "@/lib";
import { useAuthStore } from "@/stores";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

// Coincide 1 a 1 con CLIENT_CHARGE_STATUS del backend
export const INVOICE_STATUS = {
  PENDIENTE_PAGO: 1,
  EN_VALIDACION: 2,
  OBSERVADO: 3,
  PAGADO: 4,
  CANCELADO: 5,
} as const;

export type InvoiceStatusId = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

export const INVOICE_STATUS_LABEL: Record<InvoiceStatusId, string> = {
  1: "Pendiente de pago",
  2: "En validación",
  3: "Observada",
  4: "Pagada",
  5: "Cancelada",
};

export type MetodoPago = "efectivo" | "transferencia" | "tarjeta" | "oxxo";

// Una FACTURA individual (1 pedido = 1 factura), dentro de un CORTE (periodo)
export interface ClientInvoice {
  id: number;
  id_charge: number;
  id_order: number;
  vc_folio: string | null;
  f_amount: string;
  id_status: InvoiceStatusId;
  dt_due: string | null;
  dt_payment: string | null;
  vc_payment_method: string | null;
  vc_rejection_reason: string | null;
  dt_register: string;
  dt_updated: string;
  charge: {
    id_charge: number;
    id_client: number;
    vc_folio: string | null;
    dt_start: string;
    dt_end: string;
    f_total: string;
  };
  order: {
    id_order: number;
    id_client: number;
  };
}

export interface InvoiceEvidence {
  id_asset: number;
  vc_url: string;
  vc_mime: string | null;
}

export interface InvoiceLog {
  id_charge_log: number;
  vc_log: string;
  dt_register: string;
}

export interface ClientInvoiceDetail extends ClientInvoice {
  evidences: InvoiceEvidence[];
  logs: InvoiceLog[];
}

export interface InvoiceListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InvoiceListResponse {
  data: ClientInvoice[];
  meta: InvoiceListMeta;
}

export interface InvoiceFilters {
  id_client?: number;
  id_status?: InvoiceStatusId;
  dt_start?: string;
  dt_end?: string;
  vc_folio?: string;
  b_overdue?: boolean;
  page?: number;
  limit?: number;
}

export interface SubmitInvoicePaymentPayload {
  dt_payment: string;
  vc_payment_method: MetodoPago;
  evidence: File;
}

export type InvoiceStatusAction = "approve" | "reject" | "cancel";

export interface UpdateInvoiceStatusPayload {
  action: InvoiceStatusAction;
  vc_rejection_reason?: string;
}

// Helper: ¿esta factura está vencida? (sigue sin pagar y ya pasó su fecha límite)
export const isInvoiceOverdue = (invoice: ClientInvoice): boolean => {
  if (!invoice.dt_due) return false;
  if (invoice.id_status !== INVOICE_STATUS.PENDIENTE_PAGO && invoice.id_status !== INVOICE_STATUS.OBSERVADO) return false;
  return new Date(invoice.dt_due) < new Date();
};

// ─── CLIENTE: MIS FACTURAS ────────────────────────────────────────────────────

export const getMyInvoices = (filters?: Omit<InvoiceFilters, "id_client">) => {
  const params = new URLSearchParams();
  if (filters?.id_status) params.set("id_status", String(filters.id_status));
  if (filters?.dt_start) params.set("dt_start", filters.dt_start);
  if (filters?.dt_end) params.set("dt_end", filters.dt_end);
  if (filters?.vc_folio) params.set("vc_folio", filters.vc_folio);
  if (filters?.b_overdue) params.set("b_overdue", "true");
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return api.get<ApiResponse<InvoiceListResponse>>(`/finances/client-charges/invoices/all${qs ? `?${qs}` : ""}`);
};

export const getMyInvoiceDetail = (id_invoice: number) =>
  api.get<ApiResponse<ClientInvoice>>(`/finances/client-charges/invoices/${id_invoice}`);

// El endpoint es PATCH con multipart/form-data; api.upload solo hace POST,
// así que aquí hacemos el fetch directo para poder usar PATCH.
export const submitInvoicePayment = async (id_invoice: number, payload: SubmitInvoicePaymentPayload) => {
  const fd = new FormData();
  fd.append("dt_payment", payload.dt_payment);
  fd.append("vc_payment_method", payload.vc_payment_method);
  fd.append("evidence", payload.evidence);

  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_URL}/finances/client-charges/invoices/${id_invoice}/payment`, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Error ${response.status}`);
  }
  return response.json() as Promise<ApiResponse<ClientInvoice>>;
};

// ─── MASTER: TODAS LAS FACTURAS / CORTES ──────────────────────────────────────

export const getAllInvoices = (filters?: InvoiceFilters) => {
  const params = new URLSearchParams();
  if (filters?.id_client) params.set("id_client", String(filters.id_client));
  if (filters?.id_status) params.set("id_status", String(filters.id_status));
  if (filters?.dt_start) params.set("dt_start", filters.dt_start);
  if (filters?.dt_end) params.set("dt_end", filters.dt_end);
  if (filters?.vc_folio) params.set("vc_folio", filters.vc_folio);
  if (filters?.b_overdue) params.set("b_overdue", "true");
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return api.get<ApiResponse<InvoiceListResponse>>(`/finances/client-charges/invoices/all${qs ? `?${qs}` : ""}`);
};

export const getInvoiceById = (id_invoice: number) =>
  api.get<ApiResponse<ClientInvoiceDetail>>(`/finances/client-charges/invoices/${id_invoice}`);

export const updateInvoiceStatus = (id_invoice: number, payload: UpdateInvoiceStatusPayload) =>
  api.patch<ApiResponse<ClientInvoice>>(`/finances/client-charges/invoices/${id_invoice}/status`, payload);

export const updateInvoiceDueDate = (id_invoice: number, dt_due: string) =>
  api.patch<ApiResponse<ClientInvoice>>(`/finances/client-charges/invoices/${id_invoice}/due-date`, { dt_due });

export interface GenerateChargesPayload {
  dt_start: string;
  dt_end: string;
  dt_due: string;
  id_client?: number;
}

export const previewCharges = (payload: GenerateChargesPayload) =>
  api.post<ApiResponse<{ clients: Array<{ id_client: number; f_total: number; orders: Array<{ id_order: number; f_amount: number }> }> }>>(
    `/finances/client-charges/preview`,
    payload
  );

export const generateCharges = (payload: GenerateChargesPayload) =>
  api.post<ApiResponse<unknown>>(`/finances/client-charges`, payload);

export interface ClientCharge {
  id_charge: number;
  id_client: number;
  vc_folio: string | null;
  dt_start: string;
  dt_end: string;
  f_total: string;
  id_user_creator: number;
  dt_register: string;
  dt_updated: string;
}

export const getAllCharges = (filters?: { id_client?: number; dt_start?: string; dt_end?: string; vc_folio?: string; page?: number; limit?: number }) => {
  const params = new URLSearchParams();
  if (filters?.id_client) params.set("id_client", String(filters.id_client));
  if (filters?.dt_start) params.set("dt_start", filters.dt_start);
  if (filters?.dt_end) params.set("dt_end", filters.dt_end);
  if (filters?.vc_folio) params.set("vc_folio", filters.vc_folio);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return api.get<ApiResponse<{ data: ClientCharge[]; meta: InvoiceListMeta }>>(`/finances/client-charges${qs ? `?${qs}` : ""}`);
};

export const getChargeById = (id_charge: number) =>
  api.get<ApiResponse<unknown>>(`/finances/client-charges/${id_charge}`);

// Conserva acceso al store por si se requiere el id del usuario en componentes.
export const getCurrentUser = () => useAuthStore.getState().user;
