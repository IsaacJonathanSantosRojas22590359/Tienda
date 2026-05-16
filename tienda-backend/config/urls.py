from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/',             admin.site.urls),
    path('api/auth/refresh/',  TokenRefreshView.as_view(), name='token_refresh'),
    path('api/',               include('usuarios.urls')),
    path('api/',               include('productos.urls')),
    path('api/',               include('ventas.urls')),
    path('api/',               include('reportes.urls')),
]