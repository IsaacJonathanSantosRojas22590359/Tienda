export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: 'admin' | 'empleado'
}

export interface Producto {
  id: number
  nombre: string
  precio: number
  stock: number
  descripcion: string
  categoria: string
  activo: boolean
}

export interface DetalleVenta {
  producto: Producto
  cantidad: number
  subtotal: number
}

export interface Venta {
  id: number
  empleado: string
  total: number
  fecha: string
  detalles: DetalleVenta[]
}