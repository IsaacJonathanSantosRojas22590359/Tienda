from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import login, listar_usuarios, crear_usuario, UsuarioDetalleView

urlpatterns = [
    path('auth/login/',          login,               name='login'),
    path('usuarios/',            listar_usuarios,     name='listar-usuarios'),
    path('usuarios/crear/',      crear_usuario,       name='crear-usuario'),
    path('usuarios/<int:pk>/',   UsuarioDetalleView.as_view(), name='detalle-usuario'),
]