from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_connection
from auth import crear_token, verificar_token, solo_admin
import hashlib

router = APIRouter(prefix='/api', tags=['Auth y Usuarios'])

# ── Modelos ──────────────────────────────────────────────────
class LoginInput(BaseModel):
    email:    str
    password: str

class UsuarioInput(BaseModel):
    nombre:   str
    email:    str
    password: str
    rol:      str = 'empleado'

class UsuarioUpdate(BaseModel):
    nombre: str | None = None
    email:  str | None = None
    rol:    str | None = None

# ── Login ────────────────────────────────────────────────────
@router.post('/auth/login/')
def login(data: LoginInput):
    pwd_hash = hashlib.sha256(data.password.encode()).hexdigest()
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, nombre, email, rol, activo
        FROM usuarios
        WHERE email = %s AND password_hash = %s
    """, (data.email, pwd_hash))
    usuario = cursor.fetchone()
    cursor.close()
    conn.close()

    if not usuario:
        raise HTTPException(status_code=401, detail='Credenciales incorrectas')
    if not usuario['activo']:
        raise HTTPException(status_code=403, detail='Usuario inactivo')

    token = crear_token({
        'id':     usuario['id'],
        'nombre': usuario['nombre'],
        'email':  usuario['email'],
        'rol':    usuario['rol'],
    })
    return {
        'access':  token,
        'refresh': token,
        'usuario': {
            'id':     usuario['id'],
            'nombre': usuario['nombre'],
            'email':  usuario['email'],
            'rol':    usuario['rol'],
        }
    }

# ── Listar usuarios ──────────────────────────────────────────
@router.get('/usuarios/')
def listar_usuarios(payload: dict = Depends(solo_admin)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, nombre, email, rol, activo, created_at
        FROM usuarios WHERE activo = TRUE
        ORDER BY created_at DESC
    """)
    usuarios = cursor.fetchall()
    cursor.close()
    conn.close()
    for u in usuarios:
        u['created_at'] = str(u['created_at'])
    return usuarios

# ── Crear usuario ────────────────────────────────────────────
@router.post('/usuarios/crear/')
def crear_usuario(data: UsuarioInput, payload: dict = Depends(solo_admin)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT id FROM usuarios WHERE email = %s', (data.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail='El email ya está registrado')

    pwd_hash = hashlib.sha256(data.password.encode()).hexdigest()
    cursor.execute("""
        INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
        VALUES (%s, %s, %s, %s, TRUE)
    """, (data.nombre, data.email, pwd_hash, data.rol))
    conn.commit()
    nuevo_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return {'id': nuevo_id, 'nombre': data.nombre, 'email': data.email, 'rol': data.rol}

# ── Ver usuario ──────────────────────────────────────────────
@router.get('/usuarios/{usuario_id}/')
def ver_usuario(usuario_id: int, payload: dict = Depends(solo_admin)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT id, nombre, email, rol, activo, created_at FROM usuarios WHERE id = %s', (usuario_id,))
    usuario = cursor.fetchone()
    cursor.close()
    conn.close()
    if not usuario:
        raise HTTPException(status_code=404, detail='Usuario no encontrado')
    usuario['created_at'] = str(usuario['created_at'])
    return usuario

# ── Editar usuario ───────────────────────────────────────────
@router.put('/usuarios/{usuario_id}/')
def editar_usuario(usuario_id: int, data: UsuarioUpdate, payload: dict = Depends(solo_admin)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE usuarios
        SET nombre = COALESCE(%s, nombre),
            email  = COALESCE(%s, email),
            rol    = COALESCE(%s, rol)
        WHERE id = %s
    """, (data.nombre, data.email, data.rol, usuario_id))
    conn.commit()
    cursor.close()
    conn.close()
    return {'mensaje': 'Empleado actualizado correctamente'}

# ── Desactivar usuario ───────────────────────────────────────
@router.delete('/usuarios/{usuario_id}/')
def desactivar_usuario(usuario_id: int, payload: dict = Depends(solo_admin)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE usuarios SET activo = FALSE WHERE id = %s', (usuario_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {'mensaje': 'Empleado desactivado correctamente'}