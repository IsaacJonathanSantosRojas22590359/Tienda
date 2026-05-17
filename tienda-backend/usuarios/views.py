from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import connection
import hashlib
from .models import Usuario
from .serializers import UsuarioSerializer, UsuarioCrearSerializer

# ── LOGIN ────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email    = request.data.get('email', '')
    password = request.data.get('password', '')

    # Query: buscar usuario por email y contraseña
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
    
    from django.contrib.auth.models import User as DjangoUser
    try:
        django_user = DjangoUser.objects.get(username=email)
    except DjangoUser.DoesNotExist:
        django_user = DjangoUser.objects.create_user(
            username=email,
            email=email,
            password=password

        )

    refresh = RefreshToken.for_user(django_user)

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


# ── CRUD USUARIOS ────────────────────────────────────────────
class UsuarioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCrearSerializer
        return UsuarioSerializer

    def get_queryset(self):
        # Query: listar todos los usuarios activos
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id FROM usuarios WHERE activo = TRUE
            """)
            ids = [row[0] for row in cursor.fetchall()]
        return Usuario.objects.filter(id__in=ids)

    def destroy(self, request, *args, **kwargs):
        # Query: soft delete — solo desactiva, no elimina
        usuario = self.get_object()
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE usuarios SET activo = FALSE WHERE id = %s
            """, [usuario.id])
        return Response({'mensaje': 'Empleado desactivado'}, status=status.HTTP_200_OK)
