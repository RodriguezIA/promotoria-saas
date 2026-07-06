import { api, ApiResponse } from "@/lib";
import { PromoterDTO, PromoterBankAccountDTO, CreateBankAccountDTO } from "@/dtos";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Obtener todos los promotores
 * GET /promoters → { ok, data: PromoterDTO[] }
 */
export const getAllPromoters = () => api.get<ApiResponse<PromoterDTO[]>>("/promoters");

/**
 * Obtener detalle de un promotor
 * GET /promoters/:id → { ok, data: PromoterDTO }
 */
export const getPromoterById = (id: number) => 
  api.get<ApiResponse<PromoterDTO>>(`/promoters/${id}`);

/**
 * Actualizar foto de perfil de promotor (multipart)
 * POST /promoters/:id_promoter/upload-image
 */
export const updatePromoterImage = async (idPromoter: number, file: File) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/promoters/${idPromoter}/upload-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al actualizar imagen');
  }

  return res.json();
};

/**
 * Obtener cuentas bancarias de un promotor
 * GET /promoters/:id_promoter/bank-accounts
 */
export const getBankAccounts = (idPromoter: number) =>
  api.get<ApiResponse<PromoterBankAccountDTO[]>>(`/promoters/${idPromoter}/bank-accounts`);

/**
 * Crear cuenta bancaria para un promotor
 * POST /promoters/:id_promoter/bank-accounts
 */
export const createBankAccount = (idPromoter: number, payload: CreateBankAccountDTO) =>
  api.post<ApiResponse<PromoterBankAccountDTO>>(`/promoters/${idPromoter}/bank-accounts`, payload);

/**
 * Actualizar cuenta bancaria
 * PUT /promoters/:id_promoter/bank-accounts/:id_account
 */
export const updateBankAccount = (idPromoter: number, idAccount: number, payload: Partial<CreateBankAccountDTO>) =>
  api.put<ApiResponse<PromoterBankAccountDTO>>(`/promoters/${idPromoter}/bank-accounts/${idAccount}`, payload);

/**
 * Eliminar cuenta bancaria
 * DELETE /promoters/:id_promoter/bank-accounts/:id_account
 */
export const deleteBankAccount = (idPromoter: number, idAccount: number) =>
  api.delete<ApiResponse<null>>(`/promoters/${idPromoter}/bank-accounts/${idAccount}`);
