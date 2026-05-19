from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductoViewSet, CategoriaViewSet, productos_stock_bajo


router = DefaultRouter()
router.register(r'productos',  ProductoViewSet,  basename='productos')
router.register(r'categorias', CategoriaViewSet, basename='categorias')

urlpatterns = [
    path('productos/stock-bajo/', productos_stock_bajo, name='stock-bajo'),
    path('', include(router.urls)),
]