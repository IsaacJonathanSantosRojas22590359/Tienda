from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from database import get_connection
from auth import verificar_token, solo_admin
from typing import Optional

router = APIRouter(prefix='/api', tags=['Productos'])

class ProductoInput(BaseModel):
    nombre:      str
    precio:      float
    stock:       int
    descripcion: Optional[str] = ''
    categoria:   int

class CategoriaInput(BaseModel):
    nombre:      str
    descripcion: Optional[str] = ''

# ── Categorías ───────────────────────────────────────────────
@router.get('/categorias/')
def listar_categorias(payload: dict = Depends(verificar_token)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM categorias ORDER BY nombre')
    categorias = cursor.fetchall()
    cursor.close(); conn.close()
    return categorias

@router.post('/categorias/')
def crear_categoria(data: CategoriaInput, payload: dict = Depends(solo_admin)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO categorias (nombre, descripcion) VALUES (%s, %s)',
                   (data.nombre, data.descripcion))
    conn.commit()
    nuevo_id = cursor.lastrowid
    cursor.close(); conn.close()
    return {'id': nuevo_id, 'nombre': data.nombre, 'descripcion': data.descripcion}

@router.put('/categorias/{cat_id}/')
def editar_categoria(cat_id: int, data: CategoriaInput, payload: dict = Depends(solo_admin)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE categorias SET nombre=%s, descripcion=%s WHERE id=%s',
                   (data.nombre, data.descripcion, cat_id))
    conn.commit()
    cursor.close(); conn.close()
    return {'id': cat_id, 'nombre': data.nombre, 'descripcion': data.descripcion}

@router.delete('/categorias/{cat_id}/')
def eliminar_categoria(cat_id: int, payload: dict = Depends(solo_admin)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM categorias WHERE id = %s', (cat_id,))
    conn.commit()
    cursor.close(); conn.close()
    return {'mensaje': 'Categoría eliminada'}

# ── Productos ────────────────────────────────────────────────
@router.get('/productos/')
def listar_productos(payload: dict = Depends(verificar_token)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id, p.nombre, p.precio, p.stock, p.descripcion,
               p.categoria_id AS categoria, c.nombre AS categoria_nombre,
               p.activo, p.updated_at
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        WHERE p.activo = TRUE
        ORDER BY p.nombre ASC
    """)
    productos = cursor.fetchall()
    cursor.close(); conn.close()
    for p in productos:
        p['precio']     = float(p['precio'])
        p['updated_at'] = str(p['updated_at'])
    return productos

@router.post('/productos/')
def crear_producto(data: ProductoInput, payload: dict = Depends(solo_admin)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO productos (nombre, precio, stock, descripcion, categoria_id)
        VALUES (%s, %s, %s, %s, %s)
    """, (data.nombre, data.precio, data.stock, data.descripcion, data.categoria))
    conn.commit()
    nuevo_id = cursor.lastrowid
    cursor.close(); conn.close()
    return {'id': nuevo_id, **data.dict()}

@router.get('/productos/stock-bajo/')
def stock_bajo(payload: dict = Depends(verificar_token)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id, p.nombre, p.stock, c.nombre AS categoria
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        WHERE p.stock < 10 AND p.activo = TRUE
        ORDER BY p.stock ASC
    """)
    productos = cursor.fetchall()
    cursor.close(); conn.close()
    return productos

@router.get('/productos/{producto_id}/')
def ver_producto(producto_id: int, payload: dict = Depends(verificar_token)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id, p.nombre, p.precio, p.stock, p.descripcion,
               p.categoria_id AS categoria, c.nombre AS categoria_nombre,
               p.activo, p.updated_at
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        WHERE p.id = %s
    """, (producto_id,))
    producto = cursor.fetchone()
    cursor.close(); conn.close()
    if not producto:
        raise HTTPException(status_code=404, detail='Producto no encontrado')
    producto['precio']     = float(producto['precio'])
    producto['updated_at'] = str(producto['updated_at'])
    return producto

@router.put('/productos/{producto_id}/')
def editar_producto(producto_id: int, data: ProductoInput, payload: dict = Depends(solo_admin)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE productos
        SET nombre=%s, precio=%s, stock=%s, descripcion=%s, categoria_id=%s
        WHERE id=%s
    """, (data.nombre, data.precio, data.stock, data.descripcion, data.categoria, producto_id))
    conn.commit()
    cursor.close(); conn.close()
    return {'id': producto_id, **data.dict()}

@router.delete('/productos/{producto_id}/')
def eliminar_producto(producto_id: int, payload: dict = Depends(solo_admin)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE productos SET activo = FALSE WHERE id = %s', (producto_id,))
    conn.commit()
    cursor.close(); conn.close()
    return {'mensaje': 'Producto eliminado'}