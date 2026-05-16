from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import login, UsuarioViewSet

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuarios')

urlpatterns = [
    path('auth/login/', login, name='login'),
    path('', include(router.urls)),
]