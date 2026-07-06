import { api, ApiResponse } from "@/lib";
import { useAuthStore } from "@/stores";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type InvoiceStatus = "pendiente" | "en_revision" | "aceptado" | "rechazado" | "atrasado";
export type PromoterPaymentStatus = "pendiente" | "pagado";
export type MetodoPago = "efectivo" | "transferencia" | "tarjeta" | "oxxo";

export interface InvoiceItem {
  id_order: number;
  id_request: number | null;
  request_name: string | null;
  i_completed_tasks: number;
  f_subtotal: number;
}

export interface InvoicePaymentDetail {
  id_invoice_payment: number;
  f_amount: number;
  vc_method: string;
  vc_reference: string | null;
  vc_receipt_url: string | null;
  vc_notes: string | null;
  vc_review_notes: string | null;
  i_status: number; // 1=en_revision 2=aceptado 3=rechazado
  dt_register: string;
  dt_reviewed: string | null;
}

export interface ClientInvoice {
  id_cobro: number;
  id_invoice: number;
  id_client: number;
  client_name: string;
  vc_folio: string | null;
  dt_periodo_inicio: string;
  dt_periodo_fin: string;
  dt_vencimiento: string;
  f_total: number;
  status: InvoiceStatus;
  dt_pago: string | null;
  items: InvoiceItem[];
  payments?: InvoicePaymentDetail[];
}

export interface PromoterPayment {
  id_pago: number;
  id_promoter: number;
  promoter_name: string;
  dt_periodo_inicio: string;
  dt_periodo_fin: string;
  i_completed_tasks: number;
  f_monto: number;
  status: PromoterPaymentStatus;
  dt_pago: string | null;
  vc_method: string | null;
  vc_reference: string | null;
  items: InvoiceItem[];
}

export interface FinanceSummary {
  total_cobrado: number;
  total_pendiente_cobro: number;
  total_pagado_promotores: number;
  total_pendiente_promotores: number;
}

export interface FinanceConfigGlobal {
  id_finance_settings: number;
  f_promoter_pct: number | string;
  i_default_period_days: number;
  i_default_billing_weekday: number;
  i_default_payment_due_days: number;
}

export interface FinanceConfigClient {
  id_client_billing_config: number;
  id_client: number;
  client_name: string;
  i_period_days: number;
  i_billing_weekday: number;
  i_payment_due_days: number;
  b_active: boolean;
}

export interface FinanceConfig {
  global: FinanceConfigGlobal;
  clients: FinanceConfigClient[];
}

export interface SubmitPaymentPayload {
  f_amount: number;
  vc_method: MetodoPago;
  vc_reference?: string;
  vc_notes?: string;
  receipt?: File | null;
}

export interface ReviewPayload {
  decision: "aceptado" | "rechazado";
  vc_review_notes?: string;
}

export interface RegisterPromoterPayload {
  vc_method?: MetodoPago;
  vc_reference?: string;
  vc_notes?: string;
}

// ─── SUPER ADMIN: COBROS ──────────────────────────────────────────────────────

export const getInvoices = (filters?: { id_client?: number; i_status?: number }) => {
  const params = new URLSearchParams();
  if (filters?.id_client) params.set("id_client", String(filters.id_client));
  if (filters?.i_status) params.set("i_status", String(filters.i_status));
  const qs = params.toString();
  return api.get<ApiResponse<ClientInvoice[]>>(`/finance/invoices${qs ? `?${qs}` : ""}`);
};

export const getInvoiceDetail = (id_invoice: number) =>
  api.get<ApiResponse<ClientInvoice>>(`/finance/invoices/${id_invoice}`);

export const reviewInvoicePayment = (id_invoice_payment: number, payload: ReviewPayload) =>
  api.put<ApiResponse<unknown>>(`/finance/invoice-payments/${id_invoice_payment}/review`, payload);

export const markInvoiceLate = (id_invoice: number) =>
  api.put<ApiResponse<unknown>>(`/finance/invoices/${id_invoice}/late`);

// ─── SUPER ADMIN: PAGOS A PROMOTORES ─────────────────────────────────────────

export const getPromoterPayments = (filters?: { id_promoter?: number; i_status?: number }) => {
  const params = new URLSearchParams();
  if (filters?.id_promoter) params.set("id_promoter", String(filters.id_promoter));
  if (filters?.i_status) params.set("i_status", String(filters.i_status));
  const qs = params.toString();
  return api.get<ApiResponse<PromoterPayment[]>>(`/finance/promoter-payments${qs ? `?${qs}` : ""}`);
};

export const registerPromoterPayment = (id_promoter_payment: number, payload: RegisterPromoterPayload) =>
  api.put<ApiResponse<unknown>>(`/finance/promoter-payments/${id_promoter_payment}/pay`, payload);

// ─── SUPER ADMIN: RESUMEN / GENERACIÓN / CONFIG ──────────────────────────────

export const getSummary = () => api.get<ApiResponse<FinanceSummary>>(`/finance/summary`);

export const generateBilling = (payload?: { id_client?: number; dt_period_start?: string; dt_period_end?: string }) =>
  api.post<ApiResponse<{ invoices_creadas: number; pagos_promotor_creados: number; facturas_vencidas: number }>>(
    `/finance/generate`,
    payload ?? {},
  );

export const getConfig = () => api.get<ApiResponse<FinanceConfig>>(`/finance/config`);

export const saveGlobalConfig = (payload: Partial<Omit<FinanceConfigGlobal, "id_finance_settings">>) =>
  api.put<ApiResponse<unknown>>(`/finance/config`, payload);

export const saveClientConfig = (
  id_client: number,
  payload: Partial<Omit<FinanceConfigClient, "id_client_billing_config" | "id_client" | "client_name">>,
) => api.put<ApiResponse<unknown>>(`/finance/config/client/${id_client}`, payload);

// ─── CLIENTE: MIS COBROS ──────────────────────────────────────────────────────

export const getMyInvoices = () => api.get<ApiResponse<ClientInvoice[]>>(`/finance/my-invoices`);

export const getMyInvoiceDetail = (id_invoice: number) =>
  api.get<ApiResponse<ClientInvoice>>(`/finance/my-invoices/${id_invoice}`);

export const submitInvoicePayment = (id_invoice: number, payload: SubmitPaymentPayload) => {
  const fd = new FormData();
  fd.append("f_amount", String(payload.f_amount));
  fd.append("vc_method", payload.vc_method);
  if (payload.vc_reference) fd.append("vc_reference", payload.vc_reference);
  if (payload.vc_notes) fd.append("vc_notes", payload.vc_notes);
  if (payload.receipt) fd.append("receipt", payload.receipt);
  return api.upload<ApiResponse<unknown>>(`/finance/invoices/${id_invoice}/payments`, fd);
};

// Helper para etiquetas legibles de estatus.
export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  aceptado: "Pagado",
  rechazado: "Rechazado",
  atrasado: "Atrasado",
};

// Conserva acceso al store por si se requiere el id del usuario en componentes.
export const getCurrentUser = () => useAuthStore.getState().user;
