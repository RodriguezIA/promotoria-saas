export interface ProductDTO {
  id_product: number;
  id_client: number;
  name: string;
  description: string | null;
  vc_image: string | null;
  vc_folio?: string | null;
  i_status: number;
  i_stock?: number | null;
  b_allow_backorder?: boolean;
  i_backorder_days?: number | null;
  f_store_price?: number | null;
  dt_created: string;
  dt_updated: string;
}