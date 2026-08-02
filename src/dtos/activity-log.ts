/**
 * Forma común de las bitácoras del sistema (store_logs, client_logs,
 * question_logs, etc.). Cada tabla de logs tiene su propia PK, pero todas
 * comparten `log` + `dt_register` + usuario opcional — con eso alcanza para
 * pintar un timeline, así que no hace falta normalizar el nombre del id.
 */
export interface ActivityLogEntry {
    log: string
    dt_register: string
    users?: {
        name: string
        lastname: string
    } | null
}
