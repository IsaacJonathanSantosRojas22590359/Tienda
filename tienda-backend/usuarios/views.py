from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import connection
from django.contrib.auth.models import User as DjangoUser
import hashlib


# ── LOGIN ────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email    = request.data.get('email', '')
    password = request.data.get('password', '')
    pwd_hash = hashlib.sha256(password.encode()).hexdigest()

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT id, nombre, email, rol, activo
            FROM usuarios
            WHERE email = %s AND password_hash = %s
        """, [email, pwd_hash])
        row = cursor.fetchone()

    if not row:
        return Response(
            {'error': 'Credenciales incorrectas'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    usuario_id, nombre, email_db, rol, activo = row

    if not activo:
        return Response(
            {'error': 'Usuario inactivo'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        django_user = DjangoUser.objects.get(username=email)
    except DjangoUser.DoesNotExist:
        django_user = DjangoUser.objects.create_user(
            username=email,
            email=email,
            password=password
        )

    refresh          = RefreshToken.for_user(django_user)
    refresh['rol']   = rol
    refresh['nombre']= nombre

    return Response({
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
        'usuario': {
            'id':     usuario_id,
            'nombre': nombre,
            'email':  email_db,
            'rol':    rol,
        }
    })


# ── LISTAR EMPLEADOS ─────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_usuarios(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT id, nombre, email, rol, activo, created_at
            FROM usuarios
            WHERE activo = TRUE
            ORDER BY created_at DESC
        """)
        columnas = [col[0] for col in cursor.description]
        rows     = cursor.fetchall()

    data = [dict(zip(columnas, row)) for row in rows]
    for item in data:
        item['created_at'] = str(item['created_at'])
    return Response(data)


# ── CREAR EMPLEADO ───────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_usuario(request):
    nombre   = request.data.get('nombre', '')
    email    = request.data.get('email', '')
    password = request.data.get('password', '')
    rol      = request.data.get('rol', 'empleado')

    if not all([nombre, email, password]):
        return Response(
            {'error': 'nombre, email y password son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Verificar que el email no exista
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT id FROM usuarios WHERE email = %s", [email]
        )
        if cursor.fetchone():
            return Response(
                {'error': 'El email ya está registrado'},
                status=status.HTTP_400_BAD_REQUEST
            )

    pwd_hash = hashlib.sha256(password.encode()).hexdigest()

    with connection.cursor() as cursor:
        cursor.execute("""
            INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
            VALUES (%s, %s, %s, %s, TRUE)
        """, [nombre, email, pwd_hash, rol])
        nuevo_id = cursor.lastrowid

    return Response({
        'id':     nuevo_id,
        'nombre': nombre,
        'email':  email,
        'rol':    rol,
        'activo': True,
    }, status=status.HTTP_201_CREATED)


# ── VER / EDITAR / DESACTIVAR EMPLEADO ──────────────────────
class UsuarioDetalleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, nombre, email, rol, activo, created_at
                FROM usuarios WHERE id = %s
            """, [pk])
            row = cursor.fetchone()

        if not row:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            'id':         row[0],
            'nombre':     row[1],
            'email':      row[2],
            'rol':        row[3],
            'activo':     row[4],
            'created_at': str(row[5]),
        })

    def put(self, request, pk):
        nombre = request.data.get('nombre')
        email  = request.data.get('email')
        rol    = request.data.get('rol')

        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE usuarios
                SET nombre = COALESCE(%s, nombre),
                    email  = COALESCE(%s, email),
                    rol    = COALESCE(%s, rol)
                WHERE id = %s
            """, [nombre, email, rol, pk])

        return Response({'mensaje': 'Empleado actualizado correctamente'})

    def delete(self, request, pk):
        # Soft delete — solo desactiva
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE usuarios SET activo = FALSE WHERE id = %s
            """, [pk])

        return Response({'mensaje': 'Empleado desactivado correctamente'})