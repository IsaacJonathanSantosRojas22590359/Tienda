from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VentaViewSet, ticket_pdf

router = DefaultRouter()
router.register(r'ventas', VentaViewSet, basename='ventas')

urlpatterns = [
    path('', include(router.urls)),
    path('ventas/<int:venta_id>/ticket/', ticket_pdf, name='ticket-pdf'),
]