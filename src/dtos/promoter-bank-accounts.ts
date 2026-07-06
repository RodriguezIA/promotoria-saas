export interface PromoterBankAccountDTO {
  id: number
  id_promoter: number
  account_holder_name: string
  account_type: 'CLABE' | 'CARD'
  clabe?: string | null
  card_number?: string | null
  bank_name: string
  dt_register?: string
  dt_updated?: string
}

export interface CreateBankAccountDTO {
  account_holder_name: string
  account_type: 'CLABE' | 'CARD'
  clabe?: string
  card_number?: string
  bank_name: string
}
