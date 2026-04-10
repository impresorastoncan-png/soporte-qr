// Tipos de filas (Row)
export interface ClienteRow {
  id: string
  nombre: string
  rif: string | null
  direccion: string | null
  atc_email: string
  activo: boolean
  es_almacen: boolean
  created_at: string
  updated_at: string
}

export interface TecnicoRow {
  id: string
  nombre: string
  email: string
  activo: boolean
  created_at: string
}

export interface MaquinaRow {
  id: string
  serial: string
  modelo: string
  cliente_id: string
  ubicacion: string
  encargado_email: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface MaquinaTecnicoRow {
  maquina_id: string
  tecnico_id: string
}

export interface SolicitudRow {
  id: string
  maquina_id: string | null
  serial: string
  cliente_nombre: string
  modelo: string
  ubicacion: string
  nombre_solicitante: string
  correo_solicitante: string | null
  urgencia: 'baja' | 'media' | 'alta' | 'critica'
  necesita_toner: boolean
  tipo_problema: string | null
  descripcion: string
  fotos_urls: string[] | null
  estado: 'pendiente' | 'en_proceso' | 'resuelto'
  ticket_id: string
  created_at: string
  updated_at: string
}

export interface MaquinaDetalleRow {
  id: string
  serial: string
  modelo: string
  ubicacion: string
  encargado_email: string | null
  activo: boolean
  created_at: string
  cliente_id: string
  cliente_nombre: string
  atc_email: string
  tecnicos_emails: string[] | null
  tecnicos_nombres: string[] | null
}

// Tipos Insert
export interface ClienteInsert {
  id?: string
  nombre: string
  rif?: string | null
  direccion?: string | null
  atc_email: string
  activo?: boolean
  es_almacen?: boolean
  created_at?: string
  updated_at?: string
}

export interface TecnicoInsert {
  id?: string
  nombre: string
  email: string
  activo?: boolean
  created_at?: string
}

export interface MaquinaInsert {
  id?: string
  serial: string
  modelo: string
  cliente_id: string
  ubicacion?: string
  encargado_email?: string | null
  activo?: boolean
  created_at?: string
  updated_at?: string
}

export interface MaquinaTecnicoInsert {
  maquina_id: string
  tecnico_id: string
}

export interface SolicitudInsert {
  id?: string
  maquina_id?: string | null
  serial: string
  cliente_nombre: string
  modelo: string
  ubicacion: string
  nombre_solicitante: string
  correo_solicitante?: string | null
  urgencia: 'baja' | 'media' | 'alta' | 'critica'
  necesita_toner: boolean
  tipo_problema?: string | null
  descripcion: string
  fotos_urls?: string[] | null
  estado?: 'pendiente' | 'en_proceso' | 'resuelto'
  ticket_id: string
  created_at?: string
  updated_at?: string
}

// Database schema
export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: ClienteRow
        Insert: ClienteInsert
        Update: Partial<ClienteInsert>
        Relationships: []
      }
      tecnicos: {
        Row: TecnicoRow
        Insert: TecnicoInsert
        Update: Partial<TecnicoInsert>
        Relationships: []
      }
      maquinas: {
        Row: MaquinaRow
        Insert: MaquinaInsert
        Update: Partial<MaquinaInsert>
        Relationships: [
          {
            foreignKeyName: 'maquinas_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          }
        ]
      }
      maquina_tecnicos: {
        Row: MaquinaTecnicoRow
        Insert: MaquinaTecnicoInsert
        Update: Partial<MaquinaTecnicoInsert>
        Relationships: []
      }
      solicitudes: {
        Row: SolicitudRow
        Insert: SolicitudInsert
        Update: Partial<SolicitudInsert>
        Relationships: []
      }
    }
    Views: {
      v_maquinas_detalle: {
        Row: MaquinaDetalleRow
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Shortcuts
export type Cliente = ClienteRow
export type Tecnico = TecnicoRow
export type Maquina = MaquinaRow
export type Solicitud = SolicitudRow
export type MaquinaDetalle = MaquinaDetalleRow

export type Urgencia = 'baja' | 'media' | 'alta' | 'critica'
export type EstadoSolicitud = 'pendiente' | 'en_proceso' | 'resuelto'
