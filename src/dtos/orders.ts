import { UsuarioDTO } from './users'
import { ClientDTO } from './clients'

// model orders {
//   id_order    Int            @id @default(autoincrement()) @db.UnsignedInt
//   id_user     Int            @db.UnsignedInt
//   id_client   Int            @db.UnsignedInt
//   f_total     Decimal        @db.Decimal(10, 2)
//   dt_register DateTime       @db.DateTime(0)
//   dt_update   DateTime       @db.DateTime(0)
//   id_status   Int            @default(1)

//   user         users           @relation(fields: [id_user], references: [id_user])
//   client       clients         @relation(fields: [id_client], references: [id_client])
//   order_logs   order_logs[]
//   order_requests order_requests[]
//   order_items    order_items[]
//   tasks          tasks[]
// }

export interface OrderDTO {
    id_order: number
    id_user: number
    id_client: number
    f_total: number
    dt_register: string
    dt_update: string
    id_status: number
    // user?: UsuarioDTO
    // client?: ClientDTO
}

export interface OrderItemsDTO {
    // Esta es la tabal estructura que arma las request qeu se estan agregando 
    id_order_item: number
    id_order: number
    id_request: number
    id_store: number
    f_values: number
    dt_register: string
    dt_update: string
}

export interface OderListDTO {
    data: OrderDTO[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}